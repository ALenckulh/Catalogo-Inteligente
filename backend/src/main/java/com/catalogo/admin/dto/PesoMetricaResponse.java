package com.catalogo.admin.dto;

import java.math.BigDecimal;

import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.scoring.entity.PesoMetrica;

public record PesoMetricaResponse(TipoEvento tipoEvento, BigDecimal peso) {
    public static PesoMetricaResponse from(PesoMetrica p) {
        return new PesoMetricaResponse(p.getTipoEvento(), p.getPeso());
    }
}
