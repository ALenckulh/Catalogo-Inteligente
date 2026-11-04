package com.catalogo.lgpd.dto;

import java.time.OffsetDateTime;

import com.catalogo.eventos.domain.TipoEvento;

public record ExportEventoItem(
        TipoEvento tipo,
        OffsetDateTime ocorridoEm,
        Long produtoId
) {
}
