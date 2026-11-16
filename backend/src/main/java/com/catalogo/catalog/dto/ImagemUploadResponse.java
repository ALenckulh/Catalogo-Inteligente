package com.catalogo.catalog.dto;

/** `url` é relativa à base da API (ex.: "produtos/imagens/42"); vai direto em produto_imagem.url. */
public record ImagemUploadResponse(Long id, String url) {
}
