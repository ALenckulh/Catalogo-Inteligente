package com.catalogo.admin.dto;

import java.util.List;

import com.catalogo.auth.dto.UsuarioResponse;

public record AdminUsuarioDetalhe(
        UsuarioResponse usuario,
        List<ScoreProdutoRow> scoresProduto,
        List<ScoreCategoriaRow> scoresCategoria,
        FaixaPrecoRow faixaPreco,
        List<CompraResponse> compras
) {
}
