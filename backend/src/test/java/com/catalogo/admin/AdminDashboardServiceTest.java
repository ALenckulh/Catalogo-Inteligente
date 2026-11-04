package com.catalogo.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.admin.repository.AdminAnalyticsRepository;
import com.catalogo.admin.service.AdminDashboardService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.catalog.repository.ProdutoRepository;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    ProdutoRepository produtoRepository;
    @Mock
    AdminAnalyticsRepository analyticsRepository;

    AdminDashboardService service;

    @BeforeEach
    void setUp() {
        service = new AdminDashboardService(usuarioRepository, produtoRepository, analyticsRepository);
    }

    @Test
    void dashboardKpisShape() {
        when(usuarioRepository.countByTipoNotAndDeletedAtIsNull(TipoUsuario.ADMIN)).thenReturn(5L);
        when(produtoRepository.countByAtivoTrue()).thenReturn(12L);
        when(analyticsRepository.countContatosSince(any())).thenReturn(3L);
        when(analyticsRepository.countLeadsScoreAlto(anyDouble())).thenReturn(2L);
        when(analyticsRepository.topLeads(anyInt())).thenReturn(List.of());
        when(analyticsRepository.scoreDistribution()).thenReturn(List.<Object[]>of(new Object[]{"0-20", 1L}));
        when(analyticsRepository.contatosPorDia(any())).thenReturn(List.of());
        when(analyticsRepository.leadsPorCategoria()).thenReturn(List.of());

        var dash = service.dashboard();

        assertEquals(5L, dash.kpis().usuariosAtivos());
        assertEquals(12L, dash.kpis().produtosAtivos());
        assertEquals(3L, dash.kpis().contatos7d());
        assertEquals(2L, dash.kpis().leadsScoreAlto());
        assertEquals(1, dash.series().distribuicaoScores().size());
    }
}
