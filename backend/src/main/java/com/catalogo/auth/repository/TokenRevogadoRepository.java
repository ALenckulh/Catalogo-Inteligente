package com.catalogo.auth.repository;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.auth.entity.TokenRevogado;

public interface TokenRevogadoRepository extends JpaRepository<TokenRevogado, UUID> {

    @Modifying
    @Query("DELETE FROM TokenRevogado t WHERE t.expiraEm < :agora")
    int apagarVencidos(@Param("agora") OffsetDateTime agora);
}
