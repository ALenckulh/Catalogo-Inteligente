package com.catalogo.admin.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.admin.dto.DecayPatchRequest;
import com.catalogo.admin.dto.ParametroDecayResponse;
import com.catalogo.admin.dto.PesoMetricaResponse;
import com.catalogo.admin.dto.PesosPatchRequest;
import com.catalogo.admin.service.AdminConfigService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.shared.ApiException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/configuracao")
public class AdminConfigController {

    private final AdminConfigService configService;

    public AdminConfigController(AdminConfigService configService) {
        this.configService = configService;
    }

    @GetMapping("/pesos")
    public List<PesoMetricaResponse> pesos() {
        return configService.listPesos();
    }

    @PatchMapping("/pesos")
    public List<PesoMetricaResponse> patchPesos(
            Authentication authentication,
            @Valid @RequestBody PesosPatchRequest request
    ) {
        return configService.patchPesos(requireAdmin(authentication), request);
    }

    @GetMapping("/decay")
    public List<ParametroDecayResponse> decay() {
        return configService.listDecay();
    }

    @PatchMapping("/decay")
    public List<ParametroDecayResponse> patchDecay(
            Authentication authentication,
            @Valid @RequestBody DecayPatchRequest request
    ) {
        return configService.patchDecay(requireAdmin(authentication), request);
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
