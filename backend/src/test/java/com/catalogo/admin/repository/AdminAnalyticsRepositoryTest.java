package com.catalogo.admin.repository;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.HashMap;
import java.util.Map;
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

    @Test
    void textoProcuraEmNomeERazaoEEmail() {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        AdminAnalyticsRepository.filtroTexto("Mecânica 100%", sql, params);
        assertEquals(Map.of("q0", "%mecânica%", "q1", "%100\\%%"), params);
        assertFalse(sql.toString().contains("cnpj"));
    }

    @Test
    void buscaSoDeNumerosIncluiDocumentoETelefone() {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        AdminAnalyticsRepository.filtroTexto("23.456.789/0001-10", sql, params);
        assertEquals("%23456789000110%", params.get("digitos"));
        assertTrue(sql.toString().contains("u.cnpj LIKE :digitos"));
    }

    @Test
    void semTextoNaoMudaOSql() {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        AdminAnalyticsRepository.filtroTexto("  ", sql, params);
        AdminAnalyticsRepository.filtroTexto(null, sql, params);
        assertEquals("", sql.toString());
        assertTrue(params.isEmpty());
    }
}
