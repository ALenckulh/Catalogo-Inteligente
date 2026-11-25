package com.catalogo.config;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.catalogo.auth.security.UsuarioPrincipal;

import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 120 requisições por minuto por usuário logado (docs/11-API-ENDPOINTS.md §1). Roda dentro da cadeia de segurança,
 * depois do filtro JWT, porque a chave é o usuário. Eventos têm o limite deles no RateLimitFilter.
 */
@Component
@ConditionalOnProperty(name = "catalogo.rate-limit.enabled", havingValue = "true", matchIfMissing = true)
public class UsuarioRateLimitFilter extends OncePerRequestFilter {

    static final int POR_MINUTO = 120;

    private final Map<Long, Bucket> baldes = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "/api/eventos".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioPrincipal usuario
                && !baldes.computeIfAbsent(usuario.getId(), id -> RateLimitFilter.balde(POR_MINUTO)).tryConsume(1)) {
            RateLimitFilter.recusar(response);
            return;
        }
        chain.doFilter(request, response);
    }
}
