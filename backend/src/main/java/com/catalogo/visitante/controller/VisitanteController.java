package com.catalogo.visitante.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.visitante.dto.AbrirSessaoRequest;
import com.catalogo.visitante.dto.SessaoResponse;
import com.catalogo.visitante.service.VisitanteService;

@RestController
@RequestMapping("/api/visitantes")
public class VisitanteController {

    private final VisitanteService visitanteService;

    public VisitanteController(VisitanteService visitanteService) {
        this.visitanteService = visitanteService;
    }

    @PostMapping("/sessao")
    public SessaoResponse abrirSessao(@RequestBody(required = false) AbrirSessaoRequest request) {
        AbrirSessaoRequest body = request != null
                ? request
                : new AbrirSessaoRequest(null, null, null, null, null);
        return visitanteService.abrirSessao(body);
    }
}
