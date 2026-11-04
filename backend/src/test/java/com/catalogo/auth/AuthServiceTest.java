package com.catalogo.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.dto.LoginRequest;
import com.catalogo.auth.dto.PasswordResetConfirmRequest;
import com.catalogo.auth.dto.PasswordResetRequest;
import com.catalogo.auth.dto.SignupRequest;
import com.catalogo.auth.entity.PasswordResetToken;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.ConsentimentoLgpdRepository;
import com.catalogo.auth.repository.PasswordResetTokenRepository;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.auth.security.JwtService;
import com.catalogo.auth.service.AuthService;
import com.catalogo.shared.ApiException;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    ConsentimentoLgpdRepository consentimentoRepository;
    @Mock
    PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    JwtService jwtService;

    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                usuarioRepository,
                consentimentoRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                jwtService
        );
    }

    @Test
    void signupPfHappy() {
        when(usuarioRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(usuarioRepository.existsByCpf(anyString())).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generate(any())).thenReturn("tok");

        var session = authService.signup(new SignupRequest(
                TipoUsuario.PF, "pf@test.local", "senha123", null, null,
                "52998224725", "Nome", null, null, null,
                true, true, null, null
        ));

        assertEquals("tok", session.token());
        assertEquals("pf@test.local", session.usuario().email());
        verify(consentimentoRepository, org.mockito.Mockito.atLeast(2)).save(any());
    }

    @Test
    void signupRejectsMissingTermos() {
        ApiException ex = assertThrows(ApiException.class, () -> authService.signup(new SignupRequest(
                TipoUsuario.PF, "a@b.c", "senha123", null, null,
                "52998224725", "Nome", null, null, null,
                false, true, null, null
        )));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void signupRejectsInvalidCpf() {
        ApiException ex = assertThrows(ApiException.class, () -> authService.signup(new SignupRequest(
                TipoUsuario.PF, "a@b.c", "senha123", null, null,
                "11111111111", "Nome", null, null, null,
                true, true, null, null
        )));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("CPF inválido", ex.getMessage());
    }

    @Test
    void signupRejectsBlankNome() {
        ApiException ex = assertThrows(ApiException.class, () -> authService.signup(new SignupRequest(
                TipoUsuario.PF, "a@b.c", "senha123", null, null,
                "52998224725", "  ", null, null, null,
                true, true, null, null
        )));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Nome completo é obrigatório", ex.getMessage());
    }

    @Test
    void signupRejectsInvalidTelefone() {
        ApiException ex = assertThrows(ApiException.class, () -> authService.signup(new SignupRequest(
                TipoUsuario.PF, "a@b.c", "senha123", "123", null,
                "52998224725", "Nome", null, null, null,
                true, true, null, null
        )));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Telefone inválido", ex.getMessage());
    }

    @Test
    void signupNormalizesTelefoneWithCountryCode() {
        when(usuarioRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(usuarioRepository.existsByCpf(anyString())).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId(2L);
            return u;
        });
        when(jwtService.generate(any())).thenReturn("tok");

        authService.signup(new SignupRequest(
                TipoUsuario.PF, "pf2@test.local", "senha123", "+55 47 98480-4549", null,
                "52998224725", "Nome Completo", null, null, null,
                true, true, null, null
        ));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertEquals("5547984804549", captor.getValue().getTelefone());
    }

    @Test
    void signupDuplicateEmail() {
        when(usuarioRepository.existsByEmailIgnoreCase(anyString())).thenReturn(true);
        ApiException ex = assertThrows(ApiException.class, () -> authService.signup(new SignupRequest(
                TipoUsuario.PF, "a@b.c", "senha123", null, null,
                "52998224725", "Nome", null, null, null,
                true, true, null, null
        )));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void loginAdminBlockedOnConsumidor() {
        Usuario admin = usuario(TipoUsuario.ADMIN, "admin@x", "senha123");
        when(usuarioRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("admin@x")).thenReturn(Optional.of(admin));

        ApiException ex = assertThrows(ApiException.class,
                () -> authService.loginConsumidor(new LoginRequest("admin@x", "senha123")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void loginPfBlockedOnAdmin() {
        Usuario pf = usuario(TipoUsuario.PF, "pf@x", "senha123");
        when(usuarioRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("pf@x")).thenReturn(Optional.of(pf));

        ApiException ex = assertThrows(ApiException.class,
                () -> authService.loginAdmin(new LoginRequest("pf@x", "senha123")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void wrongPassword() {
        Usuario pf = usuario(TipoUsuario.PF, "pf@x", "senha123");
        when(usuarioRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("pf@x")).thenReturn(Optional.of(pf));

        ApiException ex = assertThrows(ApiException.class,
                () -> authService.loginConsumidor(new LoginRequest("pf@x", "errada")));
        assertEquals("Credenciais inválidas", ex.getMessage());
    }

    @Test
    void passwordResetUnknownEmailStillGeneric() {
        when(usuarioRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(anyString())).thenReturn(Optional.empty());
        var msg = authService.requestPasswordReset(new PasswordResetRequest("no@x"));
        assertTrue(msg.message().contains("Se o e-mail existir"));
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void passwordResetConfirmInvalidToken() {
        when(passwordResetTokenRepository.findByToken("bad")).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class,
                () -> authService.confirmPasswordReset(new PasswordResetConfirmRequest("bad", "nova1234")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void passwordResetConfirmOk() {
        Usuario pf = usuario(TipoUsuario.PF, "pf@x", "senha123");
        PasswordResetToken token = new PasswordResetToken();
        token.setUsuario(pf);
        token.setToken("abc");
        token.setExpiraEm(java.time.OffsetDateTime.now().plusHours(1));
        when(passwordResetTokenRepository.findByToken("abc")).thenReturn(Optional.of(token));

        authService.confirmPasswordReset(new PasswordResetConfirmRequest("abc", "nova1234"));
        assertTrue(passwordEncoder.matches("nova1234", pf.getSenhaHash()));
        ArgumentCaptor<PasswordResetToken> cap = ArgumentCaptor.forClass(PasswordResetToken.class);
        // token entity mutated in place
        assertTrue(token.getUsadoEm() != null);
    }

    private Usuario usuario(TipoUsuario tipo, String email, String rawPassword) {
        Usuario u = new Usuario();
        u.setId(10L);
        u.setTipo(tipo);
        u.setEmail(email);
        u.setSenhaHash(passwordEncoder.encode(rawPassword));
        u.setNomeCompleto("Nome");
        return u;
    }
}
