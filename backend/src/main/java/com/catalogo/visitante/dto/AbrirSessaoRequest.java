package com.catalogo.visitante.dto;

import jakarta.validation.constraints.Size;
import java.util.UUID;

public record AbrirSessaoRequest(
        UUID cookieId,
        @Size(max = 50, message = "deve ter no máximo 50 caracteres") String dispositivo,
        String userAgent,
        @Size(max = 100, message = "deve ter no máximo 100 caracteres") String canalOrigem,
        /** Aceite de cookies comportamentais do visitante; para quem está logado vale o da conta. */
        Boolean aceiteCookies
) {
}
