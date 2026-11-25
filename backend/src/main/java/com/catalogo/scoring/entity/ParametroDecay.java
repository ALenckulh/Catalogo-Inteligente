package com.catalogo.scoring.entity;

import com.catalogo.scoring.engine.ScoringParams;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "parametro_decay")
public class ParametroDecay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "categoria_id")
    private Long categoriaId;

    @Column(nullable = false, precision = 6, scale = 5)
    private BigDecimal lambda;

    @Column(name = "boost_conversao", nullable = false, precision = 3, scale = 2)
    private BigDecimal boostConversao = BigDecimal.ONE;

    @Column(name = "boost_recorrencia", nullable = false, precision = 3, scale = 2)
    private BigDecimal boostRecorrencia = BigDecimal.ONE;

    /** Só vale na linha global. */
    @Column(name = "pausa_dias", nullable = false)
    private Short pausaDias = ScoringParams.PAUSA_PADRAO;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    @Column(name = "atualizado_por")
    private Long atualizadoPor;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(Long categoriaId) {
        this.categoriaId = categoriaId;
    }

    public BigDecimal getLambda() {
        return lambda;
    }

    public void setLambda(BigDecimal lambda) {
        this.lambda = lambda;
    }

    public BigDecimal getBoostConversao() {
        return boostConversao;
    }

    public void setBoostConversao(BigDecimal boostConversao) {
        this.boostConversao = boostConversao;
    }

    public BigDecimal getBoostRecorrencia() {
        return boostRecorrencia;
    }

    public void setBoostRecorrencia(BigDecimal boostRecorrencia) {
        this.boostRecorrencia = boostRecorrencia;
    }

    public Short getPausaDias() {
        return pausaDias;
    }

    public void setPausaDias(Short pausaDias) {
        this.pausaDias = pausaDias;
    }

    public OffsetDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(OffsetDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }

    public Long getAtualizadoPor() {
        return atualizadoPor;
    }

    public void setAtualizadoPor(Long atualizadoPor) {
        this.atualizadoPor = atualizadoPor;
    }
}
