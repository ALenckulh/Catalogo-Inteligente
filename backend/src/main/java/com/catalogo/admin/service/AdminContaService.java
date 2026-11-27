package com.catalogo.admin.service;

import com.catalogo.admin.dto.AdminContaResponse;
import com.catalogo.auth.security.JwtService;
import com.catalogo.shared.DadosConta;
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
    private final JwtService jwtService;

    public AdminContaService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public UsuarioResponse get(Long adminId) {
        return UsuarioResponse.from(requireAdmin(adminId));
    }

    @Transactional
    public AdminContaResponse patch(Long adminId, PatchAdminContaRequest request) {
        Usuario u = requireAdmin(adminId);
        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim().toLowerCase();
            if (!email.equalsIgnoreCase(u.getEmail()) && usuarioRepository.existsByEmailIgnoreCase(email)) {
                throw new ApiException("EMAIL_EXISTS", "E-mail já cadastrado", HttpStatus.CONFLICT);
            }
            u.setEmail(email);
        }
        // null = não altera; string vazia = limpa o telefone.
        if (request.telefone() != null) {
            u.setTelefone(DadosConta.telefone(request.telefone()));
        }
        boolean trocaSenha = request.novaSenha() != null && !request.novaSenha().isBlank();
        if (trocaSenha) {
            // 400, não 401: o front trata 401 como sessão expirada e deslogaria o admin.
            if (request.senhaAtual() == null || !passwordEncoder.matches(request.senhaAtual(), u.getSenhaHash())) {
                throw new ApiException("INVALID_PASSWORD", "Senha atual inválida", HttpStatus.BAD_REQUEST);
            }
            u.trocarSenha(passwordEncoder.encode(DadosConta.senha(request.novaSenha())));
        }
        u = usuarioRepository.save(u);
        return new AdminContaResponse(UsuarioResponse.from(u), trocaSenha ? jwtService.generate(u) : null);
    }

    private Usuario requireAdmin(Long id) {
        return usuarioRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Admin não encontrado", HttpStatus.NOT_FOUND));
    }
}
