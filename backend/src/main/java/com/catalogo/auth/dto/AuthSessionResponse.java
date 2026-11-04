package com.catalogo.auth.dto;

public record AuthSessionResponse(String token, UsuarioResponse usuario) {
}
