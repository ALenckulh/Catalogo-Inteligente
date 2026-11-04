package com.catalogo.admin.dto;

public record PatchAdminContaRequest(
        String email,
        String telefone,
        String senhaAtual,
        String novaSenha
) {
}
