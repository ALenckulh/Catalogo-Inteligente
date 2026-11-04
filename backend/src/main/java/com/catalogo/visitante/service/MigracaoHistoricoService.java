package com.catalogo.visitante.service;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.dto.MessageResponse;
import com.catalogo.auth.dto.MigrarHistoricoRequest;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.repository.ScoreMigrationRepository;
import com.catalogo.shared.ApiException;
import com.catalogo.visitante.entity.Visitante;
import com.catalogo.visitante.repository.SessaoRepository;
import com.catalogo.visitante.repository.VisitanteRepository;

@Service
public class MigracaoHistoricoService {

    private final VisitanteRepository visitanteRepository;
    private final SessaoRepository sessaoRepository;
    private final EventoRepository eventoRepository;
    private final ScoreMigrationRepository scoreMigrationRepository;

    public MigracaoHistoricoService(
            VisitanteRepository visitanteRepository,
            SessaoRepository sessaoRepository,
            EventoRepository eventoRepository,
            ScoreMigrationRepository scoreMigrationRepository
    ) {
        this.visitanteRepository = visitanteRepository;
        this.sessaoRepository = sessaoRepository;
        this.eventoRepository = eventoRepository;
        this.scoreMigrationRepository = scoreMigrationRepository;
    }

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
            return new MessageResponse("Histórico de visitante não associado");
        }

        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);
        visitante.setUsuario(usuario);
        visitante.setMigradoEm(OffsetDateTime.now());
        visitanteRepository.save(visitante);

        sessaoRepository.attachUsuarioToVisitanteSessoes(usuarioId, visitante.getId());
        eventoRepository.attachUsuarioToVisitanteEventos(usuarioId, visitante.getId());
        scoreMigrationRepository.reassignVisitanteToUsuario(usuarioId, visitante.getId());

        return new MessageResponse("Histórico migrado com sucesso");
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
