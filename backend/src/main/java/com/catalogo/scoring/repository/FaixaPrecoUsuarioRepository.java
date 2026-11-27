package com.catalogo.scoring.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.scoring.entity.FaixaPrecoUsuario;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FaixaPrecoUsuarioRepository extends JpaRepository<FaixaPrecoUsuario, Long> {

    Optional<FaixaPrecoUsuario> findByUsuarioId(Long usuarioId);

    Optional<FaixaPrecoUsuario> findByVisitanteId(Long visitanteId);

    @Modifying
    @Query("DELETE FROM FaixaPrecoUsuario s WHERE s.visitanteId = :visitanteId")
    void deleteByVisitanteId(@Param("visitanteId") Long visitanteId);
}
