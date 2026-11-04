package com.catalogo.visitante.dto;

import java.util.UUID;

public record AbrirSessaoRequest(
        UUID cookieId,
        String fingerprint,
        String dispositivo,
        String userAgent,
        String canalOrigem
) {
}
