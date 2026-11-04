package com.catalogo.eventos.dto;

import java.time.OffsetDateTime;
import java.util.Map;

import com.catalogo.eventos.domain.TipoConversao;
import com.catalogo.eventos.domain.TipoEvento;

public record EventoMessage(
        TipoEvento tipo,
        Long sessaoId,
        Long usuarioId,
        Long visitanteId,
        Long produtoId,
        Long categoriaId,
        TipoConversao conversao,
        Map<String, Object> metadados,
        OffsetDateTime ocorridoEm
) {
}
