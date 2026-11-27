package com.catalogo.admin.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;

/**
 * Sem contatoVisivel, e-mail, telefone, documento e idade vêm nulos. Sem interesseVisivel, nota, categoria, última
 * atividade e próxima compra já chegam nulas da consulta.
 */
public record AdminUsuarioListItem(
        Long id,
        TipoUsuario tipo,
        String email,
        String telefone,
        String emailAlternativo,
        String cpf,
        String nomeCompleto,
        Short idade,
        String cnpj,
        String razaoSocial,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        BigDecimal scoreMaxProduto,
        String topCategoria,
        OffsetDateTime ultimaAtividade,
        String proximaCompra,
        boolean ativo,
        boolean contatoVisivel,
        boolean interesseVisivel
) {
    public static AdminUsuarioListItem from(
            Usuario u,
            BigDecimal scoreMax,
            String topCategoria,
            OffsetDateTime ultimaAtividade,
            String proximaCompra,
            boolean contatoVisivel,
            boolean interesseVisivel
    ) {
        return new AdminUsuarioListItem(
                u.getId(),
                u.getTipo(),
                contatoVisivel ? u.getEmail() : null,
                contatoVisivel ? u.getTelefone() : null,
                contatoVisivel ? u.getEmailAlternativo() : null,
                contatoVisivel ? u.getCpf() : null,
                u.getNomeCompleto(),
                contatoVisivel ? u.getIdade() : null,
                contatoVisivel ? u.getCnpj() : null,
                u.getRazaoSocial(),
                u.getCreatedAt(),
                u.getUpdatedAt(),
                scoreMax,
                topCategoria,
                ultimaAtividade,
                proximaCompra,
                u.getDeletedAt() == null,
                contatoVisivel,
                interesseVisivel
        );
    }
}
