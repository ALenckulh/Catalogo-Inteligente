package com.catalogo.scoring.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.scoring.entity.ScoreCategoria;

public interface ScoreCategoriaRepository extends JpaRepository<ScoreCategoria, Long> {

    Optional<ScoreCategoria> findByUsuarioIdAndCategoriaId(Long usuarioId, Long categoriaId);

    Optional<ScoreCategoria> findByVisitanteIdAndCategoriaId(Long visitanteId, Long categoriaId);

    List<ScoreCategoria> findByUsuarioId(Long usuarioId);
}
