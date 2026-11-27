package com.catalogo.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ProdutoInput(
        @NotBlank @Size(max = 200, message = "deve ter no máximo 200 caracteres") String nome,
        @NotBlank
        @Size(max = 220, message = "deve ter no máximo 220 caracteres")
        @Pattern(regexp = SLUG, message = SLUG_MENSAGEM)
        String slug,
        String descricao,
        @NotNull @Positive @Digits(integer = 10, fraction = 2, message = PRECO_MENSAGEM) BigDecimal preco,
        @NotNull Long categoriaId,
        @NotNull Boolean ativo,
        Map<String, Object> fichaTecnica,
        @Valid List<ImagemInput> imagens
) {
    /** Vira /produtos/{slug}: barra, espaço ou ".." deixariam a ficha inacessível e "imagens" é rota da API. */
    static final String SLUG = "(?!imagens$)[a-z0-9]+(-[a-z0-9]+)*";
    static final String SLUG_MENSAGEM = "use só letras minúsculas sem acento, números e hífen";
    static final String PRECO_MENSAGEM = "deve ter no máximo 10 dígitos e 2 casas decimais";

    public record ImagemInput(
            @Size(max = 500, message = "deve ter no máximo 500 caracteres") String url,
            @Size(max = 200, message = "deve ter no máximo 200 caracteres") String altText,
            Short ordem
    ) {
    }
}
