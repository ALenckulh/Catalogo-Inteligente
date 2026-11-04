package com.catalogo.auth.dto;

import jakarta.validation.constraints.NotNull;

public record MigrarHistoricoRequest(@NotNull Boolean aceitar) {
}
