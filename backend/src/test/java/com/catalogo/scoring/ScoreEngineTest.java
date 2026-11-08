package com.catalogo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
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
        when(compraRepository.countByUsuarioIdAndDeletedAtIsNull(1L)).thenReturn(0L);
        when(scoreProdutoRepository.findByUsuarioIdAndProdutoId(1L, 10L)).thenReturn(Optional.empty());
        when(scoreCategoriaRepository.findByUsuarioIdAndCategoriaId(1L, 1L)).thenReturn(Optional.empty());
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
    void compraBelowThresholdIgnored() {
        stubPesosAndDecay();
        Categoria cat = cat(1L);
        Produto produto = produto(10L, cat, "50.00");
        Evento view = evento(TipoEvento.VISUALIZACAO_PRODUTO, produto, OffsetDateTime.now());

        when(eventoRepository.findAtivosByUsuarioId(1L)).thenReturn(List.of(view));
        when(compraRepository.countByUsuarioIdAndDeletedAtIsNull(1L)).thenReturn(2L);
        when(scoreProdutoRepository.findByUsuarioIdAndProdutoId(1L, 10L)).thenReturn(Optional.empty());
        when(scoreCategoriaRepository.findByUsuarioIdAndCategoriaId(1L, 1L)).thenReturn(Optional.empty());
        when(faixaPrecoUsuarioRepository.findByUsuarioId(1L)).thenReturn(Optional.empty());
        when(scoreProdutoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(scoreCategoriaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(faixaPrecoUsuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        engine.recalc(1L, null);

        verify(compraRepository, never()).findByUsuarioIdAndDeletedAtIsNull(any());
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
        when(compraRepository.countByUsuarioIdAndDeletedAtIsNull(1L)).thenReturn(0L);
        when(scoreProdutoRepository.findByUsuarioIdAndProdutoId(1L, 10L)).thenReturn(Optional.empty());
        when(scoreCategoriaRepository.findByUsuarioIdAndCategoriaId(1L, 1L)).thenReturn(Optional.empty());
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
