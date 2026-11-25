package com.catalogo.admin.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/** Faixas da tela de Configuração: meia-vida de 7 a 693 dias (λ = ln 2 ÷ dias) e bônus de 0% a 50%. */
public record DecayPatchRequest(@NotEmpty @Valid List<Item> items) {
    public record Item(
            Long categoriaId,
            @NotNull
            @DecimalMin(value = "0.001", message = "deve ser no mínimo 0,001")
            @DecimalMax(value = "0.1", message = "deve ser no máximo 0,1")
            BigDecimal lambda,
            @NotNull
            @DecimalMin(value = "1", message = "deve ser no mínimo 1")
            @DecimalMax(value = "1.5", message = "deve ser no máximo 1,5")
            BigDecimal boostConversao,
            @DecimalMin(value = "1", message = "deve ser no mínimo 1")
            @DecimalMax(value = "1.5", message = "deve ser no máximo 1,5")
            BigDecimal boostRecorrencia,
            @Min(value = 0, message = "deve ser no mínimo 0")
            @Max(value = 180, message = "deve ser no máximo 180")
            Short pausaDias
    ) {
        /** Os dois últimos são opcionais: nulo não altera. A pausa só vale no item global. */
        public Item(Long categoriaId, BigDecimal lambda, BigDecimal boostConversao) {
            this(categoriaId, lambda, boostConversao, null, null);
        }
    }
}
