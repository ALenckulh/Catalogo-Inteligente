package com.catalogo.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.admin.domain.NivelInteresse;
import com.catalogo.admin.dto.AdminUsuarioListItem;
import com.catalogo.admin.repository.AdminAnalyticsRepository;
import com.catalogo.admin.repository.AdminAnalyticsRepository.FiltroUsuarios;
import com.catalogo.admin.service.AdminUsuarioService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.scoring.repository.FaixaPrecoUsuarioRepository;
import com.catalogo.scoring.repository.ScoreCategoriaRepository;
import com.catalogo.scoring.repository.ScoreProdutoRepository;

@ExtendWith(MockitoExtension.class)
class AdminUsuarioServiceListarTest {

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

    @InjectMocks
    AdminUsuarioService service;

    /** A consulta define a ordem; o findAllById pode devolver em outra. */
    @Test
    void mantemOrdemDaConsultaETotalDoBanco() {
        Instant agora = Instant.parse("2026-11-24T12:00:00Z");
        when(analyticsRepository.usuarios(any(), any(), anyInt(), anyLong())).thenReturn(List.of(
                new Object[] {9L, new BigDecimal("81.50"), "Motores", agora, "Pistão", true, true},
                new Object[] {3L, null, null, null, null, false, false}
        ));
        when(analyticsRepository.countUsuarios(any())).thenReturn(150L);
        when(usuarioRepository.findAllById(List.of(9L, 3L))).thenReturn(List.of(usuario(3L), usuario(9L)));

        var page = service.listar(null, null, null, null, null, null, 2, 20, "nome,asc");

        assertEquals(150, page.total());
        assertEquals(List.of(9L, 3L), page.items().stream().map(AdminUsuarioListItem::id).toList());
        assertEquals("Motores", page.items().get(0).topCategoria());
        assertEquals(agora.atOffset(ZoneOffset.UTC), page.items().get(0).ultimaAtividade());
        assertEquals("Pistão", page.items().get(0).proximaCompra());
        assertNull(page.items().get(1).scoreMaxProduto());
        assertNull(page.items().get(1).proximaCompra());
        assertEquals("9@x.c", page.items().get(0).email());
        assertEquals("47999990000", page.items().get(0).telefone());
        assertNull(page.items().get(1).email());
        assertNull(page.items().get(1).telefone());
        assertNull(page.items().get(1).cpf());
        assertEquals("Nome 3", page.items().get(1).nomeCompleto());
        verify(analyticsRepository).usuarios(any(), eq("nome,asc"), eq(20), eq(40L));
    }

    @Test
    void repassaFiltrosELimitaTamanhoDaPagina() {
        FiltroUsuarios filtro = new FiltroUsuarios(
                TipoUsuario.PJ, "Motores", BigDecimal.TEN, NivelInteresse.FRIO, "abc", false);

        service.listar(TipoUsuario.PJ, "Motores", BigDecimal.TEN, NivelInteresse.FRIO, "abc", false, -1, 5000, null);

        verify(analyticsRepository).usuarios(filtro, null, 100, 0L);
        verify(analyticsRepository).countUsuarios(filtro);
    }

    private static Usuario usuario(Long id) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setTipo(TipoUsuario.PF);
        u.setEmail(id + "@x.c");
        u.setTelefone("47999990000");
        u.setCpf("52998224725");
        u.setNomeCompleto("Nome " + id);
        return u;
    }
}
