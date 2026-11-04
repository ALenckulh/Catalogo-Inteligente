package com.catalogo.lgpd.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.auth.dto.MessageResponse;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.lgpd.dto.ConsentimentoResponse;
import com.catalogo.lgpd.dto.ConsentimentosBatchRequest;
import com.catalogo.lgpd.dto.ContaResponse;
import com.catalogo.lgpd.dto.ExportacaoResponse;
import com.catalogo.lgpd.dto.PatchContaRequest;
import com.catalogo.lgpd.dto.SolicitacaoLgpdRequest;
import com.catalogo.lgpd.dto.SolicitacaoLgpdResponse;
import com.catalogo.lgpd.service.ContaService;
import com.catalogo.shared.ApiException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/conta")
public class ContaController {

    private final ContaService contaService;

    public ContaController(ContaService contaService) {
        this.contaService = contaService;
    }

    @GetMapping
    public ContaResponse get(Authentication authentication) {
        return contaService.getConta(requireUserId(authentication));
    }

    @PatchMapping
    public ContaResponse patch(Authentication authentication, @RequestBody PatchContaRequest request) {
        return contaService.patchConta(requireUserId(authentication), request);
    }

    @PostMapping("/consentimentos")
    public List<ConsentimentoResponse> consentimentos(
            Authentication authentication,
            @Valid @RequestBody ConsentimentosBatchRequest request
    ) {
        return contaService.salvarConsentimentos(requireUserId(authentication), request);
    }

    @GetMapping("/exportar")
    public ResponseEntity<?> exportar(
            Authentication authentication,
            @RequestParam(defaultValue = "json") String formato
    ) {
        Long usuarioId = requireUserId(authentication);
        if ("csv".equalsIgnoreCase(formato)) {
            String csv = contaService.exportarCsv(usuarioId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"exportacao-lgpd.csv\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csv);
        }
        if (!"json".equalsIgnoreCase(formato)) {
            throw new ApiException("VALIDATION_ERROR", "formato deve ser json ou csv", HttpStatus.BAD_REQUEST);
        }
        ExportacaoResponse body = contaService.exportar(usuarioId);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/solicitacoes-lgpd")
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitacaoLgpdResponse solicitar(
            Authentication authentication,
            @Valid @RequestBody SolicitacaoLgpdRequest request
    ) {
        return contaService.criarSolicitacao(requireUserId(authentication), request);
    }

    @DeleteMapping
    public MessageResponse excluir(Authentication authentication) {
        return contaService.excluirConta(requireUserId(authentication));
    }

    private static Long requireUserId(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UsuarioPrincipal principal)) {
            throw new ApiException("UNAUTHORIZED", "Não autenticado", HttpStatus.UNAUTHORIZED);
        }
        return principal.getId();
    }
}
