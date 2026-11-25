package com.catalogo.visitante.service;

import com.catalogo.auth.service.ConsentimentoService;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.entity.Usuario;
import com.catalogo.shared.ApiException;
import com.catalogo.visitante.dto.AbrirSessaoRequest;
import com.catalogo.visitante.dto.SessaoResponse;
import com.catalogo.visitante.entity.Sessao;
import com.catalogo.visitante.entity.Visitante;
import com.catalogo.visitante.repository.SessaoRepository;
import com.catalogo.visitante.repository.VisitanteRepository;

@Service
public class VisitanteService {

    private static final int USER_AGENT_MAX = 500;

    private final VisitanteRepository visitanteRepository;
    private final SessaoRepository sessaoRepository;
    private final ConsentimentoService consentimentoService;

    public VisitanteService(
            VisitanteRepository visitanteRepository,
            SessaoRepository sessaoRepository,
            ConsentimentoService consentimentoService
    ) {
        this.visitanteRepository = visitanteRepository;
        this.sessaoRepository = sessaoRepository;
        this.consentimentoService = consentimentoService;
    }

    /**
     * Sempre abre uma sessão nova: o front só chama no 1º evento da visita (30 min sem evento = outra),
     * com aceite dos cookies comportamentais; sem ele, 403. Logado: a sessão é do usuário, sem visitante.
     * Anônimo: sem cookie, cria um visitante com cookie_id (UUID); com cookie, reaproveita.
     * O front guarda o UUID e o envia em X-Visitante-Cookie-Id.
     */
    @Transactional
    public SessaoResponse abrirSessao(AbrirSessaoRequest request, Long usuarioId) {
        if (usuarioId != null) {
            consentimentoService.exigirDoUsuario(usuarioId);
            Sessao sessao = novaSessao(request);
            sessao.setUsuario(usuarioStub(usuarioId));
            return new SessaoResponse(null, sessaoRepository.save(sessao).getId());
        }

        consentimentoService.exigir(Boolean.TRUE.equals(request.aceiteCookies()));
        Visitante visitante;
        if (request.cookieId() != null) {
            visitante = visitanteRepository.findByCookieId(request.cookieId())
                    .orElseThrow(() -> new ApiException(
                            "INVALID_COOKIE",
                            "Cookie de visitante inválido",
                            HttpStatus.BAD_REQUEST
                    ));
            if (visitante.getAceiteCookiesEm() == null) {
                visitante.setAceiteCookiesEm(OffsetDateTime.now());
            }
        } else {
            visitante = new Visitante();
            visitante.setCookieId(UUID.randomUUID());
            visitante.setAceiteCookiesEm(OffsetDateTime.now());
            visitante = visitanteRepository.save(visitante);
        }

        Sessao sessao = novaSessao(request);
        sessao.setVisitante(visitante);
        return new SessaoResponse(visitante.getCookieId(), sessaoRepository.save(sessao).getId());
    }

    private static Sessao novaSessao(AbrirSessaoRequest request) {
        Sessao sessao = new Sessao();
        sessao.setDispositivo(request.dispositivo());
        // O navegador escolhe o tamanho: corta em vez de recusar a visita.
        String userAgent = request.userAgent();
        sessao.setUserAgent(userAgent != null && userAgent.length() > USER_AGENT_MAX
                ? userAgent.substring(0, USER_AGENT_MAX)
                : userAgent);
        sessao.setCanalOrigem(request.canalOrigem());
        return sessao;
    }

    /** Só o id: o Hibernate não precisa carregar o usuário para gravar a FK. */
    private static Usuario usuarioStub(Long usuarioId) {
        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);
        return usuario;
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

    /** Sessão já ligada a um usuário (migrada) não recebe evento anônimo, mesmo com o cookie certo. */
    @Transactional(readOnly = true)
    public Sessao resolveSessaoForVisitante(Visitante visitante, Long sessaoId) {
        if (sessaoId != null) {
            Sessao sessao = requireSessao(sessaoId);
            if (sessao.getUsuario() != null
                    || sessao.getVisitante() == null
                    || !sessao.getVisitante().getId().equals(visitante.getId())) {
                throw new ApiException("INVALID_SESSAO", "Sessão não pertence ao visitante", HttpStatus.BAD_REQUEST);
            }
            return sessao;
        }
        return sessaoRepository.findFirstByVisitante_IdAndUsuarioIsNullAndEncerradaEmIsNullOrderByIniciadaEmDesc(visitante.getId())
                .orElseThrow(() -> new ApiException(
                        "INVALID_SESSAO",
                        "Nenhuma sessão aberta — chame POST /api/visitantes/sessao",
                        HttpStatus.BAD_REQUEST
                ));
    }

    /** A sessão informada tem de ser do próprio usuário; a de visitante só passa a ser dele pela migração. */
    @Transactional
    public Sessao resolveOrCreateForUsuario(Long usuarioId, Long sessaoId) {
        if (sessaoId != null) {
            Sessao sessao = requireSessao(sessaoId);
            if (sessao.getUsuario() == null || !sessao.getUsuario().getId().equals(usuarioId)) {
                throw new ApiException("INVALID_SESSAO", "Sessão não pertence ao usuário", HttpStatus.BAD_REQUEST);
            }
            return sessao;
        }
        return sessaoRepository.findFirstByUsuario_IdAndEncerradaEmIsNullOrderByIniciadaEmDesc(usuarioId)
                .orElseGet(() -> {
                    Sessao sessao = new Sessao();
                    sessao.setUsuario(usuarioStub(usuarioId));
                    return sessaoRepository.save(sessao);
                });
    }
}
