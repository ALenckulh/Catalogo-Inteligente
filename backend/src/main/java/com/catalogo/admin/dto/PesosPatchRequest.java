package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.util.List;

import com.catalogo.eventos.domain.TipoEvento;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record PesosPatchRequest(@NotEmpty @Valid List<Item> pesos) {
    public record Item(@NotNull TipoEvento tipoEvento, @NotNull BigDecimal peso) {
    }
}
