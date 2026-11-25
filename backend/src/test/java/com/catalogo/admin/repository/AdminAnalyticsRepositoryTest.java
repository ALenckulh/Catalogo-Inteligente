package com.catalogo.admin.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class AdminAnalyticsRepositoryTest {

    /** A ordenação entra concatenada no SQL: só pode sair da lista permitida. */
    @Test
    void ordenacaoSoAceitaCamposPermitidos() {
        assertEquals("mx.max_score DESC NULLS LAST, u.id",
                AdminAnalyticsRepository.orderByUsuarios("scoreMaxProduto,desc"));
        assertEquals("ua.ultima ASC NULLS FIRST, u.id",
                AdminAnalyticsRepository.orderByUsuarios("ultimaAtividade,asc"));
        assertEquals("ua.ultima ASC NULLS FIRST, u.id",
                AdminAnalyticsRepository.orderByUsuarios("ultimaAtividade,desc; DROP TABLE usuario"));
        assertEquals("u.id DESC", AdminAnalyticsRepository.orderByUsuarios("senha_hash,asc"));
        assertEquals("u.id DESC", AdminAnalyticsRepository.orderByUsuarios("u.id; DROP TABLE usuario"));
        assertEquals("u.id DESC", AdminAnalyticsRepository.orderByUsuarios(","));
        assertEquals("u.id DESC", AdminAnalyticsRepository.orderByUsuarios(""));
        assertEquals("u.id DESC", AdminAnalyticsRepository.orderByUsuarios(null));
    }
}
