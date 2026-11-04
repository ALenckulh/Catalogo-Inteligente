package com.catalogo.lgpd;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.dto.MessageResponse;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.lgpd.controller.ContaController;
import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;
import com.catalogo.lgpd.dto.ContaResponse;
import com.catalogo.lgpd.dto.ExportacaoResponse;
import com.catalogo.lgpd.dto.SolicitacaoLgpdResponse;
import com.catalogo.lgpd.service.ContaService;
import com.catalogo.shared.GlobalExceptionHandler;

@ExtendWith(MockitoExtension.class)
class ContaControllerTest {

    @Mock
    ContaService contaService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ContaController(contaService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getUnauthenticated401() throws Exception {
        mockMvc.perform(get("/api/conta"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getOk() throws Exception {
        when(contaService.getConta(1L)).thenReturn(new ContaResponse(
                new UsuarioResponse(1L, TipoUsuario.PF, "a@b.c", null, null, null, "A", null, null, null, null, null),
                List.of()
        ));

        mockMvc.perform(get("/api/conta").principal(auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.email").value("a@b.c"));
    }

    @Test
    void exportJsonOk() throws Exception {
        when(contaService.exportar(1L)).thenReturn(new ExportacaoResponse(
                new UsuarioResponse(1L, TipoUsuario.PF, "a@b.c", null, null, null, "A", null, null, null, null, null),
                List.of(),
                List.of(7L),
                List.of()
        ));

        mockMvc.perform(get("/api/conta/exportar").principal(auth()).param("formato", "json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favoritosProdutoIds[0]").value(7));
    }

    @Test
    void solicitacaoCreated201() throws Exception {
        when(contaService.criarSolicitacao(eq(1L), any())).thenReturn(new SolicitacaoLgpdResponse(
                5L, TipoSolicitacaoLgpd.EXCLUSAO, StatusSolicitacaoLgpd.PENDENTE, null, null, null
        ));

        mockMvc.perform(post("/api/conta/solicitacoes-lgpd")
                        .principal(auth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"EXCLUSAO\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDENTE"));
    }

    @Test
    void deleteOk() throws Exception {
        when(contaService.excluirConta(1L)).thenReturn(new MessageResponse("Conta anonimizada"));

        mockMvc.perform(delete("/api/conta").principal(auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Conta anonimizada"));
        verify(contaService).excluirConta(1L);
    }

    @Test
    void patchOk() throws Exception {
        when(contaService.patchConta(eq(1L), any())).thenReturn(new ContaResponse(
                new UsuarioResponse(1L, TipoUsuario.PF, "a@b.c", "1199", null, null, "A", null, null, null, null, null),
                List.of()
        ));

        mockMvc.perform(patch("/api/conta")
                        .principal(auth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"telefone\":\"1199\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.telefone").value("1199"));
    }

    private static UsernamePasswordAuthenticationToken auth() {
        Usuario u = new Usuario();
        u.setId(1L);
        u.setEmail("a@b.c");
        u.setSenhaHash("x");
        u.setTipo(TipoUsuario.PF);
        UsuarioPrincipal p = new UsuarioPrincipal(u);
        return new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities());
    }
}
