package com.catalogo.admin.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.admin.dto.AdminSolicitacaoLgpdItem;
import com.catalogo.admin.dto.PatchSolicitacaoLgpdRequest;
import com.catalogo.admin.service.AdminSolicitacaoLgpdService;
import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;
import com.catalogo.shared.PageResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/solicitacoes-lgpd")
public class AdminSolicitacaoLgpdController {

    private final AdminSolicitacaoLgpdService service;

    public AdminSolicitacaoLgpdController(AdminSolicitacaoLgpdService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<AdminSolicitacaoLgpdItem> listar(
            @RequestParam(required = false) StatusSolicitacaoLgpd status,
            @RequestParam(required = false) TipoSolicitacaoLgpd tipo,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        return service.listar(status, tipo, page, limit);
    }

    @PatchMapping("/{id}")
    public AdminSolicitacaoLgpdItem patch(
            @PathVariable Long id,
            @Valid @RequestBody PatchSolicitacaoLgpdRequest request
    ) {
        return service.patch(id, request);
    }
}
