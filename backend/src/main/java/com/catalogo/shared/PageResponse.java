package com.catalogo.shared;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * Envelope de lista paginada alinhado a {@code frontend/docs/11-API-ENDPOINTS.md}.
 */
public record PageResponse<T>(
        List<T> items,
        int page,
        int limit,
        long total
) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements()
        );
    }
}
