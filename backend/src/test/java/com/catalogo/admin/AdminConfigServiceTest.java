package com.catalogo.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.admin.dto.PesosPatchRequest;
import com.catalogo.admin.service.AdminConfigService;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.scoring.entity.PesoMetrica;
import com.catalogo.scoring.repository.ParametroDecayRepository;
import com.catalogo.scoring.repository.PesoMetricaRepository;

@ExtendWith(MockitoExtension.class)
class AdminConfigServiceTest {

    @Mock
    PesoMetricaRepository pesoMetricaRepository;
    @Mock
    ParametroDecayRepository parametroDecayRepository;
    @Mock
    CategoriaRepository categoriaRepository;

    AdminConfigService service;

    @BeforeEach
    void setUp() {
        service = new AdminConfigService(pesoMetricaRepository, parametroDecayRepository, categoriaRepository);
    }

    @Test
    void patchPesosUpdates() {
        when(pesoMetricaRepository.findById(TipoEvento.FAVORITAR)).thenReturn(Optional.empty());
        when(pesoMetricaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(pesoMetricaRepository.findAll()).thenReturn(List.of());

        service.patchPesos(1L, new PesosPatchRequest(List.of(
                new PesosPatchRequest.Item(TipoEvento.FAVORITAR, new BigDecimal("0.7000"))
        )));

        ArgumentCaptor<PesoMetrica> cap = ArgumentCaptor.forClass(PesoMetrica.class);
        verify(pesoMetricaRepository).save(cap.capture());
        assertEquals(TipoEvento.FAVORITAR, cap.getValue().getTipoEvento());
        assertEquals(0, new BigDecimal("0.7000").compareTo(cap.getValue().getPeso()));
        assertEquals(1L, cap.getValue().getAtualizadoPor());
    }
}
