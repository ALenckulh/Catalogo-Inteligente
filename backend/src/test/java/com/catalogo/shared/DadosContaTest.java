package com.catalogo.shared;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

class DadosContaTest {

    @Test
    void aceita() {
        assertEquals("Ana", DadosConta.nomeCompleto(" Ana "));
        assertEquals("AB", DadosConta.razaoSocial(" AB "));
        assertNull(DadosConta.idade(null));
        assertEquals((short) 18, DadosConta.idade((short) 18));
        assertEquals((short) 120, DadosConta.idade((short) 120));
        assertEquals("47999990000", DadosConta.telefone("(47) 99999-0000"));
        assertEquals("5547999990000", DadosConta.telefone("+55 47 99999-0000"));
        assertNull(DadosConta.telefone("  "));
        assertEquals("a@b.co", DadosConta.emailAlternativo(" A@B.co "));
        assertNull(DadosConta.emailAlternativo(""));
        assertEquals("a".repeat(72), DadosConta.senha("a".repeat(72)));
        assertEquals("123456", DadosConta.senha("123456"));
    }

    @Test
    void recusa() {
        for (Executable e : new Executable[] {
                () -> DadosConta.nomeCompleto(null), () -> DadosConta.nomeCompleto("   "), () -> DadosConta.nomeCompleto("Jo"),
                () -> DadosConta.nomeCompleto("x".repeat(256)),
                () -> DadosConta.razaoSocial("a"), () -> DadosConta.razaoSocial("x".repeat(256)),
                () -> DadosConta.idade((short) -5), () -> DadosConta.idade((short) 17), () -> DadosConta.idade((short) 121),
                () -> DadosConta.telefone("abc"), () -> DadosConta.telefone("123"), () -> DadosConta.telefone("99".repeat(6)),
                () -> DadosConta.emailAlternativo("x"), () -> DadosConta.emailAlternativo("a@b"),
                () -> DadosConta.emailAlternativo("x".repeat(255) + "@b.co"),
                () -> DadosConta.senha(null), () -> DadosConta.senha("12345"), () -> DadosConta.senha("a".repeat(73)),
                () -> DadosConta.senha("é".repeat(37)), // 74 bytes
        }) {
            assertEquals("VALIDATION_ERROR", assertThrows(ApiException.class, e).getCode());
        }
    }
}
