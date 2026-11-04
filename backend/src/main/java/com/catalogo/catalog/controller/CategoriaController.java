package com.catalogo.catalog.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.catalog.dto.CategoriaResponse;
import com.catalogo.catalog.service.CatalogService;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private final CatalogService catalogService;

    public CategoriaController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public List<CategoriaResponse> list() {
        return catalogService.listCategorias();
    }
}
