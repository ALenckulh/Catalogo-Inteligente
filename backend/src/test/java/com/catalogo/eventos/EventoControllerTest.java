package com.catalogo.eventos;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.catalogo.eventos.controller.EventoController;
import com.catalogo.eventos.dto.EventoAceitoResponse;
import com.catalogo.eventos.service.EventoService;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.GlobalExceptionHandler;

@ExtendWith(MockitoExtension.class)
class EventoControllerTest {

    @Mock
    EventoService eventoService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new EventoController(eventoService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void returns202() throws Exception {
        when(eventoService.aceitar(any(), isNull(), any())).thenReturn(EventoAceitoResponse.ok());

        mockMvc.perform(post("/api/eventos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(EventoService.HEADER_COOKIE, "11111111-1111-1111-1111-111111111111")
                        .content("{\"tipo\":\"VISUALIZACAO_PRODUTO\",\"produtoId\":1}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.aceito").value(true));
    }

    @Test
    void consentForbiddenMaps403() throws Exception {
        when(eventoService.aceitar(any(), any(), any()))
                .thenThrow(new ApiException("CONSENT_REQUIRED", "x", HttpStatus.FORBIDDEN));

        mockMvc.perform(post("/api/eventos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"FAVORITAR\"}"))
                .andExpect(status().isForbidden());
    }
}
