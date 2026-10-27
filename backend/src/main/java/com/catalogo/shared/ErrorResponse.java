package com.catalogo.shared;

/**
 * Corpo de erro HTTP alinhado a {@code frontend/docs/11-API-ENDPOINTS.md}.
 */
public record ErrorResponse(String code, String message) {
}
