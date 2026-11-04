package com.catalogo.catalog.controller;

import java.math.BigDecimal;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.catalog.dto.ProdutoResponse;
import com.catalogo.catalog.service.CatalogService;
import com.catalogo.eventos.service.EventoService;
import com.catalogo.shared.PageResponse;
import com.catalogo.visitante.repository.VisitanteRepository;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    private final CatalogService catalogService;
    private final VisitanteRepository visitanteRepository;

    public ProdutoController(CatalogService catalogService, VisitanteRepository visitanteRepository) {
        this.catalogService = catalogService;
        this.visitanteRepository = visitanteRepository;
    }

    @GetMapping
    public PageResponse<ProdutoResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoria,
            @RequestParam(required = false) BigDecimal precoMin,
            @RequestParam(required = false) BigDecimal precoMax,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Boolean destaque,
            Authentication authentication,
            @RequestHeader(value = EventoService.HEADER_COOKIE, required = false) String cookieId
    ) {
        Long usuarioId = null;
        Long visitanteId = null;
        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof UsuarioPrincipal principal) {
            usuarioId = principal.getId();
        } else if (cookieId != null && !cookieId.isBlank()) {
            try {
                visitanteId = visitanteRepository.findByCookieId(java.util.UUID.fromString(cookieId.trim()))
                        .map(v -> v.getId())
                        .orElse(null);
            } catch (IllegalArgumentException ignored) {
                // invalid cookie — rank as anonymous
            }
        }
        return catalogService.listProdutos(
                q, categoria, precoMin, precoMax, page, limit, destaque, usuarioId, visitanteId
        );
    }

    @GetMapping("/{slug}")
    public ProdutoResponse bySlug(@PathVariable String slug) {
        return catalogService.getBySlug(slug);
    }
}
