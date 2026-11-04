package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;

public record AdminUsuarioListItem(
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
        OffsetDateTime updatedAt,
        BigDecimal scoreMaxProduto,
        String topCategoria,
        OffsetDateTime ultimaAtividade,
        boolean ativo
) {
    public static AdminUsuarioListItem from(
            Usuario u,
            BigDecimal scoreMax,
            String topCategoria,
            OffsetDateTime ultimaAtividade
    ) {
        return new AdminUsuarioListItem(
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
                u.getUpdatedAt(),
                scoreMax,
                topCategoria,
                ultimaAtividade,
                u.getDeletedAt() == null
        );
    }
}
