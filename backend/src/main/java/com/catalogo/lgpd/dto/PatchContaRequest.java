package com.catalogo.lgpd.dto;

public record PatchContaRequest(
        String telefone,
        String emailAlternativo,
        String nomeCompleto,
        Short idade,
        String senhaAtual,
        String novaSenha
) {
}
