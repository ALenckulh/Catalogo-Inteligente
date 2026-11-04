package com.catalogo.scoring.engine;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.catalogo.catalog.entity.Produto;
import com.catalogo.scoring.entity.ScoreProduto;
import com.catalogo.scoring.repository.ScoreProdutoRepository;

/**
 * Blend personal score vs popularidade — [04 §6.2](frontend/docs/04-ESPECIFICACAO-TECNICA.md).
 */
@Service
public class RankingService {

    private final ScoreProdutoRepository scoreProdutoRepository;
    private final PopularidadeGlobalService popularidadeGlobalService;

    public RankingService(
            ScoreProdutoRepository scoreProdutoRepository,
            PopularidadeGlobalService popularidadeGlobalService
    ) {
        this.scoreProdutoRepository = scoreProdutoRepository;
        this.popularidadeGlobalService = popularidadeGlobalService;
    }

    public record Actor(Long usuarioId, Long visitanteId, long interactionCount, boolean hasPersistedScores) {
    }

    public double personalWeight(long interactions, boolean hasPersistedScores) {
        if (hasPersistedScores && interactions >= 10) {
            return 1.0;
        }
        if (interactions <= 2) {
            return 0.0;
        }
        if (interactions <= 9) {
            // linear 3→~0.14 … 9→~0.86 toward personal
            return (interactions - 2) / 8.0;
        }
        return 0.8;
    }

    public Map<Long, BigDecimal> personalScores(Long usuarioId, Long visitanteId) {
        List<ScoreProduto> rows = usuarioId != null
                ? scoreProdutoRepository.findByUsuarioId(usuarioId)
                : visitanteId != null
                ? scoreProdutoRepository.findByVisitanteId(visitanteId)
                : List.of();
        Map<Long, BigDecimal> map = new HashMap<>();
        for (ScoreProduto s : rows) {
            map.put(s.getProdutoId(), s.getValor());
        }
        return map;
    }

    public BigDecimal blendedScore(
            Long produtoId,
            double personalWeight,
            Map<Long, BigDecimal> personal,
            Map<Long, BigDecimal> popularidade
    ) {
        BigDecimal p = personal.getOrDefault(produtoId, BigDecimal.ZERO);
        BigDecimal g = popularidade.getOrDefault(produtoId, BigDecimal.ZERO);
        double value = personalWeight * p.doubleValue() + (1.0 - personalWeight) * g.doubleValue();
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    public void sortByRank(
            List<Produto> produtos,
            double personalWeight,
            Map<Long, BigDecimal> personal,
            Map<Long, BigDecimal> popularidade
    ) {
        Map<Long, BigDecimal> cache = popularidade.isEmpty()
                ? popularidadeGlobalService.scoresByProduto()
                : popularidade;
        produtos.sort(Comparator
                .comparing((Produto p) -> blendedScore(p.getId(), personalWeight, personal, cache))
                .reversed()
                .thenComparing(Produto::getId));
    }

    public Map<Long, BigDecimal> loadPopularidade() {
        return popularidadeGlobalService.scoresByProduto();
    }
}
