package com.catalogo.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.security.UsuarioPrincipal;

class UsuarioRateLimitFilterTest {

    private final UsuarioRateLimitFilter filtro = new UsuarioRateLimitFilter();

    @AfterEach
    void limpar() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void cento120PorUsuarioSemAfetarOutroNemEventosNemAnonimo() throws Exception {
        for (int i = 0; i < UsuarioRateLimitFilter.POR_MINUTO; i++) {
            assertEquals(200, chamar(1L, "/api/conta").getStatus());
        }
        MockHttpServletResponse limitado = chamar(1L, "/api/favoritos");
        assertEquals(429, limitado.getStatus());
        assertEquals("60", limitado.getHeader("Retry-After"));

        assertEquals(200, chamar(1L, "/api/eventos").getStatus());
        assertEquals(200, chamar(2L, "/api/conta").getStatus());
        assertEquals(200, chamar(null, "/api/produtos").getStatus());
    }

    private MockHttpServletResponse chamar(Long usuarioId, String rota) throws Exception {
        SecurityContextHolder.clearContext();
        if (usuarioId != null) {
            Usuario u = new Usuario();
            u.setId(usuarioId);
            u.setEmail("a@b.c");
            u.setSenhaHash("x");
            u.setTipo(TipoUsuario.PF);
            UsuarioPrincipal p = new UsuarioPrincipal(u);
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities()));
        }
        MockHttpServletResponse response = new MockHttpServletResponse();
        filtro.doFilter(new MockHttpServletRequest("GET", rota), response, new MockFilterChain());
        return response;
    }
}
