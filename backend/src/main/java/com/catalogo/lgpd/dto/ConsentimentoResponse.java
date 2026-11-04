package com.catalogo.lgpd.dto;

import java.time.OffsetDateTime;

import com.catalogo.auth.domain.TipoConsentimento;
import com.catalogo.auth.entity.ConsentimentoLgpd;

public record ConsentimentoResponse(
        TipoConsentimento tipo,
        boolean aceito,
        String versaoTermos,
        OffsetDateTime aceitoEm
) {
    public static ConsentimentoResponse from(ConsentimentoLgpd c) {
        return new ConsentimentoResponse(c.getTipo(), c.isAceito(), c.getVersaoTermos(), c.getAceitoEm());
    }
}
