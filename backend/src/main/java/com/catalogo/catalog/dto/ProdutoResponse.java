package com.catalogo.catalog.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import com.catalogo.catalog.entity.Produto;

public record ProdutoResponse(
        Long id,
        String nome,
        String slug,
        String descricao,
        Map<String, Object> fichaTecnica,
        BigDecimal preco,
        Long categoriaId,
        CategoriaResponse categoria,
        boolean ativo,
        List<ProdutoImagemResponse> imagens,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProdutoResponse from(Produto p, boolean includeCategoria) {
        return new ProdutoResponse(
                p.getId(),
                p.getNome(),
                p.getSlug(),
                p.getDescricao(),
                p.getFichaTecnica(),
                p.getPreco(),
                p.getCategoria().getId(),
                includeCategoria ? CategoriaResponse.from(p.getCategoria()) : null,
                p.isAtivo(),
                p.getImagens().stream().map(ProdutoImagemResponse::from).toList(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
