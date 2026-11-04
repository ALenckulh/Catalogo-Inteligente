package com.catalogo.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.admin.dto.RegistrarCompraRequest;
import com.catalogo.admin.repository.AdminAnalyticsRepository;
import com.catalogo.admin.service.AdminUsuarioService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.catalog.entity.Compra;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.scoring.repository.FaixaPrecoUsuarioRepository;
import com.catalogo.scoring.repository.ScoreCategoriaRepository;
import com.catalogo.scoring.repository.ScoreProdutoRepository;

@ExtendWith(MockitoExtension.class)
class AdminUsuarioServiceCompraTest {

    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    AdminAnalyticsRepository analyticsRepository;
    @Mock
    ScoreProdutoRepository scoreProdutoRepository;
    @Mock
    ScoreCategoriaRepository scoreCategoriaRepository;
    @Mock
    FaixaPrecoUsuarioRepository faixaPrecoUsuarioRepository;
    @Mock
    CompraRepository compraRepository;
    @Mock
    ProdutoRepository produtoRepository;
    @Mock
    ScoreEngine scoreEngine;

    AdminUsuarioService service;

    @BeforeEach
    void setUp() {
        service = new AdminUsuarioService(
                usuarioRepository,
                analyticsRepository,
                scoreProdutoRepository,
                scoreCategoriaRepository,
                faixaPrecoUsuarioRepository,
                compraRepository,
                produtoRepository,
                scoreEngine
        );
    }

    @Test
    void registrarCompraSetsRegistradoPor() {
        Usuario u = new Usuario();
        u.setId(5L);
        u.setTipo(TipoUsuario.PF);
        u.setEmail("c@x.c");
        Produto p = new Produto();
        p.setId(2L);
        p.setNome("P");
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(u));
        when(produtoRepository.findById(2L)).thenReturn(Optional.of(p));
        when(compraRepository.save(any(Compra.class))).thenAnswer(inv -> {
            Compra c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });

        service.registrarCompra(5L, 99L, new RegistrarCompraRequest(
                2L, BigDecimal.TEN, 1, BigDecimal.TEN, LocalDate.of(2026, 1, 15), null
        ));

        ArgumentCaptor<Compra> cap = ArgumentCaptor.forClass(Compra.class);
        verify(compraRepository).save(cap.capture());
        assertEquals(99L, cap.getValue().getRegistradoPor());
        verify(scoreEngine).recalc(5L, null);
    }
}
