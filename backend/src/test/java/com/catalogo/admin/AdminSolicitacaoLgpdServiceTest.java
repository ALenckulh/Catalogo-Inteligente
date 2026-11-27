package com.catalogo.admin;

import static org.mockito.Mockito.never;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.admin.dto.PatchSolicitacaoLgpdRequest;
import com.catalogo.admin.service.AdminSolicitacaoLgpdService;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;
import com.catalogo.lgpd.entity.SolicitacaoLgpd;
import com.catalogo.lgpd.repository.SolicitacaoLgpdRepository;
import com.catalogo.lgpd.service.ContaService;

@ExtendWith(MockitoExtension.class)
class AdminSolicitacaoLgpdServiceTest {

    @Mock
    SolicitacaoLgpdRepository solicitacaoRepository;
    @Mock
    ContaService contaService;

    AdminSolicitacaoLgpdService service;

    @BeforeEach
    void setUp() {
        service = new AdminSolicitacaoLgpdService(solicitacaoRepository, contaService);
    }

    @Test
    void exclusaoAtendidaAnonymizes() {
        Usuario u = new Usuario();
        u.setId(3L);
        u.setTipo(TipoUsuario.PF);
        u.setEmail("a@b.c");
        SolicitacaoLgpd s = new SolicitacaoLgpd();
        s.setId(1L);
        s.setUsuario(u);
        s.setTipo(TipoSolicitacaoLgpd.EXCLUSAO);
        s.setStatus(StatusSolicitacaoLgpd.PENDENTE);
        when(solicitacaoRepository.findById(1L)).thenReturn(Optional.of(s));
        when(solicitacaoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.patch(1L, new PatchSolicitacaoLgpdRequest(StatusSolicitacaoLgpd.ATENDIDA, "ok"));

        verify(contaService).anonymizeUsuario(u);
    }

    @Test
    void reabrirLimpaADataERevogacaoAtendidaRevogaUmaVez() {
        Usuario u = new Usuario();
        u.setId(3L);
        u.setTipo(TipoUsuario.PF);
        u.setEmail("a@b.c");
        SolicitacaoLgpd s = new SolicitacaoLgpd();
        s.setId(1L);
        s.setUsuario(u);
        s.setTipo(TipoSolicitacaoLgpd.REVOGACAO_CONSENTIMENTO);
        s.setStatus(StatusSolicitacaoLgpd.PENDENTE);
        when(solicitacaoRepository.findById(1L)).thenReturn(Optional.of(s));
        when(solicitacaoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.patch(1L, new PatchSolicitacaoLgpdRequest(StatusSolicitacaoLgpd.EM_PROCESSAMENTO, null));
        assertNull(s.getAtendidoEm());
        verify(contaService, never()).revogarConsentimentos(any());

        service.patch(1L, new PatchSolicitacaoLgpdRequest(StatusSolicitacaoLgpd.ATENDIDA, null));
        var atendidoEm = s.getAtendidoEm();
        service.patch(1L, new PatchSolicitacaoLgpdRequest(StatusSolicitacaoLgpd.ATENDIDA, "nota"));
        assertEquals(atendidoEm, s.getAtendidoEm());
        verify(contaService).revogarConsentimentos(u);

        service.patch(1L, new PatchSolicitacaoLgpdRequest(StatusSolicitacaoLgpd.EM_PROCESSAMENTO, null));
        assertNull(s.getAtendidoEm());
    }
}
