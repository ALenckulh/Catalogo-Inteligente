package com.catalogo.auth.security;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.catalogo.auth.repository.UsuarioRepository;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Autentica cada requisição pelo JWT do header Authorization (uma vez por requisição).
 * Não há sessão no servidor, mas o usuário é relido do banco por PK: assim uma conta excluída/anonimizada
 * perde o acesso na hora, mesmo com o token ainda válido (trade-off deliberado, custo de um SELECT por id).
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        // 1. Sem "Bearer ...": segue como anônimo (rotas públicas continuam funcionando).
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            // 2. Valida assinatura e exp.
            Claims claims = jwtService.parse(token);
            Long userId = jwtService.userId(claims);
            // 3. Busca o usuário no banco e ignora conta apagada (deletedAt preenchido).
            usuarioRepository.findById(userId).ifPresent(usuario -> {
                if (usuario.getDeletedAt() != null) {
                    return;
                }
                // 4. Principal com authority ROLE_PF|PJ|ADMIN no SecurityContext.
                UsuarioPrincipal principal = new UsuarioPrincipal(usuario);
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        principal.getAuthorities()
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        } catch (Exception ignored) {
            // 5. Token inválido: segue anônimo; se a rota exigir login, o entry point responde 401.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
