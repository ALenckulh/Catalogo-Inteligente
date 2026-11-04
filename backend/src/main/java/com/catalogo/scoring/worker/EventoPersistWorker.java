package com.catalogo.scoring.worker;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.entity.Usuario;
import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.config.RabbitConfig;
import com.catalogo.eventos.dto.EventoMessage;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.visitante.entity.Sessao;
import com.catalogo.visitante.entity.Visitante;

@Component
@ConditionalOnProperty(name = "catalogo.rabbit.enabled", havingValue = "true", matchIfMissing = true)
public class EventoPersistWorker {

    private static final Logger log = LoggerFactory.getLogger(EventoPersistWorker.class);

    private final EventoRepository eventoRepository;
    private final ScoreEngine scoreEngine;

    public EventoPersistWorker(EventoRepository eventoRepository, ScoreEngine scoreEngine) {
        this.eventoRepository = eventoRepository;
        this.scoreEngine = scoreEngine;
    }

    @RabbitListener(queues = {
            RabbitConfig.QUEUE_PRODUCT_VIEW,
            RabbitConfig.QUEUE_PRODUCT_FAVORITE,
            RabbitConfig.QUEUE_PRODUCT_CONTACT,
            RabbitConfig.QUEUE_SEARCH,
            RabbitConfig.QUEUE_SESSION
    })
    @Transactional
    public void persist(EventoMessage message) {
        Evento evento = new Evento();
        evento.setTipo(message.tipo());

        Sessao sessao = new Sessao();
        sessao.setId(message.sessaoId());
        evento.setSessao(sessao);

        if (message.usuarioId() != null) {
            Usuario u = new Usuario();
            u.setId(message.usuarioId());
            evento.setUsuario(u);
        }
        if (message.visitanteId() != null) {
            Visitante v = new Visitante();
            v.setId(message.visitanteId());
            evento.setVisitante(v);
        }
        if (message.produtoId() != null) {
            Produto p = new Produto();
            p.setId(message.produtoId());
            evento.setProduto(p);
        }
        if (message.categoriaId() != null) {
            Categoria c = new Categoria();
            c.setId(message.categoriaId());
            evento.setCategoria(c);
        }

        evento.setConversao(message.conversao());
        evento.setMetadados(message.metadados() != null ? message.metadados() : Map.of());
        if (message.ocorridoEm() != null) {
            evento.setOcorridoEm(message.ocorridoEm());
        }
        eventoRepository.save(evento);

        try {
            scoreEngine.recalc(message.usuarioId(), message.visitanteId());
        } catch (RuntimeException ex) {
            log.error("Score recalc failed usuario={} visitante={}", message.usuarioId(), message.visitanteId(), ex);
            throw ex;
        }
    }
}
