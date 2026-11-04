package com.catalogo.auth.dto;

import java.time.OffsetDateTime;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;

public record UsuarioResponse(
        Long id,
        TipoUsuario tipo,
        String email,
        String telefone,
        String emailAlternativo,
        String cpf,
        String nomeCompleto,
        Short idade,
        String cnpj,
        String razaoSocial,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(
                u.getId(),
                u.getTipo(),
                u.getEmail(),
                u.getTelefone(),
                u.getEmailAlternativo(),
                u.getCpf(),
                u.getNomeCompleto(),
                u.getIdade(),
                u.getCnpj(),
                u.getRazaoSocial(),
                u.getCreatedAt(),
                u.getUpdatedAt()
        );
    }
}
