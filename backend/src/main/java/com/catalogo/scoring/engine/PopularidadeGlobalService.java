package com.catalogo.scoring.engine;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.repository.EventoRepository;

@Service
public class PopularidadeGlobalService {

    private final EventoRepository eventoRepository;
    private final CompraRepository compraRepository;

    public PopularidadeGlobalService(EventoRepository eventoRepository, CompraRepository compraRepository) {
        this.eventoRepository = eventoRepository;
        this.compraRepository = compraRepository;
    }

    /**
     * Raw then normalize to [0,100] vs max in map. Keys = produtoId.
     */
    @Transactional(readOnly = true)
    public Map<Long, BigDecimal> scoresByProduto() {
        Map<Long, Double> raw = new HashMap<>();

        OffsetDateTime since30 = OffsetDateTime.now().minusDays(30);
        for (Object[] row : eventoRepository.countSignalsByProdutoSince(since30)) {
            Long produtoId = ((Number) row[0]).longValue();
            String tipo = String.valueOf(row[1]);
            long count = ((Number) row[2]).longValue();
            double weight = switch (tipo) {
                case "VISUALIZACAO_PRODUTO" -> 0.2;
                case "FAVORITAR" -> 0.5;
                case "CONTATO_WHATSAPP" -> 1.0;
                default -> 0.0;
            };
            raw.merge(produtoId, weight * count, Double::sum);
        }

        LocalDate since90 = LocalDate.now().minusDays(90);
        for (Object[] row : compraRepository.countByProdutoSince(since90)) {
            Long produtoId = ((Number) row[0]).longValue();
            long count = ((Number) row[1]).longValue();
            raw.merge(produtoId, 1.0 * count, Double::sum);
        }

        double max = raw.values().stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
        Map<Long, BigDecimal> out = new HashMap<>();
        if (max <= 0) {
            return out;
        }
        for (Map.Entry<Long, Double> e : raw.entrySet()) {
            out.put(e.getKey(), BigDecimal.valueOf(e.getValue() / max * 100.0).setScale(2, RoundingMode.HALF_UP));
        }
        return out;
    }

    public BigDecimal scoreOf(Long produtoId, Map<Long, BigDecimal> cache) {
        return cache.getOrDefault(produtoId, BigDecimal.ZERO);
    }
}
