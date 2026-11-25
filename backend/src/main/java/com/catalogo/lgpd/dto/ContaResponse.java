package com.catalogo.lgpd.dto;

import java.util.List;

import com.catalogo.auth.dto.UsuarioResponse;

public record ContaResponse(
        UsuarioResponse usuario,
        List<ConsentimentoResponse> consentimentos,
        /** Só depois de trocar a senha: o token anterior deixou de valer. */
        String token
) {
}
