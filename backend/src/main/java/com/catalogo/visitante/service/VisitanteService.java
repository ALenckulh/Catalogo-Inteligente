package com.catalogo.visitante.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.shared.ApiException;
import com.catalogo.visitante.dto.AbrirSessaoRequest;
import com.catalogo.visitante.dto.SessaoResponse;
import com.catalogo.visitante.entity.Sessao;
import com.catalogo.visitante.entity.Visitante;
import com.catalogo.visitante.repository.SessaoRepository;
import com.catalogo.visitante.repository.VisitanteRepository;

@Service
public class VisitanteService {

    private final VisitanteRepository visitanteRepository;
    private final SessaoRepository sessaoRepository;

    public VisitanteService(VisitanteRepository visitanteRepository, SessaoRepository sessaoRepository) {
        this.visitanteRepository = visitanteRepository;
        this.sessaoRepository = sessaoRepository;
    }

    @Transactional
    public SessaoResponse abrirSessao(AbrirSessaoRequest request) {
        Visitante visitante;
        if (request.cookieId() != null) {
            visitante = visitanteRepository.findByCookieId(request.cookieId())
                    .orElseThrow(() -> new ApiException(
                            "INVALID_COOKIE",
                            "Cookie de visitante inválido",
                            HttpStatus.BAD_REQUEST
                    ));
            if (request.fingerprint() != null && !request.fingerprint().isBlank()) {
                visitante.setFingerprint(request.fingerprint());
            }
        } else {
            visitante = new Visitante();
            visitante.setCookieId(UUID.randomUUID());
            visitante.setFingerprint(request.fingerprint());
            visitante = visitanteRepository.save(visitante);
        }

        Sessao sessao = new Sessao();
        sessao.setVisitante(visitante);
        sessao.setDispositivo(request.dispositivo());
        sessao.setUserAgent(request.userAgent());
        sessao.setCanalOrigem(request.canalOrigem());
        sessao = sessaoRepository.save(sessao);

        return new SessaoResponse(visitante.getCookieId(), sessao.getId());
    }

    @Transactional(readOnly = true)
    public Visitante requireByCookie(UUID cookieId) {
        if (cookieId == null) {
            throw new ApiException("INVALID_COOKIE", "Header X-Visitante-Cookie-Id obrigatório", HttpStatus.BAD_REQUEST);
        }
        return visitanteRepository.findByCookieId(cookieId)
                .orElseThrow(() -> new ApiException("INVALID_COOKIE", "Cookie de visitante inválido", HttpStatus.BAD_REQUEST));
    }

    @Transactional(readOnly = true)
    public Sessao requireSessao(Long sessaoId) {
        return sessaoRepository.findById(sessaoId)
                .orElseThrow(() -> new ApiException("INVALID_SESSAO", "Sessão inválida", HttpStatus.BAD_REQUEST));
    }

    @Transactional(readOnly = true)
    public Sessao resolveSessaoForVisitante(Visitante visitante, Long sessaoId) {
        if (sessaoId != null) {
            Sessao sessao = requireSessao(sessaoId);
            if (sessao.getVisitante() == null || !sessao.getVisitante().getId().equals(visitante.getId())) {
                throw new ApiException("INVALID_SESSAO", "Sessão não pertence ao visitante", HttpStatus.BAD_REQUEST);
            }
            return sessao;
        }
        return sessaoRepository.findFirstByVisitante_IdAndEncerradaEmIsNullOrderByIniciadaEmDesc(visitante.getId())
                .orElseThrow(() -> new ApiException(
                        "INVALID_SESSAO",
                        "Nenhuma sessão aberta — chame POST /api/visitantes/sessao",
                        HttpStatus.BAD_REQUEST
                ));
    }

    @Transactional
    public Sessao resolveOrCreateForUsuario(Long usuarioId, Long sessaoId) {
        if (sessaoId != null) {
            return requireSessao(sessaoId);
        }
        return sessaoRepository.findFirstByUsuario_IdAndEncerradaEmIsNullOrderByIniciadaEmDesc(usuarioId)
                .orElseGet(() -> {
                    Sessao sessao = new Sessao();
                    // usuario set via id join — load not needed for FK if we set usuario entity stub
                    com.catalogo.auth.entity.Usuario u = new com.catalogo.auth.entity.Usuario();
                    u.setId(usuarioId);
                    sessao.setUsuario(u);
                    return sessaoRepository.save(sessao);
                });
    }
}
