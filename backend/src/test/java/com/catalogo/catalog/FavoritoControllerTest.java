package com.catalogo.catalog;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.catalog.controller.FavoritoController;
import com.catalogo.catalog.service.FavoritoService;
import com.catalogo.shared.GlobalExceptionHandler;

@ExtendWith(MockitoExtension.class)
class FavoritoControllerTest {

    @Mock
    FavoritoService favoritoService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new FavoritoController(favoritoService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void unauthenticatedGetIs401() throws Exception {
        mockMvc.perform(get("/api/favoritos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedListOk() throws Exception {
        when(favoritoService.listar(1L)).thenReturn(List.of());
        mockMvc.perform(get("/api/favoritos").principal(auth()))
                .andExpect(status().isOk());
        verify(favoritoService).listar(1L);
    }

    @Test
    void deleteIdempotentOk() throws Exception {
        mockMvc.perform(delete("/api/favoritos/3").principal(auth()))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/favoritos/3").principal(auth()))
                .andExpect(status().isOk());
        verify(favoritoService, org.mockito.Mockito.times(2)).desfavoritar(1L, 3L);
    }

    @Test
    void postOk() throws Exception {
        mockMvc.perform(post("/api/favoritos/3").principal(auth()))
                .andExpect(status().isOk());
        verify(favoritoService).favoritar(1L, 3L);
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
