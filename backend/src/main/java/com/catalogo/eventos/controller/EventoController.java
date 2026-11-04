package com.catalogo.eventos.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.catalogo.eventos.dto.EventoAceitoResponse;
import com.catalogo.eventos.dto.EventoRequest;
import com.catalogo.eventos.service.EventoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/eventos")
public class EventoController {

    private final EventoService eventoService;

    public EventoController(EventoService eventoService) {
        this.eventoService = eventoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public EventoAceitoResponse aceitar(
            @Valid @RequestBody EventoRequest request,
            Authentication authentication,
            @RequestHeader(value = EventoService.HEADER_COOKIE, required = false) String cookieId
    ) {
        return eventoService.aceitar(request, authentication, cookieId);
    }
}
