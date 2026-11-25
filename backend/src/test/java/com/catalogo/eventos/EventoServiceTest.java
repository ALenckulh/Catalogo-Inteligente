package com.catalogo.eventos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.domain.TipoConsentimento;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.ConsentimentoLgpd;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.ConsentimentoLgpdRepository;
import com.catalogo.auth.security.UsuarioPrincipal;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.eventos.dto.EventoAceitoResponse;
import com.catalogo.eventos.dto.EventoMessage;
import com.catalogo.eventos.dto.EventoRequest;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.service.EventoPublisher;
import com.catalogo.eventos.service.EventoService;
import com.catalogo.shared.ApiException;
import com.catalogo.visitante.entity.Sessao;
import com.catalogo.visitante.entity.Visitante;
import com.catalogo.visitante.service.VisitanteService;

@ExtendWith(MockitoExtension.class)
class EventoServiceTest {

    @Mock
    VisitanteService visitanteService;
    @Mock
    ConsentimentoLgpdRepository consentimentoRepository;
    @Mock
    ProdutoRepository produtoRepository;
    @Mock
    CategoriaRepository categoriaRepository;
    @Mock
    EventoPublisher eventoPublisher;

    EventoService service;

    @BeforeEach
    void setUp() {
        service = new EventoService(
                visitanteService, consentimentoRepository, produtoRepository, categoriaRepository, eventoPublisher);
        lenient().when(produtoRepository.existsById(9L)).thenReturn(true);
    }

    /** aceitar pode criar sessão (resolveOrCreateForUsuario): transação somente leitura dava 500. */
    @Test
    void aceitarNaoEhReadOnly() throws Exception {
        Transactional tx = EventoService.class
                .getMethod("aceitar", EventoRequest.class, Authentication.class, String.class)
                .getAnnotation(Transactional.class);
        assertFalse(tx.readOnly());
    }

    @Test
    void authWithoutConsent403() {
        when(consentimentoRepository.findFirstByUsuario_IdAndTipoOrderByAceitoEmDescIdDesc(
                1L, TipoConsentimento.COOKIES_COMPORTAMENTAIS
        )).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                service.aceitar(req(TipoEvento.VISUALIZACAO_PRODUTO), auth(), null));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(eventoPublisher, never()).publish(any());
    }

    @Test
    void authWithConsentPublishes202() {
        ConsentimentoLgpd c = new ConsentimentoLgpd();
        c.setAceito(true);
        when(consentimentoRepository.findFirstByUsuario_IdAndTipoOrderByAceitoEmDescIdDesc(
                1L, TipoConsentimento.COOKIES_COMPORTAMENTAIS
        )).thenReturn(Optional.of(c));
        Sessao sessao = new Sessao();
        sessao.setId(50L);
        when(visitanteService.resolveOrCreateForUsuario(1L, null)).thenReturn(sessao);

        EventoAceitoResponse response = service.aceitar(req(TipoEvento.FAVORITAR), auth(), null);

        assertTrue(response.aceito());
        ArgumentCaptor<EventoMessage> cap = ArgumentCaptor.forClass(EventoMessage.class);
        verify(eventoPublisher).publish(cap.capture());
        assertEquals(TipoEvento.FAVORITAR, cap.getValue().tipo());
        assertEquals(50L, cap.getValue().sessaoId());
        assertEquals(1L, cap.getValue().usuarioId());
        assertEquals(com.catalogo.config.RabbitConfig.QUEUE_PRODUCT_FAVORITE, EventoRouting.queueFor(cap.getValue().tipo()));
    }

    @Test
    void invalidVisitanteCookie400() {
        when(visitanteService.requireByCookie(any()))
                .thenThrow(new ApiException("INVALID_COOKIE", "Cookie de visitante inválido", HttpStatus.BAD_REQUEST));

        ApiException ex = assertThrows(ApiException.class, () ->
                service.aceitar(req(TipoEvento.PESQUISA), null, UUID.randomUUID().toString()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(eventoPublisher, never()).publish(any());
    }

    @Test
    void malformedCookieHeader400() {
        ApiException ex = assertThrows(ApiException.class, () ->
                service.aceitar(req(TipoEvento.PESQUISA), null, "not-uuid"));
        assertEquals("INVALID_COOKIE", ex.getCode());
    }

    @Test
    void visitanteCookiePublishes() {
        UUID cookie = UUID.randomUUID();
        Visitante v = new Visitante();
        v.setId(3L);
        v.setCookieId(cookie);
        Sessao sessao = new Sessao();
        sessao.setId(8L);
        when(visitanteService.requireByCookie(cookie)).thenReturn(v);
        when(visitanteService.resolveSessaoForVisitante(v, null)).thenReturn(sessao);

        service.aceitar(req(TipoEvento.CONTATO_WHATSAPP), null, cookie.toString());

        ArgumentCaptor<EventoMessage> cap = ArgumentCaptor.forClass(EventoMessage.class);
        verify(eventoPublisher).publish(cap.capture());
        assertEquals(3L, cap.getValue().visitanteId());
        assertEquals(com.catalogo.config.RabbitConfig.QUEUE_PRODUCT_CONTACT, EventoRouting.queueFor(cap.getValue().tipo()));
    }

    /** Antes respondia 202 e a mensagem ficava em repetição sem fim no worker. */
    @Test
    void eventoQueNaoDaParaGravar400() {
        assertRecusado(new EventoRequest(TipoEvento.VISUALIZACAO_PRODUTO, 777L, null, null, null, null));
        assertRecusado(new EventoRequest(TipoEvento.FILTRO_APLICADO, null, 99999L, null, null, null));
        assertRecusado(new EventoRequest(TipoEvento.PESQUISA, null, null, null, Map.of("termo", "a\0b"), null));
        assertRecusado(new EventoRequest(TipoEvento.PESQUISA, null, null, null, Map.of("f", Map.of("q", List.of("x", "\0"))), null));
        assertRecusado(new EventoRequest(TipoEvento.PESQUISA, null, null, null, Map.of("k\0", 1), null));
        verifyNoInteractions(visitanteService, eventoPublisher);
    }

    private void assertRecusado(EventoRequest request) {
        ApiException ex = assertThrows(ApiException.class, () ->
                service.aceitar(request, null, UUID.randomUUID().toString()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("VALIDATION_ERROR", ex.getCode());
    }

    @Test
    void metadadosComunsENulosPassam() {
        UUID cookie = UUID.randomUUID();
        Visitante v = new Visitante();
        v.setId(3L);
        Sessao sessao = new Sessao();
        sessao.setId(8L);
        when(visitanteService.requireByCookie(cookie)).thenReturn(v);
        when(visitanteService.resolveSessaoForVisitante(v, null)).thenReturn(sessao);
        Map<String, Object> filtros = new HashMap<>();
        filtros.put("precoMin", null);
        filtros.put("q", "pistão");

        service.aceitar(new EventoRequest(
                TipoEvento.FILTRO_APLICADO, null, null, null, Map.of("filtros", filtros), null), null, cookie.toString());

        verify(eventoPublisher).publish(any());
    }

    @Test
    void routingKeysByTipo() {
        assertEquals(com.catalogo.config.RabbitConfig.QUEUE_PRODUCT_VIEW, EventoRouting.queueFor(TipoEvento.VISUALIZACAO_PRODUTO));
        assertEquals(com.catalogo.config.RabbitConfig.QUEUE_PRODUCT_VIEW, EventoRouting.queueFor(TipoEvento.SCROLL_DEPTH));
        assertEquals(com.catalogo.config.RabbitConfig.QUEUE_PRODUCT_FAVORITE, EventoRouting.queueFor(TipoEvento.DESFAVORITAR));
        assertEquals(com.catalogo.config.RabbitConfig.QUEUE_SEARCH, EventoRouting.queueFor(TipoEvento.PESQUISA));
    }

    private static EventoRequest req(TipoEvento tipo) {
        return new EventoRequest(tipo, 9L, null, null, null, null);
    }

    private static UsernamePasswordAuthenticationToken auth() {
        Usuario u = new Usuario();
        u.setId(1L);
        u.setEmail("a@b.c");
        u.setSenhaHash("x");
        u.setTipo(TipoUsuario.PF);
        UsuarioPrincipal p = new UsuarioPrincipal(u);
        return new UsernamePasswordAuthenticationToken(p, null, p.getAuthorities());
    }

}
