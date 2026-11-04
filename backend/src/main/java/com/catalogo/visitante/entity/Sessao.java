package com.catalogo.visitante.entity;

import java.time.OffsetDateTime;

import com.catalogo.auth.entity.Usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "sessao")
public class Sessao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visitante_id")
    private Visitante visitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    private String dispositivo;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "canal_origem", length = 100)
    private String canalOrigem;

    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    @Column(name = "iniciada_em", nullable = false)
    private OffsetDateTime iniciadaEm = OffsetDateTime.now();

    @Column(name = "encerrada_em")
    private OffsetDateTime encerradaEm;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Visitante getVisitante() {
        return visitante;
    }

    public void setVisitante(Visitante visitante) {
        this.visitante = visitante;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getDispositivo() {
        return dispositivo;
    }

    public void setDispositivo(String dispositivo) {
        this.dispositivo = dispositivo;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getCanalOrigem() {
        return canalOrigem;
    }

    public void setCanalOrigem(String canalOrigem) {
        this.canalOrigem = canalOrigem;
    }

    public String getIpHash() {
        return ipHash;
    }

    public void setIpHash(String ipHash) {
        this.ipHash = ipHash;
    }

    public OffsetDateTime getIniciadaEm() {
        return iniciadaEm;
    }

    public void setIniciadaEm(OffsetDateTime iniciadaEm) {
        this.iniciadaEm = iniciadaEm;
    }

    public OffsetDateTime getEncerradaEm() {
        return encerradaEm;
    }

    public void setEncerradaEm(OffsetDateTime encerradaEm) {
        this.encerradaEm = encerradaEm;
    }
}
