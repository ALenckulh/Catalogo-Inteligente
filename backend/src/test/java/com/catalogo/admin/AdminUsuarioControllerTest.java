package com.catalogo.admin;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
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

import com.catalogo.admin.controller.AdminUsuarioController;
import com.catalogo.admin.domain.NivelInteresse;
import com.catalogo.admin.dto.CompraResponse;
import com.catalogo.admin.service.AdminUsuarioService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.shared.GlobalExceptionHandler;
import com.catalogo.shared.PageResponse;

@ExtendWith(MockitoExtension.class)
class AdminUsuarioControllerTest {

    @Mock
    AdminUsuarioService usuarioService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AdminUsuarioController(usuarioService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listOkWithAdminPrincipal() throws Exception {
        when(usuarioService.listar(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0));

        mockMvc.perform(get("/api/admin/usuarios").principal(adminAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void listRepassaFiltroDeNivel() throws Exception {
        when(usuarioService.listar(any(), any(), any(), eq(NivelInteresse.QUENTE), any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0));

        mockMvc.perform(get("/api/admin/usuarios").param("nivel", "QUENTE").principal(adminAuth()))
                .andExpect(status().isOk());

        verify(usuarioService).listar(any(), any(), any(), eq(NivelInteresse.QUENTE), any(), any(), any());
    }

    @Test
    void compraSetsRegistradoViaService() throws Exception {
        when(usuarioService.registrarCompra(eq(5L), eq(99L), any()))
                .thenReturn(new CompraResponse(
                        1L, 5L, 2L, "P", BigDecimal.TEN, 1, BigDecimal.TEN, LocalDate.now(), null
                ));

        mockMvc.perform(post("/api/admin/usuarios/5/compras")
                        .principal(adminAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoId":2,
                                  "precoUnitario":10,
                                  "quantidade":1,
                                  "valorTotal":10,
                                  "data":"2026-01-15"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuarioId").value(5));
    }

    @Test
    void atualizarCompraRetorna200() throws Exception {
        when(usuarioService.atualizarCompra(eq(5L), eq(1L), any()))
                .thenReturn(new CompraResponse(
                        1L, 5L, 2L, "P", BigDecimal.TEN, 2, new BigDecimal("20"), LocalDate.now(), null
                ));

        mockMvc.perform(put("/api/admin/usuarios/5/compras/1")
                        .principal(adminAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "produtoId":2,
                                  "precoUnitario":10,
                                  "quantidade":2,
                                  "valorTotal":20,
                                  "data":"2026-01-15"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidade").value(2));
    }

    @Test
    void excluirCompraRetorna204() throws Exception {
        mockMvc.perform(delete("/api/admin/usuarios/5/compras/1").principal(adminAuth()))
                .andExpect(status().isNoContent());

        verify(usuarioService).excluirCompra(5L, 1L);
    }

    private static UsernamePasswordAuthenticationToken adminAuth() {
        Usuario u = new Usuario();
        u.setId(99L);
        u.setEmail("admin@x.c");
        u.setSenhaHash("x");
        u.setTipo(TipoUsuario.ADMIN);
        UsuarioPrincipal p = new UsuarioPrincipal(u);
        return new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities());
    }
}
