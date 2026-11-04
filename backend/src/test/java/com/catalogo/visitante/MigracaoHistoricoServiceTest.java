package com.catalogo.visitante;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.catalogo.auth.dto.MigrarHistoricoRequest;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.repository.ScoreMigrationRepository;
import com.catalogo.shared.ApiException;
import com.catalogo.visitante.entity.Visitante;
import com.catalogo.visitante.repository.SessaoRepository;
import com.catalogo.visitante.repository.VisitanteRepository;
import com.catalogo.visitante.service.MigracaoHistoricoService;

@ExtendWith(MockitoExtension.class)
class MigracaoHistoricoServiceTest {

    @Mock
    VisitanteRepository visitanteRepository;
    @Mock
    SessaoRepository sessaoRepository;
    @Mock
    EventoRepository eventoRepository;
    @Mock
    ScoreMigrationRepository scoreMigrationRepository;

    MigracaoHistoricoService service;

    @BeforeEach
    void setUp() {
        service = new MigracaoHistoricoService(
                visitanteRepository, sessaoRepository, eventoRepository, scoreMigrationRepository
        );
    }

    @Test
    void aceitarTrueLinksVisitanteAndEventos() {
        UUID cookie = UUID.randomUUID();
        Visitante visitante = new Visitante();
        visitante.setId(9L);
        visitante.setCookieId(cookie);
        when(visitanteRepository.findByCookieId(cookie)).thenReturn(Optional.of(visitante));
        when(visitanteRepository.save(any(Visitante.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.migrar(1L, new MigrarHistoricoRequest(true), cookie.toString());

        assertEquals("Histórico migrado com sucesso", response.message());
        assertNotNull(visitante.getUsuario());
        assertEquals(1L, visitante.getUsuario().getId());
        assertNotNull(visitante.getMigradoEm());
        verify(sessaoRepository).attachUsuarioToVisitanteSessoes(1L, 9L);
        verify(eventoRepository).attachUsuarioToVisitanteEventos(1L, 9L);
        verify(scoreMigrationRepository).reassignVisitanteToUsuario(1L, 9L);
    }

    @Test
    void aceitarFalseNoLink() {
        UUID cookie = UUID.randomUUID();
        Visitante visitante = new Visitante();
        visitante.setId(9L);
        visitante.setCookieId(cookie);
        when(visitanteRepository.findByCookieId(cookie)).thenReturn(Optional.of(visitante));

        var response = service.migrar(1L, new MigrarHistoricoRequest(false), cookie.toString());

        assertEquals("Histórico de visitante não associado", response.message());
        assertNull(visitante.getUsuario());
        assertNull(visitante.getMigradoEm());
        verify(visitanteRepository, never()).save(any());
        verify(eventoRepository, never()).attachUsuarioToVisitanteEventos(any(), any());
        verify(scoreMigrationRepository, never()).reassignVisitanteToUsuario(any(), any());
    }

    @Test
    void invalidCookie400() {
        UUID cookie = UUID.randomUUID();
        when(visitanteRepository.findByCookieId(cookie)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () ->
                service.migrar(1L, new MigrarHistoricoRequest(true), cookie.toString()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_COOKIE", ex.getCode());
        verify(scoreMigrationRepository, never()).reassignVisitanteToUsuario(eq(1L), any());
    }

    @Test
    void missingCookieHeader400() {
        ApiException ex = assertThrows(ApiException.class, () ->
                service.migrar(1L, new MigrarHistoricoRequest(true), null));
        assertEquals("INVALID_COOKIE", ex.getCode());
    }
}
