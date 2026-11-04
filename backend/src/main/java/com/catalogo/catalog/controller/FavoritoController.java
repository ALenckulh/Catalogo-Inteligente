package com.catalogo.catalog.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.catalog.dto.FavoritoResponse;
import com.catalogo.catalog.service.FavoritoService;
import com.catalogo.shared.ApiException;

@RestController
@RequestMapping("/api/favoritos")
public class FavoritoController {

    private final FavoritoService favoritoService;

    public FavoritoController(FavoritoService favoritoService) {
        this.favoritoService = favoritoService;
    }

    @GetMapping
    public List<FavoritoResponse> listar(Authentication authentication) {
        return favoritoService.listar(requireUser(authentication));
    }

    @PostMapping("/{produtoId}")
    @ResponseStatus(HttpStatus.OK)
    public void favoritar(Authentication authentication, @PathVariable Long produtoId) {
        favoritoService.favoritar(requireUser(authentication), produtoId);
    }

    @DeleteMapping("/{produtoId}")
    @ResponseStatus(HttpStatus.OK)
    public void desfavoritar(Authentication authentication, @PathVariable Long produtoId) {
        favoritoService.desfavoritar(requireUser(authentication), produtoId);
    }

    private static Long requireUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UsuarioPrincipal principal)) {
            throw new ApiException("UNAUTHORIZED", "Não autenticado", HttpStatus.UNAUTHORIZED);
        }
        return principal.getId();
    }
}
