package com.catalogo.eventos.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import com.catalogo.config.RabbitConfig;
import com.catalogo.eventos.EventoRouting;
import com.catalogo.eventos.dto.EventoMessage;

@Component
public class EventoPublisher {

    private final RabbitTemplate rabbitTemplate;

    public EventoPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(EventoMessage message) {
        String routingKey = EventoRouting.queueFor(message.tipo());
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE_EVENTS, routingKey, message);
    }
}
