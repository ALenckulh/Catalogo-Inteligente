package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.catalogo.auth.domain.TipoUsuario;

public record AdminLeadItem(
        Long usuarioId,
        String nome,
        TipoUsuario tipo,
        String email,
        String telefone,
        BigDecimal scoreMaxProduto,
        String topCategoria,
        OffsetDateTime ultimaAtividade
) {
}
