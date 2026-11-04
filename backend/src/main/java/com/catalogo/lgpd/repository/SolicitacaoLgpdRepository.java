package com.catalogo.lgpd.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;
import com.catalogo.lgpd.entity.SolicitacaoLgpd;

public interface SolicitacaoLgpdRepository extends JpaRepository<SolicitacaoLgpd, Long> {

    @EntityGraph(attributePaths = "usuario")
    @Query("""
            SELECT s FROM SolicitacaoLgpd s
            WHERE (:status IS NULL OR s.status = :status)
              AND (:tipo IS NULL OR s.tipo = :tipo)
            """)
    Page<SolicitacaoLgpd> search(
            @Param("status") StatusSolicitacaoLgpd status,
            @Param("tipo") TipoSolicitacaoLgpd tipo,
            Pageable pageable
    );
}
