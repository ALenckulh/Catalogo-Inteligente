package com.catalogo.visitante.dto;

import java.util.UUID;

public record SessaoResponse(UUID cookieId, Long sessaoId) {
}
