package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RegistrarCompraRequest(
        @NotNull Long produtoId,
        @NotNull @Positive BigDecimal precoUnitario,
        @NotNull @Positive Integer quantidade,
        @NotNull @Positive BigDecimal valorTotal,
        @NotNull LocalDate data,
        String observacoes
) {
}
