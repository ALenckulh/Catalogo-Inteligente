package com.catalogo.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

/** PATCH parcial: campo nulo = não altera; campo enviado segue as mesmas regras do POST. */
public record PatchProdutoRequest(
        @Pattern(regexp = ".*\\S.*", message = "não pode ficar em branco")
        @Size(max = 200, message = "deve ter no máximo 200 caracteres")
        String nome,
        @Pattern(regexp = ProdutoInput.SLUG, message = ProdutoInput.SLUG_MENSAGEM)
        @Size(max = 220, message = "deve ter no máximo 220 caracteres")
        String slug,
        String descricao,
        @Positive @Digits(integer = 10, fraction = 2, message = ProdutoInput.PRECO_MENSAGEM) BigDecimal preco,
        Long categoriaId,
        Boolean ativo,
        Map<String, Object> fichaTecnica,
        @Valid List<ProdutoInput.ImagemInput> imagens
) {
}
