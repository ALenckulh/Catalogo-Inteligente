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
        assertEquals(0.0, rankingService.personalWeight(0, false));
        assertEquals(0.0, rankingService.personalWeight(2, false));
    }

    @Test
    void midBandLinear() {
        double w = rankingService.personalWeight(5, false);
        assertTrue(w > 0 && w < 0.8);
    }

    @Test
    void highInteractionDominant() {
        assertEquals(0.8, rankingService.personalWeight(10, false));
        assertEquals(1.0, rankingService.personalWeight(10, true));
    }

    @Test
    void sortPrefersHigherBlended() {
        List<Long> list = new ArrayList<>(List.of(1L, 2L));
        rankingService.sortByRank(
                list,
                1.0,
                Map.of(1L, BigDecimal.TEN, 2L, BigDecimal.valueOf(90)),
                Map.of(1L, BigDecimal.ZERO, 2L, BigDecimal.ZERO)
        );
        assertEquals(List.of(2L, 1L), list);
    }

    @Test
    void sortDesempataPorMenorId() {
        List<Long> list = new ArrayList<>(List.of(300L, 2L, 150L, 1L));
        rankingService.sortByRank(list, 0.0, Map.of(), Map.of(150L, BigDecimal.ONE));
        assertEquals(List.of(150L, 1L, 2L, 300L), list);
    }
}
