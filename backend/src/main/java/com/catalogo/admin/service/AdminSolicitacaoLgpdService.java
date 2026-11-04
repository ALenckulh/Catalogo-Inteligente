package com.catalogo.admin.service;

import java.time.OffsetDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.admin.dto.AdminSolicitacaoLgpdItem;
import com.catalogo.admin.dto.PatchSolicitacaoLgpdRequest;
import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;
import com.catalogo.lgpd.entity.SolicitacaoLgpd;
import com.catalogo.lgpd.repository.SolicitacaoLgpdRepository;
import com.catalogo.lgpd.service.ContaService;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.PageResponse;

@Service
public class AdminSolicitacaoLgpdService {

    private final SolicitacaoLgpdRepository solicitacaoRepository;
    private final ContaService contaService;

    public AdminSolicitacaoLgpdService(SolicitacaoLgpdRepository solicitacaoRepository, ContaService contaService) {
        this.solicitacaoRepository = solicitacaoRepository;
        this.contaService = contaService;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminSolicitacaoLgpdItem> listar(
            StatusSolicitacaoLgpd status,
            TipoSolicitacaoLgpd tipo,
            Integer page,
            Integer limit
    ) {
        int pageIndex = page == null || page < 0 ? 0 : page;
        int size = limit == null || limit < 1 ? 20 : Math.min(limit, 100);
        PageRequest pageable = PageRequest.of(
                pageIndex,
                size,
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "solicitadoEm")
        );
        Page<SolicitacaoLgpd> result = solicitacaoRepository.search(status, tipo, pageable);
        return PageResponse.from(result.map(AdminSolicitacaoLgpdItem::from));
    }

    @Transactional
    public AdminSolicitacaoLgpdItem patch(Long id, PatchSolicitacaoLgpdRequest request) {
        SolicitacaoLgpd s = solicitacaoRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Solicitação não encontrada", HttpStatus.NOT_FOUND));

        StatusSolicitacaoLgpd novo = request.status();
        if (novo == StatusSolicitacaoLgpd.PENDENTE) {
            throw new ApiException("VALIDATION_ERROR", "Status inválido", HttpStatus.BAD_REQUEST);
        }

        s.setStatus(novo);
        if (request.observacoes() != null) {
            s.setObservacoes(request.observacoes());
        }
        if (novo == StatusSolicitacaoLgpd.ATENDIDA || novo == StatusSolicitacaoLgpd.REJEITADA) {
            s.setAtendidoEm(OffsetDateTime.now());
        }

        if (novo == StatusSolicitacaoLgpd.ATENDIDA && s.getTipo() == TipoSolicitacaoLgpd.EXCLUSAO) {
            contaService.anonymizeUsuario(s.getUsuario());
        }

        return AdminSolicitacaoLgpdItem.from(solicitacaoRepository.save(s));
    }
}
