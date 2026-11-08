package com.catalogo.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import com.catalogo.admin.dto.PatchProdutoRequest;
import com.catalogo.admin.dto.ProdutoInput;
import com.catalogo.admin.service.AdminProdutoService;
import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.shared.ApiException;

@ExtendWith(MockitoExtension.class)
class AdminProdutoServiceTest {

    @Mock
    ProdutoRepository produtoRepository;
    @Mock
    CategoriaRepository categoriaRepository;

    AdminProdutoService service;

    @BeforeEach
    void setUp() {
        service = new AdminProdutoService(produtoRepository, categoriaRepository);
    }

    @Test
    void criarAndDeleteSoft() {
        Categoria cat = new Categoria();
        cat.setId(1L);
        cat.setNome("C");
        cat.setSlug("c");
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(produtoRepository.existsBySlugIgnoreCase("novo")).thenReturn(false);
        when(produtoRepository.save(any(Produto.class))).thenAnswer(inv -> {
            Produto p = inv.getArgument(0);
            p.setId(9L);
            return p;
        });
        when(produtoRepository.findByIdWithDetails(9L)).thenAnswer(inv -> {
            Produto p = new Produto();
            p.setId(9L);
            p.setNome("N");
            p.setSlug("novo");
            p.setPreco(BigDecimal.TEN);
            p.setCategoria(cat);
            p.setAtivo(true);
            return Optional.of(p);
        });

        service.criar(new ProdutoInput(
                "N", "novo", null, BigDecimal.TEN, 1L, true, null, null
        ));

        Produto existing = new Produto();
        existing.setId(9L);
        existing.setAtivo(true);
        when(produtoRepository.findById(9L)).thenReturn(Optional.of(existing));

        service.deletar(9L);
        assertFalse(existing.isAtivo());
    }

    @Test
    void listarAndGetById() {
        Categoria cat = new Categoria();
        cat.setId(1L);
        cat.setNome("C");
        cat.setSlug("c");
        Produto p = new Produto();
        p.setId(3L);
        p.setNome("P");
        p.setSlug("p");
        p.setPreco(BigDecimal.ONE);
        p.setCategoria(cat);
        p.setAtivo(true);
        when(produtoRepository.adminSearch(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(p)));
        when(produtoRepository.findByIdWithDetails(3L)).thenReturn(Optional.of(p));

        assertEquals(1, service.listar(null, null, null, null).total());
        assertEquals("P", service.getById(3L).nome());
    }

    @Test
    void criarSlugConflict() {
        when(produtoRepository.existsBySlugIgnoreCase("x")).thenReturn(true);
        assertThrows(ApiException.class, () ->
                service.criar(new ProdutoInput("N", "x", null, BigDecimal.TEN, 1L, true, null, null)));
    }

    @Test
    void patchUpdatesFields() {
        Categoria cat = new Categoria();
        cat.setId(1L);
        cat.setNome("C");
        cat.setSlug("c");
        Produto p = new Produto();
        p.setId(3L);
        p.setNome("Old");
        p.setSlug("old");
        p.setPreco(BigDecimal.ONE);
        p.setCategoria(cat);
        p.setAtivo(true);
        when(produtoRepository.findByIdWithDetails(3L)).thenReturn(Optional.of(p));
        when(produtoRepository.existsBySlugIgnoreCase("new")).thenReturn(false);
        when(produtoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var out = service.patch(3L, new PatchProdutoRequest(
                "New", "new", "d", new BigDecimal("9.90"), null, false, Map.of("k", "v"), null
        ));
        assertEquals("New", out.nome());
        assertEquals("new", p.getSlug());
        assertFalse(p.isAtivo());
    }
}
