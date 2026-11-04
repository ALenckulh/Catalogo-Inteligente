package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.catalogo.catalog.entity.Compra;

public record CompraResponse(
        Long id,
        Long usuarioId,
        Long produtoId,
        String produtoNome,
        BigDecimal precoUnitario,
        Integer quantidade,
        BigDecimal valorTotal,
        LocalDate data,
        String observacoes
) {
    public static CompraResponse from(Compra c) {
        return new CompraResponse(
                c.getId(),
                c.getUsuarioId(),
                c.getProduto().getId(),
                c.getProduto().getNome(),
                c.getPrecoUnitario(),
                c.getQuantidade(),
                c.getValorTotal(),
                c.getDataCompra(),
                c.getObservacoes()
        );
    }
}
