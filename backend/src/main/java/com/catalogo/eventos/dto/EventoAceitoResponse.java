package com.catalogo.eventos.dto;

public record EventoAceitoResponse(boolean aceito) {
    public static EventoAceitoResponse ok() {
        return new EventoAceitoResponse(true);
    }
}
