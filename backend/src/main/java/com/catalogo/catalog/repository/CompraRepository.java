package com.catalogo.catalog.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.catalog.entity.Compra;

public interface CompraRepository extends JpaRepository<Compra, Long> {

    long countByUsuarioIdAndDeletedAtIsNull(Long usuarioId);

    @Query("""
            SELECT c FROM Compra c JOIN FETCH c.produto
            WHERE c.usuarioId = :usuarioId AND c.deletedAt IS NULL
            """)
    List<Compra> findByUsuarioIdAndDeletedAtIsNull(@Param("usuarioId") Long usuarioId);

    @Query("""
            SELECT c.produto.id, COUNT(c)
            FROM Compra c
            WHERE c.deletedAt IS NULL AND c.dataCompra >= :desde
            GROUP BY c.produto.id
            """)
    List<Object[]> countByProdutoSince(@Param("desde") LocalDate desde);
}
