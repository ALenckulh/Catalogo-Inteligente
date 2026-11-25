package com.catalogo.visitante;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

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

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.GlobalExceptionHandler;
import com.catalogo.visitante.controller.VisitanteController;
import com.catalogo.visitante.dto.SessaoResponse;
import com.catalogo.visitante.service.VisitanteService;

@ExtendWith(MockitoExtension.class)
class VisitanteControllerTest {

    @Mock
    VisitanteService visitanteService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new VisitanteController(visitanteService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void abrirSessaoOk() throws Exception {
        UUID cookie = UUID.randomUUID();
        when(visitanteService.abrirSessao(any(), isNull())).thenReturn(new SessaoResponse(cookie, 5L));

        mockMvc.perform(post("/api/visitantes/sessao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cookieId").value(cookie.toString()))
                .andExpect(jsonPath("$.sessaoId").value(5));
    }

    @Test
    void logadoAbreSessaoDoUsuario() throws Exception {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setTipo(TipoUsuario.PF);
        UsuarioPrincipal principal = new UsuarioPrincipal(usuario);
        when(visitanteService.abrirSessao(any(), eq(1L))).thenReturn(new SessaoResponse(null, 6L));

        mockMvc.perform(post("/api/visitantes/sessao")
                        .principal(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cookieId").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.sessaoId").value(6));
    }

    @Test
    void invalidCookieUuidInBodyMaps400() throws Exception {
        mockMvc.perform(post("/api/visitantes/sessao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cookieId\":\"not-a-uuid\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownCookieMaps400() throws Exception {
        when(visitanteService.abrirSessao(any(), isNull()))
                .thenThrow(new ApiException("INVALID_COOKIE", "Cookie de visitante inválido", HttpStatus.BAD_REQUEST));

        mockMvc.perform(post("/api/visitantes/sessao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cookieId\":\"11111111-1111-1111-1111-111111111111\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_COOKIE"));
    }
}
