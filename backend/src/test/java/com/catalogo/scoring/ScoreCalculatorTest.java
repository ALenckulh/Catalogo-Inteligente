package com.catalogo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.catalogo.visitante.entity.Sessao;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Compra;
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

    @Test
    void tempoNaPaginaValeProporcionalAte2Minutos() {
        ScoringParams params = params(Map.of(TipoEvento.TEMPO_PAGINA, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0));
        Produto p = produto(10L, 1L);

        // 60s = metade do peso: 0,5 / (1 + 3) * 100 = 12,5; 300s = peso cheio = 25
        assertEquals(12.5, nota(params, tempo(p, 60)), 1e-9);
        assertEquals(25.0, nota(params, tempo(p, 300)), 1e-9);
    }

    @Test
    void tempoNaoNumericoOuInfinitoValeZero() {
        ScoringParams params = params(Map.of(TipoEvento.TEMPO_PAGINA, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0));
        Produto p = produto(10L, 1L);
        for (Object s : new Object[] {"NaN", "Infinity", "-Infinity", "abc", Double.NaN}) {
            Evento e = evento(TipoEvento.TEMPO_PAGINA, p, AGORA);
            e.setMetadados(Map.of("segundos_ativos", s));
            assertEquals(0.0, nota(params, e), 1e-9, String.valueOf(s));
        }
    }

    @Test
    void rolarAteOFimSomaNoMaximoOPesoCheio() {
        ScoringParams params = params(Map.of(TipoEvento.SCROLL_DEPTH, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0));
        Produto p = produto(10L, 1L);
        Evento[] marcos = new Evento[4];
        for (int i = 0; i < 4; i++) {
            marcos[i] = evento(TipoEvento.SCROLL_DEPTH, p, AGORA);
            marcos[i].setMetadados(Map.of("pct", (i + 1) * 25));
        }

        // 1 marco = 1/4 do peso (6,25); os 4 marcos = peso cheio (25)
        assertEquals(6.25, nota(params, marcos[0]), 1e-9);
        assertEquals(25.0, nota(params, marcos), 1e-9);
    }

    @Test
    void compraDeProdutoSemEventosTambemPontua() {
        ScoringParams params = params(Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0));
        Produto visto = produto(10L, 1L);
        Produto soComprado = produto(20L, 2L);
        List<Compra> compras = List.of(
                compra(visto, AGORA.toLocalDate()),
                compra(visto, AGORA.toLocalDate()),
                compra(soComprado, AGORA.toLocalDate())
        );

        var r = ScoreCalculator.calcular(
                List.of(evento(TipoEvento.VISUALIZACAO_PRODUTO, visto, AGORA)), compras, params, AGORA);

        // 1 compra recente = peso do WhatsApp (3) / (1 + 3) * 100 = 75
        assertEquals(75.0, r.notasProduto().get(20L), 1e-9);
        assertEquals(75.0, r.notasCategoria().get(2L), 1e-9);
        // compra = conversão: os dois produtos entram na faixa com conversão
        assertEquals(2, r.precosComConversao().size());
        assertEquals(0, r.precosSemConversao().size());
    }

    /** Abaixo de 3 compras não há pontos, mas a compra é conversão (docs/04 §8.1). */
    @Test
    void umaCompraDaBonusEFaixaSemPontos() {
        ScoringParams params = new ScoringParams(
                Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0), 0.01, 1.5, Map.of(), Map.of());
        Produto p = produto(10L, 1L);
        List<Evento> visto = List.of(evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA));

        var sem = ScoreCalculator.calcular(visto, List.of(), params, AGORA);
        var com = ScoreCalculator.calcular(visto, List.of(compra(p, AGORA.toLocalDate().minusDays(30))), params, AGORA);
        var velha = ScoreCalculator.calcular(visto, List.of(compra(p, AGORA.toLocalDate().minusDays(31))), params, AGORA);

        assertEquals(sem.notasProduto(), com.notasProduto());
        assertEquals(sem.notasCategoria().get(1L) * 1.5, com.notasCategoria().get(1L), 1e-9);
        assertEquals(sem.notasCategoria(), velha.notasCategoria());
        assertEquals(1, com.precosComConversao().size());
        assertEquals(1, velha.precosComConversao().size());
        assertEquals(1, sem.precosSemConversao().size());
    }

    @Test
    void compraPausaOuAtenuaODecaimento() {
        ScoringParams params = params(Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0));
        Produto p = produto(10L, 1L);
        java.util.function.BiFunction<Integer, Integer, Double> nota = (diasEvento, diasCompra) -> ScoreCalculator.calcular(
                List.of(evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA.minusDays(diasEvento))),
                diasCompra == null ? List.of() : List.of(compra(p, AGORA.toLocalDate().minusDays(diasCompra))),
                params, AGORA).notasProduto().get(10L);

        assertEquals(25.0, nota.apply(100, 60), 1e-9); // compra há 60 dias: pausado
        assertEquals(25.0 * Math.exp(-1.0), nota.apply(100, 61), 1e-9); // 61: volta a decair, na taxa normal
        assertEquals(25.0 * Math.exp(-2.0), nota.apply(100, null), 1e-9); // sem compra: acelerado
        assertEquals(25.0 * Math.exp(-2.0), nota.apply(200, 300), 1e-9); // comprado não zera depois de 180 dias
        assertEquals(0.0, nota.apply(200, null), 1e-9);
    }

    /** Os valores iniciais (V020) não mudam nenhuma nota. */
    @Test
    void valoresIniciaisNaoMudamNota() {
        Map<TipoEvento, Double> antes = Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0);
        Map<TipoEvento, Double> depois = Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 3.0,
                TipoEvento.COMPRA, 3.0, TipoEvento.RETORNO_PAGINA, 0.0);
        Produto p = produto(10L, 1L);
        List<Evento> eventos = List.of(
                vista(p, 1L, AGORA.minusDays(20)), vista(p, 2L, AGORA.minusDays(10)), vista(p, 2L, AGORA.minusDays(10)));
        List<Compra> compras = List.of(
                compra(p, AGORA.toLocalDate()), compra(p, AGORA.toLocalDate().minusDays(90)), compra(p, AGORA.toLocalDate().minusDays(800)));

        var a = ScoreCalculator.calcular(eventos, compras, params(antes), AGORA);
        var d = ScoreCalculator.calcular(eventos, compras, params(depois), AGORA);

        assertEquals(a.notasProduto(), d.notasProduto());
        assertEquals(a.notasCategoria(), d.notasCategoria());
    }

    @Test
    void compraTemPesoProprioForaDoDivisor() {
        Produto p = produto(10L, 1L);
        List<Compra> tres = List.of(compra(p, AGORA.toLocalDate()), compra(p, AGORA.toLocalDate()), compra(p, AGORA.toLocalDate()));
        ScoringParams params = params(Map.of(TipoEvento.CONTATO_WHATSAPP, 4.0, TipoEvento.COMPRA, 0.4));

        assertEquals(4.0, params.scoreMax(), 1e-9);
        // 3 × 0,4 ÷ 4 × 100
        assertEquals(30.0, ScoreCalculator.calcular(List.of(), tres, params, AGORA).notasProduto().get(10L), 1e-9);
    }

    /** Três sessões = dois retornos, um por sessão, seja quantas vezes o produto foi visto em cada uma. */
    @Test
    void retornoContaUmaVezPorSessaoDepoisDaPrimeira() {
        Produto p = produto(10L, 1L);
        ScoringParams params = params(Map.of(
                TipoEvento.VISUALIZACAO_PRODUTO, 0.0, TipoEvento.CONTATO_WHATSAPP, 4.0, TipoEvento.RETORNO_PAGINA, 1.0));

        assertEquals(0.0, nota(params, vista(p, 1L, AGORA), vista(p, 1L, AGORA)), 1e-9);
        assertEquals(50.0, nota(params, vista(p, 3L, AGORA), vista(p, 1L, AGORA.minusDays(2)), vista(p, 2L, AGORA.minusDays(1)),
                vista(p, 3L, AGORA)), 1e-9);
        // o retorno esfria pela data dele: 30 dias
        assertEquals(25.0 * Math.exp(-0.3), nota(params, vista(p, 1L, AGORA.minusDays(40)), vista(p, 2L, AGORA.minusDays(30))), 1e-9);
        // sem sessão (dado antigo) não conta
        assertEquals(0.0, nota(params, evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA), evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA)), 1e-9);
    }

    @Test
    void recorrenciaMultiplicaACategoriaComTresComprasEmDatasDiferentes() {
        Produto p = produto(10L, 1L);
        Produto q = produto(11L, 1L);
        Produto outra = produto(12L, 2L);
        LocalDate hoje = AGORA.toLocalDate();
        ScoringParams sem = params(Map.of(TipoEvento.CONTATO_WHATSAPP, 10.0, TipoEvento.COMPRA, 1.0));
        ScoringParams com = new ScoringParams(sem.pesos(), 0.01, 1.0, Map.of(), Map.of(), 1.5, Map.of(2L, 1.2), 60);
        List<Compra> recorrente = List.of(compra(p, hoje.minusDays(40)), compra(q, hoje.minusDays(80)), compra(outra, hoje.minusDays(40)));

        var a = ScoreCalculator.calcular(List.of(), recorrente, sem, AGORA).notasCategoria();
        var b = ScoreCalculator.calcular(List.of(), recorrente, com, AGORA).notasCategoria();
        assertEquals(a.get(1L) * 1.5, b.get(1L), 1e-9); // produtos diferentes, mesma categoria, duas datas
        assertEquals(a.get(2L), b.get(2L), 1e-9); // uma compra só

        // mesma data não é recorrência; com 2 compras no total, também não
        List<Compra> mesmoDia = List.of(compra(p, hoje), compra(q, hoje), compra(p, hoje));
        assertEquals(ScoreCalculator.calcular(List.of(), mesmoDia, sem, AGORA).notasCategoria(),
                ScoreCalculator.calcular(List.of(), mesmoDia, com, AGORA).notasCategoria());
        List<Evento> visto = List.of(evento(TipoEvento.CONTATO_WHATSAPP, p, AGORA.minusDays(40)));
        assertEquals(ScoreCalculator.calcular(visto, recorrente.subList(0, 2), sem, AGORA).notasCategoria(),
                ScoreCalculator.calcular(visto, recorrente.subList(0, 2), com, AGORA).notasCategoria());

        // ajuste próprio da categoria e teto de 100
        List<Compra> na2 = List.of(compra(outra, hoje.minusDays(40)), compra(outra, hoje.minusDays(80)), compra(p, hoje.minusDays(40)));
        assertEquals(ScoreCalculator.calcular(List.of(), na2, sem, AGORA).notasCategoria().get(2L) * 1.2,
                ScoreCalculator.calcular(List.of(), na2, com, AGORA).notasCategoria().get(2L), 1e-9);
        ScoringParams alto = new ScoringParams(Map.of(TipoEvento.CONTATO_WHATSAPP, 1.0), 0.01, 1.0, Map.of(), Map.of(), 1.5, Map.of(), 60);
        assertEquals(100.0, ScoreCalculator.calcular(List.of(), recorrente, alto, AGORA).notasCategoria().get(1L), 1e-9);
    }

    @Test
    void pausaConfiguravel() {
        Produto p = produto(10L, 1L);
        Map<TipoEvento, Double> pesos = Map.of(TipoEvento.VISUALIZACAO_PRODUTO, 1.0, TipoEvento.CONTATO_WHATSAPP, 0.0);
        java.util.function.BiFunction<Integer, Integer, Double> nota = (pausa, dias) -> nota(
                new ScoringParams(pesos, 0.01, 1.0, Map.of(), Map.of(), 1.0, Map.of(), pausa),
                evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA.minusDays(50)),
                evento(TipoEvento.CONTATO_WHATSAPP, p, AGORA.minusDays(dias)));

        assertEquals(100.0, nota.apply(60, 30), 1e-9);
        assertEquals(100.0, nota.apply(30, 30), 1e-9);
        assertEquals(100.0 * Math.exp(-0.5), nota.apply(29, 30), 1e-9);
        assertEquals(100.0 * Math.exp(-0.5), nota.apply(0, 1), 1e-9);
    }

    private static Evento vista(Produto p, Long sessaoId, OffsetDateTime quando) {
        Evento e = evento(TipoEvento.VISUALIZACAO_PRODUTO, p, quando);
        Sessao s = new Sessao();
        s.setId(sessaoId);
        e.setSessao(s);
        return e;
    }

    @Test
    void soCompradoAbaixoDoMinimoNaoGanhaNota() {
        ScoringParams params = params(Map.of(TipoEvento.CONTATO_WHATSAPP, 3.0));
        var r = ScoreCalculator.calcular(List.of(), List.of(compra(produto(10L, 1L), AGORA.toLocalDate())), params, AGORA);
        assertTrue(r.notasProduto().isEmpty());
        assertTrue(r.notasCategoria().isEmpty());
        assertTrue(Double.isNaN(r.notaMaxima()));
        assertEquals(1, r.precosComConversao().size());
    }

    @Test
    void favoritoValePeloUltimoEstado() {
        ScoringParams params = params(Map.of(
                TipoEvento.FAVORITAR, 0.5, TipoEvento.DESFAVORITAR, 0.1, TipoEvento.VISUALIZACAO_PRODUTO, 0.4));
        Produto p = produto(10L, 1L);
        Evento[] muitos = new Evento[22];
        for (int i = 0; i < 22; i++) {
            muitos[i] = evento(i % 2 == 0 ? TipoEvento.FAVORITAR : TipoEvento.DESFAVORITAR, p, AGORA.minusMinutes(30 - i));
        }
        assertEquals(0.0, nota(params, muitos), 1e-9); // termina desfavoritado
        assertEquals(50.0, nota(params, java.util.Arrays.copyOf(muitos, 21)), 1e-9); // termina favoritado: conta 1 vez

        // Mesmo horário: o id desempata. A ordem da lista não importa.
        Evento fav = evento(TipoEvento.FAVORITAR, p, AGORA);
        fav.setId(1L);
        Evento desf = evento(TipoEvento.DESFAVORITAR, p, AGORA);
        desf.setId(2L);
        Evento ver = evento(TipoEvento.VISUALIZACAO_PRODUTO, p, AGORA);
        assertEquals(30.0, nota(params, ver, fav, desf), 1e-9); // 0,4 − 0,1
        assertEquals(30.0, nota(params, desf, fav, ver), 1e-9);
    }

    private static Compra compra(Produto p, LocalDate data) {
        Compra c = new Compra();
        c.setProduto(p);
        c.setDataCompra(data);
        return c;
    }

    private static Evento tempo(Produto p, int segundos) {
        Evento e = evento(TipoEvento.TEMPO_PAGINA, p, AGORA);
        e.setMetadados(Map.of("segundos_ativos", segundos));
        return e;
    }

    private static double nota(ScoringParams params, Evento... eventos) {
        return ScoreCalculator.calcular(List.of(eventos), List.of(), params, AGORA).notasProduto().get(10L);
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
