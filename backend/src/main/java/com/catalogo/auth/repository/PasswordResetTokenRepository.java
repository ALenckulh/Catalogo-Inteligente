package com.catalogo.auth.repository;

import java.time.OffsetDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    /** Um pedido novo anula os códigos que a pessoa ainda não usou. */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.usadoEm = :agora WHERE t.usuario.id = :usuarioId AND t.usadoEm IS NULL")
    int invalidarPendentes(@Param("usuarioId") Long usuarioId, @Param("agora") OffsetDateTime agora);
}
