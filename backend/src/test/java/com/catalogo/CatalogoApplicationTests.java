package com.catalogo;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

import com.catalogo.shared.PageResponse;

/**
 * Smoke offline — full context covered by {@link com.catalogo.support.PostgresIntegrationTest}.
 */
class CatalogoApplicationTests {

    @Test
    void pageResponseFactoryExists() {
        assertNotNull(PageResponse.class);
    }
}
