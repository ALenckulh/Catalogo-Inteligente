package com.catalogo.lgpd.dto;

import java.util.List;

import com.catalogo.auth.dto.UsuarioResponse;

public record ExportacaoResponse(
        UsuarioResponse usuario,
        List<ConsentimentoResponse> consentimentos,
        List<Long> favoritosProdutoIds,
        List<ExportEventoItem> eventos
) {
}
