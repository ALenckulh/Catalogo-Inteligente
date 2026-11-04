package com.catalogo.catalog.dto;

import com.catalogo.catalog.entity.ProdutoImagem;

public record ProdutoImagemResponse(
        Long id,
        Long produtoId,
        String url,
        short ordem,
        String altText
) {
    public static ProdutoImagemResponse from(ProdutoImagem img) {
        return new ProdutoImagemResponse(
                img.getId(),
                img.getProduto().getId(),
                img.getUrl(),
                img.getOrdem(),
                img.getAltText()
        );
    }
}
