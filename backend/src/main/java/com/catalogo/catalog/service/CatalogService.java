package com.catalogo.catalog.service;

import java.math.BigDecimal;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.catalog.dto.CategoriaResponse;
import com.catalogo.catalog.dto.ProdutoResponse;
import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.engine.RankingService;
import com.catalogo.scoring.repository.ScoreProdutoRepository;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.PageResponse;

@Service
public class CatalogService {

    private static final int DESTAQUE_LIMIT = 6;

    private final ProdutoRepository produtoRepository;
    private final CategoriaRepository categoriaRepository;
    private final EventoRepository eventoRepository;
    private final ScoreProdutoRepository scoreProdutoRepository;
    private final RankingService rankingService;

    public CatalogService(
            ProdutoRepository produtoRepository,
            CategoriaRepository categoriaRepository,
            EventoRepository eventoRepository,
            ScoreProdutoRepository scoreProdutoRepository,
            RankingService rankingService
    ) {
        this.produtoRepository = produtoRepository;
        this.categoriaRepository = categoriaRepository;
        this.eventoRepository = eventoRepository;
        this.scoreProdutoRepository = scoreProdutoRepository;
        this.rankingService = rankingService;
    }

    /**
     * Catálogo ordenado por intenção:
     * 1) busca os ids dos produtos ativos que batem com os filtros; 2) conta as interações do sujeito;
     * 3) calcula o peso pessoal w (cold start); 4) nota final = w × nota pessoal + (1 − w) × popularidade;
     * 5) ordena os ids (desempate por id), corta a página e carrega do banco só os produtos dela.
     */
    @Transactional(readOnly = true)
    public PageResponse<ProdutoResponse> listProdutos(
            String q,
            Long categoriaId,
            BigDecimal precoMin,
            BigDecimal precoMax,
            Integer page,
            Integer limit,
            Boolean destaque,
            Long usuarioId,
            Long visitanteId
    ) {
        int pageIndex = page == null || page < 0 ? 0 : page;
        int size = limit == null || limit < 1 ? 20 : Math.min(limit, 100);
        if (Boolean.TRUE.equals(destaque)) {
            size = DESTAQUE_LIMIT;
            pageIndex = 0;
        }

        Set<Long> categoriaIds = null;
        if (categoriaId != null) {
            categoriaIds = descendantIds(categoriaId);
        }

        String query = (q == null || q.isBlank()) ? null : q.trim();

        // Só ids: todos os produtos entram no ranking sem carregar descrição, ficha e imagens de cada um.
        List<Long> ids = new ArrayList<>(produtoRepository.searchIds(query, categoriaIds, precoMin, precoMax));

        long interactions = 0;
        boolean hasScores = false;
        if (usuarioId != null) {
            interactions = eventoRepository.countByUsuario_IdAndDeletedAtIsNull(usuarioId);
            hasScores = scoreProdutoRepository.countByUsuarioId(usuarioId) > 0;
        } else if (visitanteId != null) {
            interactions = eventoRepository.countByVisitante_IdAndUsuarioIsNullAndDeletedAtIsNull(visitanteId);
            hasScores = scoreProdutoRepository.countByVisitanteId(visitanteId) > 0;
        }

        double personalWeight = rankingService.personalWeight(interactions, hasScores);
        Map<Long, BigDecimal> personal = rankingService.personalScores(usuarioId, visitanteId);
        Map<Long, BigDecimal> popularidade = rankingService.loadPopularidade();
        rankingService.sortByRank(ids, personalWeight, personal, popularidade);

        int from = (int) Math.min((long) pageIndex * size, ids.size());
        int to = Math.min(from + size, ids.size());
        return new PageResponse<>(carregarNaOrdem(ids.subList(from, to)), pageIndex, size, ids.size());
    }

    private List<ProdutoResponse> carregarNaOrdem(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Produto> porId = produtoRepository.findAllByIdInWithImagens(ids).stream()
                .collect(Collectors.toMap(Produto::getId, Function.identity()));
        return ids.stream()
                .map(porId::get)
                .filter(Objects::nonNull)
                .map(p -> ProdutoResponse.from(p, false))
                .toList();
    }

    /** Backward-compatible overload for tests without actor. */
    @Transactional(readOnly = true)
    public PageResponse<ProdutoResponse> listProdutos(
            String q,
            Long categoriaId,
            BigDecimal precoMin,
            BigDecimal precoMax,
            Integer page,
            Integer limit,
            Boolean destaque
    ) {
        return listProdutos(q, categoriaId, precoMin, precoMax, page, limit, destaque, null, null);
    }

    @Transactional(readOnly = true)
    public ProdutoResponse getBySlug(String slug) {
        Produto produto = produtoRepository.findBySlugAndAtivoTrue(slug)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Produto não encontrado", HttpStatus.NOT_FOUND));
        return ProdutoResponse.from(produto, true);
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listCategorias() {
        return categoriaRepository.findAll().stream()
                .map(CategoriaResponse::from)
                .toList();
    }

    /**
     * Categoria + todas as subcategorias: busca em largura (BFS) na árvore parent_id, com fila e Set de
     * visitados. O resultado vai para a query como IN :categoriaIds.
     */
    private Set<Long> descendantIds(Long rootId) {
        List<Categoria> all = categoriaRepository.findAll();
        if (all.stream().noneMatch(c -> c.getId().equals(rootId))) {
            throw new ApiException("NOT_FOUND", "Categoria não encontrada", HttpStatus.NOT_FOUND);
        }
        Map<Long, List<Categoria>> byParent = all.stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.groupingBy(c -> c.getParent().getId()));

        Set<Long> ids = new HashSet<>();
        ArrayDeque<Long> queue = new ArrayDeque<>();
        queue.add(rootId);
        while (!queue.isEmpty()) {
            Long id = queue.removeFirst();
            if (ids.add(id)) {
                for (Categoria child : byParent.getOrDefault(id, List.of())) {
                    queue.add(child.getId());
                }
            }
        }
        return ids;
    }
}
