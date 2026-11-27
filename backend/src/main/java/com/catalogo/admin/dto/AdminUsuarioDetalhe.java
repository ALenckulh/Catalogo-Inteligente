package com.catalogo.admin.dto;

import java.util.List;

import com.catalogo.auth.dto.UsuarioResponse;

/** Sem contatoVisivel, o usuário vem sem e-mail, telefone, documento e idade; sem interesseVisivel, sem notas e sem faixa de preço. */
public record AdminUsuarioDetalhe(
        UsuarioResponse usuario,
        boolean contatoVisivel,
        boolean interesseVisivel,
        List<ScoreProdutoRow> scoresProduto,
        List<ScoreCategoriaRow> scoresCategoria,
        FaixaPrecoRow faixaPreco,
        List<CompraResponse> compras
) {
}
