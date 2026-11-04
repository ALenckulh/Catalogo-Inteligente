package com.catalogo.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.catalogo.auth.dto.LoginRequest;
import com.catalogo.auth.repository.ConsentimentoLgpdRepository;
import com.catalogo.auth.repository.PasswordResetTokenRepository;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.auth.security.JwtService;
import com.catalogo.auth.service.AuthService;
import com.catalogo.shared.ApiException;

@ExtendWith(MockitoExtension.class)
class AuthServiceDeletedUserTest {

    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    ConsentimentoLgpdRepository consentimentoRepository;
    @Mock
    PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    JwtService jwtService;

    AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                usuarioRepository,
                consentimentoRepository,
                passwordResetTokenRepository,
                new BCryptPasswordEncoder(),
                jwtService
        );
    }

    @Test
    void loginRejectsMissingActiveUser() {
        when(usuarioRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("gone@x.c"))
                .thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                authService.loginConsumidor(new LoginRequest("gone@x.c", "senha123")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }
}
