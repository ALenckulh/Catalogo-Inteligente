package com.catalogo.visitante.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.visitante.entity.Sessao;

public interface SessaoRepository extends JpaRepository<Sessao, Long> {

    Optional<Sessao> findFirstByVisitante_IdAndUsuarioIsNullAndEncerradaEmIsNullOrderByIniciadaEmDesc(Long visitanteId);

    Optional<Sessao> findFirstByUsuario_IdAndEncerradaEmIsNullOrderByIniciadaEmDesc(Long usuarioId);

    /** Só sessões ainda sem dono: uma migração nunca leva a sessão de outro usuário. */
    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE sessao
            SET usuario_id = :usuarioId
            WHERE visitante_id = :visitanteId AND usuario_id IS NULL
            """, nativeQuery = true)
    int attachUsuarioToVisitanteSessoes(@Param("usuarioId") Long usuarioId, @Param("visitanteId") Long visitanteId);
}
