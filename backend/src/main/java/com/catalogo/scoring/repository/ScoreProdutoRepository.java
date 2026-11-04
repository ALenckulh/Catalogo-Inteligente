package com.catalogo.scoring.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.scoring.entity.ScoreProduto;

public interface ScoreProdutoRepository extends JpaRepository<ScoreProduto, Long> {

    Optional<ScoreProduto> findByUsuarioIdAndProdutoId(Long usuarioId, Long produtoId);

    Optional<ScoreProduto> findByVisitanteIdAndProdutoId(Long visitanteId, Long produtoId);

    List<ScoreProduto> findByUsuarioId(Long usuarioId);

    List<ScoreProduto> findByVisitanteId(Long visitanteId);

    long countByUsuarioId(Long usuarioId);

    long countByVisitanteId(Long visitanteId);
}
