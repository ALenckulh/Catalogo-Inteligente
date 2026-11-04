package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record PatchProdutoRequest(
        String nome,
        String slug,
        String descricao,
        BigDecimal preco,
        Long categoriaId,
        Boolean ativo,
        Map<String, Object> fichaTecnica,
        List<ProdutoInput.ImagemInput> imagens
) {
}
