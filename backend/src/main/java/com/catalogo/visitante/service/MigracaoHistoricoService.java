package com.catalogo.visitante.service;

import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.scoring.repository.FaixaPrecoUsuarioRepository;
import com.catalogo.scoring.repository.ScoreCategoriaRepository;
import com.catalogo.scoring.repository.ScoreProdutoRepository;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.dto.MessageResponse;
import com.catalogo.auth.dto.MigrarHistoricoRequest;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.shared.ApiException;
import com.catalogo.visitante.entity.Visitante;
import com.catalogo.visitante.repository.SessaoRepository;
import com.catalogo.visitante.repository.VisitanteRepository;

@Service
public class MigracaoHistoricoService {

    private final VisitanteRepository visitanteRepository;
    private final SessaoRepository sessaoRepository;
    private final EventoRepository eventoRepository;
    private final ScoreProdutoRepository scoreProdutoRepository;
    private final ScoreCategoriaRepository scoreCategoriaRepository;
    private final FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository;
    private final ScoreEngine scoreEngine;

    public MigracaoHistoricoService(
            VisitanteRepository visitanteRepository,
            SessaoRepository sessaoRepository,
            EventoRepository eventoRepository,
            ScoreProdutoRepository scoreProdutoRepository,
            ScoreCategoriaRepository scoreCategoriaRepository,
            FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository,
            ScoreEngine scoreEngine
    ) {
        this.visitanteRepository = visitanteRepository;
        this.sessaoRepository = sessaoRepository;
        this.eventoRepository = eventoRepository;
        this.scoreProdutoRepository = scoreProdutoRepository;
        this.scoreCategoriaRepository = scoreCategoriaRepository;
        this.faixaPrecoUsuarioRepository = faixaPrecoUsuarioRepository;
        this.scoreEngine = scoreEngine;
    }

    /**
     * Após login/cadastro, se a pessoa aceitar no modal, leva o histórico anônimo para a conta:
     * 1) liga o visitante ao usuário (migrado_em); 2) passa sessões e eventos do visitante para o usuário
     * (UPDATE nativo); 3) apaga as notas do visitante e recalcula as da conta com o histórico inteiro (o recente pesa
     * mais pelo decaimento). Se recusar, o histórico anônimo é descartado. Tudo numa transação só.
     */
    @Transactional
    public MessageResponse migrar(Long usuarioId, MigrarHistoricoRequest request, String cookieHeader) {
        UUID cookieId = parseCookie(cookieHeader);
        Visitante visitante = visitanteRepository.findByCookieId(cookieId)
                .orElseThrow(() -> new ApiException(
                        "INVALID_COOKIE",
                        "Cookie de visitante inválido",
                        HttpStatus.BAD_REQUEST
                ));

        if (!Boolean.TRUE.equals(request.aceitar())) {
            descartar(visitante.getId());
            return new MessageResponse("Histórico de visitante descartado");
        }

        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);
        visitante.setUsuario(usuario);
        visitante.setMigradoEm(OffsetDateTime.now());
        visitanteRepository.save(visitante);

        sessaoRepository.attachUsuarioToVisitanteSessoes(usuarioId, visitante.getId());
        eventoRepository.attachUsuarioToVisitanteEventos(usuarioId, visitante.getId());
        apagarNotas(visitante.getId());
        scoreEngine.recalc(usuarioId, null);

        return new MessageResponse("Histórico migrado com sucesso");
    }

    /** Só o que ainda é anônimo: o que já foi para uma conta fica com ela. */
    private void descartar(Long visitanteId) {
        eventoRepository.descartarDoVisitante(visitanteId);
        sessaoRepository.limparUserAgentDoVisitante(visitanteId);
        apagarNotas(visitanteId);
    }

    private void apagarNotas(Long visitanteId) {
        scoreProdutoRepository.deleteByVisitanteId(visitanteId);
        scoreCategoriaRepository.deleteByVisitanteId(visitanteId);
        faixaPrecoUsuarioRepository.deleteByVisitanteId(visitanteId);
    }

    private static UUID parseCookie(String cookieHeader) {
        if (cookieHeader == null || cookieHeader.isBlank()) {
            throw new ApiException(
                    "INVALID_COOKIE",
                    "Header X-Visitante-Cookie-Id obrigatório",
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
