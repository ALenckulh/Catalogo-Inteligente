package com.catalogo.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.admin.dto.PatchProdutoRequest;
import com.catalogo.admin.dto.ProdutoInput;
import com.catalogo.admin.service.AdminProdutoService;
import com.catalogo.catalog.dto.ProdutoResponse;
import com.catalogo.shared.PageResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/produtos")
public class AdminProdutoController {

    private final AdminProdutoService produtoService;

    public AdminProdutoController(AdminProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @GetMapping
    public PageResponse<ProdutoResponse> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        return produtoService.listar(q, ativo, page, limit);
    }

    @GetMapping("/{id}")
    public ProdutoResponse get(@PathVariable Long id) {
        return produtoService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoResponse criar(@Valid @RequestBody ProdutoInput input) {
        return produtoService.criar(input);
    }

    @PatchMapping("/{id}")
    public ProdutoResponse patch(@PathVariable Long id, @RequestBody PatchProdutoRequest input) {
        return produtoService.patch(id, input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        produtoService.deletar(id);
    }
}
