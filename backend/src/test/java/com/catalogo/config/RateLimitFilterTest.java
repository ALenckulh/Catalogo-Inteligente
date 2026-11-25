package com.catalogo.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitFilterTest {

    @Test
    void sixthRequestIs429() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("10.0.0.1");

        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            assertEquals(200, response.getStatus());
        }

        MockHttpServletResponse limited = new MockHttpServletResponse();
        filter.doFilter(request, limited, new MockFilterChain());
        assertEquals(429, limited.getStatus());
        assertEquals("60", limited.getHeader("Retry-After"));
    }

    @Test
    void xForwardedForFalsificadoNaoGanhaBaldeNovo() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        int ultimo = 0;
        for (int i = 0; i < 6; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("10.0.0.2");
            request.addHeader("X-Forwarded-For", "203.0.113." + i);
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            ultimo = response.getStatus();
        }
        assertEquals(429, ultimo);
    }

    /** A rota é pública e insere linhas: sem limite, um script enche visitante e sessao. */
    @Test
    void aberturaDeSessaoPermite30PorMinutoPorIp() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        for (int i = 0; i < 30; i++) {
            assertEquals(200, abrirSessao(filter, "POST", "10.0.0.3").getStatus());
        }
        MockHttpServletResponse limited = abrirSessao(filter, "POST", "10.0.0.3");
        assertEquals(429, limited.getStatus());
        assertEquals("60", limited.getHeader("Retry-After"));

        // Outro IP e o preflight do CORS não são afetados.
        assertEquals(200, abrirSessao(filter, "POST", "10.0.0.4").getStatus());
        assertEquals(200, abrirSessao(filter, "OPTIONS", "10.0.0.3").getStatus());
    }

    private static MockHttpServletResponse abrirSessao(RateLimitFilter filter, String metodo, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(metodo, "/api/visitantes/sessao");
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
