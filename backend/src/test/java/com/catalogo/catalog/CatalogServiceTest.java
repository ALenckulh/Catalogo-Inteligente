package com.catalogo.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.LongStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.catalogo.catalog.dto.ProdutoResponse;
import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.catalog.service.CatalogService;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.engine.RankingService;
import com.catalogo.scoring.repository.ScoreProdutoRepository;
import com.catalogo.shared.ApiException;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

    @Mock
    ProdutoRepository produtoRepository;
    @Mock
    CategoriaRepository categoriaRepository;
    @Mock
    EventoRepository eventoRepository;
    @Mock
    ScoreProdutoRepository scoreProdutoRepository;
    @Mock
    RankingService rankingService;

    CatalogService catalogService;

    @BeforeEach
    void setUp() {
        catalogService = new CatalogService(
                produtoRepository,
                categoriaRepository,
                eventoRepository,
                scoreProdutoRepository,
                rankingService
        );
    }

    @Test
    void getBySlugNotFound() {
        when(produtoRepository.findBySlugAndAtivoTrue("x")).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> catalogService.getBySlug("x"));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void categoriaFilterIncludesDescendants() {
        Categoria root = categoria(1L, null);
        Categoria child = categoria(2L, root);
        when(categoriaRepository.findAll()).thenReturn(List.of(root, child));
        when(produtoRepository.searchIds(isNull(), eq(Set.of(1L, 2L)), isNull(), isNull())).thenReturn(List.of());
        when(rankingService.personalWeight(0, false)).thenReturn(0.0);
        when(rankingService.personalScores(null, null)).thenReturn(Map.of());
        when(rankingService.loadPopularidade()).thenReturn(Map.of());

        var page = catalogService.listProdutos(null, 1L, null, null, 0, 20, false);
        assertEquals(0, page.total());
    }

    @Test
    void destaqueLimitsReturnedSize() {
        Categoria cat = categoria(1L, null);
        when(produtoRepository.searchIds(isNull(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L));
        stubCarregamento(cat);
        when(rankingService.personalWeight(0, false)).thenReturn(0.0);
        when(rankingService.personalScores(null, null)).thenReturn(Map.of());
        when(rankingService.loadPopularidade()).thenReturn(Map.of());

        var page = catalogService.listProdutos(null, null, null, null, 0, 20, true);
        assertEquals(6, page.items().size());
        assertEquals(6, page.limit());
    }

    /** Mais de 100 produtos: todos entram no ranking e no total, e a página sai na ordem do ranking. */
    @Test
    void catalogoComMaisDe100ProdutosPaginaTodos() {
        Categoria cat = categoria(1L, null);
        when(produtoRepository.searchIds(isNull(), isNull(), isNull(), isNull()))
                .thenReturn(LongStream.rangeClosed(1, 150).boxed().toList());
        stubCarregamento(cat);
        when(rankingService.personalWeight(0, false)).thenReturn(0.0);
        when(rankingService.personalScores(null, null)).thenReturn(Map.of());
        when(rankingService.loadPopularidade()).thenReturn(Map.of());
        // Ranking simulado: maior id primeiro. O repositório devolve a página em ordem crescente.
        doAnswer(inv -> {
            List<Long> ids = inv.getArgument(0);
            ids.sort(Comparator.reverseOrder());
            return null;
        }).when(rankingService).sortByRank(any(), anyDouble(), any(), any());

        var primeira = catalogService.listProdutos(null, null, null, null, 0, 12, false);
        var ultima = catalogService.listProdutos(null, null, null, null, 12, 12, false);

        assertEquals(150, primeira.total());
        assertEquals(LongStream.iterate(150, i -> i - 1).limit(12).boxed().toList(),
                primeira.items().stream().map(ProdutoResponse::id).toList());
        assertEquals(List.of(6L, 5L, 4L, 3L, 2L, 1L), ultima.items().stream().map(ProdutoResponse::id).toList());
    }

    @Test
    void paginaAlemDoFimVemVaziaComTotal() {
        when(produtoRepository.searchIds(isNull(), isNull(), isNull(), isNull())).thenReturn(List.of(1L, 2L));
        when(rankingService.personalWeight(0, false)).thenReturn(0.0);
        when(rankingService.personalScores(null, null)).thenReturn(Map.of());
        when(rankingService.loadPopularidade()).thenReturn(Map.of());

        var page = catalogService.listProdutos(null, null, null, null, Integer.MAX_VALUE, 100, false);
        assertEquals(0, page.items().size());
        assertEquals(2, page.total());
    }

    @Test
    void highInteractionPrefersPersonalWeight() {
        when(produtoRepository.searchIds(isNull(), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(eventoRepository.countByUsuario_IdAndDeletedAtIsNull(1L)).thenReturn(12L);
        when(scoreProdutoRepository.countByUsuarioId(1L)).thenReturn(3L);
        when(rankingService.personalWeight(12L, true)).thenReturn(1.0);
        when(rankingService.personalScores(1L, null)).thenReturn(Map.of());
        when(rankingService.loadPopularidade()).thenReturn(Map.of());

        catalogService.listProdutos(null, null, null, null, 0, 20, false, 1L, null);
        org.mockito.Mockito.verify(rankingService).personalWeight(12L, true);
    }

    @Test
    void getBySlugMapsFicha() {
        Categoria cat = categoria(1L, null);
        Produto p = produto(9L, cat);
        p.getFichaTecnica().put("volts", "220");
        when(produtoRepository.findBySlugAndAtivoTrue("p")).thenReturn(Optional.of(p));

        var dto = catalogService.getBySlug("p");
        assertEquals("220", dto.fichaTecnica().get("volts"));
        assertEquals("root", dto.categoria().slug());
    }

    private void stubCarregamento(Categoria cat) {
        when(produtoRepository.findAllByIdInWithImagens(any())).thenAnswer(inv -> {
            Collection<Long> ids = inv.getArgument(0);
            return ids.stream().sorted().map(id -> produto(id, cat)).toList();
        });
    }

    private static Produto produto(Long id, Categoria cat) {
        Produto p = new Produto();
        p.setId(id);
        p.setNome("P" + id);
        p.setSlug("p" + id);
        p.setPreco(BigDecimal.TEN);
        p.setCategoria(cat);
        p.setAtivo(true);
        return p;
    }

    private static Categoria categoria(Long id, Categoria parent) {
        Categoria c = new Categoria();
        c.setId(id);
        c.setNome(parent == null ? "Root" : "Child");
        c.setSlug(parent == null ? "root" : "child");
        c.setParent(parent);
        return c;
    }
}
