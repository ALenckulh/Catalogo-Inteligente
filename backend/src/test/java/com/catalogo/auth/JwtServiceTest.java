package com.catalogo.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.security.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;

class JwtServiceTest {

    private static final String SECRET = "test-only-catalogo-jwt-secret-key-32b!!";

    JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 3_600_000L);
    }

    @Test
    void generateAndParseRoundTrip() {
        Usuario u = usuario(42L, TipoUsuario.PF, "a@b.c");
        String token = jwtService.generate(u);
        Claims claims = jwtService.parse(token);
        assertEquals(42L, jwtService.userId(claims));
        assertEquals(TipoUsuario.PF, jwtService.tipo(claims));
        assertEquals("a@b.c", claims.get("email", String.class));
    }

    @Test
    void expiredTokenThrows() throws InterruptedException {
        JwtService shortLived = new JwtService(SECRET, 1L);
        String token = shortLived.generate(usuario(1L, TipoUsuario.ADMIN, "admin@x.c"));
        Thread.sleep(20L);
        assertThrows(ExpiredJwtException.class, () -> shortLived.parse(token));
    }

    @Test
    void tokenIsCompactJwt() {
        String token = jwtService.generate(usuario(7L, TipoUsuario.PJ, "pj@x.c"));
        assertTrue(token.split("\\.").length == 3);
    }

    private static Usuario usuario(Long id, TipoUsuario tipo, String email) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setTipo(tipo);
        u.setEmail(email);
        u.setSenhaHash("hash");
        return u;
    }
}
