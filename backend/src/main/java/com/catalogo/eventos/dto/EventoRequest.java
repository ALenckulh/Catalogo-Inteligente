package com.catalogo.eventos.dto;

import java.util.Map;

import com.catalogo.eventos.domain.TipoConversao;
import com.catalogo.eventos.domain.TipoEvento;

import jakarta.validation.constraints.NotNull;

public record EventoRequest(
        @NotNull TipoEvento tipo,
        Long produtoId,
        Long categoriaId,
        TipoConversao conversao,
        Map<String, Object> metadados,
        Long sessaoId
) {
}
