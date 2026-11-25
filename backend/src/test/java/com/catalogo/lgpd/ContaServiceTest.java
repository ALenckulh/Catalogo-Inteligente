package com.catalogo.lgpd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.catalogo.auth.security.JwtService;
import com.catalogo.catalog.entity.Compra;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CompraRepository;
import com.catalogo.visitante.repository.SessaoRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.catalogo.auth.domain.TipoConsentimento;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.ConsentimentoLgpd;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.ConsentimentoLgpdRepository;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.catalog.repository.FavoritoRepository;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;
import com.catalogo.lgpd.dto.ConsentimentoItemRequest;
import com.catalogo.lgpd.dto.ConsentimentosBatchRequest;
import com.catalogo.lgpd.dto.PatchContaRequest;
import com.catalogo.lgpd.dto.SolicitacaoLgpdRequest;
import com.catalogo.lgpd.entity.SolicitacaoLgpd;
import com.catalogo.lgpd.repository.CompraAnonymizeRepository;
import com.catalogo.lgpd.repository.SolicitacaoLgpdRepository;
import com.catalogo.lgpd.service.ContaService;
import com.catalogo.shared.ApiException;

@ExtendWith(MockitoExtension.class)
class ContaServiceTest {

    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    ConsentimentoLgpdRepository consentimentoRepository;
    @Mock
    SolicitacaoLgpdRepository solicitacaoRepository;
    @Mock
    FavoritoRepository favoritoRepository;
    @Mock
    EventoRepository eventoRepository;
    @Mock
    CompraAnonymizeRepository compraAnonymizeRepository;
    @Mock
    CompraRepository compraRepository;
    @Mock
    SessaoRepository sessaoRepository;
    @Mock
    JwtService jwtService;

    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    ContaService service;

    @BeforeEach
    void setUp() {
        service = new ContaService(
                usuarioRepository,
                consentimentoRepository,
                solicitacaoRepository,
                favoritoRepository,
                eventoRepository,
                compraAnonymizeRepository,
                compraRepository,
                sessaoRepository,
                passwordEncoder,
                jwtService
        );
    }

    @Test
    void getContaReturnsUsuarioAndLatestConsents() {
        Usuario u = usuario(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        ConsentimentoLgpd old = consent(u, TipoConsentimento.COOKIES_COMPORTAMENTAIS, false, OffsetDateTime.now().minusDays(2));
        ConsentimentoLgpd neu = consent(u, TipoConsentimento.COOKIES_COMPORTAMENTAIS, true, OffsetDateTime.now());
        when(consentimentoRepository.findByUsuario_IdOrderByAceitoEmDescIdDesc(1L)).thenReturn(List.of(neu, old));

        var conta = service.getConta(1L);

        assertEquals("a@b.c", conta.usuario().email());
        assertEquals(1, conta.consentimentos().size());
        assertTrue(conta.consentimentos().getFirst().aceito());
    }

    @Test
    void patchWrongPasswordBadRequest() {
        Usuario u = usuario(1L);
        u.setSenhaHash(passwordEncoder.encode("secret"));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));

        ApiException ex = assertThrows(ApiException.class, () ->
                service.patchConta(1L, new PatchContaRequest(null, null, null, null, "wrong", "nova1234")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_PASSWORD", ex.getCode());
        verify(usuarioRepository, never()).save(any());
    }

    /** Trocar a senha derruba as outras sessões; esta recebe um token novo. */
    @Test
    void trocarSenhaDevolveTokenNovo() {
        Usuario u = usuario(1L);
        u.setSenhaHash(passwordEncoder.encode("secret"));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(jwtService.generate(u)).thenReturn("novo");

        assertNull(service.patchConta(1L, new PatchContaRequest("47999990000", null, null, null, null, null)).token());
        assertNull(u.getSessoesValidasDesde());
        assertEquals("novo", service.patchConta(1L, new PatchContaRequest(null, null, null, null, "secret", "nova1234")).token());
        assertTrue(u.getSessoesValidasDesde() != null);
    }

    @Test
    void consentimentosAppend() {
        Usuario u = usuario(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(consentimentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = service.salvarConsentimentos(1L, new ConsentimentosBatchRequest(List.of(
                new ConsentimentoItemRequest(TipoConsentimento.CONTATO_PROATIVO, true, "1.0")
        )));

        assertEquals(1, result.size());
        ArgumentCaptor<ConsentimentoLgpd> cap = ArgumentCaptor.forClass(ConsentimentoLgpd.class);
        verify(consentimentoRepository).save(cap.capture());
        assertEquals(TipoConsentimento.CONTATO_PROATIVO, cap.getValue().getTipo());
        // Hora do servidor, nunca a do navegador.
        assertTrue(Duration.between(cap.getValue().getAceitoEm(), OffsetDateTime.now()).abs().toSeconds() < 10);
    }

    /** Aba aberta como PF salvando com o token da PJ gravava o nome da pessoa na empresa. */
    @Test
    void pjNaoAceitaNomeNemIdade() {
        Usuario pj = usuario(2L);
        pj.setTipo(TipoUsuario.PJ);
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(pj));

        for (PatchContaRequest r : List.of(
                new PatchContaRequest(null, null, "Ana", null, null, null),
                new PatchContaRequest(null, null, null, (short) 30, null, null))) {
            ApiException ex = assertThrows(ApiException.class, () -> service.patchConta(2L, r));
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        }
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void contaDoAdminNaoEAnonimizada() {
        Usuario admin = usuario(1L);
        admin.setTipo(TipoUsuario.ADMIN);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin));

        ApiException ex = assertThrows(ApiException.class, () -> service.excluirConta(1L));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertNull(admin.getDeletedAt());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void exportJsonMarksSolicitacaoAtendida() {
        Usuario u = usuario(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(consentimentoRepository.findByUsuario_IdOrderByAceitoEmDescIdDesc(1L)).thenReturn(List.of());
        when(favoritoRepository.findAtivosByUsuarioId(1L)).thenReturn(List.of());
        Evento e = new Evento();
        e.setTipo(TipoEvento.VISUALIZACAO_PRODUTO);
        e.setOcorridoEm(OffsetDateTime.now());
        when(eventoRepository.findAtivosByUsuarioId(1L)).thenReturn(List.of(e));
        when(solicitacaoRepository.save(any())).thenAnswer(inv -> {
            SolicitacaoLgpd s = inv.getArgument(0);
            s.setId(10L);
            return s;
        });

        var export = service.exportar(1L);

        assertEquals(1, export.eventos().size());
        ArgumentCaptor<SolicitacaoLgpd> cap = ArgumentCaptor.forClass(SolicitacaoLgpd.class);
        verify(solicitacaoRepository).save(cap.capture());
        assertEquals(TipoSolicitacaoLgpd.EXPORTACAO, cap.getValue().getTipo());
        assertEquals(StatusSolicitacaoLgpd.ATENDIDA, cap.getValue().getStatus());
    }

    @Test
    void exportTrazComprasESolicitacoesESemFormulaNoCsv() {
        Usuario u = usuario(1L);
        u.setNomeCompleto("=HYPERLINK(\"http://x\",\"y\")");
        u.setEmailAlternativo("@SUM(1)");
        Produto p = new Produto();
        p.setId(7L);
        p.setNome("-2+3, filtro");
        Compra c = new Compra();
        c.setId(1L);
        c.setProduto(p);
        c.setQuantidade(2);
        c.setPrecoUnitario(new BigDecimal("10.50"));
        c.setValorTotal(new BigDecimal("21.00"));
        c.setDataCompra(LocalDate.of(2026, 1, 15));
        c.setObservacoes("anotação interna");
        SolicitacaoLgpd s = new SolicitacaoLgpd();
        s.setTipo(TipoSolicitacaoLgpd.CORRECAO);
        s.setStatus(StatusSolicitacaoLgpd.PENDENTE);
        s.setObservacoes("corrigir nome");
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(compraRepository.findByUsuarioIdAndDeletedAtIsNull(1L)).thenReturn(List.of(c));
        when(solicitacaoRepository.findByUsuario_IdOrderBySolicitadoEmDescIdDesc(1L)).thenReturn(List.of(s));

        var export = service.exportar(1L);
        assertEquals("-2+3, filtro", export.compras().getFirst().produtoNome());
        assertEquals("corrigir nome", export.solicitacoes().getFirst().observacoes());

        String csv = service.exportarCsv(1L);
        assertTrue(csv.contains("usuario,nomeCompleto,\"'=HYPERLINK(\"\"http://x\"\",\"\"y\"\")\"\n"), csv);
        assertTrue(csv.contains("usuario,emailAlternativo,'@SUM(1)\n"), csv);
        assertTrue(csv.contains("compra,\"'-2+3, filtro\",2026-01-15|2 x 10.50|total=21.00\n"), csv);
        assertTrue(csv.contains("solicitacao,CORRECAO,PENDENTE|"), csv);
        assertTrue(!csv.contains("interna"), csv);
    }

    /** Só grava o que ainda não estava recusado: o histórico não ganha linha repetida. */
    @Test
    void revogacaoRecusaCookiesEContato() {
        Usuario u = usuario(1L);
        when(consentimentoRepository.findByUsuario_IdOrderByAceitoEmDescIdDesc(1L)).thenReturn(List.of(
                consent(u, TipoConsentimento.COOKIES_COMPORTAMENTAIS, true, OffsetDateTime.now()),
                consent(u, TipoConsentimento.CONTATO_PROATIVO, false, OffsetDateTime.now())));

        service.revogarConsentimentos(u);

        ArgumentCaptor<ConsentimentoLgpd> cap = ArgumentCaptor.forClass(ConsentimentoLgpd.class);
        verify(consentimentoRepository).save(cap.capture());
        assertEquals(TipoConsentimento.COOKIES_COMPORTAMENTAIS, cap.getValue().getTipo());
        assertTrue(!cap.getValue().isAceito());
    }

    @Test
    void solicitacaoPendente() {
        Usuario u = usuario(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(solicitacaoRepository.save(any())).thenAnswer(inv -> {
            SolicitacaoLgpd s = inv.getArgument(0);
            s.setId(3L);
            return s;
        });

        var response = service.criarSolicitacao(1L, new SolicitacaoLgpdRequest(TipoSolicitacaoLgpd.CORRECAO, "fix nome"));

        assertEquals(StatusSolicitacaoLgpd.PENDENTE, response.status());
        assertEquals(3L, response.id());
    }

    @Test
    void deleteAnonymizes() {
        Usuario u = usuario(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(usuarioRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(solicitacaoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.excluirConta(1L);

        assertEquals("anon_1@removido.local", u.getEmail());
        assertEquals("!", u.getSenhaHash());
        assertNull(u.getNomeCompleto());
        assertNull(u.getCpf());
        assertNotNullDeleted(u);
        var ordem = org.mockito.Mockito.inOrder(usuarioRepository, eventoRepository);
        ordem.verify(usuarioRepository).travarParaExcluir(1L);
        ordem.verify(eventoRepository).softDeleteByUsuarioId(1L);
        verify(favoritoRepository).softDeleteByUsuarioId(1L);
        verify(eventoRepository).softDeleteByUsuarioId(1L);
        verify(compraAnonymizeRepository).softDeleteByUsuarioId(1L);
        verify(sessaoRepository).limparUserAgentByUsuarioId(1L);
    }

    private static void assertNotNullDeleted(Usuario u) {
        assertTrue(u.getDeletedAt() != null);
    }

    private static Usuario usuario(Long id) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setTipo(TipoUsuario.PF);
        u.setEmail("a@b.c");
        u.setSenhaHash("hash");
        u.setNomeCompleto("Ana");
        u.setCpf("52998224725");
        return u;
    }

    private static ConsentimentoLgpd consent(Usuario u, TipoConsentimento tipo, boolean aceito, OffsetDateTime when) {
        ConsentimentoLgpd c = new ConsentimentoLgpd();
        c.setUsuario(u);
        c.setTipo(tipo);
        c.setAceito(aceito);
        c.setVersaoTermos("1.0");
        c.setAceitoEm(when);
        return c;
    }
}
