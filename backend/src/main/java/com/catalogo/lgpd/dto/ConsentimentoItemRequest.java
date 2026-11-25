package com.catalogo.lgpd.dto;

import com.catalogo.auth.domain.TipoConsentimento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConsentimentoItemRequest(
        @NotNull TipoConsentimento tipo,
        @NotNull Boolean aceito,
        @NotBlank @Size(max = 20, message = "deve ter no máximo 20 caracteres") String versaoTermos
) {
}
