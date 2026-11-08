package com.catalogo.admin.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.admin.dto.DecayPatchRequest;
import com.catalogo.admin.dto.ParametroDecayResponse;
import com.catalogo.admin.dto.PesoMetricaResponse;
import com.catalogo.admin.dto.PesosPatchRequest;
import com.catalogo.admin.dto.SimulacaoRequest;
import com.catalogo.admin.dto.SimulacaoResponse;
import com.catalogo.admin.service.AdminConfigService;
import com.catalogo.admin.service.AdminScoringService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.shared.ApiException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/configuracao")
public class AdminConfigController {

    private final AdminConfigService configService;
    private final AdminScoringService scoringService;

    public AdminConfigController(AdminConfigService configService, AdminScoringService scoringService) {
        this.configService = configService;
        this.scoringService = scoringService;
    }

    /** Simula parâmetros propostos com os dados reais, sem gravar (impacto + precisão em backtest). */
    @PostMapping("/simular")
    public SimulacaoResponse simular(@Valid @RequestBody SimulacaoRequest request) {
        return scoringService.simular(request);
    }

    /** Recalcula e grava as notas de todos com os parâmetros salvos. */
    @PostMapping("/recalcular")
    public RecalculoResponse recalcular(Authentication authentication) {
        requireAdmin(authentication);
        return new RecalculoResponse(scoringService.recalcularTodos());
    }

    public record RecalculoResponse(int recalculados) {
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

    /** Remove o ajuste da categoria (a linha global não tem rota de remoção). */
    @DeleteMapping("/decay/{categoriaId}")
    public List<ParametroDecayResponse> removerDecay(Authentication authentication, @PathVariable Long categoriaId) {
        requireAdmin(authentication);
        return configService.removerDecay(categoriaId);
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
