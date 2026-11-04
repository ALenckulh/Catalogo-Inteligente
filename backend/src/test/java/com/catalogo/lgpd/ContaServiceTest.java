package com.catalogo.lgpd;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
                passwordEncoder
        );
    }

    @Test
    void getContaReturnsUsuarioAndLatestConsents() {
        Usuario u = usuario(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        ConsentimentoLgpd old = consent(u, TipoConsentimento.COOKIES_COMPORTAMENTAIS, false, OffsetDateTime.now().minusDays(2));
        ConsentimentoLgpd neu = consent(u, TipoConsentimento.COOKIES_COMPORTAMENTAIS, true, OffsetDateTime.now());
        when(consentimentoRepository.findByUsuario_IdOrderByAceitoEmDesc(1L)).thenReturn(List.of(neu, old));

        var conta = service.getConta(1L);

        assertEquals("a@b.c", conta.usuario().email());
        assertEquals(1, conta.consentimentos().size());
        assertTrue(conta.consentimentos().getFirst().aceito());
    }

    @Test
    void patchWrongPasswordUnauthorized() {
        Usuario u = usuario(1L);
        u.setSenhaHash(passwordEncoder.encode("secret"));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));

        ApiException ex = assertThrows(ApiException.class, () ->
                service.patchConta(1L, new PatchContaRequest(null, null, null, null, "wrong", "nova1234")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void consentimentosAppend() {
        Usuario u = usuario(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(consentimentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = service.salvarConsentimentos(1L, new ConsentimentosBatchRequest(List.of(
                new ConsentimentoItemRequest(TipoConsentimento.CONTATO_PROATIVO, true, "1.0", null)
        )));

        assertEquals(1, result.size());
        ArgumentCaptor<ConsentimentoLgpd> cap = ArgumentCaptor.forClass(ConsentimentoLgpd.class);
        verify(consentimentoRepository).save(cap.capture());
        assertEquals(TipoConsentimento.CONTATO_PROATIVO, cap.getValue().getTipo());
    }

    @Test
    void exportJsonMarksSolicitacaoAtendida() {
        Usuario u = usuario(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(u));
        when(consentimentoRepository.findByUsuario_IdOrderByAceitoEmDesc(1L)).thenReturn(List.of());
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
        verify(favoritoRepository).softDeleteByUsuarioId(1L);
        verify(eventoRepository).softDeleteByUsuarioId(1L);
        verify(compraAnonymizeRepository).softDeleteByUsuarioId(1L);
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
