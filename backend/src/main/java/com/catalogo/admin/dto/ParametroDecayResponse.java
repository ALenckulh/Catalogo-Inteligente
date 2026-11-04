package com.catalogo.admin.dto;

import java.math.BigDecimal;

public record ParametroDecayResponse(
        Long categoriaId,
        String categoriaNome,
        BigDecimal lambda,
        BigDecimal boostConversao
) {
}
