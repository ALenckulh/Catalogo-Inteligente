package com.catalogo.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.catalogo.admin.dto.PatchProdutoRequest;
import com.catalogo.admin.dto.ProdutoInput;
import com.catalogo.admin.service.AdminProdutoService;
import com.catalogo.catalog.dto.ImagemUploadResponse;
import com.catalogo.catalog.dto.ProdutoResponse;
import com.catalogo.catalog.service.ImagemArquivoService;
import com.catalogo.shared.PageResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/produtos")
public class AdminProdutoController {

    private final AdminProdutoService produtoService;
    private final ImagemArquivoService imagemArquivoService;

    public AdminProdutoController(AdminProdutoService produtoService, ImagemArquivoService imagemArquivoService) {
        this.produtoService = produtoService;
        this.imagemArquivoService = imagemArquivoService;
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

    @PostMapping(path = "/imagens", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ImagemUploadResponse uploadImagem(@RequestPart("arquivo") MultipartFile arquivo) {
        return imagemArquivoService.salvar(arquivo);
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
