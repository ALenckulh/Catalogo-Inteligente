package com.catalogo.catalog;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.catalogo.catalog.controller.CategoriaController;
import com.catalogo.catalog.controller.ProdutoController;
import com.catalogo.catalog.dto.CategoriaResponse;
import com.catalogo.catalog.dto.ProdutoResponse;
import com.catalogo.catalog.entity.ImagemArquivo;
import com.catalogo.catalog.service.CatalogService;
import com.catalogo.catalog.service.ImagemArquivoService;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.GlobalExceptionHandler;
import com.catalogo.shared.PageResponse;
import com.catalogo.visitante.repository.VisitanteRepository;

@ExtendWith(MockitoExtension.class)
class CatalogControllerTest {

    @Mock
    CatalogService catalogService;
    @Mock
    VisitanteRepository visitanteRepository;
    @Mock
    ImagemArquivoService imagemArquivoService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(
                        new ProdutoController(catalogService, visitanteRepository, imagemArquivoService),
                        new CategoriaController(catalogService)
                )
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void listProdutosReturnsPage() throws Exception {
        when(catalogService.listProdutos(any(), any(), any(), any(), any(), any(), any(), isNull(), isNull()))
                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0));
        mockMvc.perform(get("/api/produtos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void produtoSlugNotFound() throws Exception {
        when(catalogService.getBySlug("x"))
                .thenThrow(new ApiException("NOT_FOUND", "Produto não encontrado", HttpStatus.NOT_FOUND));
        mockMvc.perform(get("/api/produtos/x"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void produtoDetalheCamelCase() throws Exception {
        when(catalogService.getBySlug("slug")).thenReturn(new ProdutoResponse(
                1L, "N", "slug", "d", java.util.Map.of("volts", "220"),
                BigDecimal.TEN, 2L, new CategoriaResponse(2L, "C", "c", 1L, null),
                true, List.of(), null, null
        ));
        mockMvc.perform(get("/api/produtos/slug").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fichaTecnica.volts").value("220"))
                .andExpect(jsonPath("$.categoriaId").value(2));
    }

    @Test
    void imagemServeBytesComCacheImutavel() throws Exception {
        ImagemArquivo img = new ImagemArquivo();
        img.setContentType("image/webp");
        img.setConteudo(new byte[] {1, 2, 3});
        when(imagemArquivoService.buscar(5L)).thenReturn(img);
        mockMvc.perform(get("/api/produtos/imagens/5"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/webp"))
                .andExpect(header().string("Cache-Control", "max-age=31536000, public, immutable"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(content().bytes(new byte[] {1, 2, 3}));
    }

    @Test
    void listCategorias() throws Exception {
        when(catalogService.listCategorias()).thenReturn(List.of(
                new CategoriaResponse(1L, "Root", "root", null, null)
        ));
        mockMvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("root"));
    }
}
