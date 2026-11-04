package com.catalogo.admin.dto;

import java.math.BigDecimal;

import com.catalogo.scoring.entity.FaixaPrecoUsuario;

public record FaixaPrecoRow(
        BigDecimal medianaComConversao,
        BigDecimal medianaSemConversao,
        BigDecimal gapPreco
) {
    public static FaixaPrecoRow from(FaixaPrecoUsuario f) {
        if (f == null) {
            return new FaixaPrecoRow(null, null, null);
        }
        return new FaixaPrecoRow(f.getMedianaComConversao(), f.getMedianaSemConversao(), f.getGapPreco());
    }
}
