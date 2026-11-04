package com.catalogo.admin.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.admin.dto.PatchAdminContaRequest;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.shared.ApiException;

@Service
public class AdminContaService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminContaService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UsuarioResponse get(Long adminId) {
        return UsuarioResponse.from(requireAdmin(adminId));
    }

    @Transactional
    public UsuarioResponse patch(Long adminId, PatchAdminContaRequest request) {
        Usuario u = requireAdmin(adminId);
        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (!email.equalsIgnoreCase(u.getEmail()) && usuarioRepository.existsByEmailIgnoreCase(email)) {
                throw new ApiException("EMAIL_EXISTS", "E-mail já cadastrado", HttpStatus.CONFLICT);
            }
            u.setEmail(email);
        }
        if (request.telefone() != null) {
            u.setTelefone(request.telefone());
        }
        if (request.novaSenha() != null && !request.novaSenha().isBlank()) {
            if (request.senhaAtual() == null || !passwordEncoder.matches(request.senhaAtual(), u.getSenhaHash())) {
                throw new ApiException("UNAUTHORIZED", "Senha atual inválida", HttpStatus.UNAUTHORIZED);
            }
            u.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        }
        return UsuarioResponse.from(usuarioRepository.save(u));
    }

    private Usuario requireAdmin(Long id) {
        return usuarioRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Admin não encontrado", HttpStatus.NOT_FOUND));
    }
}
