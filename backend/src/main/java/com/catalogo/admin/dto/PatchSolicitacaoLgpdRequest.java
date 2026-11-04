package com.catalogo.admin.dto;

import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;

import jakarta.validation.constraints.NotNull;

public record PatchSolicitacaoLgpdRequest(
        @NotNull StatusSolicitacaoLgpd status,
        String observacoes
) {
}
