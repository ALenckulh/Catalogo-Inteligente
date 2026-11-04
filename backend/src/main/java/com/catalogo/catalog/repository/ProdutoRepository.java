package com.catalogo.catalog.repository;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.catalog.entity.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    Optional<Produto> findBySlugAndAtivoTrue(String slug);

    long countByAtivoTrue();

    boolean existsBySlugIgnoreCase(String slug);

    @Query("""
            SELECT p FROM Produto p
            LEFT JOIN FETCH p.imagens
            LEFT JOIN FETCH p.categoria
            WHERE p.id = :id
            """)
    Optional<Produto> findByIdWithDetails(@Param("id") Long id);

    @Query("""
            SELECT p FROM Produto p
            WHERE (:q IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
                   OR LOWER(p.slug) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
              AND (:ativo IS NULL OR p.ativo = :ativo)
            """)
    Page<Produto> adminSearch(
            @Param("q") String q,
            @Param("ativo") Boolean ativo,
            Pageable pageable
    );

    @Query("""
            SELECT p FROM Produto p
            WHERE p.ativo = true
              AND (:q IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
                   OR LOWER(p.descricao) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
              AND (:categoriaIds IS NULL OR p.categoria.id IN :categoriaIds)
              AND (:precoMin IS NULL OR p.preco >= :precoMin)
              AND (:precoMax IS NULL OR p.preco <= :precoMax)
            """)
    Page<Produto> search(
            @Param("q") String q,
            @Param("categoriaIds") Collection<Long> categoriaIds,
            @Param("precoMin") java.math.BigDecimal precoMin,
            @Param("precoMax") java.math.BigDecimal precoMax,
            Pageable pageable
    );
}
