package com.catalogo.lgpd.entity;

import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.catalogo.auth.entity.Usuario;
import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "solicitacao_lgpd")
public class SolicitacaoLgpd {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "tipo_solicitacao_lgpd")
    private TipoSolicitacaoLgpd tipo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "status_solicitacao_lgpd")
    private StatusSolicitacaoLgpd status = StatusSolicitacaoLgpd.PENDENTE;

    @Column(name = "solicitado_em", nullable = false)
    private OffsetDateTime solicitadoEm = OffsetDateTime.now();

    @Column(name = "atendido_em")
    private OffsetDateTime atendidoEm;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public TipoSolicitacaoLgpd getTipo() {
        return tipo;
    }

    public void setTipo(TipoSolicitacaoLgpd tipo) {
        this.tipo = tipo;
    }

    public StatusSolicitacaoLgpd getStatus() {
        return status;
    }

    public void setStatus(StatusSolicitacaoLgpd status) {
        this.status = status;
    }

    public OffsetDateTime getSolicitadoEm() {
        return solicitadoEm;
    }

    public void setSolicitadoEm(OffsetDateTime solicitadoEm) {
        this.solicitadoEm = solicitadoEm;
    }

    public OffsetDateTime getAtendidoEm() {
        return atendidoEm;
    }

    public void setAtendidoEm(OffsetDateTime atendidoEm) {
        this.atendidoEm = atendidoEm;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }
}
