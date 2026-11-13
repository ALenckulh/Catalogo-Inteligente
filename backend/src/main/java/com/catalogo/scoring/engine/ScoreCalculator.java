package com.catalogo.scoring.engine;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.catalogo.catalog.entity.Compra;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.entity.Evento;

/**
 * Cálculo puro (sem banco) das notas de um sujeito (usuário ou visitante), conforme
 * docs/04-ESPECIFICACAO-TECNICA.md §4–5. Usado pelo {@link ScoreEngine} (persistência)
 * e pela simulação de parâmetros no admin.
 */
public final class ScoreCalculator {

    /** Compras só entram no score quando o usuário tem pelo menos este número de compras. */
    public static final int MIN_COMPRAS = 3;

    private ScoreCalculator() {
    }

    public record Resultado(
            Map<Long, Double> notasProduto,
            Map<Long, Double> notasCategoria,
            List<BigDecimal> precosComConversao,
            List<BigDecimal> precosSemConversao
    ) {
        public double notaMaxima() {
            return notasProduto.values().stream().mapToDouble(Double::doubleValue).max().orElse(Double.NaN);
        }
    }

    public static boolean comprasElegiveis(List<Compra> compras) {
        return compras != null && compras.size() >= MIN_COMPRAS;
    }

    /**
     * @param eventos ativos do sujeito (apenas os com produto entram na nota)
     * @param compras compras já elegíveis (vazio quando abaixo de {@link #MIN_COMPRAS})
     * @param agora   instante de referência do decaimento
     */
    public static Resultado calcular(List<Evento> eventos, List<Compra> compras, ScoringParams params, OffsetDateTime agora) {
        double scoreMax = params.scoreMax();

        Map<Long, List<Evento>> byProduto = new HashMap<>();
        for (Evento e : eventos) {
            if (e.getProduto() == null || e.getProduto().getId() == null) {
                continue;
            }
            byProduto.computeIfAbsent(e.getProduto().getId(), k -> new ArrayList<>()).add(e);
        }

        Map<Long, Double> productScores = new HashMap<>();
        Map<Long, Integer> productInteractions = new HashMap<>();
        Map<Long, Long> produtoCategoria = new HashMap<>();
        Set<Long> conversionCategorias30d = new HashSet<>();
        Set<Long> categoriasComConversao = new HashSet<>();
        List<BigDecimal> precosComConversao = new ArrayList<>();
        List<BigDecimal> precosSemConversao = new ArrayList<>();

        double contatoPeso = params.pesos().getOrDefault(TipoEvento.CONTATO_WHATSAPP, 1.0);

        for (Map.Entry<Long, List<Evento>> entry : byProduto.entrySet()) {
            Long produtoId = entry.getKey();
            List<Evento> pe = entry.getValue();
            Produto produto = pe.getFirst().getProduto();
            Long categoriaId = produto.getCategoria() != null ? produto.getCategoria().getId() : null;
            if (categoriaId != null) {
                produtoCategoria.put(produtoId, categoriaId);
            }

            boolean hasConversion = pe.stream().anyMatch(ScoreCalculator::isConversao);
            boolean contactPause = pe.stream().anyMatch(e ->
                    e.getTipo() == TipoEvento.CONTATO_WHATSAPP
                            && DecayCalculator.withinDays(e.getOcorridoEm(), agora, DecayCalculator.PAUSE_CONTACT_DAYS));

            if (hasConversion && categoriaId != null) {
                categoriasComConversao.add(categoriaId);
            }
            if (hasConversion && categoriaId != null && pe.stream().anyMatch(e ->
                    isConversao(e) && DecayCalculator.withinDays(e.getOcorridoEm(), agora, 30))) {
                conversionCategorias30d.add(categoriaId);
            }

            double lambda = params.lambda(categoriaId);
            double raw = 0.0;
            for (Evento e : pe) {
                double peso = params.peso(e.getTipo());
                double valor = e.getTipo() == TipoEvento.DESFAVORITAR ? -1.0 : eventValor(e);
                double decay = DecayCalculator.interactionFactor(
                        e.getOcorridoEm(), agora, lambda, hasConversion, contactPause
                );
                raw += peso * valor * decay;
            }

            for (Compra c : compras) {
                if (c.getProduto() != null && produtoId.equals(c.getProduto().getId())) {
                    OffsetDateTime compraEm = c.getDataCompra().atStartOfDay().atOffset(agora.getOffset());
                    raw += contatoPeso * DecayCalculator.purchaseAgeFactor(compraEm, agora);
                }
            }

            double normalized = Math.max(0.0, Math.min(100.0, raw / scoreMax * 100.0));
            productScores.put(produtoId, normalized);
            productInteractions.put(produtoId, pe.size());

            BigDecimal preco = produto.getPreco();
            if (preco != null) {
                (hasConversion ? precosComConversao : precosSemConversao).add(preco);
            }
        }

        Map<Long, Double> pontosFiltro = pontosDeFiltro(eventos, categoriasComConversao, params, agora, scoreMax);
        Map<Long, Double> categoryScores = calcularCategorias(
                productScores, productInteractions, produtoCategoria, conversionCategorias30d, pontosFiltro, params);
        return new Resultado(productScores, categoryScores, precosComConversao, precosSemConversao);
    }

    /** Conversão = contato pelo WhatsApp ou evento marcado com conversão. */
    public static boolean isConversao(Evento e) {
        return e.getTipo() == TipoEvento.CONTATO_WHATSAPP || e.getConversao() != null;
    }

    private static Map<Long, Double> calcularCategorias(
            Map<Long, Double> productScores,
            Map<Long, Integer> productInteractions,
            Map<Long, Long> produtoCategoria,
            Set<Long> conversionCategorias30d,
            Map<Long, Double> pontosFiltro,
            ScoringParams params
    ) {
        Map<Long, List<Long>> byCat = new HashMap<>();
        for (Map.Entry<Long, Long> e : produtoCategoria.entrySet()) {
            byCat.computeIfAbsent(e.getValue(), k -> new ArrayList<>()).add(e.getKey());
        }
        // Categoria só filtrada (sem produto visto) também recebe nota.
        for (Long categoriaId : pontosFiltro.keySet()) {
            byCat.computeIfAbsent(categoriaId, k -> new ArrayList<>());
        }
        Map<Long, Double> out = new HashMap<>();
        for (Map.Entry<Long, List<Long>> e : byCat.entrySet()) {
            Long categoriaId = e.getKey();
            double num = 0.0;
            double den = 0.0;
            for (Long produtoId : e.getValue()) {
                double score = productScores.getOrDefault(produtoId, 0.0);
                double w = Math.log(1.0 + productInteractions.getOrDefault(produtoId, 0));
                num += score * w;
                den += w;
            }
            double catScore = (den > 0 ? num / den : 0.0) + pontosFiltro.getOrDefault(categoriaId, 0.0);
            if (conversionCategorias30d.contains(categoriaId)) {
                catScore = catScore * params.boost(categoriaId);
            }
            out.put(categoriaId, Math.max(0.0, Math.min(100.0, catScore)));
        }
        return out;
    }

    /**
     * Pontos que filtros por categoria somam na nota da categoria, na mesma escala da nota de produto
     * ({@code peso × decaimento ÷ Score_máximo × 100}) e com o λ da categoria.
     */
    private static Map<Long, Double> pontosDeFiltro(
            List<Evento> eventos,
            Set<Long> categoriasComConversao,
            ScoringParams params,
            OffsetDateTime agora,
            double scoreMax
    ) {
        Map<Long, Double> out = new HashMap<>();
        for (Evento e : eventos) {
            if (!ScoringParams.TIPOS_DE_CATEGORIA.contains(e.getTipo())
                    || e.getCategoria() == null || e.getCategoria().getId() == null) {
                continue;
            }
            Long categoriaId = e.getCategoria().getId();
            double decay = DecayCalculator.interactionFactor(
                    e.getOcorridoEm(), agora, params.lambda(categoriaId),
                    categoriasComConversao.contains(categoriaId), false);
            out.merge(categoriaId, params.peso(e.getTipo()) * decay / scoreMax * 100.0, Double::sum);
        }
        return out;
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
}
