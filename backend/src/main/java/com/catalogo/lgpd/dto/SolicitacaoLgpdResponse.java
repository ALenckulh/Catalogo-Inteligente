package com.catalogo.lgpd.dto;

import java.time.OffsetDateTime;

import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;
import com.catalogo.lgpd.entity.SolicitacaoLgpd;

public record SolicitacaoLgpdResponse(
        Long id,
        TipoSolicitacaoLgpd tipo,
        StatusSolicitacaoLgpd status,
        OffsetDateTime solicitadoEm,
        OffsetDateTime atendidoEm,
        String observacoes
) {
    public static SolicitacaoLgpdResponse from(SolicitacaoLgpd s) {
        return new SolicitacaoLgpdResponse(
                s.getId(),
                s.getTipo(),
                s.getStatus(),
                s.getSolicitadoEm(),
                s.getAtendidoEm(),
                s.getObservacoes()
        );
    }
}
