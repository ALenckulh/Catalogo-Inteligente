package com.catalogo.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.admin.dto.PatchAdminContaRequest;
import com.catalogo.admin.service.AdminContaService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.shared.ApiException;

@RestController
@RequestMapping("/api/admin/conta")
public class AdminContaController {

    private final AdminContaService contaService;

    public AdminContaController(AdminContaService contaService) {
        this.contaService = contaService;
    }

    @GetMapping
    public UsuarioResponse get(Authentication authentication) {
        return contaService.get(requireAdmin(authentication));
    }

    @PatchMapping
    public UsuarioResponse patch(Authentication authentication, @RequestBody PatchAdminContaRequest request) {
        return contaService.patch(requireAdmin(authentication), request);
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
