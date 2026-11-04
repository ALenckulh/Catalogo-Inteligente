package com.catalogo.auth.entity;

import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.catalogo.auth.domain.TipoConsentimento;

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
@Table(name = "consentimento_lgpd")
public class ConsentimentoLgpd {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "tipo_consentimento")
    private TipoConsentimento tipo;

    @Column(nullable = false)
    private boolean aceito;

    @Column(name = "versao_termos", nullable = false, length = 20)
    private String versaoTermos;

    @Column(name = "aceito_em", nullable = false)
    private OffsetDateTime aceitoEm;

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

    public TipoConsentimento getTipo() {
        return tipo;
    }

    public void setTipo(TipoConsentimento tipo) {
        this.tipo = tipo;
    }

    public boolean isAceito() {
        return aceito;
    }

    public void setAceito(boolean aceito) {
        this.aceito = aceito;
    }

    public String getVersaoTermos() {
        return versaoTermos;
    }

    public void setVersaoTermos(String versaoTermos) {
        this.versaoTermos = versaoTermos;
    }

    public OffsetDateTime getAceitoEm() {
        return aceitoEm;
    }

    public void setAceitoEm(OffsetDateTime aceitoEm) {
        this.aceitoEm = aceitoEm;
    }
}
