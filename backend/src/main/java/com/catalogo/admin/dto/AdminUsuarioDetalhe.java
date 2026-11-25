package com.catalogo.admin.dto;

import java.util.List;

import com.catalogo.auth.dto.UsuarioResponse;

/** contatoProativo: último consentimento CONTATO_PROATIVO; null = o cliente nunca respondeu. */
public record AdminUsuarioDetalhe(
        UsuarioResponse usuario,
        Boolean contatoProativo,
        List<ScoreProdutoRow> scoresProduto,
        List<ScoreCategoriaRow> scoresCategoria,
        FaixaPrecoRow faixaPreco,
        List<CompraResponse> compras
) {
}
