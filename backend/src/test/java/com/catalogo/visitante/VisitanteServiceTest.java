package com.catalogo.visitante;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.catalogo.shared.ApiException;
import com.catalogo.visitante.dto.AbrirSessaoRequest;
import com.catalogo.visitante.dto.SessaoResponse;
import com.catalogo.visitante.entity.Sessao;
import com.catalogo.visitante.entity.Visitante;
import com.catalogo.visitante.repository.SessaoRepository;
import com.catalogo.visitante.repository.VisitanteRepository;
import com.catalogo.visitante.service.VisitanteService;

@ExtendWith(MockitoExtension.class)
class VisitanteServiceTest {

    @Mock
    VisitanteRepository visitanteRepository;
    @Mock
    SessaoRepository sessaoRepository;

    VisitanteService service;

    @BeforeEach
    void setUp() {
        service = new VisitanteService(visitanteRepository, sessaoRepository);
    }

    @Test
    void newCookieCreatesVisitanteAndSessao() {
        when(visitanteRepository.save(any(Visitante.class))).thenAnswer(inv -> {
            Visitante v = inv.getArgument(0);
            v.setId(10L);
            return v;
        });
        when(sessaoRepository.save(any(Sessao.class))).thenAnswer(inv -> {
            Sessao s = inv.getArgument(0);
            s.setId(20L);
            return s;
        });

        SessaoResponse response = service.abrirSessao(new AbrirSessaoRequest(null, "fp", "mobile", "ua", "web"));

        assertEquals(20L, response.sessaoId());
        ArgumentCaptor<Visitante> cap = ArgumentCaptor.forClass(Visitante.class);
        verify(visitanteRepository).save(cap.capture());
        assertEquals(cap.getValue().getCookieId(), response.cookieId());
    }

    @Test
    void reuseCookieSameVisitanteNewSessao() {
        UUID cookie = UUID.randomUUID();
        Visitante existing = new Visitante();
        existing.setId(1L);
        existing.setCookieId(cookie);
        when(visitanteRepository.findByCookieId(cookie)).thenReturn(Optional.of(existing));
        when(sessaoRepository.save(any(Sessao.class))).thenAnswer(inv -> {
            Sessao s = inv.getArgument(0);
            s.setId(99L);
            return s;
        });

        SessaoResponse first = service.abrirSessao(new AbrirSessaoRequest(cookie, null, null, null, null));
        SessaoResponse second = service.abrirSessao(new AbrirSessaoRequest(cookie, null, null, null, null));

        assertEquals(cookie, first.cookieId());
        assertEquals(cookie, second.cookieId());
        assertEquals(99L, first.sessaoId());
        assertEquals(99L, second.sessaoId());
        verify(visitanteRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void unknownCookieReturns400() {
        UUID cookie = UUID.randomUUID();
        when(visitanteRepository.findByCookieId(cookie)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                service.abrirSessao(new AbrirSessaoRequest(cookie, null, null, null, null)));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_COOKIE", ex.getCode());
    }
}
