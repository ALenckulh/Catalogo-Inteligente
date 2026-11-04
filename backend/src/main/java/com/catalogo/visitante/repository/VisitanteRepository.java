package com.catalogo.visitante.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.visitante.entity.Visitante;

public interface VisitanteRepository extends JpaRepository<Visitante, Long> {

    Optional<Visitante> findByCookieId(UUID cookieId);
}
