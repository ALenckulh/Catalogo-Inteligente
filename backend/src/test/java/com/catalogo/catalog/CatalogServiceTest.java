package com.catalogo.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

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
        when(produtoRepository.search(isNull(), eq(Set.of(1L, 2L)), isNull(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 0));
        when(rankingService.personalWeight(0, false)).thenReturn(0.0);
        when(rankingService.personalScores(null, null)).thenReturn(Map.of());
        when(rankingService.loadPopularidade()).thenReturn(Map.of());

        var page = catalogService.listProdutos(null, 1L, null, null, 0, 20, false);
        assertEquals(0, page.total());
    }

    @Test
    void destaqueLimitsReturnedSize() {
        Categoria cat = categoria(1L, null);
        List<Produto> many = List.of(
                produto(1L, cat), produto(2L, cat), produto(3L, cat),
                produto(4L, cat), produto(5L, cat), produto(6L, cat), produto(7L, cat)
        );
        when(produtoRepository.search(isNull(), isNull(), isNull(), isNull(), any()))
                .thenReturn(new PageImpl<>(many, PageRequest.of(0, 100), many.size()));
        when(rankingService.personalWeight(0, false)).thenReturn(0.0);
        when(rankingService.personalScores(null, null)).thenReturn(Map.of());
        when(rankingService.loadPopularidade()).thenReturn(Map.of());

        var page = catalogService.listProdutos(null, null, null, null, 0, 20, true);
        assertEquals(6, page.items().size());
        assertEquals(6, page.limit());
    }

    @Test
    void highInteractionPrefersPersonalWeight() {
        when(produtoRepository.search(isNull(), isNull(), isNull(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 0));
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
