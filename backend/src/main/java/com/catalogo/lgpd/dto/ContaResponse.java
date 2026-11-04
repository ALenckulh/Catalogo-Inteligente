package com.catalogo.lgpd.dto;

import java.util.List;

import com.catalogo.auth.dto.UsuarioResponse;

public record ContaResponse(
        UsuarioResponse usuario,
        List<ConsentimentoResponse> consentimentos
) {
}
