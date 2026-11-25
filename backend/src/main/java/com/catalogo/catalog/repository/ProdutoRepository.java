package com.catalogo.catalog.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.catalog.entity.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Long>, ProdutoBuscaRepository {

    Optional<Produto> findBySlugAndAtivoTrue(String slug);

    long countByAtivoTrue();

    boolean existsBySlugIgnoreCase(String slug);

    boolean existsByIdAndAtivoTrue(Long id);

    @Query("""
            SELECT p FROM Produto p
            LEFT JOIN FETCH p.imagens
            LEFT JOIN FETCH p.categoria
            WHERE p.id = :id
            """)
    Optional<Produto> findByIdWithDetails(@Param("id") Long id);

    /** Produtos com as imagens já carregadas; a ordem dos ids não é garantida. */
    @Query("SELECT p FROM Produto p LEFT JOIN FETCH p.imagens WHERE p.id IN :ids")
    List<Produto> findAllByIdInWithImagens(@Param("ids") Collection<Long> ids);
}
