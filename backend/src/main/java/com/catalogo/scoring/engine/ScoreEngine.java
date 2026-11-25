package com.catalogo.scoring.engine;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.catalog.entity.Compra;
import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.entity.FaixaPrecoUsuario;
import com.catalogo.scoring.entity.ScoreCategoria;
import com.catalogo.scoring.entity.ScoreProduto;
import com.catalogo.scoring.repository.FaixaPrecoUsuarioRepository;
import com.catalogo.scoring.repository.ParametroDecayRepository;
import com.catalogo.scoring.repository.PesoMetricaRepository;
import com.catalogo.scoring.repository.ScoreCategoriaRepository;
import com.catalogo.scoring.repository.ScoreProdutoRepository;

/**
 * Orquestra o score de um sujeito (usuário ou visitante): carrega eventos, compras e parâmetros do banco,
 * delega o cálculo ao ScoreCalculator (puro) e grava o resultado. As tabelas score_* funcionam como cache
 * materializado: sempre podem ser recalculadas a partir dos eventos.
 */
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
        recalc(usuarioId, visitanteId, carregarParams());
    }

    /** Parâmetros atualmente salvos (pesos e decaimento). */
    @Transactional(readOnly = true)
    public ScoringParams carregarParams() {
        return ScoringParams.from(pesoMetricaRepository.findAll(), parametroDecayRepository.findAll());
    }

    /** Recalcula com parâmetros já carregados (evita recarregar a cada sujeito no recálculo em lote). */
    @Transactional
    public void recalc(Long usuarioId, Long visitanteId, ScoringParams params) {
        if (usuarioId == null && visitanteId == null) {
            return;
        }
        OffsetDateTime now = OffsetDateTime.now();

        List<Evento> eventos = usuarioId != null
                ? eventoRepository.findAtivosByUsuarioId(usuarioId)
                : eventoRepository.findAtivosByVisitanteId(visitanteId);

        List<Compra> compras = usuarioId != null
                ? compraRepository.findByUsuarioIdAndDeletedAtIsNull(usuarioId)
                : List.of();

        ScoreCalculator.Resultado r = ScoreCalculator.calcular(eventos, compras, params, now);
        gravarProdutos(usuarioId, visitanteId, r.notasProduto(), now);
        gravarCategorias(usuarioId, visitanteId, r.notasCategoria(), now);
        upsertFaixaPreco(usuarioId, visitanteId, r.precosComConversao(), r.precosSemConversao(), now);

        log.debug("Score recalc usuario={} visitante={} produtos={}", usuarioId, visitanteId, r.notasProduto().size());
    }

    /**
     * Faixa de preço: mediana dos preços dos produtos com conversão × sem conversão, e o gap entre elas.
     * Mostra ao vendedor quanto o cliente realmente paga comparado com o que ele só olha.
     */
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

    /** Cria ou atualiza as notas do sujeito e apaga as que não têm mais sinal (ex.: a compra foi excluída). */
    private void gravarProdutos(Long usuarioId, Long visitanteId, Map<Long, Double> notas, OffsetDateTime now) {
        Map<Long, ScoreProduto> atuais = (usuarioId != null
                ? scoreProdutoRepository.findByUsuarioId(usuarioId)
                : scoreProdutoRepository.findByVisitanteId(visitanteId))
                .stream().collect(Collectors.toMap(ScoreProduto::getProdutoId, Function.identity()));
        notas.forEach((produtoId, nota) -> {
            ScoreProduto score = atuais.remove(produtoId);
            if (score == null) {
                score = new ScoreProduto();
                score.setUsuarioId(usuarioId);
                score.setVisitanteId(visitanteId);
                score.setProdutoId(produtoId);
            }
            score.setValor(duasCasas(nota));
            score.setCalculadoEm(now);
            scoreProdutoRepository.save(score);
        });
        scoreProdutoRepository.deleteAllInBatch(atuais.values());
    }

    private void gravarCategorias(Long usuarioId, Long visitanteId, Map<Long, Double> notas, OffsetDateTime now) {
        Map<Long, ScoreCategoria> atuais = (usuarioId != null
                ? scoreCategoriaRepository.findByUsuarioId(usuarioId)
                : scoreCategoriaRepository.findByVisitanteId(visitanteId))
                .stream().collect(Collectors.toMap(ScoreCategoria::getCategoriaId, Function.identity()));
        notas.forEach((categoriaId, nota) -> {
            ScoreCategoria score = atuais.remove(categoriaId);
            if (score == null) {
                score = new ScoreCategoria();
                score.setUsuarioId(usuarioId);
                score.setVisitanteId(visitanteId);
                score.setCategoriaId(categoriaId);
            }
            score.setValor(duasCasas(nota));
            score.setCalculadoEm(now);
            scoreCategoriaRepository.save(score);
        });
        scoreCategoriaRepository.deleteAllInBatch(atuais.values());
    }

    private static BigDecimal duasCasas(double valor) {
        return BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP);
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
