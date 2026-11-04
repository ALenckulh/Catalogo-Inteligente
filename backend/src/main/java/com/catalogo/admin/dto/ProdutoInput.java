package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ProdutoInput(
        @NotBlank String nome,
        @NotBlank String slug,
        String descricao,
        @NotNull @Positive BigDecimal preco,
        @NotNull Long categoriaId,
        @NotNull Boolean ativo,
        Map<String, Object> fichaTecnica,
        List<ImagemInput> imagens
) {
    public record ImagemInput(String url, String altText, Short ordem) {
    }
}
