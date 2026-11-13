package com.catalogo.admin.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.catalogo.admin.domain.NivelInteresse;
import com.catalogo.admin.dto.DecayPatchRequest;
import com.catalogo.admin.dto.PesosPatchRequest;
import com.catalogo.admin.dto.SimulacaoResponse;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.scoring.engine.ScoringParams;

class AdminScoringServiceTest {

    private static final OffsetDateTime T0 = OffsetDateTime.parse("2026-11-01T08:00:00Z");
    private static final Produto P10 = produto(10L);
    private static final Produto P20 = produto(20L);

    /** Contato pesa muito: deve separar bem quem converteu. */
    private static final ScoringParams BOM = params(1.0, 0.1, 0.1);
    /** Contato não pesa e visualização pesa muito: deve separar mal. */
    private static final ScoringParams RUIM = params(0.0, 0.0, 1.0);

    @Test
    void aucPerfeitaInversaEEmpate() {
        assertEquals(1.0, AdminScoringService.auc(List.of(n(90, 1), n(80, 1), n(10, 0), n(5, 0))), 1e-9);
        assertEquals(0.0, AdminScoringService.auc(List.of(n(10, 1), n(90, 0))), 1e-9);
        assertEquals(0.5, AdminScoringService.auc(List.of(n(50, 1), n(50, 0))), 1e-9);
        assertNull(AdminScoringService.auc(List.of(n(50, 1), n(60, 1))));
    }

    @Test
    void parametrosIguaisNaoMudamNada() {
        List<Evento> eventos = historico();
        var impacto = AdminScoringService.calcularImpacto(clientes(), eventos, List.of(), BOM, BOM, T0.plusDays(1));
        var precisao = AdminScoringService.calcularPrecisao(eventos, List.of(), BOM, BOM);

        assertEquals(0, impacto.mudamDeNivel());
        assertEquals(impacto.atual(), impacto.proposta());
        assertEquals(precisao.atual(), precisao.proposta());
    }

    @Test
    void parametrosQueValorizamContatoOrdenamMelhor() {
        var precisao = AdminScoringService.calcularPrecisao(historico(), List.of(), RUIM, BOM);

        assertNotNull(precisao.corte());
        assertEquals(2, precisao.conversoes());
        assertEquals(SimulacaoResponse.Confianca.BAIXA, precisao.confianca());
        assertTrue(precisao.proposta().auc() > precisao.atual().auc(),
                "AUC proposta " + precisao.proposta().auc() + " deveria superar " + precisao.atual().auc());
    }

    @Test
    void clienteSemEventosFicaSemInteracaoEDistribuicaoSomaTotal() {
        List<AdminScoringService.Cliente> clientes = new ArrayList<>(clientes());
        clientes.add(new AdminScoringService.Cliente(99L, "Sem eventos"));

        var impacto = AdminScoringService.calcularImpacto(clientes, historico(), List.of(), BOM, RUIM, T0.plusDays(1));

        long total = impacto.proposta().stream().mapToLong(SimulacaoResponse.NivelContagem::quantidade).sum();
        assertEquals(clientes.size(), total);
        long semScore = impacto.atual().stream()
                .filter(c -> c.nivel() == NivelInteresse.SEM_SCORE)
                .mapToLong(SimulacaoResponse.NivelContagem::quantidade).sum();
        assertEquals(1, semScore);
    }

    @Test
    void quemSoApareceDepoisDoCorteFicaForaDaAvaliacao() {
        List<Evento> eventos = new ArrayList<>(historico());
        // cliente 5: primeiro evento já depois do corte, e converte; nenhum parâmetro o preveria
        eventos.add(evento(5L, TipoEvento.CONTATO_WHATSAPP, P10, T0.plusHours(22)));

        var precisao = AdminScoringService.calcularPrecisao(eventos, List.of(), BOM, BOM);

        assertEquals(4, precisao.amostras());
        assertEquals(2, precisao.conversoes());
    }

    @Test
    void bonusMudaCategoriaFavoritaSemMudarNivel() {
        // categoria 1: um contato em P10 (83 pts, com conversão); categoria 2: 11 visualizações em P30 (92 pts)
        Produto p30 = produto(30L, 2L);
        List<Evento> eventos = new ArrayList<>();
        eventos.add(evento(1L, TipoEvento.CONTATO_WHATSAPP, P10, T0));
        for (int i = 0; i < 11; i++) {
            eventos.add(evento(1L, TipoEvento.VISUALIZACAO_PRODUTO, p30, T0));
        }
        // bônus de +50% na categoria 1, que teve contato recente: ela passa a 2 na frente
        ScoringParams bonusCat1 = new ScoringParams(BOM.pesos(), 0.01, 1.0, Map.of(), Map.of(1L, 1.5));

        var impacto = AdminScoringService.calcularImpacto(
                List.of(new AdminScoringService.Cliente(1L, "Um")), eventos, List.of(), BOM, bonusCat1, T0.plusHours(1));

        assertEquals(0, impacto.mudamDeNivel());
        assertEquals(1, impacto.mudamDeCategoria());
        assertEquals("C2", impacto.mudancasCategoria().getFirst().categoriaAtual());
        assertEquals("C1", impacto.mudancasCategoria().getFirst().categoriaProposta());
    }

    @Test
    void historicoNumUnicoInstanteNaoTemBacktest() {
        List<Evento> eventos = List.of(evento(1L, TipoEvento.VISUALIZACAO_PRODUTO, P10, T0), evento(2L, TipoEvento.CONTATO_WHATSAPP, P10, T0));
        var precisao = AdminScoringService.calcularPrecisao(eventos, List.of(), BOM, RUIM);
        assertNull(precisao.corte());
    }

    @Test
    void toParamsSeparaDecayGlobalDoPorCategoria() {
        var params = AdminScoringService.toParams(
                List.of(new PesosPatchRequest.Item(TipoEvento.FAVORITAR, new BigDecimal("0.7"))),
                List.of(
                        new DecayPatchRequest.Item(null, new BigDecimal("0.02"), new BigDecimal("1.5")),
                        new DecayPatchRequest.Item(7L, new BigDecimal("0.05"), new BigDecimal("2.0"))
                ));

        assertEquals(0.7, params.pesos().get(TipoEvento.FAVORITAR), 1e-9);
        assertEquals(0.02, params.lambdaGlobal(), 1e-9);
        assertEquals(1.5, params.boostGlobal(), 1e-9);
        assertEquals(Map.of(7L, 0.05), params.lambdaPorCategoria());
        assertEquals(Map.of(7L, 2.0), params.boostPorCategoria());

        var padrao = AdminScoringService.toParams(List.of(), List.of());
        assertEquals(ScoringParams.LAMBDA_PADRAO, padrao.lambdaGlobal(), 1e-9);
        assertEquals(ScoringParams.BOOST_PADRAO, padrao.boostGlobal(), 1e-9);
    }

    @Test
    void recalcularTodosRecalculaUsuariosEVisitantes() {
        EventoRepository eventos = mock(EventoRepository.class);
        ScoreEngine engine = mock(ScoreEngine.class);
        when(engine.carregarParams()).thenReturn(BOM);
        when(eventos.findUsuarioIdsComEventos()).thenReturn(List.of(1L, 2L));
        when(eventos.findVisitanteIdsSemUsuario()).thenReturn(List.of(9L));

        int total = new AdminScoringService(eventos, mock(CompraRepository.class), engine).recalcularTodos();

        assertEquals(3, total);
        verify(engine).recalc(1L, null, BOM);
        verify(engine).recalc(2L, null, BOM);
        verify(engine).recalc(null, 9L, BOM);
    }

    /**
     * Antes do corte: 1 chama no WhatsApp (P10), 2 e 4 só visualizam várias vezes, 3 chama no WhatsApp (P20).
     * Depois do corte: 1 e 3 voltam a chamar (convertem); 2 e 4 não.
     */
    private static List<Evento> historico() {
        List<Evento> ev = new ArrayList<>();
        ev.add(evento(1L, TipoEvento.CONTATO_WHATSAPP, P10, T0.plusHours(1)));
        ev.add(evento(3L, TipoEvento.CONTATO_WHATSAPP, P20, T0.plusHours(1)));
        for (int i = 0; i < 3; i++) {
            ev.add(evento(2L, TipoEvento.VISUALIZACAO_PRODUTO, P10, T0.plusHours(2 + i)));
            ev.add(evento(4L, TipoEvento.VISUALIZACAO_PRODUTO, P20, T0.plusHours(2 + i)));
        }
        ev.add(evento(1L, TipoEvento.CONTATO_WHATSAPP, P10, T0.plusHours(20)));
        ev.add(evento(3L, TipoEvento.CONTATO_WHATSAPP, P20, T0.plusHours(21)));
        return ev;
    }

    private static List<AdminScoringService.Cliente> clientes() {
        return List.of(
                new AdminScoringService.Cliente(1L, "Um"),
                new AdminScoringService.Cliente(2L, "Dois"),
                new AdminScoringService.Cliente(3L, "Três"),
                new AdminScoringService.Cliente(4L, "Quatro")
        );
    }

    private static ScoringParams params(double contato, double favoritar, double visualizacao) {
        return new ScoringParams(Map.of(
                TipoEvento.CONTATO_WHATSAPP, contato,
                TipoEvento.FAVORITAR, favoritar,
                TipoEvento.VISUALIZACAO_PRODUTO, visualizacao
        ), 0.01, 1.0, Map.of(), Map.of());
    }

    private static double[] n(double nota, int positivo) {
        return new double[] {nota, positivo};
    }

    private static Produto produto(Long id) {
        return produto(id, 1L);
    }

    private static Produto produto(Long id, Long categoriaId) {
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

    private static Evento evento(Long usuarioId, TipoEvento tipo, Produto produto, OffsetDateTime quando) {
        Usuario u = new Usuario();
        u.setId(usuarioId);
        Evento e = new Evento();
        e.setUsuario(u);
        e.setTipo(tipo);
        e.setProduto(produto);
        e.setOcorridoEm(quando);
        return e;
    }
}
