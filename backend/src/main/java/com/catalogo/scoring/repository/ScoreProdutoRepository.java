package com.catalogo.scoring.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.scoring.entity.ScoreProduto;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScoreProdutoRepository extends JpaRepository<ScoreProduto, Long> {

    List<ScoreProduto> findByUsuarioId(Long usuarioId);

    List<ScoreProduto> findByVisitanteId(Long visitanteId);

    long countByUsuarioId(Long usuarioId);

    long countByVisitanteId(Long visitanteId);

    /** Clientes com nota gravada; conta excluída fica de fora (as notas dela são só estatística, docs/08 §5.2). */
    @Query("""
            SELECT DISTINCT s.usuarioId FROM ScoreProduto s JOIN Usuario u ON u.id = s.usuarioId
            WHERE u.deletedAt IS NULL
            """)
    List<Long> findUsuarioIdsComNota();

    @Query("SELECT DISTINCT s.visitanteId FROM ScoreProduto s WHERE s.visitanteId IS NOT NULL")
    List<Long> findVisitanteIdsComNota();

    @Modifying
    @Query("DELETE FROM ScoreProduto s WHERE s.visitanteId = :visitanteId")
    void deleteByVisitanteId(@Param("visitanteId") Long visitanteId);
}
