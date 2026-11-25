package com.catalogo.scoring.engine;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.scoring.entity.ParametroDecay;
import com.catalogo.scoring.entity.PesoMetrica;

/**
 * Parâmetros do cálculo de score (pesos, λ e boost), desacoplados do banco para permitir
 * recalcular com valores persistidos ({@link #from}) ou simular valores propostos.
 * Record imutável: carregado uma vez e reutilizado para recalcular N sujeitos (recalcularTodos).
 */
public record ScoringParams(
        Map<TipoEvento, Double> pesos,
        double lambdaGlobal,
        double boostGlobal,
        Map<Long, Double> lambdaPorCategoria,
        Map<Long, Double> boostPorCategoria,
        double recorrenciaGlobal,
        Map<Long, Double> recorrenciaPorCategoria,
        int pausaDias
) {

    /** Meia-vida de 90 dias. */
    public static final double LAMBDA_PADRAO = 0.0077;
    public static final double BOOST_PADRAO = 1.0;

    /** Contato no WhatsApp ou compra abre uma negociação B2B que leva semanas: o interesse não esfria nesse prazo. */
    public static final short PAUSA_PADRAO = 60;

    /**
     * Eventos que somam na nota da <b>categoria</b> (ex.: filtrar por categoria), não na de produto.
     * Por isso ficam fora do divisor da nota de produto ({@link #scoreMax()}) — senão aumentar o peso
     * deles só reduziria todas as notas de produto. Ver docs/13-MUDANCAS-DE-ESCOPO.md (M2, M3).
     */
    public static final Set<TipoEvento> TIPOS_DE_CATEGORIA =
            Collections.unmodifiableSet(EnumSet.of(TipoEvento.FILTRO_APLICADO));

    /** Compra e retorno somam na nota de produto sem diluir as outras métricas: mudar o peso deles não muda o das demais. */
    private static final Set<TipoEvento> FORA_DO_DIVISOR = Collections.unmodifiableSet(
            EnumSet.of(TipoEvento.FILTRO_APLICADO, TipoEvento.COMPRA, TipoEvento.RETORNO_PAGINA));

    public ScoringParams {
        Map<TipoEvento, Double> copia = new EnumMap<>(TipoEvento.class);
        copia.putAll(pesos);
        pesos = Collections.unmodifiableMap(copia);
        lambdaPorCategoria = Map.copyOf(lambdaPorCategoria);
        boostPorCategoria = Map.copyOf(boostPorCategoria);
        recorrenciaPorCategoria = Map.copyOf(recorrenciaPorCategoria);
    }

    /** Sem bônus de recorrência e com a pausa padrão. */
    public ScoringParams(
            Map<TipoEvento, Double> pesos,
            double lambdaGlobal,
            double boostGlobal,
            Map<Long, Double> lambdaPorCategoria,
            Map<Long, Double> boostPorCategoria
    ) {
        this(pesos, lambdaGlobal, boostGlobal, lambdaPorCategoria, boostPorCategoria,
                BOOST_PADRAO, Map.of(), PAUSA_PADRAO);
    }

    public static ScoringParams from(List<PesoMetrica> pesos, List<ParametroDecay> decay) {
        Map<TipoEvento, Double> p = new EnumMap<>(TipoEvento.class);
        for (PesoMetrica m : pesos) {
            p.put(m.getTipoEvento(), m.getPeso().doubleValue());
        }
        double lambda = LAMBDA_PADRAO;
        double boost = BOOST_PADRAO;
        Map<Long, Double> lambdaCat = new HashMap<>();
        Map<Long, Double> boostCat = new HashMap<>();
        double recorrencia = BOOST_PADRAO;
        Map<Long, Double> recorrenciaCat = new HashMap<>();
        int pausa = PAUSA_PADRAO;
        for (ParametroDecay d : decay) {
            if (d.getCategoriaId() == null) {
                lambda = d.getLambda().doubleValue();
                boost = d.getBoostConversao().doubleValue();
                recorrencia = d.getBoostRecorrencia().doubleValue();
                pausa = d.getPausaDias();
            } else {
                lambdaCat.put(d.getCategoriaId(), d.getLambda().doubleValue());
                boostCat.put(d.getCategoriaId(), d.getBoostConversao().doubleValue());
                recorrenciaCat.put(d.getCategoriaId(), d.getBoostRecorrencia().doubleValue());
            }
        }
        return new ScoringParams(p, lambda, boost, lambdaCat, boostCat, recorrencia, recorrenciaCat, pausa);
    }

    public double peso(TipoEvento tipo) {
        return pesos.getOrDefault(tipo, 0.0);
    }

    /** Divisor da normalização: soma dos pesos positivos das métricas de produto. */
    public double scoreMax() {
        double max = pesos.entrySet().stream()
                .filter(e -> !FORA_DO_DIVISOR.contains(e.getKey()))
                .mapToDouble(Map.Entry::getValue)
                .filter(v -> v > 0)
                .sum();
        return max > 0 ? max : 1.0;
    }

    /** λ da categoria (linha própria em parametro_decay) ou, se não houver, o global (categoria_id NULL). */
    public double lambda(Long categoriaId) {
        return categoriaId != null && lambdaPorCategoria.containsKey(categoriaId)
                ? lambdaPorCategoria.get(categoriaId)
                : lambdaGlobal;
    }

    public double boost(Long categoriaId) {
        return categoriaId != null && boostPorCategoria.containsKey(categoriaId)
                ? boostPorCategoria.get(categoriaId)
                : boostGlobal;
    }

    /** Peso próprio da compra; sem ele (dado antigo), vale o do WhatsApp. */
    public double pesoCompra() {
        return pesos.getOrDefault(TipoEvento.COMPRA, pesos.getOrDefault(TipoEvento.CONTATO_WHATSAPP, 1.0));
    }

    /** Bônus da categoria com compra em mais de uma data. */
    public double recorrencia(Long categoriaId) {
        return categoriaId != null && recorrenciaPorCategoria.containsKey(categoriaId)
                ? recorrenciaPorCategoria.get(categoriaId)
                : recorrenciaGlobal;
    }
}
