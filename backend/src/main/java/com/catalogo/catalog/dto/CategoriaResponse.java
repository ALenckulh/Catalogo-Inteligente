package com.catalogo.catalog.dto;

import com.catalogo.catalog.entity.Categoria;

public record CategoriaResponse(
        Long id,
        String nome,
        String slug,
        Long parentId,
        String descricao
) {
    public static CategoriaResponse from(Categoria c) {
        return new CategoriaResponse(
                c.getId(),
                c.getNome(),
                c.getSlug(),
                c.getParent() != null ? c.getParent().getId() : null,
                c.getDescricao()
        );
    }
}
