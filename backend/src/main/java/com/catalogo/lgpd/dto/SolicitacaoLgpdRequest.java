package com.catalogo.lgpd.dto;

import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;

import jakarta.validation.constraints.NotNull;

public record SolicitacaoLgpdRequest(
        @NotNull TipoSolicitacaoLgpd tipo,
        String detalhes
) {
}
