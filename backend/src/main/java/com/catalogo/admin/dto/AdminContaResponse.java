package com.catalogo.admin.dto;

import com.catalogo.auth.dto.UsuarioResponse;

/** @param token só depois de trocar a senha: o token anterior deixou de valer */
public record AdminContaResponse(UsuarioResponse usuario, String token) {
}
