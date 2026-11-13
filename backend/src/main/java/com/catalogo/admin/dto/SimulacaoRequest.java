package com.catalogo.admin.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

/** Parâmetros propostos para simular (mesmos itens dos PATCH de pesos e decay). */
public record SimulacaoRequest(
        @NotEmpty @Valid List<PesosPatchRequest.Item> pesos,
        @NotEmpty @Valid List<DecayPatchRequest.Item> decay
) {
}
