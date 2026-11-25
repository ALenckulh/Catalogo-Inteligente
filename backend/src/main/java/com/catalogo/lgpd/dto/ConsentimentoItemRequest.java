package com.catalogo.lgpd.dto;

import com.catalogo.auth.domain.TipoConsentimento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConsentimentoItemRequest(
        @NotNull TipoConsentimento tipo,
        @NotNull Boolean aceito,
        @NotBlank String versaoTermos
) {
}
