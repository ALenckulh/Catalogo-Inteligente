package com.catalogo.eventos;

import static org.mockito.Mockito.verify;

import java.time.OffsetDateTime;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import com.catalogo.config.RabbitConfig;
import com.catalogo.eventos.domain.TipoEvento;
import com.catalogo.eventos.dto.EventoMessage;
import com.catalogo.eventos.service.EventoPublisher;

@ExtendWith(MockitoExtension.class)
class EventoPublisherTest {

    @Mock
    RabbitTemplate rabbitTemplate;

    @Test
    void publishUsesExchangeAndRoutingKey() {
        EventoPublisher publisher = new EventoPublisher(rabbitTemplate);
        EventoMessage msg = new EventoMessage(
                TipoEvento.PESQUISA, 1L, null, 2L, null, null, null, Map.of(), OffsetDateTime.now()
        );

        publisher.publish(msg);

        verify(rabbitTemplate).convertAndSend(
                RabbitConfig.EXCHANGE_EVENTS,
                RabbitConfig.QUEUE_SEARCH,
                msg
        );
    }
}
