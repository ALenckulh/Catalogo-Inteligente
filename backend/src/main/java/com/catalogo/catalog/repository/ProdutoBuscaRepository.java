package com.catalogo.catalog.repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.catalogo.catalog.entity.Produto;

/** Buscas com texto livre ({@link com.catalogo.shared.BuscaTexto}); parâmetro nulo = sem o filtro. */
public interface ProdutoBuscaRepository {

    /** Só os ids dos produtos ativos que batem com os filtros; quem ordena e pagina é o ranking. */
    List<Long> searchIds(String q, Collection<Long> categoriaIds, BigDecimal precoMin, BigDecimal precoMax);

    /** Lista do admin, com inativos; nome e slug ordenam em pt-BR (acento não vai para o fim). */
    Page<Produto> adminSearch(String q, Boolean ativo, Pageable pageable);
}
