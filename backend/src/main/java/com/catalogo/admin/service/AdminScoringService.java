package com.catalogo.admin.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.admin.domain.NivelInteresse;
import com.catalogo.admin.dto.DecayPatchRequest;
import com.catalogo.admin.dto.PesosPatchRequest;
import com.catalogo.admin.dto.SimulacaoRequest;
import com.catalogo.admin.dto.SimulacaoResponse;
import com.catalogo.admin.dto.SimulacaoResponse.CategoriaContagem;
import com.catalogo.admin.dto.SimulacaoResponse.Confianca;
import com.catalogo.admin.dto.SimulacaoResponse.Impacto;
import com.catalogo.admin.dto.SimulacaoResponse.Metricas;
import com.catalogo.admin.dto.SimulacaoResponse.MudancaCategoria;
import com.catalogo.admin.dto.SimulacaoResponse.MudancaCliente;
import com.catalogo.admin.dto.SimulacaoResponse.NivelContagem;
import com.catalogo.admin.dto.SimulacaoResponse.Precisao;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.catalog.entity.Compra;
import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.engine.ScoreCalculator;
import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.scoring.engine.ScoringParams;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Simulação de parâmetros de score (sem gravar nada) e recálculo em lote.
 * O cálculo usa o mesmo {@link ScoreCalculator} do motor, então a prévia bate com o que será gravado.
 */
@Service
public class AdminScoringService {

    static final int JANELA_DIAS = 365;
    /** O backtest usa os primeiros 70% do histórico (por horário) para prever os 30% finais. */
    static final double PERCENTIL_CORTE = 0.7;
    static final int MAX_MUDANCAS = 10;
    static final int TOP_N = 3;
    static final int MAX_CATEGORIAS = 6;

    @PersistenceContext
    private EntityManager em;

    private final EventoRepository eventoRepository;
    private final CompraRepository compraRepository;
    private final ScoreEngine scoreEngine;

    public AdminScoringService(
            EventoRepository eventoRepository,
            CompraRepository compraRepository,
            ScoreEngine scoreEngine
    ) {
        this.eventoRepository = eventoRepository;
        this.compraRepository = compraRepository;
        this.scoreEngine = scoreEngine;
    }

    public record Cliente(Long id, String nome) {
    }

    @Transactional(readOnly = true)
    public SimulacaoResponse simular(SimulacaoRequest request) {
        ScoringParams atual = scoreEngine.carregarParams();
        ScoringParams proposta = toParams(request.pesos(), request.decay());
        OffsetDateTime agora = OffsetDateTime.now();

        List<Evento> eventos = eventoRepository.findAtivosDesde(agora.minusDays(JANELA_DIAS));
        List<Compra> compras = compraRepository.findAtivasComProduto();
        List<Cliente> clientes = em.createQuery("""
                        SELECT u FROM Usuario u
                        WHERE u.deletedAt IS NULL AND u.tipo <> :admin
                        ORDER BY u.id
                        """, Usuario.class)
                .setParameter("admin", TipoUsuario.ADMIN)
                .getResultList()
                .stream()
                .map(u -> new Cliente(u.getId(), nome(u)))
                .toList();

        return new SimulacaoResponse(
                calcularImpacto(clientes, eventos, compras, atual, proposta, agora),
                calcularPrecisao(eventos, compras, atual, proposta)
        );
    }

    /** Recalcula e grava as notas de todos os clientes e visitantes com eventos. */
    @Transactional
    public int recalcularTodos() {
        // Síncrono: adequado ao volume atual. Com muitos sujeitos, publicar na fila de scoring.
        ScoringParams params = scoreEngine.carregarParams();
        int total = 0;
        for (Long usuarioId : eventoRepository.findUsuarioIdsComEventos()) {
            scoreEngine.recalc(usuarioId, null, params);
            total++;
        }
        for (Long visitanteId : eventoRepository.findVisitanteIdsSemUsuario()) {
            scoreEngine.recalc(null, visitanteId, params);
            total++;
        }
        return total;
    }

    static ScoringParams toParams(List<PesosPatchRequest.Item> pesos, List<DecayPatchRequest.Item> decay) {
        Map<TipoEvento, Double> p = new EnumMap<>(TipoEvento.class);
        for (PesosPatchRequest.Item i : pesos) {
            p.put(i.tipoEvento(), i.peso().doubleValue());
        }
        double lambda = ScoringParams.LAMBDA_PADRAO;
        double boost = ScoringParams.BOOST_PADRAO;
        Map<Long, Double> lambdaCat = new HashMap<>();
        Map<Long, Double> boostCat = new HashMap<>();
        for (DecayPatchRequest.Item d : decay) {
            if (d.categoriaId() == null) {
                lambda = d.lambda().doubleValue();
                boost = d.boostConversao().doubleValue();
            } else {
                lambdaCat.put(d.categoriaId(), d.lambda().doubleValue());
                boostCat.put(d.categoriaId(), d.boostConversao().doubleValue());
            }
        }
        return new ScoringParams(p, lambda, boost, lambdaCat, boostCat);
    }

    // ---------------------------------------------------------------- impacto

    static Impacto calcularImpacto(
            List<Cliente> clientes,
            List<Evento> eventos,
            List<Compra> compras,
            ScoringParams atual,
            ScoringParams proposta,
            OffsetDateTime agora
    ) {
        Map<Long, List<Evento>> eventosPorUsuario = new HashMap<>();
        for (Evento e : eventos) {
            if (e.getUsuario() != null) {
                eventosPorUsuario.computeIfAbsent(e.getUsuario().getId(), k -> new ArrayList<>()).add(e);
            }
        }
        Map<Long, List<Compra>> comprasPorUsuario = agruparCompras(compras, null);
        Map<Long, String> nomesCategoria = nomesCategoria(eventos);
        Map<Long, Long> favAtual = new HashMap<>();
        Map<Long, Long> favProposta = new HashMap<>();
        List<MudancaCategoria> mudancasCategoria = new ArrayList<>();
        int mudamDeCategoria = 0;

        Map<NivelInteresse, Long> distAtual = contagemVazia();
        Map<NivelInteresse, Long> distProposta = contagemVazia();
        List<MudancaCliente> mudancas = new ArrayList<>();
        double somaAtual = 0;
        double somaProposta = 0;
        int comNota = 0;
        int mudam = 0;

        for (Cliente c : clientes) {
            List<Evento> ev = eventosPorUsuario.getOrDefault(c.id(), List.of());
            List<Compra> co = elegiveis(comprasPorUsuario.getOrDefault(c.id(), List.of()));
            ScoreCalculator.Resultado ra = ScoreCalculator.calcular(ev, co, atual, agora);
            ScoreCalculator.Resultado rp = ScoreCalculator.calcular(ev, co, proposta, agora);
            double na = ra.notaMaxima();
            double np = rp.notaMaxima();
            Long catA = favorita(ra.notasCategoria());
            Long catP = favorita(rp.notasCategoria());
            if (catA != null) {
                favAtual.merge(catA, 1L, Long::sum);
            }
            if (catP != null) {
                favProposta.merge(catP, 1L, Long::sum);
            }
            if (!java.util.Objects.equals(catA, catP)) {
                mudamDeCategoria++;
                if (mudancasCategoria.size() < MAX_MUDANCAS) {
                    mudancasCategoria.add(new MudancaCategoria(
                            c.id(), c.nome(), nomesCategoria.get(catA), nomesCategoria.get(catP)));
                }
            }
            NivelInteresse nivelA = NivelInteresse.deNota(na);
            NivelInteresse nivelP = NivelInteresse.deNota(np);
            distAtual.merge(nivelA, 1L, Long::sum);
            distProposta.merge(nivelP, 1L, Long::sum);
            if (!Double.isNaN(na)) {
                somaAtual += na;
                somaProposta += np;
                comNota++;
            }
            boolean mudouNivel = nivelA != nivelP;
            if (mudouNivel) {
                mudam++;
            }
            if (mudouNivel || (!Double.isNaN(na) && Math.abs(np - na) >= 0.05)) {
                mudancas.add(new MudancaCliente(c.id(), c.nome(), nivelA, nivelP, nullIfNaN(na), nullIfNaN(np)));
            }
        }

        mudancas.sort(Comparator
                .comparing((MudancaCliente m) -> m.nivelAtual() == m.nivelProposto())
                .thenComparing(m -> -Math.abs(valor(m.notaProposta()) - valor(m.notaAtual()))));

        return new Impacto(
                clientes.size(),
                toContagens(distAtual),
                toContagens(distProposta),
                comNota > 0 ? somaAtual / comNota : null,
                comNota > 0 ? somaProposta / comNota : null,
                mudam,
                mudancas.stream().limit(MAX_MUDANCAS).toList(),
                mudamDeCategoria,
                topCategorias(favAtual, favProposta, favAtual, nomesCategoria),
                topCategorias(favAtual, favProposta, favProposta, nomesCategoria),
                mudancasCategoria
        );
    }

    /** Categoria de maior nota; empate → menor id (determinístico). */
    static Long favorita(Map<Long, Double> notasCategoria) {
        return notasCategoria.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .max(Map.Entry.<Long, Double>comparingByValue()
                        .thenComparing(Map.Entry.comparingByKey(Comparator.reverseOrder())))
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    /**
     * Contagem de {@code cenario} nas mesmas categorias para os dois cenários: as mais frequentes
     * somando hoje e com os ajustes, para as barras ficarem lado a lado.
     */
    private static List<CategoriaContagem> topCategorias(
            Map<Long, Long> favAtual,
            Map<Long, Long> favProposta,
            Map<Long, Long> cenario,
            Map<Long, String> nomes
    ) {
        Set<Long> ids = new HashSet<>(favAtual.keySet());
        ids.addAll(favProposta.keySet());
        return ids.stream()
                .sorted(Comparator
                        .comparingLong((Long id) -> -(favAtual.getOrDefault(id, 0L) + favProposta.getOrDefault(id, 0L)))
                        .thenComparing(Comparator.naturalOrder()))
                .limit(MAX_CATEGORIAS)
                .map(id -> new CategoriaContagem(id, nomes.getOrDefault(id, "Categoria " + id), cenario.getOrDefault(id, 0L)))
                .toList();
    }

    private static Map<Long, String> nomesCategoria(List<Evento> eventos) {
        Map<Long, String> out = new HashMap<>();
        for (Evento e : eventos) {
            if (e.getProduto() != null && e.getProduto().getCategoria() != null) {
                out.putIfAbsent(e.getProduto().getCategoria().getId(), e.getProduto().getCategoria().getNome());
            }
            if (e.getCategoria() != null && e.getCategoria().getNome() != null) {
                out.putIfAbsent(e.getCategoria().getId(), e.getCategoria().getNome());
            }
        }
        return out;
    }

    // --------------------------------------------------------------- precisão

    /**
     * Backtest: notas calculadas com o histórico anterior ao corte; acerto medido pelas conversões
     * (contato, evento com conversão ou compra) a partir do corte. Inclui clientes e visitantes que já
     * tinham pelo menos um evento antes do corte.
     */
    static Precisao calcularPrecisao(
            List<Evento> eventos,
            List<Compra> compras,
            ScoringParams atual,
            ScoringParams proposta
    ) {
        List<OffsetDateTime> horarios = eventos.stream().map(Evento::getOcorridoEm).sorted().toList();
        if (horarios.size() < 2 || horarios.getFirst().equals(horarios.getLast())) {
            return new Precisao(null, 0, 0, Confianca.BAIXA, null, null);
        }
        OffsetDateTime corte = horarios.get((int) Math.floor(PERCENTIL_CORTE * (horarios.size() - 1)));
        LocalDate diaCorte = corte.toLocalDate();

        Map<String, List<Evento>> antes = new LinkedHashMap<>();
        Map<String, Set<Long>> convertidosDepois = new LinkedHashMap<>();
        for (Evento e : eventos) {
            String sujeito = sujeito(e);
            if (sujeito == null) {
                continue;
            }
            if (e.getOcorridoEm().isBefore(corte)) {
                antes.computeIfAbsent(sujeito, k -> new ArrayList<>()).add(e);
            } else if (ScoreCalculator.isConversao(e)) {
                convertidosDepois.computeIfAbsent(sujeito, k -> new HashSet<>())
                        .add(e.getProduto() != null ? e.getProduto().getId() : null);
            }
        }
        Map<Long, List<Compra>> comprasAntes = agruparCompras(compras, c -> c.getDataCompra().isBefore(diaCorte));
        for (Compra c : compras) {
            if (!c.getDataCompra().isBefore(diaCorte) && c.getUsuarioId() != null) {
                String sujeito = "U" + c.getUsuarioId();
                convertidosDepois.computeIfAbsent(sujeito, k -> new HashSet<>()).add(c.getProduto().getId());
            }
        }

        // Só avalia quem tinha histórico no corte: sem nenhum evento antes, nenhum parâmetro consegue prever.
        convertidosDepois.keySet().retainAll(antes.keySet());

        int positivos = convertidosDepois.size();
        Confianca confianca = positivos < 10 ? Confianca.BAIXA : positivos < 30 ? Confianca.MEDIA : Confianca.ALTA;
        return new Precisao(
                corte,
                antes.size(),
                positivos,
                confianca,
                metricas(antes, comprasAntes, convertidosDepois, atual, corte),
                metricas(antes, comprasAntes, convertidosDepois, proposta, corte)
        );
    }

    private static Metricas metricas(
            Map<String, List<Evento>> antes,
            Map<Long, List<Compra>> comprasAntes,
            Map<String, Set<Long>> convertidosDepois,
            ScoringParams params,
            OffsetDateTime corte
    ) {
        List<double[]> notas = new ArrayList<>(); // [nota, positivo(0/1)]
        int quentes = 0;
        int quentesQueConverteram = 0;
        int pares = 0;
        int acertosTop = 0;

        for (Map.Entry<String, List<Evento>> s : antes.entrySet()) {
            List<Compra> co = s.getKey().startsWith("U")
                    ? elegiveis(comprasAntes.getOrDefault(Long.valueOf(s.getKey().substring(1)), List.of()))
                    : List.of();
            ScoreCalculator.Resultado r = ScoreCalculator.calcular(s.getValue(), co, params, corte);
            double nota = r.notaMaxima();
            boolean converteu = convertidosDepois.containsKey(s.getKey());
            boolean quente = NivelInteresse.deNota(nota) == NivelInteresse.QUENTE;
            notas.add(new double[] {Double.isNaN(nota) ? 0.0 : nota, converteu ? 1 : 0});
            if (quente) {
                quentes++;
                if (converteu) {
                    quentesQueConverteram++;
                }
            }
            if (converteu) {
                Set<Long> top = r.notasProduto().entrySet().stream()
                        .filter(e -> e.getValue() > 0)
                        .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                        .limit(TOP_N)
                        .map(Map.Entry::getKey)
                        .collect(Collectors.toSet());
                for (Long produtoId : convertidosDepois.get(s.getKey())) {
                    if (produtoId == null) {
                        continue;
                    }
                    pares++;
                    if (top.contains(produtoId)) {
                        acertosTop++;
                    }
                }
            }
        }
        int positivos = convertidosDepois.size();
        return new Metricas(
                quentes > 0 ? (double) quentesQueConverteram / quentes : null,
                positivos > 0 ? (double) quentesQueConverteram / positivos : null,
                auc(notas),
                pares > 0 ? (double) acertosTop / pares : null,
                quentes
        );
    }

    /** AUC por Mann–Whitney com postos médios em empates; null sem positivos ou sem negativos. */
    static Double auc(List<double[]> notas) {
        long pos = notas.stream().filter(n -> n[1] == 1).count();
        long neg = notas.size() - pos;
        if (pos == 0 || neg == 0) {
            return null;
        }
        List<double[]> ordenadas = new ArrayList<>(notas);
        ordenadas.sort(Comparator.comparingDouble(n -> n[0]));
        double somaPostosPos = 0;
        int i = 0;
        while (i < ordenadas.size()) {
            int j = i;
            while (j + 1 < ordenadas.size() && ordenadas.get(j + 1)[0] == ordenadas.get(i)[0]) {
                j++;
            }
            double postoMedio = (i + j) / 2.0 + 1;
            for (int k = i; k <= j; k++) {
                if (ordenadas.get(k)[1] == 1) {
                    somaPostosPos += postoMedio;
                }
            }
            i = j + 1;
        }
        return (somaPostosPos - pos * (pos + 1) / 2.0) / (pos * neg);
    }

    // ---------------------------------------------------------------- helpers

    private static String sujeito(Evento e) {
        if (e.getUsuario() != null) {
            return "U" + e.getUsuario().getId();
        }
        if (e.getVisitante() != null) {
            return "V" + e.getVisitante().getId();
        }
        return null;
    }

    private static Map<Long, List<Compra>> agruparCompras(List<Compra> compras, Predicate<Compra> filtro) {
        Map<Long, List<Compra>> out = new HashMap<>();
        for (Compra c : compras) {
            if (c.getUsuarioId() != null && (filtro == null || filtro.test(c))) {
                out.computeIfAbsent(c.getUsuarioId(), k -> new ArrayList<>()).add(c);
            }
        }
        return out;
    }

    private static List<Compra> elegiveis(List<Compra> compras) {
        return ScoreCalculator.comprasElegiveis(compras) ? compras : List.of();
    }

    private static Map<NivelInteresse, Long> contagemVazia() {
        Map<NivelInteresse, Long> m = new EnumMap<>(NivelInteresse.class);
        for (NivelInteresse n : NivelInteresse.values()) {
            m.put(n, 0L);
        }
        return m;
    }

    private static List<NivelContagem> toContagens(Map<NivelInteresse, Long> m) {
        return m.entrySet().stream().map(e -> new NivelContagem(e.getKey(), e.getValue())).toList();
    }

    private static Double nullIfNaN(double v) {
        return Double.isNaN(v) ? null : v;
    }

    private static double valor(Double v) {
        return v == null ? 0.0 : v;
    }

    private static String nome(Usuario u) {
        if (u.getNomeCompleto() != null) {
            return u.getNomeCompleto();
        }
        return u.getRazaoSocial() != null ? u.getRazaoSocial() : u.getEmail();
    }
}
