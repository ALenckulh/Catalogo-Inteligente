package com.catalogo.admin.dto;

import java.math.BigDecimal;

public record ScoreProdutoRow(Long produtoId, String produtoNome, BigDecimal valor) {
}
