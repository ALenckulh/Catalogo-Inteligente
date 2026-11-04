package com.catalogo.catalog.dto;

import java.time.OffsetDateTime;

import com.catalogo.catalog.entity.Favorito;

public record FavoritoResponse(
        Long produtoId,
        OffsetDateTime createdAt,
        ProdutoResponse produto
) {
    public static FavoritoResponse from(Favorito f) {
        return new FavoritoResponse(
                f.getProdutoId(),
                f.getCreatedAt(),
                ProdutoResponse.from(f.getProduto(), true)
        );
    }
}
