package com.catalogo.admin.domain;

import java.math.BigDecimal;

/**
 * Nível de interesse de um cliente, derivado do seu maior score de produto (0–100).
 * Fonte única dos cortes usados no dashboard (KPI, gráfico) e no filtro da lista de usuários.
 */
public enum NivelInteresse {
    QUENTE,
    MORNO,
    FRIO,
    SEM_SCORE;

    /** Score mínimo para "Quente" (= KPI "Clientes com alto interesse"). */
    public static final double ALTO = 70.0;
    /** Score mínimo para "Morno". */
    public static final double MORNO_MIN = 40.0;

    private static final BigDecimal ALTO_BD = BigDecimal.valueOf(ALTO);
    private static final BigDecimal MORNO_BD = BigDecimal.valueOf(MORNO_MIN);

    /** Nível a partir de uma nota calculada; {@code NaN} (sem nenhuma nota) = SEM_SCORE. */
    public static NivelInteresse deNota(double nota) {
        return Double.isNaN(nota) ? SEM_SCORE : of(BigDecimal.valueOf(nota));
    }

    public static NivelInteresse of(BigDecimal scoreMax) {
        if (scoreMax == null) {
            return SEM_SCORE;
        }
        if (scoreMax.compareTo(ALTO_BD) >= 0) {
            return QUENTE;
        }
        if (scoreMax.compareTo(MORNO_BD) >= 0) {
            return MORNO;
        }
        return FRIO;
    }
}
