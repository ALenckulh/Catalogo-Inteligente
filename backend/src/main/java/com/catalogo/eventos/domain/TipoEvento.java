package com.catalogo.eventos.domain;

public enum TipoEvento {
    VISUALIZACAO_PRODUTO,
    FAVORITAR,
    DESFAVORITAR,
    CONTATO_WHATSAPP,
    PESQUISA,
    FILTRO_APLICADO,
    SCROLL_DEPTH,
    TEMPO_PAGINA,
    /** Só peso: a compra vem da tabela compra. */
    COMPRA,
    /** Só peso: calculado das visualizações do produto em sessões diferentes. */
    RETORNO_PAGINA;

    /** Tem peso na nota, mas não existe como evento. */
    public boolean soPeso() {
        return this == COMPRA || this == RETORNO_PAGINA;
    }
}
