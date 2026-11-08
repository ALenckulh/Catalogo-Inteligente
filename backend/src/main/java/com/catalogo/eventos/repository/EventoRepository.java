package com.catalogo.eventos.repository;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.eventos.entity.Evento;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE evento
            SET usuario_id = :usuarioId
            WHERE visitante_id = :visitanteId AND usuario_id IS NULL
            """, nativeQuery = true)
    int attachUsuarioToVisitanteEventos(@Param("usuarioId") Long usuarioId, @Param("visitanteId") Long visitanteId);

    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE evento SET deleted_at = now()
            WHERE usuario_id = :usuarioId AND deleted_at IS NULL
            """, nativeQuery = true)
    int softDeleteByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("""
            SELECT e FROM Evento e
            LEFT JOIN FETCH e.produto p
            LEFT JOIN FETCH p.categoria
            WHERE e.usuario.id = :usuarioId AND e.deletedAt IS NULL
            ORDER BY e.ocorridoEm DESC
            """)
    List<Evento> findAtivosByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("""
            SELECT e FROM Evento e
            LEFT JOIN FETCH e.produto p
            LEFT JOIN FETCH p.categoria
            WHERE e.visitante.id = :visitanteId AND e.deletedAt IS NULL
            ORDER BY e.ocorridoEm DESC
            """)
    List<Evento> findAtivosByVisitanteId(@Param("visitanteId") Long visitanteId);

    long countByUsuario_IdAndDeletedAtIsNull(Long usuarioId);

    long countByVisitante_IdAndDeletedAtIsNull(Long visitanteId);

    @Query(value = """
            SELECT produto_id, tipo, COUNT(*)
            FROM evento
            WHERE deleted_at IS NULL
              AND produto_id IS NOT NULL
              AND ocorrido_em >= :desde
              AND tipo IN ('VISUALIZACAO_PRODUTO', 'FAVORITAR', 'CONTATO_WHATSAPP')
            GROUP BY produto_id, tipo
            """, nativeQuery = true)
    List<Object[]> countSignalsByProdutoSince(@Param("desde") java.time.OffsetDateTime desde);

    /** Eventos ativos desde uma data, com produto e categoria (simulação de parâmetros de score). */
    @Query("""
            SELECT e FROM Evento e
            LEFT JOIN FETCH e.produto p
            LEFT JOIN FETCH p.categoria
            LEFT JOIN FETCH e.categoria
            WHERE e.deletedAt IS NULL AND e.ocorridoEm >= :desde
            """)
    List<Evento> findAtivosDesde(@Param("desde") OffsetDateTime desde);

    @Query("SELECT DISTINCT e.usuario.id FROM Evento e WHERE e.usuario IS NOT NULL AND e.deletedAt IS NULL")
    List<Long> findUsuarioIdsComEventos();

    /** Visitantes com eventos ainda não ligados a um usuário. */
    @Query("""
            SELECT DISTINCT e.visitante.id FROM Evento e
            WHERE e.usuario IS NULL AND e.visitante IS NOT NULL AND e.deletedAt IS NULL
            """)
    List<Long> findVisitanteIdsSemUsuario();
}
