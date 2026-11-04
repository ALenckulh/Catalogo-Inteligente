package com.catalogo.eventos.service;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.domain.TipoConsentimento;
import com.catalogo.auth.repository.ConsentimentoLgpdRepository;
import com.catalogo.auth.security.UsuarioPrincipal;
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
    private final EventoPublisher eventoPublisher;

    public EventoService(
            VisitanteService visitanteService,
            ConsentimentoLgpdRepository consentimentoRepository,
            EventoPublisher eventoPublisher
    ) {
        this.visitanteService = visitanteService;
        this.consentimentoRepository = consentimentoRepository;
        this.eventoPublisher = eventoPublisher;
    }

    @Transactional(readOnly = true)
    public EventoAceitoResponse aceitar(EventoRequest request, Authentication authentication, String cookieHeader) {
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

    private void requireBehavioralConsent(Long usuarioId) {
        boolean ok = consentimentoRepository
                .findFirstByUsuario_IdAndTipoOrderByAceitoEmDesc(usuarioId, TipoConsentimento.COOKIES_COMPORTAMENTAIS)
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
