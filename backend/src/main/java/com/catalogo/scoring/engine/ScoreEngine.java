package com.catalogo.scoring.engine;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.catalog.entity.Compra;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.entity.FaixaPrecoUsuario;
import com.catalogo.scoring.entity.ParametroDecay;
import com.catalogo.scoring.entity.PesoMetrica;
import com.catalogo.scoring.entity.ScoreCategoria;
import com.catalogo.scoring.entity.ScoreProduto;
import com.catalogo.scoring.repository.FaixaPrecoUsuarioRepository;
import com.catalogo.scoring.repository.ParametroDecayRepository;
import com.catalogo.scoring.repository.PesoMetricaRepository;
import com.catalogo.scoring.repository.ScoreCategoriaRepository;
import com.catalogo.scoring.repository.ScoreProdutoRepository;

@Service
public class ScoreEngine {

    private static final Logger log = LoggerFactory.getLogger(ScoreEngine.class);

    private final EventoRepository eventoRepository;
    private final CompraRepository compraRepository;
    private final PesoMetricaRepository pesoMetricaRepository;
    private final ParametroDecayRepository parametroDecayRepository;
    private final ScoreProdutoRepository scoreProdutoRepository;
    private final ScoreCategoriaRepository scoreCategoriaRepository;
    private final FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository;

    public ScoreEngine(
            EventoRepository eventoRepository,
            CompraRepository compraRepository,
            PesoMetricaRepository pesoMetricaRepository,
            ParametroDecayRepository parametroDecayRepository,
            ScoreProdutoRepository scoreProdutoRepository,
            ScoreCategoriaRepository scoreCategoriaRepository,
            FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository
    ) {
        this.eventoRepository = eventoRepository;
        this.compraRepository = compraRepository;
        this.pesoMetricaRepository = pesoMetricaRepository;
        this.parametroDecayRepository = parametroDecayRepository;
        this.scoreProdutoRepository = scoreProdutoRepository;
        this.scoreCategoriaRepository = scoreCategoriaRepository;
        this.faixaPrecoUsuarioRepository = faixaPrecoUsuarioRepository;
    }

    @Transactional
    public void recalc(Long usuarioId, Long visitanteId) {
        if (usuarioId == null && visitanteId == null) {
            return;
        }
        OffsetDateTime now = OffsetDateTime.now();
        Map<TipoEvento, Double> pesos = loadPesos();
        double scoreMax = pesos.values().stream().filter(p -> p > 0).mapToDouble(Double::doubleValue).sum();
        if (scoreMax <= 0) {
            scoreMax = 1.0;
        }

        List<Evento> eventos = usuarioId != null
                ? eventoRepository.findAtivosByUsuarioId(usuarioId)
                : eventoRepository.findAtivosByVisitanteId(visitanteId);

        Map<Long, List<Evento>> byProduto = new HashMap<>();
        for (Evento e : eventos) {
            if (e.getProduto() == null || e.getProduto().getId() == null) {
                continue;
            }
            byProduto.computeIfAbsent(e.getProduto().getId(), k -> new ArrayList<>()).add(e);
        }

        List<Compra> compras = List.of();
        boolean comprasElegiveis = false;
        if (usuarioId != null) {
            long count = compraRepository.countByUsuarioIdAndDeletedAtIsNull(usuarioId);
            comprasElegiveis = count >= 3;
            if (comprasElegiveis) {
                compras = compraRepository.findByUsuarioIdAndDeletedAtIsNull(usuarioId);
            }
        }

        Map<Long, Double> productScores = new HashMap<>();
        Map<Long, Integer> productInteractions = new HashMap<>();
        Map<Long, Long> produtoCategoria = new HashMap<>();
        Set<Long> conversionProdutos30d = new HashSet<>();
        Set<Long> conversionCategorias30d = new HashSet<>();
        List<BigDecimal> precosComConversao = new ArrayList<>();
        List<BigDecimal> precosSemConversao = new ArrayList<>();

        double contatoPeso = pesos.getOrDefault(TipoEvento.CONTATO_WHATSAPP, 1.0);

        for (Map.Entry<Long, List<Evento>> entry : byProduto.entrySet()) {
            Long produtoId = entry.getKey();
            List<Evento> pe = entry.getValue();
            Produto produto = pe.getFirst().getProduto();
            Long categoriaId = produto.getCategoria() != null ? produto.getCategoria().getId() : null;
            if (categoriaId != null) {
                produtoCategoria.put(produtoId, categoriaId);
            }

            boolean hasConversion = pe.stream().anyMatch(e ->
                    e.getTipo() == TipoEvento.CONTATO_WHATSAPP || e.getConversao() != null);
            boolean contactPause = pe.stream().anyMatch(e ->
                    e.getTipo() == TipoEvento.CONTATO_WHATSAPP
                            && DecayCalculator.withinDays(e.getOcorridoEm(), now, DecayCalculator.PAUSE_CONTACT_DAYS));

            if (hasConversion && pe.stream().anyMatch(e ->
                    (e.getTipo() == TipoEvento.CONTATO_WHATSAPP || e.getConversao() != null)
                            && DecayCalculator.withinDays(e.getOcorridoEm(), now, 30))) {
                conversionProdutos30d.add(produtoId);
                if (categoriaId != null) {
                    conversionCategorias30d.add(categoriaId);
                }
            }

            double lambda = resolveLambda(categoriaId);
            double raw = 0.0;
            for (Evento e : pe) {
                double peso = pesos.getOrDefault(e.getTipo(), 0.0);
                double valor = eventValor(e);
                if (e.getTipo() == TipoEvento.DESFAVORITAR) {
                    valor = -1.0;
                }
                double decay = DecayCalculator.interactionFactor(
                        e.getOcorridoEm(), now, lambda, hasConversion, contactPause
                );
                raw += peso * valor * decay;
            }

            if (comprasElegiveis) {
                for (Compra c : compras) {
                    if (c.getProduto() != null && produtoId.equals(c.getProduto().getId())) {
                        OffsetDateTime compraEm = c.getDataCompra().atStartOfDay().atOffset(now.getOffset());
                        raw += contatoPeso * DecayCalculator.purchaseAgeFactor(compraEm, now);
                    }
                }
            }

            double normalized = Math.max(0.0, Math.min(100.0, raw / scoreMax * 100.0));
            productScores.put(produtoId, normalized);
            productInteractions.put(produtoId, pe.size());
            upsertScoreProduto(usuarioId, visitanteId, produtoId, normalized, now);

            BigDecimal preco = produto.getPreco();
            if (preco != null) {
                if (hasConversion) {
                    precosComConversao.add(preco);
                } else {
                    precosSemConversao.add(preco);
                }
            }
        }

        recalcCategorias(usuarioId, visitanteId, productScores, productInteractions, produtoCategoria,
                conversionCategorias30d, now);
        upsertFaixaPreco(usuarioId, visitanteId, precosComConversao, precosSemConversao, now);

        log.debug("Score recalc usuario={} visitante={} produtos={}", usuarioId, visitanteId, productScores.size());
    }

    private void recalcCategorias(
            Long usuarioId,
            Long visitanteId,
            Map<Long, Double> productScores,
            Map<Long, Integer> productInteractions,
            Map<Long, Long> produtoCategoria,
            Set<Long> conversionCategorias30d,
            OffsetDateTime now
    ) {
        Map<Long, List<Long>> byCat = new HashMap<>();
        for (Map.Entry<Long, Long> e : produtoCategoria.entrySet()) {
            byCat.computeIfAbsent(e.getValue(), k -> new ArrayList<>()).add(e.getKey());
        }

        for (Map.Entry<Long, List<Long>> e : byCat.entrySet()) {
            Long categoriaId = e.getKey();
            double num = 0.0;
            double den = 0.0;
            for (Long produtoId : e.getValue()) {
                double score = productScores.getOrDefault(produtoId, 0.0);
                int interactions = productInteractions.getOrDefault(produtoId, 0);
                double w = Math.log(1.0 + interactions);
                num += score * w;
                den += w;
            }
            double catScore = den > 0 ? num / den : 0.0;
            if (conversionCategorias30d.contains(categoriaId)) {
                double boost = resolveBoost(categoriaId);
                catScore = Math.min(100.0, catScore * boost);
            }
            upsertScoreCategoria(usuarioId, visitanteId, categoriaId, catScore, now);
        }
    }

    private void upsertFaixaPreco(
            Long usuarioId,
            Long visitanteId,
            List<BigDecimal> com,
            List<BigDecimal> sem,
            OffsetDateTime now
    ) {
        FaixaPrecoUsuario faixa = usuarioId != null
                ? faixaPrecoUsuarioRepository.findByUsuarioId(usuarioId).orElseGet(FaixaPrecoUsuario::new)
                : faixaPrecoUsuarioRepository.findByVisitanteId(visitanteId).orElseGet(FaixaPrecoUsuario::new);
        faixa.setUsuarioId(usuarioId);
        faixa.setVisitanteId(visitanteId);
        BigDecimal medCom = median(com);
        BigDecimal medSem = median(sem);
        faixa.setMedianaComConversao(medCom);
        faixa.setMedianaSemConversao(medSem);
        if (medCom != null && medSem != null) {
            faixa.setGapPreco(medSem.subtract(medCom));
        } else {
            faixa.setGapPreco(null);
        }
        faixa.setCalculadoEm(now);
        faixaPrecoUsuarioRepository.save(faixa);
    }

    private void upsertScoreProduto(Long usuarioId, Long visitanteId, Long produtoId, double valor, OffsetDateTime now) {
        ScoreProduto score = usuarioId != null
                ? scoreProdutoRepository.findByUsuarioIdAndProdutoId(usuarioId, produtoId).orElseGet(ScoreProduto::new)
                : scoreProdutoRepository.findByVisitanteIdAndProdutoId(visitanteId, produtoId).orElseGet(ScoreProduto::new);
        score.setUsuarioId(usuarioId);
        score.setVisitanteId(visitanteId);
        score.setProdutoId(produtoId);
        score.setValor(BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP));
        score.setCalculadoEm(now);
        scoreProdutoRepository.save(score);
    }

    private void upsertScoreCategoria(Long usuarioId, Long visitanteId, Long categoriaId, double valor, OffsetDateTime now) {
        ScoreCategoria score = usuarioId != null
                ? scoreCategoriaRepository.findByUsuarioIdAndCategoriaId(usuarioId, categoriaId).orElseGet(ScoreCategoria::new)
                : scoreCategoriaRepository.findByVisitanteIdAndCategoriaId(visitanteId, categoriaId).orElseGet(ScoreCategoria::new);
        score.setUsuarioId(usuarioId);
        score.setVisitanteId(visitanteId);
        score.setCategoriaId(categoriaId);
        score.setValor(BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP));
        score.setCalculadoEm(now);
        scoreCategoriaRepository.save(score);
    }

    private Map<TipoEvento, Double> loadPesos() {
        Map<TipoEvento, Double> map = new EnumMap<>(TipoEvento.class);
        for (PesoMetrica p : pesoMetricaRepository.findAll()) {
            map.put(p.getTipoEvento(), p.getPeso().doubleValue());
        }
        return map;
    }

    private double resolveLambda(Long categoriaId) {
        if (categoriaId != null) {
            var override = parametroDecayRepository.findByCategoriaId(categoriaId);
            if (override.isPresent()) {
                return override.get().getLambda().doubleValue();
            }
        }
        return parametroDecayRepository.findGlobal()
                .map(ParametroDecay::getLambda)
                .orElse(BigDecimal.valueOf(0.01))
                .doubleValue();
    }

    private double resolveBoost(Long categoriaId) {
        if (categoriaId != null) {
            var override = parametroDecayRepository.findByCategoriaId(categoriaId);
            if (override.isPresent()) {
                return override.get().getBoostConversao().doubleValue();
            }
        }
        return parametroDecayRepository.findGlobal()
                .map(ParametroDecay::getBoostConversao)
                .orElse(BigDecimal.ONE)
                .doubleValue();
    }

    private static double eventValor(Evento e) {
        Map<String, Object> meta = e.getMetadados();
        if (e.getTipo() == TipoEvento.SCROLL_DEPTH && meta != null && meta.get("scroll") != null) {
            double v = toDouble(meta.get("scroll"));
            return Math.max(0.0, Math.min(1.0, v > 1 ? v / 100.0 : v));
        }
        if (e.getTipo() == TipoEvento.TEMPO_PAGINA && meta != null && meta.get("segundos") != null) {
            double sec = toDouble(meta.get("segundos"));
            return Math.max(0.0, Math.min(1.0, sec / 120.0));
        }
        return 1.0;
    }

    private static double toDouble(Object o) {
        if (o instanceof Number n) {
            return n.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(o));
        } catch (NumberFormatException ex) {
            return 0.0;
        }
    }

    private static BigDecimal median(List<BigDecimal> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        List<BigDecimal> sorted = values.stream().sorted().toList();
        int mid = sorted.size() / 2;
        if (sorted.size() % 2 == 0) {
            return sorted.get(mid - 1).add(sorted.get(mid)).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        }
        return sorted.get(mid);
    }
}
