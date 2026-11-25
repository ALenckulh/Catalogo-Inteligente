package com.catalogo.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetConfirmRequest(
        @NotBlank String token,
        @NotBlank @JsonAlias("nova_senha") String novaSenha
) {
}
