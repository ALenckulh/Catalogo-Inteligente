package com.catalogo.catalog.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.catalog.entity.Favorito;
import com.catalogo.catalog.entity.FavoritoId;

public interface FavoritoRepository extends JpaRepository<Favorito, FavoritoId> {

    Optional<Favorito> findByUsuarioIdAndProdutoId(Long usuarioId, Long produtoId);

    @Query("""
            SELECT f FROM Favorito f
            JOIN FETCH f.produto p
            LEFT JOIN FETCH p.imagens
            LEFT JOIN FETCH p.categoria
            WHERE f.usuarioId = :usuarioId AND f.deletedAt IS NULL
            ORDER BY f.createdAt DESC
            """)
    List<Favorito> findAtivosByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE favorito SET deleted_at = now()
            WHERE usuario_id = :usuarioId AND deleted_at IS NULL
            """, nativeQuery = true)
    int softDeleteByUsuarioId(@Param("usuarioId") Long usuarioId);
}
