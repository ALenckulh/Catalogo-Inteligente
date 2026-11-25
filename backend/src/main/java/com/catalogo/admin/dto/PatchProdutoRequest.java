package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

/** PATCH parcial: campo nulo = não altera; campo enviado segue as mesmas regras do POST. */
public record PatchProdutoRequest(
        @Pattern(regexp = ".*\\S.*", message = "não pode ficar em branco") String nome,
        @Pattern(regexp = ".*\\S.*", message = "não pode ficar em branco") String slug,
        String descricao,
        @Positive BigDecimal preco,
        Long categoriaId,
        Boolean ativo,
        Map<String, Object> fichaTecnica,
        List<ProdutoInput.ImagemInput> imagens
) {
}
