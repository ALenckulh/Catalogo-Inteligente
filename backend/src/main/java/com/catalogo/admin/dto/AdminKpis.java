package com.catalogo.admin.dto;

public record AdminKpis(
        long usuariosAtivos,
        long produtosAtivos,
        long contatos7d,
        long leadsScoreAlto
) {
}
