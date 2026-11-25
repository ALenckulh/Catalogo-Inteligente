package com.catalogo.auth.security;

import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.TokenRevogadoRepository;
import io.jsonwebtoken.JwtException;
import java.io.IOException;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionException;
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

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final TokenRevogadoRepository tokenRevogadoRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UsuarioRepository usuarioRepository,
            TokenRevogadoRepository tokenRevogadoRepository
    ) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.tokenRevogadoRepository = tokenRevogadoRepository;
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

        Claims claims;
        Long userId;
        UUID jti;
        try {
            // 2. Valida assinatura e exp.
            claims = jwtService.parse(header.substring(7));
            userId = jwtService.userId(claims);
            jti = claims.getId() != null ? UUID.fromString(claims.getId()) : null;
        } catch (JwtException | IllegalArgumentException ex) {
            // Token inválido: segue anônimo; se a rota exigir login, o entry point responde 401.
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
            return;
        }

        Optional<Usuario> encontrado;
        try {
            // 3. Busca o usuário no banco; token que saiu da conta não vale mais.
            encontrado = jti != null && tokenRevogadoRepository.existsById(jti)
                    ? Optional.empty()
                    : usuarioRepository.findById(userId);
        } catch (DataAccessException | TransactionException ex) {
            // Banco fora não é token inválido: com 401 o front apagaria a sessão de quem está logado.
            log.error("Falha ao buscar o usuário do token", ex);
            response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"code\":\"SERVICE_UNAVAILABLE\",\"message\":\"Serviço indisponível\"}");
            return;
        }

        // 4. Não entra conta apagada nem token anterior à troca de senha; as demais viram principal com ROLE_PF|PJ|ADMIN.
        if (encontrado.isPresent() && encontrado.get().getDeletedAt() == null
                && !anteriorATrocaDeSenha(claims, encontrado.get())) {
            UsuarioPrincipal principal = new UsuarioPrincipal(encontrado.get());
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    principal.getAuthorities()
            );
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }

    private static boolean anteriorATrocaDeSenha(Claims claims, Usuario usuario) {
        OffsetDateTime desde = usuario.getSessoesValidasDesde();
        return desde != null
                && (claims.getIssuedAt() == null || claims.getIssuedAt().toInstant().isBefore(desde.toInstant()));
    }
}
