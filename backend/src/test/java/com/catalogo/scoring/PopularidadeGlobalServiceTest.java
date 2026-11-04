package com.catalogo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.engine.PopularidadeGlobalService;

@ExtendWith(MockitoExtension.class)
class PopularidadeGlobalServiceTest {

    @Mock
    EventoRepository eventoRepository;
    @Mock
    CompraRepository compraRepository;

    PopularidadeGlobalService service;

    @BeforeEach
    void setUp() {
        service = new PopularidadeGlobalService(eventoRepository, compraRepository);
    }

    @Test
    void weightsSignalsAndNormalizes() {
        List<Object[]> signals = List.<Object[]>of(
                new Object[]{1L, "VISUALIZACAO_PRODUTO", 10L},
                new Object[]{2L, "CONTATO_WHATSAPP", 1L}
        );
        List<Object[]> compras = List.<Object[]>of(
                new Object[]{2L, 2L}
        );
        when(eventoRepository.countSignalsByProdutoSince(any())).thenReturn(signals);
        when(compraRepository.countByProdutoSince(any())).thenReturn(compras);

        Map<Long, BigDecimal> scores = service.scoresByProduto();

        assertTrue(scores.containsKey(1L));
        assertTrue(scores.containsKey(2L));
        // product 2: contact 1.0 + compras 2.0 = 3.0 raw vs product1 2.0 → 2 is max → 100
        assertEquals(0, scores.get(2L).compareTo(new BigDecimal("100.00")));
        assertTrue(scores.get(1L).doubleValue() < 100.0);
    }
}
