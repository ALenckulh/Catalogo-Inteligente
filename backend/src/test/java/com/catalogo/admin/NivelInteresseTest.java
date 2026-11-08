package com.catalogo.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.catalogo.admin.domain.NivelInteresse;

class NivelInteresseTest {

    @Test
    void semScoreQuandoNulo() {
        assertEquals(NivelInteresse.SEM_SCORE, NivelInteresse.of(null));
    }

    @Test
    void limitesDasFaixas() {
        assertEquals(NivelInteresse.FRIO, NivelInteresse.of(new BigDecimal("0")));
        assertEquals(NivelInteresse.FRIO, NivelInteresse.of(new BigDecimal("39.99")));
        assertEquals(NivelInteresse.MORNO, NivelInteresse.of(new BigDecimal("40")));
        assertEquals(NivelInteresse.MORNO, NivelInteresse.of(new BigDecimal("69.99")));
        assertEquals(NivelInteresse.QUENTE, NivelInteresse.of(new BigDecimal("70")));
        assertEquals(NivelInteresse.QUENTE, NivelInteresse.of(new BigDecimal("100")));
    }
}
