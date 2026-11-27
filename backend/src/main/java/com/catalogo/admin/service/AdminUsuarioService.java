package com.catalogo.admin.service;

import com.catalogo.shared.Fuso;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.admin.domain.NivelInteresse;
import com.catalogo.admin.dto.AdminUsuarioDetalhe;
import com.catalogo.admin.dto.AdminUsuarioListItem;
import com.catalogo.admin.dto.CompraResponse;
import com.catalogo.admin.dto.FaixaPrecoRow;
import com.catalogo.admin.dto.RegistrarCompraRequest;
import com.catalogo.admin.dto.ScoreCategoriaRow;
import com.catalogo.admin.dto.ScoreProdutoRow;
import com.catalogo.admin.repository.AdminAnalyticsRepository;
import com.catalogo.admin.repository.AdminAnalyticsRepository.FiltroUsuarios;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.auth.service.ConsentimentoService;
import com.catalogo.catalog.entity.Compra;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.scoring.entity.ScoreCategoria;
import com.catalogo.scoring.entity.ScoreProduto;
import com.catalogo.scoring.repository.FaixaPrecoUsuarioRepository;
import com.catalogo.scoring.repository.ScoreCategoriaRepository;
import com.catalogo.scoring.repository.ScoreProdutoRepository;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.PageResponse;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class AdminUsuarioService {

    /** Limite da coluna compra.valor_total, numeric(12,2). */
    private static final BigDecimal TOTAL_MAX = new BigDecimal("9999999999.99");

    @PersistenceContext
    private EntityManager em;

    private final UsuarioRepository usuarioRepository;
    private final AdminAnalyticsRepository analyticsRepository;
    private final ScoreProdutoRepository scoreProdutoRepository;
    private final ScoreCategoriaRepository scoreCategoriaRepository;
    private final FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository;
    private final CompraRepository compraRepository;
    private final ProdutoRepository produtoRepository;
    private final ConsentimentoService consentimentoService;
    private final ScoreEngine scoreEngine;

    public AdminUsuarioService(
            UsuarioRepository usuarioRepository,
            AdminAnalyticsRepository analyticsRepository,
            ScoreProdutoRepository scoreProdutoRepository,
            ScoreCategoriaRepository scoreCategoriaRepository,
            FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository,
            CompraRepository compraRepository,
            ProdutoRepository produtoRepository,
            ConsentimentoService consentimentoService,
            ScoreEngine scoreEngine
    ) {
        this.usuarioRepository = usuarioRepository;
        this.analyticsRepository = analyticsRepository;
        this.scoreProdutoRepository = scoreProdutoRepository;
        this.scoreCategoriaRepository = scoreCategoriaRepository;
        this.faixaPrecoUsuarioRepository = faixaPrecoUsuarioRepository;
        this.compraRepository = compraRepository;
        this.produtoRepository = produtoRepository;
        this.consentimentoService = consentimentoService;
        this.scoreEngine = scoreEngine;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUsuarioListItem> listar(
            TipoUsuario tipo,
            String categoria,
            BigDecimal scoreMin,
            NivelInteresse nivel,
            String q,
            Boolean ativo,
            Integer page,
            Integer limit,
            String sort
    ) {
        int pageIndex = page == null || page < 0 ? 0 : page;
        int size = limit == null || limit < 1 ? 20 : Math.min(limit, 100);
        FiltroUsuarios filtro = new FiltroUsuarios(tipo, categoria, scoreMin, nivel, q, ativo);

        List<Object[]> rows = analyticsRepository.usuarios(filtro, sort, size, (long) pageIndex * size);
        long total = analyticsRepository.countUsuarios(filtro);

        Map<Long, Usuario> porId = usuarioRepository.findAllById(rows.stream().map(r -> toLong(r[0])).toList())
                .stream()
                .collect(Collectors.toMap(Usuario::getId, Function.identity()));
        List<AdminUsuarioListItem> items = rows.stream()
                .filter(r -> porId.containsKey(toLong(r[0])))
                .map(r -> AdminUsuarioListItem.from(
                        porId.get(toLong(r[0])), toBd(r[1]), (String) r[2], toOdt(r[3]), (String) r[4],
                        (Boolean) r[5], (Boolean) r[6]))
                .toList();
        return new PageResponse<>(items, pageIndex, size, total);
    }

    @Transactional(readOnly = true)
    public AdminUsuarioDetalhe detalhe(Long id) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND));
        if (u.getTipo() == TipoUsuario.ADMIN) {
            throw new ApiException("NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND);
        }

        boolean contato = consentimentoService.aceitaContato(id);
        boolean interesse = consentimentoService.aceitaCookies(id);

        List<ScoreProduto> scores = interesse ? scoreProdutoRepository.findByUsuarioId(id) : List.of();
        List<ScoreProdutoRow> scoreRows = new ArrayList<>();
        for (ScoreProduto s : scores) {
            String nome = produtoRepository.findById(s.getProdutoId()).map(Produto::getNome).orElse("?");
            scoreRows.add(new ScoreProdutoRow(s.getProdutoId(), nome, s.getValor()));
        }

        List<ScoreCategoriaRow> catRows = new ArrayList<>();
        for (ScoreCategoria s : interesse ? scoreCategoriaRepository.findByUsuarioId(id) : List.<ScoreCategoria>of()) {
            String nome = em.createQuery("SELECT c.nome FROM Categoria c WHERE c.id = :id", String.class)
                    .setParameter("id", s.getCategoriaId())
                    .getResultStream().findFirst().orElse("?");
            catRows.add(new ScoreCategoriaRow(s.getCategoriaId(), nome, s.getValor()));
        }

        FaixaPrecoRow faixa = FaixaPrecoRow.from(
                interesse ? faixaPrecoUsuarioRepository.findByUsuarioId(id).orElse(null) : null
        );
        List<CompraResponse> compras = compraRepository.findByUsuarioIdAndDeletedAtIsNull(id).stream()
                .map(CompraResponse::from)
                .toList();

        UsuarioResponse usuario = UsuarioResponse.from(u);
        return new AdminUsuarioDetalhe(
                contato ? usuario : usuario.semContato(), contato, interesse, scoreRows, catRows, faixa, compras);
    }

    /**
     * Compra registrada pelo admin (não há checkout), com registrado_por = admin.
     * Recalcula o score na hora, de forma síncrona, porque a compra muda a nota; editar e excluir também.
     */
    @Transactional
    public CompraResponse registrarCompra(Long usuarioId, Long adminId, RegistrarCompraRequest request) {
        Usuario u = usuarioRepository.findById(usuarioId)
                .filter(x -> x.getDeletedAt() == null && x.getTipo() != TipoUsuario.ADMIN)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND));
        Produto produto = produtoRepository.findById(request.produtoId())
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Produto não encontrado", HttpStatus.NOT_FOUND));

        Compra compra = new Compra();
        compra.setUsuarioId(u.getId());
        preencher(compra, produto, request);
        compra.setRegistradoPor(adminId);
        compra = compraRepository.save(compra);

        scoreEngine.recalc(usuarioId, null);
        return CompraResponse.from(compra);
    }

    @Transactional
    public CompraResponse atualizarCompra(Long usuarioId, Long compraId, RegistrarCompraRequest request) {
        Compra compra = compraDoUsuario(usuarioId, compraId);
        Produto produto = produtoRepository.findById(request.produtoId())
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Produto não encontrado", HttpStatus.NOT_FOUND));

        preencher(compra, produto, request);
        compra = compraRepository.save(compra);

        scoreEngine.recalc(usuarioId, null);
        return CompraResponse.from(compra);
    }

    private static void preencher(Compra compra, Produto produto, RegistrarCompraRequest request) {
        if (request.data().isAfter(Fuso.hoje())) {
            throw new ApiException("VALIDATION_ERROR", "A data da compra não pode ser futura", HttpStatus.BAD_REQUEST);
        }
        BigDecimal total = request.precoUnitario().multiply(BigDecimal.valueOf(request.quantidade()));
        if (total.compareTo(TOTAL_MAX) > 0) {
            throw new ApiException(
                    "VALIDATION_ERROR", "O total da compra passa de R$ 9.999.999.999,99", HttpStatus.BAD_REQUEST);
        }
        compra.setProduto(produto);
        compra.setPrecoUnitario(request.precoUnitario());
        compra.setQuantidade(request.quantidade());
        compra.setValorTotal(total);
        compra.setDataCompra(request.data());
        compra.setObservacoes(request.observacoes());
    }

    /** Soft delete: todas as leituras de compra já filtram {@code deleted_at}. */
    @Transactional
    public void excluirCompra(Long usuarioId, Long compraId) {
        Compra compra = compraDoUsuario(usuarioId, compraId);
        compra.setDeletedAt(OffsetDateTime.now());
        compraRepository.save(compra);
        scoreEngine.recalc(usuarioId, null);
    }

    private Compra compraDoUsuario(Long usuarioId, Long compraId) {
        return compraRepository.findById(compraId)
                .filter(c -> c.getUsuarioId().equals(usuarioId) && c.getDeletedAt() == null)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Compra não encontrada", HttpStatus.NOT_FOUND));
    }

    private static Long toLong(Object o) {
        return ((Number) o).longValue();
    }

    private static BigDecimal toBd(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof BigDecimal bd) {
            return bd;
        }
        return BigDecimal.valueOf(((Number) o).doubleValue());
    }

    private static OffsetDateTime toOdt(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof OffsetDateTime odt) {
            return odt;
        }
        // Hibernate 6 devolve timestamptz de query nativa como Instant.
        if (o instanceof Instant i) {
            return i.atOffset(ZoneOffset.UTC);
        }
        if (o instanceof Timestamp ts) {
            return ts.toInstant().atOffset(ZoneOffset.UTC);
        }
        return null;
    }
}
