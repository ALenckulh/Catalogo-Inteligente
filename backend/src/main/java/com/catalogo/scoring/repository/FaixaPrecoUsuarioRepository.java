package com.catalogo.scoring.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.scoring.entity.FaixaPrecoUsuario;

public interface FaixaPrecoUsuarioRepository extends JpaRepository<FaixaPrecoUsuario, Long> {

    Optional<FaixaPrecoUsuario> findByUsuarioId(Long usuarioId);

    Optional<FaixaPrecoUsuario> findByVisitanteId(Long visitanteId);
}
