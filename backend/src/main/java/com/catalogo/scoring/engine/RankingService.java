package com.catalogo.scoring.engine;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.catalogo.scoring.entity.ScoreProduto;
import com.catalogo.scoring.repository.ScoreProdutoRepository;

/**
 * Nota pessoal × popularidade — docs/04-ESPECIFICACAO-TECNICA.md §6.2.
 */
@Service
public class RankingService {

    private static final double PESO_DOMINANTE = 0.8;

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

    /**
     * Cold start: quanto a nota pessoal pesa na ordem do catálogo.
     * 0–2 interações → 0 (só popularidade); 3–9 → (n−2)/8; ≥10 com score gravado → 1; ≥10 sem score → 0,8.
     * Cliente logado que já tem notas não passa pela transição: no mínimo 0,8.
     */
    public double personalWeight(long interactions, boolean hasPersistedScores, boolean logado) {
        double peso = personalWeight(interactions, hasPersistedScores);
        return logado && hasPersistedScores ? Math.max(PESO_DOMINANTE, peso) : peso;
    }

    private static double personalWeight(long interactions, boolean hasPersistedScores) {
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
        return PESO_DOMINANTE;
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

    /** Nota usada na ordenação: w × nota pessoal + (1 − w) × popularidade global. */
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

    /**
     * Ordena os ids pela nota (maior primeiro). Empate pelo menor id; para cliente logado, antes pela popularidade:
     * com peso 1, todos os produtos que ele nunca viu empatam em 0.
     */
    public void sortByRank(
            List<Long> produtoIds,
            double personalWeight,
            Map<Long, BigDecimal> personal,
            Map<Long, BigDecimal> popularidade,
            boolean logado
    ) {
        Map<Long, BigDecimal> cache = popularidade.isEmpty()
                ? popularidadeGlobalService.scoresByProduto()
                : popularidade;
        Map<Long, BigDecimal> notas = new HashMap<>();
        for (Long id : produtoIds) {
            notas.put(id, blendedScore(id, personalWeight, personal, cache));
        }
        Comparator<Long> ordem = Comparator.comparing((Long id) -> notas.get(id)).reversed();
        if (logado) {
            ordem = ordem.thenComparing(
                    (Long id) -> cache.getOrDefault(id, BigDecimal.ZERO), Comparator.reverseOrder());
        }
        produtoIds.sort(ordem.thenComparing(Comparator.naturalOrder()));
    }

    public Map<Long, BigDecimal> loadPopularidade() {
        return popularidadeGlobalService.scoresByProduto();
    }
}
