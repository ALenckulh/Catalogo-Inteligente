package com.catalogo.shared;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Regra comum das buscas: cada palavra precisa aparecer, em qualquer ordem, sem diferenciar maiúsculas.
 * O acento é ignorado no banco (unaccent dos dois lados). %, _ e \ digitados são texto comum.
 */
public final class BuscaTexto {

    /** Caractere de escape a informar no LIKE. */
    public static final char ESCAPE = '\\';

    private static final int MAX_PALAVRAS = 10;
    private static final int MIN_DIGITOS = 3;

    private BuscaTexto() {
    }

    /** Um padrão de LIKE por palavra; vazio = sem filtro. */
    public static List<String> padroes(String q) {
        if (q == null) {
            return List.of();
        }
        return Arrays.stream(q.toLowerCase(Locale.ROOT).split("[\\s\\p{Cntrl}]+"))
                .filter(p -> !p.isEmpty())
                .distinct()
                .limit(MAX_PALAVRAS)
                .map(p -> "%" + p.replaceAll("[\\\\%_]", "\\\\$0") + "%")
                .toList();
    }

    /** Dígitos de uma busca por documento ou telefone ("23.456.789/0001-10"); null se não for uma. */
    public static String digitos(String q) {
        if (q == null || !q.matches("[\\d\\s().+/-]+")) {
            return null;
        }
        String d = Documentos.onlyDigits(q);
        return d.length() >= MIN_DIGITOS ? d : null;
    }
}
