package com.catalogo.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.catalogo.eventos.service.EventoService;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limit: auth 5/min/IP; sessão de visitante 30/min/IP; eventos 60/min por cookie ou IP (docs/11-API-ENDPOINTS.md §1).
 * O limite geral por usuário logado é o UsuarioRateLimitFilter.
 * Algoritmo token bucket (Bucket4j): um balde por chave; cada requisição consome 1 ficha e o balde
 * se recarrega a cada minuto. Balde vazio → 429 com Retry-After: 60.
 * Limites conhecidos: fica em memória (não vale para várias instâncias) e o mapa não é limpo.
 * A chave usa o IP da conexão; atrás de um proxy reverso, configurar server.forward-headers-strategy
 * com a lista de proxies confiáveis para o Tomcat preencher o remoteAddr. Evolução: Bucket4j com Redis.
 */
@Component
// Logo depois da cadeia de segurança (-100): antes dela, o 429 saía sem os cabeçalhos de CORS e a tela via "Network Error".
@Order(-99)
@ConditionalOnProperty(name = "catalogo.rate-limit.enabled", havingValue = "true", matchIfMissing = true)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String EVENTOS = "/api/eventos";
    /** Rota pública que insere linhas a cada chamada; o front abre no máximo uma por visita. */
    private static final String SESSAO = "/api/visitantes/sessao";

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return !(path.equals("/api/auth/login")
                || path.equals("/api/auth/signup")
                || path.equals("/api/auth/password-reset")
                || path.equals("/api/auth/password-reset/confirm")
                || path.equals("/api/admin/auth/login")
                || path.equals(SESSAO)
                || path.equals(EVENTOS));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean eventos = EVENTOS.equals(path);
        int capacity = eventos ? 60 : SESSAO.equals(path) ? 30 : 5;
        String key = rateKey(request, eventos);
        Bucket bucket = buckets.computeIfAbsent(key, k -> balde(capacity));

        if (!bucket.tryConsume(1)) {
            recusar(response);
            return;
        }
        filterChain.doFilter(request, response);
    }

    /** Balde que se enche de novo aos poucos, em 1 minuto. */
    static Bucket balde(int porMinuto) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(porMinuto).refillGreedy(porMinuto, Duration.ofMinutes(1)).build())
                .build();
    }

    static void recusar(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", "60");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"code\":\"RATE_LIMIT\",\"message\":\"Muitas tentativas. Aguarde um minuto.\"}");
    }

    /** Chave do balde: eventos por cookie do visitante (ou IP); demais rotas por IP + rota. */
    private static String rateKey(HttpServletRequest request, boolean eventos) {
        if (eventos) {
            // ponytail: cookie/IP only — parse sessaoId from body if cookie-less auth needs per-sessao caps
            String cookie = request.getHeader(EventoService.HEADER_COOKIE);
            if (cookie != null && !cookie.isBlank()) {
                return "eventos:cookie:" + cookie.trim();
            }
            return "eventos:ip:" + clientIp(request);
        }
        return clientIp(request) + ":" + request.getRequestURI();
    }

    /**
     * IP da conexão TCP. X-Forwarded-For é ignorado de propósito: sem proxy confiável na frente,
     * qualquer cliente o falsifica e ganha um balde novo por requisição.
     */
    private static String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
