package com.catalogo.shared;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;
import java.util.stream.IntStream;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

class BuscaTextoTest {

    @Test
    void umPadraoPorPalavraEmMinusculasSemRepetir() {
        assertEquals(List.of("%vw%", "%motor%"), BuscaTexto.padroes("  VW\tmotor  vw "));
        assertEquals(List.of("%pistão%"), BuscaTexto.padroes("PISTÃO"));
        assertEquals(List.of("%a%", "%b%"), BuscaTexto.padroes("a\0b"));
    }

    @Test
    void semTextoNaoFiltra() {
        assertEquals(List.of(), BuscaTexto.padroes(null));
        assertEquals(List.of(), BuscaTexto.padroes(" \t \0 "));
    }

    @Test
    void curingaDigitadoETextoComum() {
        assertEquals(List.of("%100\\%%"), BuscaTexto.padroes("100%"));
        assertEquals(List.of("%a\\_b%", "%c\\\\d%"), BuscaTexto.padroes("a_b c\\d"));
    }

    @Test
    void noMaximoDezPalavras() {
        String q = IntStream.range(0, 50).mapToObj(i -> "p" + i).collect(Collectors.joining(" "));
        assertEquals(10, BuscaTexto.padroes(q).size());
    }

    @ParameterizedTest
    @CsvSource({"23.456.789/0001-10,23456789000110", "423.567.890-12,42356789012", "(47) 98812-3402,47988123402",
            "+55 47 98812-3402,5547988123402", "479,479"})
    void buscaSoDeNumerosEhDocumentoOuTelefone(String q, String digitos) {
        assertEquals(digitos, BuscaTexto.digitos(q));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ana123", "12", "12 de maio", "motor 1.6 8v", "", "-", "()"})
    void outrosTextosNaoSao(String q) {
        assertNull(BuscaTexto.digitos(q));
    }
}
