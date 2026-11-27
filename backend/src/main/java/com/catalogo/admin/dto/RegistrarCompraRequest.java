package com.catalogo.admin.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** O total não vem do cliente: é quantidade × preço unitário, calculado no service. */
public record RegistrarCompraRequest(
        @NotNull Long produtoId,
        @NotNull
        @Positive
        @Digits(integer = 10, fraction = 2, message = "deve ter no máximo 10 dígitos e 2 casas decimais")
        BigDecimal precoUnitario,
        @NotNull @Positive Integer quantidade,
        @NotNull LocalDate data,
        @Size(max = 500, message = "deve ter no máximo 500 caracteres") String observacoes
) {
}
