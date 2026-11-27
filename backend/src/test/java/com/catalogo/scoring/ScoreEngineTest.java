package com.catalogo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.catalogo.catalog.entity.Compra;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.scoring.entity.ParametroDecay;
import com.catalogo.scoring.entity.PesoMetrica;
import com.catalogo.scoring.entity.ScoreCategoria;
import com.catalogo.scoring.entity.ScoreProduto;
import com.catalogo.scoring.repository.FaixaPrecoUsuarioRepository;
import com.catalogo.scoring.repository.ParametroDecayRepository;
import com.catalogo.scoring.repository.PesoMetricaRepository;
import com.catalogo.scoring.repository.ScoreCategoriaRepository;
import com.catalogo.scoring.repository.ScoreProdutoRepository;

@ExtendWith(MockitoExtension.class)
class ScoreEngineTest {

    @Mock
    EventoRepository eventoRepository;
    @Mock
    CompraRepository compraRepository;
    @Mock
    PesoMetricaRepository pesoMetricaRepository;
    @Mock
    ParametroDecayRepository parametroDecayRepository;
    @Mock
    ScoreProdutoRepository scoreProdutoRepository;
    @Mock
    ScoreCategoriaRepository scoreCategoriaRepository;
    @Mock
    FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository;

    ScoreEngine engine;

    @BeforeEach
    void setUp() {
        engine = new ScoreEngine(
                eventoRepository,
                compraRepository,
                pesoMetricaRepository,
                parametroDecayRepository,
                scoreProdutoRepository,
                scoreCategoriaRepository,
                faixaPrecoUsuarioRepository
        );
    }

    @Test
    void recalcUpsertsProdutoScore() {
        stubPesosAndDecay();
        Categoria cat = cat(1L);
        Produto produto = produto(10L, cat, "50.00");
        Evento view = evento(TipoEvento.VISUALIZACAO_PRODUTO, produto, OffsetDateTime.now().minusDays(1));

        when(eventoRepository.findAtivosByUsuarioId(1L)).thenReturn(List.of(view));
        when(faixaPrecoUsuarioRepository.findByUsuarioId(1L)).thenReturn(Optional.empty());
        when(scoreProdutoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(scoreCategoriaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(faixaPrecoUsuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        engine.recalc(1L, null);

        ArgumentCaptor<ScoreProduto> cap = ArgumentCaptor.forClass(ScoreProduto.class);
        verify(scoreProdutoRepository).save(cap.capture());
        assertEquals(10L, cap.getValue().getProdutoId());
        assertTrue(cap.getValue().getValor().doubleValue() > 0);
    }

    @Test
    void compraAbaixoDoMinimoNaoSomaPontos() {
        stubPesosAndDecay();
        Categoria cat = cat(1L);
        Produto produto = produto(10L, cat, "50.00");
        Evento view = evento(TipoEvento.VISUALIZACAO_PRODUTO, produto, OffsetDateTime.now());

        when(eventoRepository.findAtivosByUsuarioId(1L)).thenReturn(List.of(view));
        when(compraRepository.findByUsuarioIdAndDeletedAtIsNull(1L)).thenReturn(List.of(compra(produto), compra(produto)));
        when(faixaPrecoUsuarioRepository.findByUsuarioId(1L)).thenReturn(Optional.empty());
        when(scoreProdutoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(scoreCategoriaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(faixaPrecoUsuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        engine.recalc(1L, null);

        ArgumentCaptor<ScoreProduto> cap = ArgumentCaptor.forClass(ScoreProduto.class);
        verify(scoreProdutoRepository).save(cap.capture());
        // só a visualização: 0,2 / (0,2 + 1,0 + 0,5 + 0,1) * 100
        assertEquals(new BigDecimal("11.11"), cap.getValue().getValor());
    }

    @Test
    void notaSemSinalEApagadaEAExistenteEReaproveitada() {
        stubPesosAndDecay();
        Produto produto = produto(10L, cat(1L), "50.00");
        ScoreProduto mantida = new ScoreProduto();
        mantida.setUsuarioId(1L);
        mantida.setProdutoId(10L);
        ScoreProduto velha = new ScoreProduto();
        velha.setUsuarioId(1L);
        velha.setProdutoId(99L);
        ScoreCategoria catVelha = new ScoreCategoria();
        catVelha.setUsuarioId(1L);
        catVelha.setCategoriaId(77L);
        when(eventoRepository.findAtivosByUsuarioId(1L)).thenReturn(
                List.of(evento(TipoEvento.VISUALIZACAO_PRODUTO, produto, OffsetDateTime.now())));
        when(scoreProdutoRepository.findByUsuarioId(1L)).thenReturn(List.of(mantida, velha));
        when(scoreCategoriaRepository.findByUsuarioId(1L)).thenReturn(List.of(catVelha));
        when(faixaPrecoUsuarioRepository.findByUsuarioId(1L)).thenReturn(Optional.empty());

        engine.recalc(1L, null);

        verify(scoreProdutoRepository).save(mantida);
        assertEquals(new BigDecimal("11.11"), mantida.getValor());
        assertApagadas(scoreProdutoRepository, velha);
        assertApagadas(scoreCategoriaRepository, catVelha);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static void assertApagadas(org.springframework.data.jpa.repository.JpaRepository repo, Object esperada) {
        ArgumentCaptor<Iterable> cap = ArgumentCaptor.forClass(Iterable.class);
        verify(repo).deleteAllInBatch(cap.capture());
        List<Object> apagadas = new java.util.ArrayList<>();
        cap.getValue().forEach(apagadas::add);
        assertEquals(List.of(esperada), apagadas);
    }

    private static Compra compra(Produto p) {
        Compra c = new Compra();
        c.setProduto(p);
        c.setDataCompra(LocalDate.now());
        return c;
    }

    @Test
    void categoryBoostOnRecentConversion() {
        stubPesosAndDecay();
        ParametroDecay global = new ParametroDecay();
        global.setLambda(BigDecimal.valueOf(0.01));
        global.setBoostConversao(BigDecimal.valueOf(1.5));
        when(parametroDecayRepository.findAll()).thenReturn(List.of(global));

        Categoria cat = cat(1L);
        Produto produto = produto(10L, cat, "80.00");
        Evento contact = evento(TipoEvento.CONTATO_WHATSAPP, produto, OffsetDateTime.now().minusDays(2));

        when(eventoRepository.findAtivosByUsuarioId(1L)).thenReturn(List.of(contact));
        when(faixaPrecoUsuarioRepository.findByUsuarioId(1L)).thenReturn(Optional.empty());
        when(scoreProdutoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(scoreCategoriaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(faixaPrecoUsuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        engine.recalc(1L, null);

        ArgumentCaptor<ScoreCategoria> cap = ArgumentCaptor.forClass(ScoreCategoria.class);
        verify(scoreCategoriaRepository).save(cap.capture());
        assertEquals(1L, cap.getValue().getCategoriaId());
        assertTrue(cap.getValue().getValor().doubleValue() > 0);
    }

    private void stubPesosAndDecay() {
        when(pesoMetricaRepository.findAll()).thenReturn(List.of(
                peso(TipoEvento.VISUALIZACAO_PRODUTO, "0.2"),
                peso(TipoEvento.CONTATO_WHATSAPP, "1.0"),
                peso(TipoEvento.FAVORITAR, "0.5"),
                peso(TipoEvento.DESFAVORITAR, "0.1")
        ));
        ParametroDecay global = new ParametroDecay();
        global.setLambda(BigDecimal.valueOf(0.01));
        global.setBoostConversao(BigDecimal.ONE);
        when(parametroDecayRepository.findAll()).thenReturn(List.of(global));
    }

    private static PesoMetrica peso(TipoEvento tipo, String valor) {
        PesoMetrica p = new PesoMetrica();
        p.setTipoEvento(tipo);
        p.setPeso(new BigDecimal(valor));
        return p;
    }

    private static Categoria cat(Long id) {
        Categoria c = new Categoria();
        c.setId(id);
        c.setNome("C");
        c.setSlug("c");
        return c;
    }

    private static Produto produto(Long id, Categoria cat, String preco) {
        Produto p = new Produto();
        p.setId(id);
        p.setNome("P");
        p.setSlug("p");
        p.setPreco(new BigDecimal(preco));
        p.setCategoria(cat);
        p.setAtivo(true);
        return p;
    }

    private static Evento evento(TipoEvento tipo, Produto produto, OffsetDateTime when) {
        Evento e = new Evento();
        e.setTipo(tipo);
        e.setProduto(produto);
        e.setOcorridoEm(when);
        return e;
    }
}
