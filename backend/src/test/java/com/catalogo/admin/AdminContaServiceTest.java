package com.catalogo.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.catalogo.admin.dto.PatchAdminContaRequest;
import com.catalogo.admin.service.AdminContaService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.shared.ApiException;

@ExtendWith(MockitoExtension.class)
class AdminContaServiceTest {

    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    PasswordEncoder passwordEncoder;

    AdminContaService service;

    @BeforeEach
    void setUp() {
        service = new AdminContaService(usuarioRepository, passwordEncoder);
    }

    @Test
    void getReturnsAdmin() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin(1L, "a@x.c")));
        UsuarioResponse r = service.get(1L);
        assertEquals(1L, r.id());
        assertEquals("a@x.c", r.email());
    }

    @Test
    void getNotFound() {
        when(usuarioRepository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(ApiException.class, () -> service.get(9L));
    }

    @Test
    void patchEmailAndTelefone() {
        Usuario u = admin(1L, "old@x.c");
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(usuarioRepository.existsByEmailIgnoreCase("new@x.c")).thenReturn(false);
        when(usuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponse r = service.patch(1L, new PatchAdminContaRequest("new@x.c", "11999999999", null, null));
        assertEquals("new@x.c", r.email());
        assertEquals("11999999999", r.telefone());
    }

    @Test
    void patchEmailConflict() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin(1L, "old@x.c")));
        when(usuarioRepository.existsByEmailIgnoreCase("taken@x.c")).thenReturn(true);
        assertThrows(ApiException.class, () ->
                service.patch(1L, new PatchAdminContaRequest("taken@x.c", null, null, null)));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void patchSenhaRequiresCurrent() {
        Usuario u = admin(1L, "a@x.c");
        u.setSenhaHash("hashed");
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThrows(ApiException.class, () ->
                service.patch(1L, new PatchAdminContaRequest(null, null, "wrong", "novaSenha1")));
    }

    @Test
    void patchSenhaOk() {
        Usuario u = admin(1L, "a@x.c");
        u.setSenhaHash("hashed");
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("atual", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("novaSenha1")).thenReturn("newhash");
        when(usuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.patch(1L, new PatchAdminContaRequest(null, null, "atual", "novaSenha1"));
        assertEquals("newhash", u.getSenhaHash());
    }

    private static Usuario admin(Long id, String email) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setTipo(TipoUsuario.ADMIN);
        u.setEmail(email);
        u.setSenhaHash("x");
        return u;
    }
}
