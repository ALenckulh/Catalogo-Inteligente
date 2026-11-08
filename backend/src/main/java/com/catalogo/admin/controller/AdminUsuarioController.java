package com.catalogo.admin.controller;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.admin.domain.NivelInteresse;
import com.catalogo.admin.dto.AdminUsuarioDetalhe;
import com.catalogo.admin.dto.AdminUsuarioListItem;
import com.catalogo.admin.dto.CompraResponse;
import com.catalogo.admin.dto.RegistrarCompraRequest;
import com.catalogo.admin.service.AdminUsuarioService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.PageResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/usuarios")
public class AdminUsuarioController {

    private final AdminUsuarioService usuarioService;

    public AdminUsuarioController(AdminUsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public PageResponse<AdminUsuarioListItem> listar(
            @RequestParam(required = false) TipoUsuario tipo,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) BigDecimal scoreMin,
            @RequestParam(required = false) NivelInteresse nivel,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        return usuarioService.listar(tipo, categoria, scoreMin, nivel, q, page, limit);
    }

    @GetMapping("/{id}")
    public AdminUsuarioDetalhe detalhe(@PathVariable Long id) {
        return usuarioService.detalhe(id);
    }

    @PostMapping("/{id}/compras")
    @ResponseStatus(HttpStatus.CREATED)
    public CompraResponse compra(
            @PathVariable Long id,
            @Valid @RequestBody RegistrarCompraRequest request,
            Authentication authentication
    ) {
        return usuarioService.registrarCompra(id, requireAdmin(authentication), request);
    }

    private static Long requireAdmin(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof UsuarioPrincipal p)
                || p.getTipo() != TipoUsuario.ADMIN) {
            throw new ApiException("FORBIDDEN", "Admin obrigatório", HttpStatus.FORBIDDEN);
        }
        return p.getId();
    }
}
