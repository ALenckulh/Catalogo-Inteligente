package com.catalogo.scoring.engine;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;

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

        // Compras só entram com 3 ou mais (MIN_COMPRAS): com menos, a amostra é pequena e vira ruído.
        List<Compra> compras = List.of();
        if (usuarioId != null
                && compraRepository.countByUsuarioIdAndDeletedAtIsNull(usuarioId) >= ScoreCalculator.MIN_COMPRAS) {
            compras = compraRepository.findByUsuarioIdAndDeletedAtIsNull(usuarioId);
        }

        ScoreCalculator.Resultado r = ScoreCalculator.calcular(eventos, compras, params, now);
        r.notasProduto().forEach((produtoId, nota) -> upsertScoreProduto(usuarioId, visitanteId, produtoId, nota, now));
        r.notasCategoria().forEach((categoriaId, nota) -> upsertScoreCategoria(usuarioId, visitanteId, categoriaId, nota, now));
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

    /** Upsert: procura a linha do sujeito + produto; se não existe, cria; atualiza valor e calculado_em. */
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
