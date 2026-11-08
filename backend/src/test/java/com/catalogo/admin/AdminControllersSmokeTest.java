package com.catalogo.admin;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.catalogo.admin.controller.AdminConfigController;
import com.catalogo.admin.controller.AdminContaController;
import com.catalogo.admin.controller.AdminDashboardController;
import com.catalogo.admin.controller.AdminProdutoController;
import com.catalogo.admin.controller.AdminSolicitacaoLgpdController;
import com.catalogo.admin.dto.AdminDashboardResponse;
import com.catalogo.admin.dto.AdminDashboardSeries;
import com.catalogo.admin.dto.AdminKpis;
import com.catalogo.admin.dto.AdminSolicitacaoLgpdItem;
import com.catalogo.admin.service.AdminConfigService;
import com.catalogo.admin.service.AdminContaService;
import com.catalogo.admin.service.AdminDashboardService;
import com.catalogo.admin.service.AdminProdutoService;
import com.catalogo.admin.service.AdminSolicitacaoLgpdService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.shared.GlobalExceptionHandler;
import com.catalogo.shared.PageResponse;

@ExtendWith(MockitoExtension.class)
class AdminControllersSmokeTest {

    @Mock
    AdminDashboardService dashboardService;
    @Mock
    AdminConfigService configService;
    @Mock
    AdminProdutoService produtoService;
    @Mock
    AdminContaService contaService;
    @Mock
    AdminSolicitacaoLgpdService lgpdService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(
                        new AdminDashboardController(dashboardService),
                        new AdminConfigController(configService),
                        new AdminProdutoController(produtoService),
                        new AdminContaController(contaService),
                        new AdminSolicitacaoLgpdController(lgpdService)
                )
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void dashboardOk() throws Exception {
        when(dashboardService.dashboard()).thenReturn(new AdminDashboardResponse(
                new AdminKpis(1, 2, 3, 4),
                List.of(),
                new AdminDashboardSeries(List.of(), List.of(), List.of())
        ));
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.usuariosAtivos").value(1));
    }

    @Test
    void configPesosGetAndPatch() throws Exception {
        when(configService.listPesos()).thenReturn(List.of());
        when(configService.patchPesos(eq(99L), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/configuracao/pesos"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/admin/configuracao/pesos")
                        .principal(adminAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"pesos":[{"tipoEvento":"FAVORITAR","peso":0.5}]}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void configDecayGetAndPatch() throws Exception {
        when(configService.listDecay()).thenReturn(List.of());
        when(configService.patchDecay(eq(99L), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/configuracao/decay"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/admin/configuracao/decay")
                        .principal(adminAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"items":[{"categoriaId":null,"lambda":0.01,"boostConversao":1.1}]}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void produtosListGetDelete() throws Exception {
        when(produtoService.listar(any(), any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0));
        mockMvc.perform(get("/api/admin/produtos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));

        mockMvc.perform(delete("/api/admin/produtos/3"))
                .andExpect(status().isNoContent());
        verify(produtoService).deletar(3L);
    }

    @Test
    void contaGetAndPatch() throws Exception {
        UsuarioResponse resp = UsuarioResponse.from(adminUser());
        when(contaService.get(99L)).thenReturn(resp);
        when(contaService.patch(eq(99L), any())).thenReturn(resp);

        mockMvc.perform(get("/api/admin/conta").principal(adminAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@x.c"));

        mockMvc.perform(patch("/api/admin/conta")
                        .principal(adminAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"telefone":"11988887777"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void solicitacoesLgpdListAndPatch() throws Exception {
        when(lgpdService.listar(any(), any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0));
        when(lgpdService.patch(eq(8L), any())).thenReturn(
                new AdminSolicitacaoLgpdItem(8L, 1L, null, null, null, StatusSolicitacaoLgpd.ATENDIDA, null, null, null)
        );

        mockMvc.perform(get("/api/admin/solicitacoes-lgpd"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/admin/solicitacoes-lgpd/8")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"ATENDIDA","observacoes":"ok"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ATENDIDA"));
    }

    private static UsernamePasswordAuthenticationToken adminAuth() {
        UsuarioPrincipal p = new UsuarioPrincipal(adminUser());
        return new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities());
    }

    private static Usuario adminUser() {
        Usuario u = new Usuario();
        u.setId(99L);
        u.setEmail("admin@x.c");
        u.setSenhaHash("x");
        u.setTipo(TipoUsuario.ADMIN);
        return u;
    }
}
