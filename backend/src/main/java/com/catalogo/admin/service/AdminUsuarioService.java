package com.catalogo.admin.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.UsuarioRepository;
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
import jakarta.persistence.TypedQuery;

@Service
public class AdminUsuarioService {

    @PersistenceContext
    private EntityManager em;

    private final UsuarioRepository usuarioRepository;
    private final AdminAnalyticsRepository analyticsRepository;
    private final ScoreProdutoRepository scoreProdutoRepository;
    private final ScoreCategoriaRepository scoreCategoriaRepository;
    private final FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository;
    private final CompraRepository compraRepository;
    private final ProdutoRepository produtoRepository;
    private final ScoreEngine scoreEngine;

    public AdminUsuarioService(
            UsuarioRepository usuarioRepository,
            AdminAnalyticsRepository analyticsRepository,
            ScoreProdutoRepository scoreProdutoRepository,
            ScoreCategoriaRepository scoreCategoriaRepository,
            FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository,
            CompraRepository compraRepository,
            ProdutoRepository produtoRepository,
            ScoreEngine scoreEngine
    ) {
        this.usuarioRepository = usuarioRepository;
        this.analyticsRepository = analyticsRepository;
        this.scoreProdutoRepository = scoreProdutoRepository;
        this.scoreCategoriaRepository = scoreCategoriaRepository;
        this.faixaPrecoUsuarioRepository = faixaPrecoUsuarioRepository;
        this.compraRepository = compraRepository;
        this.produtoRepository = produtoRepository;
        this.scoreEngine = scoreEngine;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUsuarioListItem> listar(
            TipoUsuario tipo,
            String categoria,
            BigDecimal scoreMin,
            NivelInteresse nivel,
            String q,
            Integer page,
            Integer limit
    ) {
        int pageIndex = page == null || page < 0 ? 0 : page;
        int size = limit == null || limit < 1 ? 20 : Math.min(limit, 100);

        StringBuilder jpql = new StringBuilder("SELECT u FROM Usuario u WHERE u.tipo <> :admin");
        if (tipo != null) {
            jpql.append(" AND u.tipo = :tipo");
        }
        if (q != null && !q.isBlank()) {
            jpql.append("""
                     AND (LOWER(u.email) LIKE :q
                       OR LOWER(COALESCE(u.nomeCompleto, '')) LIKE :q
                       OR LOWER(COALESCE(u.razaoSocial, '')) LIKE :q)
                    """);
        }
        jpql.append(" ORDER BY u.id DESC");

        TypedQuery<Usuario> query = em.createQuery(jpql.toString(), Usuario.class);
        query.setParameter("admin", TipoUsuario.ADMIN);
        if (tipo != null) {
            query.setParameter("tipo", tipo);
        }
        if (q != null && !q.isBlank()) {
            query.setParameter("q", "%" + q.trim().toLowerCase(Locale.ROOT) + "%");
        }

        List<Usuario> all = query.getResultList();
        List<AdminUsuarioListItem> enriched = new ArrayList<>();
        for (Usuario u : all) {
            if (u.getTipo() == TipoUsuario.ADMIN) {
                continue;
            }
            Object[] row = analyticsRepository.usuarioEnrichment(u.getId()).stream().findFirst().orElse(null);
            BigDecimal scoreMax = row != null ? toBd(row[0]) : null;
            String topCat = row != null && row[1] != null ? String.valueOf(row[1]) : null;
            OffsetDateTime ultima = row != null ? toOdt(row[2]) : null;

            if (scoreMin != null && (scoreMax == null || scoreMax.compareTo(scoreMin) < 0)) {
                continue;
            }
            if (nivel != null && NivelInteresse.of(scoreMax) != nivel) {
                continue;
            }
            if (categoria != null && !categoria.isBlank()) {
                if (topCat == null || !topCat.equalsIgnoreCase(categoria.trim())) {
                    continue;
                }
            }
            enriched.add(AdminUsuarioListItem.from(u, scoreMax, topCat, ultima));
        }

        int from = Math.min(pageIndex * size, enriched.size());
        int to = Math.min(from + size, enriched.size());
        return new PageResponse<>(enriched.subList(from, to), pageIndex, size, enriched.size());
    }

    @Transactional(readOnly = true)
    public AdminUsuarioDetalhe detalhe(Long id) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND));
        if (u.getTipo() == TipoUsuario.ADMIN) {
            throw new ApiException("NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND);
        }

        List<ScoreProduto> scores = scoreProdutoRepository.findByUsuarioId(id);
        List<ScoreProdutoRow> scoreRows = new ArrayList<>();
        for (ScoreProduto s : scores) {
            String nome = produtoRepository.findById(s.getProdutoId()).map(Produto::getNome).orElse("?");
            scoreRows.add(new ScoreProdutoRow(s.getProdutoId(), nome, s.getValor()));
        }

        List<ScoreCategoriaRow> catRows = new ArrayList<>();
        for (ScoreCategoria s : scoreCategoriaRepository.findByUsuarioId(id)) {
            String nome = em.createQuery("SELECT c.nome FROM Categoria c WHERE c.id = :id", String.class)
                    .setParameter("id", s.getCategoriaId())
                    .getResultStream().findFirst().orElse("?");
            catRows.add(new ScoreCategoriaRow(s.getCategoriaId(), nome, s.getValor()));
        }

        FaixaPrecoRow faixa = FaixaPrecoRow.from(
                faixaPrecoUsuarioRepository.findByUsuarioId(id).orElse(null)
        );
        List<CompraResponse> compras = compraRepository.findByUsuarioIdAndDeletedAtIsNull(id).stream()
                .map(CompraResponse::from)
                .toList();

        return new AdminUsuarioDetalhe(UsuarioResponse.from(u), scoreRows, catRows, faixa, compras);
    }

    @Transactional
    public CompraResponse registrarCompra(Long usuarioId, Long adminId, RegistrarCompraRequest request) {
        Usuario u = usuarioRepository.findById(usuarioId)
                .filter(x -> x.getDeletedAt() == null && x.getTipo() != TipoUsuario.ADMIN)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND));
        Produto produto = produtoRepository.findById(request.produtoId())
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Produto não encontrado", HttpStatus.NOT_FOUND));

        Compra compra = new Compra();
        compra.setUsuarioId(u.getId());
        compra.setProduto(produto);
        compra.setPrecoUnitario(request.precoUnitario());
        compra.setQuantidade(request.quantidade());
        compra.setValorTotal(request.valorTotal());
        compra.setDataCompra(request.data());
        compra.setObservacoes(request.observacoes());
        compra.setRegistradoPor(adminId);
        compra = compraRepository.save(compra);

        scoreEngine.recalc(usuarioId, null);
        return CompraResponse.from(compra);
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
        if (o instanceof Timestamp ts) {
            return ts.toInstant().atOffset(ZoneOffset.UTC);
        }
        return null;
    }
}
