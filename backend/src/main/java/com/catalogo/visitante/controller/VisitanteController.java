package com.catalogo.visitante.controller;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.auth.security.UsuarioPrincipal;
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
    public SessaoResponse abrirSessao(
            @Valid @RequestBody(required = false) AbrirSessaoRequest request,
            Authentication authentication
    ) {
        AbrirSessaoRequest body = request != null
                ? request
                : new AbrirSessaoRequest(null, null, null, null, null);
        Long usuarioId = authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal principal
                ? principal.getId()
                : null;
        return visitanteService.abrirSessao(body, usuarioId);
    }
}
