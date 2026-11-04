package com.catalogo.lgpd.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

public record ConsentimentosBatchRequest(
        @NotEmpty @Valid List<ConsentimentoItemRequest> consentimentos
) {
}
