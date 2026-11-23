package com.catalogo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.catalogo.auth.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** BCrypt: hash lento com salt aleatório embutido; senhas iguais geram hashes diferentes e só dá para comparar (matches). */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
                .cors(Customizer.withDefaults())
                // CSRF desligado: API stateless e o token vai no header Authorization, que o navegador
                // não envia sozinho (CSRF explora cookies enviados automaticamente).
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Públicas: catálogo (GET), signup/login, sessão de visitante e eventos.
                // /api/admin/** exige ROLE_ADMIN (montada em UsuarioPrincipal); o resto exige login.
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/signup", "/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/password-reset", "/api/auth/password-reset/confirm").permitAll()
                        .requestMatchers("/api/admin/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/produtos", "/api/produtos/**", "/api/categorias").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/visitantes/sessao").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/eventos").permitAll()
                        .requestMatchers("/api/favoritos/**").authenticated()
                        .requestMatchers("/api/auth/logout").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                // Rota protegida sem autenticação válida → 401 em JSON.
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"code\":\"UNAUTHORIZED\",\"message\":\"Não autenticado\"}");
                }))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
