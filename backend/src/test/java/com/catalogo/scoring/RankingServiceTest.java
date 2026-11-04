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

import com.catalogo.catalog.entity.Produto;
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
        Produto a = produto(1L);
        Produto b = produto(2L);
        List<Produto> list = new ArrayList<>(List.of(a, b));
        rankingService.sortByRank(
                list,
                1.0,
                Map.of(1L, BigDecimal.TEN, 2L, BigDecimal.valueOf(90)),
                Map.of(1L, BigDecimal.ZERO, 2L, BigDecimal.ZERO)
        );
        assertEquals(2L, list.getFirst().getId());
    }

    private static Produto produto(Long id) {
        Produto p = new Produto();
        p.setId(id);
        return p;
    }
}
