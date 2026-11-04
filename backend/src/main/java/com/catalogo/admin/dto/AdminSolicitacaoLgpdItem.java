package com.catalogo.admin.dto;

import java.time.OffsetDateTime;

import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;
import com.catalogo.lgpd.entity.SolicitacaoLgpd;

public record AdminSolicitacaoLgpdItem(
        Long id,
        Long usuarioId,
        String titularEmail,
        String titularNome,
        TipoSolicitacaoLgpd tipo,
        StatusSolicitacaoLgpd status,
        OffsetDateTime solicitadoEm,
        OffsetDateTime atendidoEm,
        String observacoes
) {
    public static AdminSolicitacaoLgpdItem from(SolicitacaoLgpd s) {
        var u = s.getUsuario();
        boolean deleted = u.getDeletedAt() != null;
        return new AdminSolicitacaoLgpdItem(
                s.getId(),
                u.getId(),
                deleted ? "titular excluído" : u.getEmail(),
                deleted ? "titular excluído" : (u.getNomeCompleto() != null ? u.getNomeCompleto() : u.getRazaoSocial()),
                s.getTipo(),
                s.getStatus(),
                s.getSolicitadoEm(),
                s.getAtendidoEm(),
                s.getObservacoes()
        );
    }
}
