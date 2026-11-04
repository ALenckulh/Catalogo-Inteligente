package com.catalogo.scoring;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.dto.EventoMessage;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.scoring.worker.EventoPersistWorker;

@ExtendWith(MockitoExtension.class)
class EventoPersistWorkerTest {

    @Mock
    EventoRepository eventoRepository;
    @Mock
    ScoreEngine scoreEngine;

    EventoPersistWorker worker;

    @BeforeEach
    void setUp() {
        worker = new EventoPersistWorker(eventoRepository, scoreEngine);
    }

    @Test
    void persistThenRecalc() {
        when(eventoRepository.save(org.mockito.ArgumentMatchers.any(Evento.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        EventoMessage msg = new EventoMessage(
                TipoEvento.VISUALIZACAO_PRODUTO,
                1L,
                9L,
                null,
                3L,
                null,
                null,
                Map.of(),
                OffsetDateTime.now()
        );

        worker.persist(msg);

        verify(eventoRepository).save(org.mockito.ArgumentMatchers.any(Evento.class));
        verify(scoreEngine).recalc(eq(9L), isNull());
    }
}
