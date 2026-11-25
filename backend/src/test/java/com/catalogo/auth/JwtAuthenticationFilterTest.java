package com.catalogo.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.catalogo.auth.repository.TokenRevogadoRepository;
import io.jsonwebtoken.MalformedJwtException;
import java.util.Optional;

import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.auth.security.JwtAuthenticationFilter;
import com.catalogo.auth.security.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    JwtService jwtService;
    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    TokenRevogadoRepository tokenRevogadoRepository;

    JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, usuarioRepository, tokenRevogadoRepository);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void noBearerPassesThrough() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(req, res, chain);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void validTokenSetsAuthentication() throws Exception {
        Usuario u = new Usuario();
        u.setId(5L);
        u.setEmail("u@x.c");
        u.setSenhaHash("x");
        u.setTipo(TipoUsuario.PF);

        Claims claims = Jwts.claims().subject("5").add("tipo", "PF").add("email", "u@x.c").build();
        when(jwtService.parse("tok")).thenReturn(claims);
        when(jwtService.userId(claims)).thenReturn(5L);
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(u));

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader(HttpHeaders.AUTHORIZATION, "Bearer tok");
        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(req, res, chain);
        assertTrue(SecurityContextHolder.getContext().getAuthentication().isAuthenticated());
    }

    @Test
    void tokenRevogadoNaoEntraEOutroDaMesmaContaEntra() throws Exception {
        Usuario u = usuario(null);
        UUID revogado = UUID.randomUUID();
        when(tokenRevogadoRepository.existsById(any())).thenAnswer(inv -> revogado.equals(inv.getArgument(0)));
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(u));

        assertNull(autenticar(Jwts.claims().id(revogado.toString()).subject("5").build()));
        assertNotNull(autenticar(Jwts.claims().id(UUID.randomUUID().toString()).subject("5").build()));
    }

    @Test
    void tokenAnteriorATrocaDeSenhaNaoEntra() throws Exception {
        Usuario u = usuario("velha");
        u.trocarSenha("nova");
        java.time.Instant troca = u.getSessoesValidasDesde().toInstant();
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(u));

        assertNull(autenticar(Jwts.claims().subject("5").issuedAt(java.util.Date.from(troca.minusSeconds(1))).build()));
        assertNotNull(autenticar(Jwts.claims().subject("5").issuedAt(java.util.Date.from(troca)).build()));
        assertNull(autenticar(Jwts.claims().subject("5").build()));
    }

    private org.springframework.security.core.Authentication autenticar(Claims claims) throws Exception {
        SecurityContextHolder.clearContext();
        when(jwtService.parse("tok")).thenReturn(claims);
        when(jwtService.userId(claims)).thenReturn(5L);
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader(HttpHeaders.AUTHORIZATION, "Bearer tok");
        filter.doFilter(req, new MockHttpServletResponse(), new MockFilterChain());
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private static Usuario usuario(String senha) {
        Usuario u = new Usuario();
        u.setId(5L);
        u.setEmail("u@x.c");
        u.setSenhaHash(senha != null ? senha : "x");
        u.setTipo(TipoUsuario.PF);
        return u;
    }

    /** Banco fora: 503 e a cadeia para. Com 401 o front apagaria a sessão. */
    @Test
    void bancoForaDa503() throws Exception {
        Claims claims = Jwts.claims().subject("5").build();
        when(jwtService.parse("tok")).thenReturn(claims);
        when(jwtService.userId(claims)).thenReturn(5L);
        when(usuarioRepository.findById(5L)).thenThrow(new DataAccessResourceFailureException("fora"));

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader(HttpHeaders.AUTHORIZATION, "Bearer tok");
        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(req, res, chain);
        assertEquals(503, res.getStatus());
        assertTrue(res.getContentAsString().contains("SERVICE_UNAVAILABLE"));
        assertNull(chain.getRequest());
    }

    @Test
    void invalidTokenClearsContext() throws Exception {
        when(jwtService.parse("bad")).thenThrow(new MalformedJwtException("bad"));

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader(HttpHeaders.AUTHORIZATION, "Bearer bad");
        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(req, res, chain);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(jwtService).parse("bad");
    }
}
