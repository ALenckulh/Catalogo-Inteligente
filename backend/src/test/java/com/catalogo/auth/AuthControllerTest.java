package com.catalogo.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.catalogo.auth.controller.AdminAuthController;
import com.catalogo.auth.controller.AuthController;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.dto.AuthSessionResponse;
import com.catalogo.auth.dto.MessageResponse;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.auth.service.AuthService;
import com.catalogo.eventos.service.EventoService;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.GlobalExceptionHandler;
import com.catalogo.visitante.service.MigracaoHistoricoService;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    AuthService authService;
    @Mock
    MigracaoHistoricoService migracaoHistoricoService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthController(authService, migracaoHistoricoService), new AdminAuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void signupReturns201() throws Exception {
        when(authService.signup(any())).thenReturn(session(TipoUsuario.PF));
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tipo":"PF","email":"a@b.c","senha":"senha123",
                                  "cpf":"52998224725","nomeCompleto":"A",
                                  "aceitaTermos":true,"aceitaPrivacidade":true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("t"));
    }

    @Test
    void loginMapsUnauthorized() throws Exception {
        when(authService.loginConsumidor(any()))
                .thenThrow(new ApiException("UNAUTHORIZED", "Credenciais inválidas", HttpStatus.UNAUTHORIZED));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"a@b.c","senha":"x"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void adminLoginOk() throws Exception {
        when(authService.loginAdmin(any())).thenReturn(session(TipoUsuario.ADMIN));
        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@b.c","senha":"x"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.tipo").value("ADMIN"));
    }

    @Test
    void logoutWithoutAuthReturns401() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void migrarHistoricoUnauthenticated401() throws Exception {
        mockMvc.perform(post("/api/auth/migrar-historico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"aceitar\":true}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void migrarHistoricoOk() throws Exception {
        when(migracaoHistoricoService.migrar(eq(1L), any(), any()))
                .thenReturn(new MessageResponse("Histórico migrado com sucesso"));

        mockMvc.perform(post("/api/auth/migrar-historico")
                        .principal(auth())
                        .header(EventoService.HEADER_COOKIE, "11111111-1111-1111-1111-111111111111")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"aceitar\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Histórico migrado com sucesso"));
    }

    private static AuthSessionResponse session(TipoUsuario tipo) {
        return new AuthSessionResponse("t", new UsuarioResponse(
                1L, tipo, "a@b.c", null, null, null, "N", null, null, null, null, null
        ));
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
