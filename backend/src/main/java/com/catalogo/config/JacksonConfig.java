package com.catalogo.config;

import org.springframework.context.annotation.Configuration;

/**
 * JSON wire em camelCase (default Jackson). Sem PropertyNamingStrategies.SNAKE_CASE.
 * Colunas DB permanecem snake_case — mapeamento via JPA / MapStruct.
 *
 * @see <a href="../../../../../../frontend/docs/11-API-ENDPOINTS.md">11-API-ENDPOINTS.md §1</a>
 */
@Configuration
public class JacksonConfig {
}
