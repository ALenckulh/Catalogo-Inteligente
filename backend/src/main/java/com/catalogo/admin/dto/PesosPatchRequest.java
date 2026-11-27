package com.catalogo.admin.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.util.List;

import com.catalogo.eventos.domain.TipoEvento;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record PesosPatchRequest(@NotEmpty @Valid List<Item> pesos) {
    public record Item(
            @NotNull TipoEvento tipoEvento,
            @NotNull
            @DecimalMin(value = "0", message = "deve ser no mínimo 0")
            @DecimalMax(value = "9.9999", message = "deve ser no máximo 9,9999")
            BigDecimal peso
    ) {
    }
}
