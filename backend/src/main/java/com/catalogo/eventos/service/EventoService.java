package com.catalogo.eventos.service;

import com.catalogo.auth.service.ConsentimentoService;
import com.catalogo.eventos.domain.TipoConversao;
import com.catalogo.eventos.domain.TipoEvento;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.eventos.dto.EventoAceitoResponse;
import com.catalogo.eventos.dto.EventoMessage;
import com.catalogo.eventos.dto.EventoRequest;
import com.catalogo.shared.ApiException;
import com.catalogo.visitante.entity.Sessao;
import com.catalogo.visitante.entity.Visitante;
import com.catalogo.visitante.service.VisitanteService;

@Service
public class EventoService {

    public static final String HEADER_COOKIE = "X-Visitante-Cookie-Id";

    private static final int METADADOS_MAX = 10_000;
    private static final Set<TipoEvento> EXIGEM_PRODUTO = EnumSet.of(
            TipoEvento.VISUALIZACAO_PRODUTO,
            TipoEvento.FAVORITAR,
            TipoEvento.DESFAVORITAR,
            TipoEvento.CONTATO_WHATSAPP,
            TipoEvento.SCROLL_DEPTH,
            TipoEvento.TEMPO_PAGINA);

    private final VisitanteService visitanteService;
    private final ConsentimentoService consentimentoService;
    private final ProdutoRepository produtoRepository;
    private final CategoriaRepository categoriaRepository;
    private final EventoPublisher eventoPublisher;

    public EventoService(
            VisitanteService visitanteService,
            ConsentimentoService consentimentoService,
            ProdutoRepository produtoRepository,
            CategoriaRepository categoriaRepository,
            EventoPublisher eventoPublisher
    ) {
        this.visitanteService = visitanteService;
        this.consentimentoService = consentimentoService;
        this.produtoRepository = produtoRepository;
        this.categoriaRepository = categoriaRepository;
        this.eventoPublisher = eventoPublisher;
    }

    /**
     * Valida e enfileira um evento de comportamento. Evento sem sentido ou que o worker não conseguiria gravar é recusado aqui (400);
     * logado ou anônimo → exige consentimento de cookies comportamentais (403 sem ele) e resolve a sessão;
     * anônimo → exige também o header X-Visitante-Cookie-Id.
     * Depois monta o EventoMessage e publica; quem grava é o EventoPersistWorker.
     * Não é readOnly: resolveOrCreateForUsuario pode criar a sessão do usuário logado.
     */
    @Transactional
    public EventoAceitoResponse aceitar(EventoRequest request, Authentication authentication, String cookieHeader) {
        boolean logado = authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal;
        requireValido(request, logado);
        Long usuarioId = null;
        Long visitanteId = null;
        Sessao sessao;

        if (authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal principal) {
            usuarioId = principal.getId();
            consentimentoService.exigirDoUsuario(usuarioId);
            sessao = visitanteService.resolveOrCreateForUsuario(usuarioId, request.sessaoId());
        } else {
            UUID cookieId = parseCookie(cookieHeader);
            Visitante visitante = visitanteService.requireByCookie(cookieId);
            consentimentoService.exigirDoVisitante(visitante);
            visitanteId = visitante.getId();
            sessao = visitanteService.resolveSessaoForVisitante(visitante, request.sessaoId());
        }

        EventoMessage message = new EventoMessage(
                request.tipo(),
                sessao.getId(),
                usuarioId,
                visitanteId,
                request.produtoId(),
                request.categoriaId(),
                request.conversao(),
                request.metadados() != null ? request.metadados() : Map.of(),
                OffsetDateTime.now()
        );
        eventoPublisher.publish(message);
        return EventoAceitoResponse.ok();
    }

    /** A resposta é 202 antes de gravar: sem isto, o erro só apareceria no worker, longe de quem enviou. */
    private void requireValido(EventoRequest request, boolean logado) {
        TipoEvento tipo = request.tipo();
        if (tipo.soPeso()) {
            throw invalido("Tipo de evento inválido");
        }
        // toString é mais barato que serializar e tem praticamente o tamanho do JSON.
        if (request.metadados() != null && request.metadados().toString().length() > METADADOS_MAX) {
            throw invalido("Metadados grandes demais");
        }
        boolean favorito = tipo == TipoEvento.FAVORITAR || tipo == TipoEvento.DESFAVORITAR;
        if (favorito && !logado) {
            throw invalido("Favoritar exige login");
        }
        if (request.produtoId() == null && EXIGEM_PRODUTO.contains(tipo)) {
            throw invalido("Produto obrigatório");
        }
        // CONFIRMADA é a compra, que só o admin registra.
        if (request.conversao() == TipoConversao.CONFIRMADA
                || (request.conversao() != null && tipo != TipoEvento.CONTATO_WHATSAPP)) {
            throw invalido("Conversão inválida para este evento");
        }
        if (request.produtoId() != null) {
            // Tirar dos favoritos um produto que saiu do catálogo continua valendo.
            boolean existe = tipo == TipoEvento.DESFAVORITAR
                    ? produtoRepository.existsById(request.produtoId())
                    : produtoRepository.existsByIdAndAtivoTrue(request.produtoId());
            if (!existe) {
                throw invalido("Produto inexistente ou inativo");
            }
        }
        if (request.categoriaId() != null && !categoriaRepository.existsById(request.categoriaId())) {
            throw invalido("Categoria inexistente");
        }
        if (temCaractereNulo(request.metadados())) {
            throw invalido("Texto com caractere inválido");
        }
    }

    private static ApiException invalido(String mensagem) {
        return new ApiException("VALIDATION_ERROR", mensagem, HttpStatus.BAD_REQUEST);
    }

    /** O Postgres não grava o caractere nulo em jsonb. */
    private static boolean temCaractereNulo(Object valor) {
        return switch (valor) {
            case String s -> s.indexOf('\0') >= 0;
            case Map<?, ?> m -> m.entrySet().stream()
                    .anyMatch(e -> temCaractereNulo(e.getKey()) || temCaractereNulo(e.getValue()));
            case Collection<?> c -> c.stream().anyMatch(EventoService::temCaractereNulo);
            case null, default -> false;
        };
    }

    private static UUID parseCookie(String cookieHeader) {
        if (cookieHeader == null || cookieHeader.isBlank()) {
            throw new ApiException(
                    "INVALID_COOKIE",
                    "Autenticação ou header X-Visitante-Cookie-Id obrigatório",
                    HttpStatus.BAD_REQUEST
            );
        }
        try {
            return UUID.fromString(cookieHeader.trim());
        } catch (IllegalArgumentException ex) {
            throw new ApiException("INVALID_COOKIE", "Cookie de visitante inválido", HttpStatus.BAD_REQUEST);
        }
    }
}
