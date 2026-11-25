package com.catalogo.scoring.engine;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.catalogo.catalog.entity.Compra;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.entity.Evento;
import java.util.stream.Collectors;

/**
 * Cálculo puro (sem banco) das notas de um sujeito (usuário ou visitante), conforme
 * docs/04-ESPECIFICACAO-TECNICA.md §4–5. Usado pelo {@link ScoreEngine} (persistência)
 * e pela simulação de parâmetros no admin.
 * Por ser puro, é testável sem banco e a prévia do admin usa exatamente a mesma conta que será gravada.
 */
public final class ScoreCalculator {

    /** Compras só somam pontos quando o usuário tem pelo menos este número de compras. */
    public static final int MIN_COMPRAS = 3;

    /** Conversão nos últimos 30 dias dá o bônus da categoria. */
    private static final int DIAS_BONUS = 30;

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
     * Nota de produto: bruto = Σ (peso do tipo × valor do evento × fator de decaimento) + compras;
     * nota = clamp(bruto ÷ ScoreMax × 100, 0, 100). Depois calcula as notas de categoria e as listas de
     * preços com/sem conversão (para a faixa de preço).
     *
     * @param eventos ativos do sujeito (apenas os com produto entram na nota)
     * @param compras todas as do sujeito: qualquer uma vale como conversão (docs/04 §8.1), mas só somam pontos
     *                a partir de {@link #MIN_COMPRAS}
     * @param agora   instante de referência do decaimento
     */
    public static Resultado calcular(List<Evento> eventos, List<Compra> compras, ScoringParams params, OffsetDateTime agora) {
        double scoreMax = params.scoreMax();
        boolean compraPontua = comprasElegiveis(compras);

        // Produtos avaliados = com eventos ∪ comprados (compra sem nenhuma interação também conta).
        Map<Long, List<Evento>> byProduto = new HashMap<>();
        Map<Long, Produto> produtos = new HashMap<>();
        for (Evento e : eventos) {
            if (e.getProduto() == null || e.getProduto().getId() == null) {
                continue;
            }
            byProduto.computeIfAbsent(e.getProduto().getId(), k -> new ArrayList<>()).add(e);
            produtos.putIfAbsent(e.getProduto().getId(), e.getProduto());
        }
        for (Compra c : compras) {
            if (c.getProduto() != null && c.getProduto().getId() != null) {
                produtos.putIfAbsent(c.getProduto().getId(), c.getProduto());
            }
        }

        Map<Long, Double> productScores = new HashMap<>();
        Map<Long, Integer> productInteractions = new HashMap<>();
        Map<Long, Long> produtoCategoria = new HashMap<>();
        Set<Long> conversionCategorias30d = new HashSet<>();
        Set<Long> categoriasComConversao = new HashSet<>();
        List<BigDecimal> precosComConversao = new ArrayList<>();
        List<BigDecimal> precosSemConversao = new ArrayList<>();

        Map<Long, Set<LocalDate>> datasDeCompra = new HashMap<>();

        for (Map.Entry<Long, Produto> entry : produtos.entrySet()) {
            Long produtoId = entry.getKey();
            Produto produto = entry.getValue();
            List<Evento> pe = soUltimoFavorito(byProduto.getOrDefault(produtoId, List.of()));
            List<LocalDate> comprasDoProduto = compras.stream()
                    .filter(c -> c.getProduto() != null && produtoId.equals(c.getProduto().getId()))
                    .map(Compra::getDataCompra)
                    .toList();
            Long categoriaId = produto.getCategoria() != null ? produto.getCategoria().getId() : null;
            boolean hasConversion = !comprasDoProduto.isEmpty() || pe.stream().anyMatch(ScoreCalculator::isConversao);
            boolean contactPause = comprasDoProduto.stream().anyMatch(d ->
                    DecayCalculator.withinDays(d, agora, params.pausaDias()))
                    || pe.stream().anyMatch(e -> e.getTipo() == TipoEvento.CONTATO_WHATSAPP
                            && DecayCalculator.withinDays(e.getOcorridoEm(), agora, params.pausaDias()));

            if (hasConversion && categoriaId != null) {
                categoriasComConversao.add(categoriaId);
            }
            if (categoriaId != null && (comprasDoProduto.stream()
                    .anyMatch(d -> DecayCalculator.withinDays(d, agora, DIAS_BONUS))
                    || pe.stream().anyMatch(e ->
                            isConversao(e) && DecayCalculator.withinDays(e.getOcorridoEm(), agora, DIAS_BONUS)))) {
                conversionCategorias30d.add(categoriaId);
            }

            if (categoriaId != null) {
                datasDeCompra.computeIfAbsent(categoriaId, k -> new HashSet<>()).addAll(comprasDoProduto);
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

            // Voltar ao produto em outra visita: cada sessão depois da primeira soma o peso de retorno.
            for (Evento e : retornos(pe)) {
                raw += params.peso(TipoEvento.RETORNO_PAGINA) * DecayCalculator.interactionFactor(
                        e.getOcorridoEm(), agora, lambda, hasConversion, contactPause);
            }

            // Cada compra do produto soma peso da compra × fator de idade (1,0 até 2 anos, depois 0,5).
            if (compraPontua) {
                for (LocalDate data : comprasDoProduto) {
                    raw += params.pesoCompra() * DecayCalculator.purchaseAgeFactor(data, agora);
                }
            }

            // Sem interação e sem compra que pontue não há nota: "nunca interagiu" não pode virar nota 0 (Frio).
            if (!pe.isEmpty() || compraPontua) {
                // Normaliza para 0–100 dividindo pelo ScoreMax (soma dos pesos de produto).
                double normalized = Math.max(0.0, Math.min(100.0, raw / scoreMax * 100.0));
                productScores.put(produtoId, normalized);
                // Compra conta como interação: sem isso o peso ln(1 + n) do produto na categoria seria 0.
                productInteractions.put(produtoId, pe.size() + (compraPontua ? comprasDoProduto.size() : 0));
                if (categoriaId != null) {
                    produtoCategoria.put(produtoId, categoriaId);
                }
            }

            // Faixa de preço: todo produto com interação ou comprado.
            BigDecimal preco = produto.getPreco();
            if (preco != null) {
                (hasConversion ? precosComConversao : precosSemConversao).add(preco);
            }
        }

        Map<Long, Double> pontosFiltro = pontosDeFiltro(eventos, categoriasComConversao, params, agora, scoreMax);
        // Recorrência é parte do histórico de compras: só a partir do mesmo mínimo dos pontos.
        Set<Long> recorrentes = compraPontua
                ? datasDeCompra.entrySet().stream().filter(d -> d.getValue().size() > 1).map(Map.Entry::getKey)
                        .collect(Collectors.toSet())
                : Set.of();
        Map<Long, Double> categoryScores = calcularCategorias(
                productScores, productInteractions, produtoCategoria, conversionCategorias30d, recorrentes, pontosFiltro, params);
        return new Resultado(productScores, categoryScores, precosComConversao, precosSemConversao);
    }

    /** Primeira visualização de cada sessão, menos a da sessão mais antiga. */
    private static List<Evento> retornos(List<Evento> eventos) {
        Map<Long, Evento> primeiras = new HashMap<>();
        for (Evento e : eventos) {
            if (e.getTipo() == TipoEvento.VISUALIZACAO_PRODUTO && e.getSessao() != null && e.getSessao().getId() != null) {
                primeiras.merge(e.getSessao().getId(), e,
                        (a, b) -> b.getOcorridoEm().isBefore(a.getOcorridoEm()) ? b : a);
            }
        }
        return primeiras.values().stream().sorted(Comparator.comparing(Evento::getOcorridoEm)).skip(1).toList();
    }

    /** Favoritar e desfavoritar valem pelo último estado: repetir o clique não acumula pontos. */
    private static List<Evento> soUltimoFavorito(List<Evento> eventos) {
        Evento ultimo = eventos.stream()
                .filter(ScoreCalculator::isFavorito)
                .max(Comparator.comparing(Evento::getOcorridoEm)
                        .thenComparing(Evento::getId, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
        return eventos.stream().filter(e -> !isFavorito(e) || e == ultimo).toList();
    }

    private static boolean isFavorito(Evento e) {
        return e.getTipo() == TipoEvento.FAVORITAR || e.getTipo() == TipoEvento.DESFAVORITAR;
    }

    /** Conversão por evento = contato pelo WhatsApp ou evento marcado com conversão (a compra é vista à parte). */
    public static boolean isConversao(Evento e) {
        return e.getTipo() == TipoEvento.CONTATO_WHATSAPP || e.getConversao() != null;
    }

    /**
     * Nota de categoria = média ponderada das notas dos produtos dela, com peso ln(1 + nº de interações)
     * (mais interações pesam mais, com retorno decrescente), + pontos de filtro na categoria,
     * × boost se houve conversão na categoria nos últimos 30 dias, × bônus de recorrência se houve compra em
     * mais de uma data. Limitada a 0–100.
     */
    private static Map<Long, Double> calcularCategorias(
            Map<Long, Double> productScores,
            Map<Long, Integer> productInteractions,
            Map<Long, Long> produtoCategoria,
            Set<Long> conversionCategorias30d,
            Set<Long> recorrentes,
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
            if (recorrentes.contains(categoriaId)) {
                catScore = catScore * params.recorrencia(categoriaId);
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
        // O front envia um evento por marco de rolagem (25/50/75/100%): cada um vale 1/4,
        // então rolar até o fim soma no máximo o peso cheio (docs/03 §4.0.1).
        if (e.getTipo() == TipoEvento.SCROLL_DEPTH) {
            return 0.25;
        }
        if (e.getTipo() == TipoEvento.TEMPO_PAGINA && meta != null && meta.get("segundos_ativos") != null) {
            double sec = toDouble(meta.get("segundos_ativos"));
            return Math.max(0.0, Math.min(1.0, sec / 120.0));
        }
        return 1.0;
    }

    /** Valor que não é número finito ("abc", "NaN", infinito) conta como 0: NaN contaminaria a nota inteira. */
    private static double toDouble(Object o) {
        double d;
        try {
            d = o instanceof Number n ? n.doubleValue() : Double.parseDouble(String.valueOf(o));
        } catch (NumberFormatException ex) {
            return 0.0;
        }
        return Double.isFinite(d) ? d : 0.0;
    }
}
