package com.catalogo.lgpd.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.catalogo.catalog.entity.Compra;

/** Compra na exportação do titular. Sem as observações, que são anotação interna do vendedor. */
public record ExportCompraItem(
        Long produtoId,
        String produtoNome,
        Integer quantidade,
        BigDecimal precoUnitario,
        BigDecimal valorTotal,
        LocalDate data
) {
    public static ExportCompraItem from(Compra c) {
        return new ExportCompraItem(
                c.getProduto().getId(),
                c.getProduto().getNome(),
                c.getQuantidade(),
                c.getPrecoUnitario(),
                c.getValorTotal(),
                c.getDataCompra()
        );
    }
}
