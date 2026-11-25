package com.catalogo.scoring;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.catalogo.catalog.entity.Compra;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.scoring.engine.ScoreCalculator;
import com.catalogo.scoring.engine.ScoringParams;

/** Valores da V023 (docs/13, M21): só navegar não vira Quente, e demonstrar intenção vira. */
class CalibracaoPadraoTest {

    private static final OffsetDateTime AGORA = OffsetDateTime.parse("2026-11-07T12:00:00Z");
    private static final Produto PRODUTO = ScoreCalculatorTest.produto(10L, 1L);
    private static final double MORNO = 40;
    private static final double QUENTE = 70;

    private static final ScoringParams PADRAO = new ScoringParams(Map.of(
            TipoEvento.VISUALIZACAO_PRODUTO, 0.1,
            TipoEvento.FAVORITAR, 1.2,
            TipoEvento.DESFAVORITAR, 0.1,
            TipoEvento.CONTATO_WHATSAPP, 1.5,
            TipoEvento.PESQUISA, 0.4,
            TipoEvento.FILTRO_APLICADO, 0.5,
            TipoEvento.SCROLL_DEPTH, 0.3,
            TipoEvento.TEMPO_PAGINA, 0.2,
            TipoEvento.COMPRA, 1.0,
            TipoEvento.RETORNO_PAGINA, 0.0
    ), ScoringParams.LAMBDA_PADRAO, 1.0, Map.of(), Map.of());

    private final List<Evento> eventos = new ArrayList<>();

    @Test
    void soNavegarNaoViraQuente() {
        leu(0);
        assertTrue(nota() < MORNO, "ler uma vez é Frio");
        leu(2);
        leu(5);
        assertTrue(nota() < QUENTE, "ler 3 vezes na semana não é Quente");
    }

    @Test
    void olharCincoVezesEFrio() {
        for (int dias : List.of(0, 1, 3, 5, 6)) {
            visita(dias, 2, 25);
        }
        assertTrue(nota() < MORNO);
    }

    @Test
    void umSinalDeIntencaoEMorno() {
        leu(0);
        acao(TipoEvento.FAVORITAR);
        assertMorno();

        eventos.clear();
        leu(0);
        acao(TipoEvento.CONTATO_WHATSAPP);
        assertMorno();
    }

    @Test
    void favoritarEChamarEQuente() {
        leu(0);
        acao(TipoEvento.FAVORITAR);
        acao(TipoEvento.CONTATO_WHATSAPP);
        assertTrue(nota() >= QUENTE);
    }

    /** A compra não esfria: peso alto deixaria um cliente antigo Quente para sempre. */
    @Test
    void comprasAntigasDeProdutosDiferentesNaoMantemOCliente() {
        List<Compra> compras = List.of(compra(11L), compra(12L), compra(13L));
        double maior = ScoreCalculator.calcular(List.of(), compras, PADRAO, AGORA).notaMaxima();
        assertTrue(maior < MORNO, "nota " + maior);
    }

    private void leu(int diasAtras) {
        visita(diasAtras, 4, 100);
    }

    private void visita(int diasAtras, int marcosDeRolagem, int segundos) {
        OffsetDateTime quando = AGORA.minusDays(diasAtras);
        eventos.add(ScoreCalculatorTest.evento(TipoEvento.VISUALIZACAO_PRODUTO, PRODUTO, quando));
        for (int i = 0; i < marcosDeRolagem; i++) {
            eventos.add(ScoreCalculatorTest.evento(TipoEvento.SCROLL_DEPTH, PRODUTO, quando));
        }
        Evento tempo = ScoreCalculatorTest.evento(TipoEvento.TEMPO_PAGINA, PRODUTO, quando);
        tempo.setMetadados(Map.of("segundos_ativos", segundos));
        eventos.add(tempo);
    }

    private void acao(TipoEvento tipo) {
        eventos.add(ScoreCalculatorTest.evento(tipo, PRODUTO, AGORA));
    }

    private static Compra compra(Long produtoId) {
        Compra c = new Compra();
        c.setProduto(ScoreCalculatorTest.produto(produtoId, 1L));
        c.setDataCompra(LocalDate.parse("2025-11-01"));
        return c;
    }

    private double nota() {
        return ScoreCalculator.calcular(eventos, List.of(), PADRAO, AGORA).notaMaxima();
    }

    private void assertMorno() {
        double n = nota();
        assertTrue(n >= MORNO && n < QUENTE, "nota " + n);
    }
}
