package com.catalogo.auth.dto;

import com.catalogo.auth.domain.TipoUsuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotNull TipoUsuario tipo,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 100) String senha,
        String telefone,
        String emailAlternativo,
        String cpf,
        String nomeCompleto,
        Short idade,
        String cnpj,
        String razaoSocial,
        @NotNull Boolean aceitaTermos,
        @NotNull Boolean aceitaPrivacidade,
        Boolean cookiesComportamentais,
        Boolean contatoProativo
) {
}
