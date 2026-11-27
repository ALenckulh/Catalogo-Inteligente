package com.catalogo.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record PatchAdminContaRequest(
        @Email @Size(max = 255, message = "deve ter no máximo 255 caracteres") String email,
        String telefone,
        String senhaAtual,
        String novaSenha
) {
}
