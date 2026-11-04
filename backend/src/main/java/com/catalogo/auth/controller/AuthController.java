package com.catalogo.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.auth.dto.AuthSessionResponse;
import com.catalogo.auth.dto.LoginRequest;
import com.catalogo.auth.dto.MessageResponse;
import com.catalogo.auth.dto.MigrarHistoricoRequest;
import com.catalogo.auth.dto.PasswordResetConfirmRequest;
import com.catalogo.auth.dto.PasswordResetRequest;
import com.catalogo.auth.dto.SignupRequest;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.auth.service.AuthService;
import com.catalogo.eventos.service.EventoService;
import com.catalogo.shared.ApiException;
import com.catalogo.visitante.service.MigracaoHistoricoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final MigracaoHistoricoService migracaoHistoricoService;

    public AuthController(AuthService authService, MigracaoHistoricoService migracaoHistoricoService) {
        this.authService = authService;
        this.migracaoHistoricoService = migracaoHistoricoService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthSessionResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    @PostMapping("/login")
    public AuthSessionResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.loginConsumidor(request);
    }

    @PostMapping("/logout")
    public MessageResponse logout(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException("UNAUTHORIZED", "Não autenticado", HttpStatus.UNAUTHORIZED);
        }
        return new MessageResponse("Logout realizado");
    }

    @PostMapping("/password-reset")
    public MessageResponse passwordReset(@Valid @RequestBody PasswordResetRequest request) {
        return authService.requestPasswordReset(request);
    }

    @PostMapping("/password-reset/confirm")
    public MessageResponse passwordResetConfirm(@Valid @RequestBody PasswordResetConfirmRequest request) {
        return authService.confirmPasswordReset(request);
    }

    @PostMapping("/migrar-historico")
    public MessageResponse migrarHistorico(
            Authentication authentication,
            @Valid @RequestBody MigrarHistoricoRequest request,
            @RequestHeader(value = EventoService.HEADER_COOKIE, required = false) String cookieId
    ) {
        Long usuarioId = requireUserId(authentication);
        return migracaoHistoricoService.migrar(usuarioId, request, cookieId);
    }

    private static Long requireUserId(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UsuarioPrincipal principal)) {
            throw new ApiException("UNAUTHORIZED", "Não autenticado", HttpStatus.UNAUTHORIZED);
        }
        return principal.getId();
    }
}
