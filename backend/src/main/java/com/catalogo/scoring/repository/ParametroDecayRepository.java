package com.catalogo.scoring.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.catalogo.scoring.entity.ParametroDecay;

public interface ParametroDecayRepository extends JpaRepository<ParametroDecay, Long> {

    Optional<ParametroDecay> findByCategoriaId(Long categoriaId);

    @Query("SELECT p FROM ParametroDecay p WHERE p.categoriaId IS NULL")
    Optional<ParametroDecay> findGlobal();
}
