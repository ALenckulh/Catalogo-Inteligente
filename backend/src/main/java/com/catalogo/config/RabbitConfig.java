package com.catalogo.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Filas de eventos conforme {@code frontend/docs/12-ARQUITETURA-BACKEND.md} §6.
 */
@Configuration
public class RabbitConfig {

    public static final String EXCHANGE_EVENTS = "events.exchange";
    public static final String DLQ = "events.dlq";

    public static final String QUEUE_PRODUCT_VIEW = "events.product.view";
    public static final String QUEUE_PRODUCT_FAVORITE = "events.product.favorite";
    public static final String QUEUE_PRODUCT_CONTACT = "events.product.contact";
    public static final String QUEUE_SEARCH = "events.search";
    public static final String QUEUE_SESSION = "events.session";

    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public DirectExchange eventsExchange() {
        return new DirectExchange(EXCHANGE_EVENTS, true, false);
    }

    @Bean
    public Queue dlq() {
        return QueueBuilder.durable(DLQ).build();
    }

    @Bean
    public Queue productViewQueue() {
        return durableWithDlq(QUEUE_PRODUCT_VIEW);
    }

    @Bean
    public Queue productFavoriteQueue() {
        return durableWithDlq(QUEUE_PRODUCT_FAVORITE);
    }

    @Bean
    public Queue productContactQueue() {
        return durableWithDlq(QUEUE_PRODUCT_CONTACT);
    }

    @Bean
    public Queue searchQueue() {
        return durableWithDlq(QUEUE_SEARCH);
    }

    @Bean
    public Queue sessionQueue() {
        return durableWithDlq(QUEUE_SESSION);
    }

    @Bean
    public Binding productViewBinding(Queue productViewQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(productViewQueue).to(eventsExchange).with(QUEUE_PRODUCT_VIEW);
    }

    @Bean
    public Binding productFavoriteBinding(Queue productFavoriteQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(productFavoriteQueue).to(eventsExchange).with(QUEUE_PRODUCT_FAVORITE);
    }

    @Bean
    public Binding productContactBinding(Queue productContactQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(productContactQueue).to(eventsExchange).with(QUEUE_PRODUCT_CONTACT);
    }

    @Bean
    public Binding searchBinding(Queue searchQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(searchQueue).to(eventsExchange).with(QUEUE_SEARCH);
    }

    @Bean
    public Binding sessionBinding(Queue sessionQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(sessionQueue).to(eventsExchange).with(QUEUE_SESSION);
    }

    @Bean
    public Binding dlqBinding(Queue dlq, DirectExchange eventsExchange) {
        return BindingBuilder.bind(dlq).to(eventsExchange).with(DLQ);
    }

    private static Queue durableWithDlq(String name) {
        return QueueBuilder.durable(name)
                .withArgument("x-dead-letter-exchange", EXCHANGE_EVENTS)
                .withArgument("x-dead-letter-routing-key", DLQ)
                .build();
    }
}
