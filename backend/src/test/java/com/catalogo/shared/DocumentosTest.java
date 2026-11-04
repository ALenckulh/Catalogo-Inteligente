package com.catalogo.shared;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class DocumentosTest {

    @Test
    void validCpfCnpj() {
        assertTrue(Documentos.isValidCpf("52998224725"));
        assertTrue(Documentos.isValidCnpj("11222333000181"));
        assertFalse(Documentos.isValidCpf("11111111111"));
        assertFalse(Documentos.isValidCnpj("00000000000000"));
    }
}
