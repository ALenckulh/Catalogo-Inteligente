package com.catalogo.auth.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import java.util.UUID;
import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${catalogo.jwt.secret}") String secret,
            @Value("${catalogo.jwt.expiration-ms}") long expirationMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Claims: jti = id do token (para revogar no logout), sub = id do usuário, tipo (PF/PJ/ADMIN), email, iat e exp (catalogo.jwt.expiration-ms = 24 h).
     * Assinado com HMAC-SHA256 usando catalogo.jwt.secret.
     */
    public String generate(Usuario usuario) {
        Date now = new Date();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(usuario.getId()))
                .claim("tipo", usuario.getTipo().name())
                .claim("email", usuario.getEmail())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    /** Valida assinatura e expiração; lança exceção se o token for inválido. */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long userId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    public TipoUsuario tipo(Claims claims) {
        return TipoUsuario.valueOf(claims.get("tipo", String.class));
    }
}
