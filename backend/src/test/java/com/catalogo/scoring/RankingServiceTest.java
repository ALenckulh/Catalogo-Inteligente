package com.catalogo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.scoring.engine.PopularidadeGlobalService;
import com.catalogo.scoring.engine.RankingService;
import com.catalogo.scoring.repository.ScoreProdutoRepository;

@ExtendWith(MockitoExtension.class)
class RankingServiceTest {

    @Mock
    ScoreProdutoRepository scoreProdutoRepository;
    @Mock
    PopularidadeGlobalService popularidadeGlobalService;

    @InjectMocks
    RankingService rankingService;

    @Test
    void coldStartWeightZero() {
        assertEquals(0.0, rankingService.personalWeight(0, false, false));
        assertEquals(0.0, rankingService.personalWeight(2, false, true));
    }

    @Test
    void midBandLinear() {
        double w = rankingService.personalWeight(5, false, true);
        assertTrue(w > 0 && w < 0.8);
    }

    @Test
    void highInteractionDominant() {
        assertEquals(0.8, rankingService.personalWeight(10, false, true));
        assertEquals(1.0, rankingService.personalWeight(10, true, false));
    }

    @Test
    void clienteQueVoltaNaoPassaPelaTransicao() {
        assertEquals(0.8, rankingService.personalWeight(1, true, true));
        assertEquals(0.8, rankingService.personalWeight(5, true, true));
        assertEquals(0.86, rankingService.personalWeight(9, true, true), 0.02);
        assertEquals(1.0, rankingService.personalWeight(10, true, true));
        // visitante e quem não tem nota seguem a transição
        assertEquals(0.0, rankingService.personalWeight(1, true, false));
        assertEquals(0.375, rankingService.personalWeight(5, true, false));
        assertEquals(0.0, rankingService.personalWeight(1, false, true));
    }

    @Test
    void empateDoClienteVaiPelaPopularidadeEDepoisPeloId() {
        List<Long> list = new ArrayList<>(List.of(1L, 2L, 3L, 4L));
        Map<Long, BigDecimal> pessoal = Map.of(4L, BigDecimal.ONE);
        Map<Long, BigDecimal> pop = Map.of(3L, BigDecimal.TEN);
        rankingService.sortByRank(list, 1.0, pessoal, pop, true);
        assertEquals(List.of(4L, 3L, 1L, 2L), list);
        rankingService.sortByRank(list, 1.0, pessoal, pop, false);
        assertEquals(List.of(4L, 1L, 2L, 3L), list);
    }

    @Test
    void sortPrefersHigherBlended() {
        List<Long> list = new ArrayList<>(List.of(1L, 2L));
        rankingService.sortByRank(
                list,
                1.0,
                Map.of(1L, BigDecimal.TEN, 2L, BigDecimal.valueOf(90)),
                Map.of(1L, BigDecimal.ZERO, 2L, BigDecimal.ZERO),
                false
        );
        assertEquals(List.of(2L, 1L), list);
    }

    @Test
    void sortDesempataPorMenorId() {
        List<Long> list = new ArrayList<>(List.of(300L, 2L, 150L, 1L));
        rankingService.sortByRank(list, 0.0, Map.of(), Map.of(150L, BigDecimal.ONE), false);
        assertEquals(List.of(150L, 1L, 2L, 300L), list);
    }
}
