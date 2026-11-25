package com.catalogo.auth.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.catalogo.auth.domain.TipoConsentimento;
import com.catalogo.auth.repository.ConsentimentoLgpdRepository;
import com.catalogo.shared.ApiException;
import com.catalogo.visitante.entity.Visitante;

/** LGPD no backend, não só no front: sem aceite de cookies comportamentais não há sessão nem evento. */
@Service
public class ConsentimentoService {

    private final ConsentimentoLgpdRepository consentimentoRepository;

    public ConsentimentoService(ConsentimentoLgpdRepository consentimentoRepository) {
        this.consentimentoRepository = consentimentoRepository;
    }

    /** Vale o consentimento mais recente (tabela append-only). */
    public void exigirDoUsuario(Long usuarioId) {
        exigir(consentimentoRepository
                .findFirstByUsuario_IdAndTipoOrderByAceitoEmDescIdDesc(usuarioId, TipoConsentimento.COOKIES_COMPORTAMENTAIS)
                .map(c -> c.isAceito())
                .orElse(false));
    }

    public void exigirDoVisitante(Visitante visitante) {
        exigir(visitante.getAceiteCookiesEm() != null);
    }

    public void exigir(boolean aceito) {
        if (!aceito) {
            throw new ApiException(
                    "CONSENT_REQUIRED",
                    "Consentimento de cookies comportamentais obrigatório",
                    HttpStatus.FORBIDDEN
            );
        }
    }
}
