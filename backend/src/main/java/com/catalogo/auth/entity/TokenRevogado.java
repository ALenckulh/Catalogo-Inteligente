package com.catalogo.auth.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Token que saiu da conta antes de vencer. */
@Entity
@Table(name = "token_revogado")
public class TokenRevogado {

    @Id
    private UUID jti;

    @Column(name = "expira_em", nullable = false)
    private OffsetDateTime expiraEm;

    protected TokenRevogado() {
    }

    public TokenRevogado(UUID jti, OffsetDateTime expiraEm) {
        this.jti = jti;
        this.expiraEm = expiraEm;
    }

    public UUID getJti() {
        return jti;
    }

    public OffsetDateTime getExpiraEm() {
        return expiraEm;
    }
}
