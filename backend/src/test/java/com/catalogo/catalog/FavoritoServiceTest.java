package com.catalogo.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Favorito;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.FavoritoRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.catalog.service.FavoritoService;

@ExtendWith(MockitoExtension.class)
class FavoritoServiceTest {

    @Mock
    FavoritoRepository favoritoRepository;
    @Mock
    ProdutoRepository produtoRepository;

    FavoritoService service;

    @BeforeEach
    void setUp() {
        service = new FavoritoService(favoritoRepository, produtoRepository);
    }

    @Test
    void postTwiceIdempotentSingleActive() {
        Produto produto = produto(7L);
        when(produtoRepository.findById(7L)).thenReturn(Optional.of(produto));
        when(favoritoRepository.findByUsuarioIdAndProdutoId(1L, 7L)).thenReturn(Optional.empty());
        when(favoritoRepository.save(any(Favorito.class))).thenAnswer(inv -> inv.getArgument(0));

        service.favoritar(1L, 7L);

        Favorito softDeleted = new Favorito();
        softDeleted.setUsuarioId(1L);
        softDeleted.setProdutoId(7L);
        softDeleted.setDeletedAt(OffsetDateTime.now());
        when(favoritoRepository.findByUsuarioIdAndProdutoId(1L, 7L)).thenReturn(Optional.of(softDeleted));

        service.favoritar(1L, 7L);

        ArgumentCaptor<Favorito> cap = ArgumentCaptor.forClass(Favorito.class);
        verify(favoritoRepository, times(2)).save(cap.capture());
        assertNull(cap.getAllValues().get(1).getDeletedAt());
    }

    @Test
    void deleteTwiceIdempotent() {
        Favorito fav = new Favorito();
        fav.setUsuarioId(1L);
        fav.setProdutoId(7L);
        when(favoritoRepository.findByUsuarioIdAndProdutoId(1L, 7L)).thenReturn(Optional.of(fav));

        service.desfavoritar(1L, 7L);
        service.desfavoritar(1L, 7L);

        assertEquals(true, fav.getDeletedAt() != null);
    }

    @Test
    void listOnlyNonDeleted() {
        Favorito ativo = new Favorito();
        ativo.setUsuarioId(1L);
        ativo.setProdutoId(7L);
        ativo.setCreatedAt(OffsetDateTime.now());
        ativo.setProduto(produto(7L));
        when(favoritoRepository.findAtivosByUsuarioId(1L)).thenReturn(List.of(ativo));

        assertEquals(1, service.listar(1L).size());
        verify(favoritoRepository).findAtivosByUsuarioId(1L);
        verify(favoritoRepository, never()).findAll();
    }

    private static Produto produto(Long id) {
        Categoria cat = new Categoria();
        cat.setId(1L);
        cat.setNome("C");
        cat.setSlug("c");
        Produto p = new Produto();
        p.setId(id);
        p.setNome("P");
        p.setSlug("p");
        p.setPreco(BigDecimal.TEN);
        p.setAtivo(true);
        p.setCategoria(cat);
        p.setCreatedAt(OffsetDateTime.now());
        p.setUpdatedAt(OffsetDateTime.now());
        return p;
    }
}
