package com.catalogo.eventos.service;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.domain.TipoConsentimento;
import com.catalogo.auth.repository.ConsentimentoLgpdRepository;
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

    private final VisitanteService visitanteService;
    private final ConsentimentoLgpdRepository consentimentoRepository;
    private final ProdutoRepository produtoRepository;
    private final CategoriaRepository categoriaRepository;
    private final EventoPublisher eventoPublisher;

    public EventoService(
            VisitanteService visitanteService,
            ConsentimentoLgpdRepository consentimentoRepository,
            ProdutoRepository produtoRepository,
            CategoriaRepository categoriaRepository,
            EventoPublisher eventoPublisher
    ) {
        this.visitanteService = visitanteService;
        this.consentimentoRepository = consentimentoRepository;
        this.produtoRepository = produtoRepository;
        this.categoriaRepository = categoriaRepository;
        this.eventoPublisher = eventoPublisher;
    }

    /**
     * Valida e enfileira um evento de comportamento. Quem o worker não conseguiria gravar é recusado aqui (400);
     * logado → exige consentimento de cookies comportamentais (403 sem ele) e resolve/cria a sessão;
     * anônimo → exige o header X-Visitante-Cookie-Id e acha visitante e sessão.
     * Depois monta o EventoMessage e publica; quem grava é o EventoPersistWorker.
     * Não é readOnly: resolveOrCreateForUsuario pode criar a sessão do usuário logado.
     */
    @Transactional
    public EventoAceitoResponse aceitar(EventoRequest request, Authentication authentication, String cookieHeader) {
        requireGravavel(request);
        Long usuarioId = null;
        Long visitanteId = null;
        Sessao sessao;

        if (authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal principal) {
            usuarioId = principal.getId();
            requireBehavioralConsent(usuarioId);
            sessao = visitanteService.resolveOrCreateForUsuario(usuarioId, request.sessaoId());
        } else {
            UUID cookieId = parseCookie(cookieHeader);
            Visitante visitante = visitanteService.requireByCookie(cookieId);
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
    private void requireGravavel(EventoRequest request) {
        if (request.produtoId() != null && !produtoRepository.existsById(request.produtoId())) {
            throw invalido("Produto inexistente");
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

    /**
     * LGPD no backend, não só no front: usa o consentimento mais recente (tabela append-only) e
     * recusa com 403 CONSENT_REQUIRED se o usuário não aceitou ou revogou.
     */
    private void requireBehavioralConsent(Long usuarioId) {
        boolean ok = consentimentoRepository
                .findFirstByUsuario_IdAndTipoOrderByAceitoEmDescIdDesc(usuarioId, TipoConsentimento.COOKIES_COMPORTAMENTAIS)
                .map(c -> c.isAceito())
                .orElse(false);
        if (!ok) {
            throw new ApiException(
                    "CONSENT_REQUIRED",
                    "Consentimento de cookies comportamentais obrigatório",
                    HttpStatus.FORBIDDEN
            );
        }
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
