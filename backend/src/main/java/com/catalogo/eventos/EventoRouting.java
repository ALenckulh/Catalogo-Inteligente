package com.catalogo.eventos;

import com.catalogo.config.RabbitConfig;
import com.catalogo.eventos.domain.TipoEvento;

public final class EventoRouting {

    private EventoRouting() {
    }

    public static String queueFor(TipoEvento tipo) {
        return switch (tipo) {
            case VISUALIZACAO_PRODUTO, SCROLL_DEPTH, TEMPO_PAGINA, FILTRO_APLICADO -> RabbitConfig.QUEUE_PRODUCT_VIEW;
            case FAVORITAR, DESFAVORITAR -> RabbitConfig.QUEUE_PRODUCT_FAVORITE;
            case CONTATO_WHATSAPP -> RabbitConfig.QUEUE_PRODUCT_CONTACT;
            case PESQUISA -> RabbitConfig.QUEUE_SEARCH;
        };
    }
}
