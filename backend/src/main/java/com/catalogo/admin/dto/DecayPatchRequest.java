package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record DecayPatchRequest(@NotEmpty @Valid List<Item> items) {
    public record Item(
            Long categoriaId,
            @NotNull BigDecimal lambda,
            @NotNull BigDecimal boostConversao
    ) {
    }
}
