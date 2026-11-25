package com.catalogo.scoring.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.scoring.entity.ScoreCategoria;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScoreCategoriaRepository extends JpaRepository<ScoreCategoria, Long> {

    List<ScoreCategoria> findByUsuarioId(Long usuarioId);

    List<ScoreCategoria> findByVisitanteId(Long visitanteId);

    @Modifying
    @Query("DELETE FROM ScoreCategoria s WHERE s.visitanteId = :visitanteId")
    void deleteByVisitanteId(@Param("visitanteId") Long visitanteId);
}
