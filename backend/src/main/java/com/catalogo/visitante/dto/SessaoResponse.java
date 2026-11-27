package com.catalogo.visitante.dto;

import java.util.UUID;

/** cookieId é null na sessão de usuário logado (ela não tem visitante). */
public record SessaoResponse(UUID cookieId, Long sessaoId) {
}
