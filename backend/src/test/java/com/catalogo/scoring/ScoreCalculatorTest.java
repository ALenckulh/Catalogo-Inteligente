package com.catalogo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.scoring.engine.ScoreCalculator;
import com.catalogo.scoring.engine.ScoringParams;

class ScoreCalculatorTest {

    private static final OffsetDateTime AGORA = OffsetDateTime.parse("2026-11-07T12:00:00Z");

    @Test
    void notaEPesoDividoPelaSomaDosPesosDeProduto() {
        ScoringParams params = params(Map.of(
                TipoEvento.VISUALIZACAO_PRODUTO, 1.0,
                TipoEvento.CONTATO_WHATSAPP, 3.0
        ));
        Produto p = produto(10L, 1L);

        var r = ScoreCalculator.calcular(List.of(evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA)), List.of(), params, AGORA);

        // 1 visualização = 1 / (1 + 3) * 100 = 25 pontos
        assertEquals(25.0, r.notasProduto().get(10L), 1e-9);
    }

    @Test
    void pesquisaComProdutoSomaNoProdutoESemProdutoNao() {
        ScoringParams params = params(Map.of(TipoEvento.PESQUISA, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0));
        Produto p = produto(10L, 1L);

        var comProduto = ScoreCalculator.calcular(List.of(evento(TipoEvento.PESQUISA, p, AGORA)), List.of(), params, AGORA);
        var semProduto = ScoreCalculator.calcular(List.of(evento(TipoEvento.PESQUISA, null, AGORA)), List.of(), params, AGORA);

        // pesquisou e abriu o resultado = 1 / (1 + 3) * 100 = 25 pontos no produto
        assertEquals(25.0, comProduto.notasProduto().get(10L), 1e-9);
        assertTrue(semProduto.notasProduto().isEmpty());
    }

    @Test
    void divisorIncluiPesquisaEExcluiFiltro() {
        Produto p = produto(10L, 1L);
        List<Evento> eventos = List.of(evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA));
        ScoringParams base = params(Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0));
        ScoringParams comFiltro = params(Map.of(
                TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0, TipoEvento.FILTRO_APLICADO, 10.0));
        ScoringParams comPesquisa = params(Map.of(
                TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0, TipoEvento.PESQUISA, 4.0));

        double notaBase = ScoreCalculator.calcular(eventos, List.of(), base, AGORA).notasProduto().get(10L);
        assertEquals(notaBase, ScoreCalculator.calcular(eventos, List.of(), comFiltro, AGORA).notasProduto().get(10L), 1e-9);
        // pesquisa agora é métrica de produto: entra no divisor (1 / (1 + 3 + 4) * 100 = 12,5)
        assertEquals(12.5, ScoreCalculator.calcular(eventos, List.of(), comPesquisa, AGORA).notasProduto().get(10L), 1e-9);
    }

    @Test
    void filtroPorCategoriaSomaNaCategoriaENaoMudaProduto() {
        ScoringParams params = params(Map.of(
                TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0, TipoEvento.FILTRO_APLICADO, 2.0));
        Produto p = produto(10L, 1L);
        List<Evento> soVisualizacao = List.of(evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA));
        List<Evento> comFiltro = List.of(
                evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA),
                filtro(1L, AGORA),
                filtro(2L, AGORA)
        );

        var sem = ScoreCalculator.calcular(soVisualizacao, List.of(), params, AGORA);
        var com = ScoreCalculator.calcular(comFiltro, List.of(), params, AGORA);

        assertEquals(sem.notasProduto(), com.notasProduto());
        // categoria 1: média dos produtos (25) + filtro (2 / 4 * 100 = 50)
        assertEquals(75.0, com.notasCategoria().get(1L), 1e-9);
        // categoria 2: só filtrada, sem produto visto
        assertEquals(50.0, com.notasCategoria().get(2L), 1e-9);
    }

    @Test
    void filtroAntigoDecaiComLambdaDaCategoria() {
        ScoringParams params = new ScoringParams(
                Map.of(TipoEvento.CONTATO_WHATSAPP, 1.0, TipoEvento.FILTRO_APLICADO, 1.0),
                0.01, 1.0, Map.of(2L, 0.05), Map.of());

        double recente = ScoreCalculator.calcular(List.of(filtro(2L, AGORA)), List.of(), params, AGORA).notasCategoria().get(2L);
        double antigo = ScoreCalculator.calcular(List.of(filtro(2L, AGORA.minusDays(30))), List.of(), params, AGORA).notasCategoria().get(2L);

        assertEquals(100.0, recente, 1e-9);
        assertEquals(100.0 * Math.exp(-0.05 * 30), antigo, 1e-6);
    }

    @Test
    void pesosSaoRelativos() {
        Produto p = produto(10L, 1L);
        List<Evento> eventos = List.of(
                evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA.minusDays(20)),
                evento(TipoEvento.FAVORITAR, p, AGORA.minusDays(3))
        );
        ScoringParams base = params(Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 0.2, TipoEvento.FAVORITAR, 0.5, TipoEvento.CONTATO_WHATSAPP, 1.0));
        ScoringParams dobro = params(Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 0.4, TipoEvento.FAVORITAR, 1.0, TipoEvento.CONTATO_WHATSAPP, 2.0));

        assertEquals(
                ScoreCalculator.calcular(eventos, List.of(), base, AGORA).notasProduto().get(10L),
                ScoreCalculator.calcular(eventos, List.of(), dobro, AGORA).notasProduto().get(10L),
                1e-9
        );
    }

    @Test
    void lambdaMaiorReduzNotaDeEventoAntigo() {
        Produto p = produto(10L, 1L);
        List<Evento> eventos = List.of(evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA.minusDays(30)));
        Map<TipoEvento, Double> pesos = Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 1.0);
        ScoringParams lento = new ScoringParams(pesos, 0.01, 1.0, Map.of(), Map.of());
        ScoringParams rapido = new ScoringParams(pesos, 0.05, 1.0, Map.of(), Map.of());

        assertTrue(ScoreCalculator.calcular(eventos, List.of(), rapido, AGORA).notaMaxima()
                < ScoreCalculator.calcular(eventos, List.of(), lento, AGORA).notaMaxima());
    }

    private static ScoringParams params(Map<TipoEvento, Double> pesos) {
        return new ScoringParams(pesos, 0.01, 1.0, Map.of(), Map.of());
    }

    static Produto produto(Long id, Long categoriaId) {
        Categoria c = new Categoria();
        c.setId(categoriaId);
        c.setNome("C" + categoriaId);
        c.setSlug("c" + categoriaId);
        Produto p = new Produto();
        p.setId(id);
        p.setNome("P" + id);
        p.setSlug("p" + id);
        p.setPreco(new BigDecimal("10.00"));
        p.setCategoria(c);
        p.setAtivo(true);
        return p;
    }

    static Evento filtro(Long categoriaId, OffsetDateTime quando) {
        Categoria c = new Categoria();
        c.setId(categoriaId);
        Evento e = new Evento();
        e.setTipo(TipoEvento.FILTRO_APLICADO);
        e.setCategoria(c);
        e.setOcorridoEm(quando);
        return e;
    }

    static Evento evento(TipoEvento tipo, Produto produto, OffsetDateTime quando) {
        Evento e = new Evento();
        e.setTipo(tipo);
        e.setProduto(produto);
        e.setOcorridoEm(quando);
        return e;
    }
}
