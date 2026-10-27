package com.catalogo.shared;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

class PageResponseTest {

    @Test
    void fromSpringPage() {
        Page<String> page = new PageImpl<>(List.of("a", "b"), PageRequest.of(1, 10), 42);
        PageResponse<String> response = PageResponse.from(page);

        assertEquals(List.of("a", "b"), response.items());
        assertEquals(1, response.page());
        assertEquals(10, response.limit());
        assertEquals(42, response.total());
    }
}
