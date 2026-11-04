package com.catalogo.scoring.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.scoring.entity.PesoMetrica;

public interface PesoMetricaRepository extends JpaRepository<PesoMetrica, TipoEvento> {
}
