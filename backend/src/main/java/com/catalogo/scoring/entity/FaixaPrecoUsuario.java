package com.catalogo.scoring.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "faixa_preco_usuario")
public class FaixaPrecoUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "visitante_id")
    private Long visitanteId;

    @Column(name = "mediana_com_conversao", precision = 12, scale = 2)
    private BigDecimal medianaComConversao;

    @Column(name = "mediana_sem_conversao", precision = 12, scale = 2)
    private BigDecimal medianaSemConversao;

    @Column(name = "gap_preco", precision = 12, scale = 2)
    private BigDecimal gapPreco;

    @Column(name = "calculado_em", nullable = false)
    private OffsetDateTime calculadoEm = OffsetDateTime.now();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public Long getVisitanteId() {
        return visitanteId;
    }

    public void setVisitanteId(Long visitanteId) {
        this.visitanteId = visitanteId;
    }

    public BigDecimal getMedianaComConversao() {
        return medianaComConversao;
    }

    public void setMedianaComConversao(BigDecimal medianaComConversao) {
        this.medianaComConversao = medianaComConversao;
    }

    public BigDecimal getMedianaSemConversao() {
        return medianaSemConversao;
    }

    public void setMedianaSemConversao(BigDecimal medianaSemConversao) {
        this.medianaSemConversao = medianaSemConversao;
    }

    public BigDecimal getGapPreco() {
        return gapPreco;
    }

    public void setGapPreco(BigDecimal gapPreco) {
        this.gapPreco = gapPreco;
    }

    public OffsetDateTime getCalculadoEm() {
        return calculadoEm;
    }

    public void setCalculadoEm(OffsetDateTime calculadoEm) {
        this.calculadoEm = calculadoEm;
    }
}
