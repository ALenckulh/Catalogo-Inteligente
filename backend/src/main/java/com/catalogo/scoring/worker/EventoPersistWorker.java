package com.catalogo.scoring.worker;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.entity.Usuario;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.config.RabbitConfig;
import com.catalogo.eventos.dto.EventoMessage;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.scoring.engine.ScoreEngine;
import com.catalogo.visitante.entity.Sessao;
import com.catalogo.visitante.entity.Visitante;

/**
 * Consumidor das filas de eventos: grava o evento e recalcula o score do sujeito.
 * Roda no mesmo processo da API (ADR-B07, um JAR só); como a fila desacopla os dois, extrair este worker
 * para outro serviço é mudança de deploy, não de lógica.
 */
@Component
@ConditionalOnProperty(name = "catalogo.rabbit.enabled", havingValue = "true", matchIfMissing = true)
public class EventoPersistWorker {

    private static final Logger log = LoggerFactory.getLogger(EventoPersistWorker.class);

    private final EventoRepository eventoRepository;
    private final ProdutoRepository produtoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ScoreEngine scoreEngine;

    public EventoPersistWorker(
            EventoRepository eventoRepository,
            ProdutoRepository produtoRepository,
            CategoriaRepository categoriaRepository,
            ScoreEngine scoreEngine
    ) {
        this.eventoRepository = eventoRepository;
        this.produtoRepository = produtoRepository;
        this.categoriaRepository = categoriaRepository;
        this.scoreEngine = scoreEngine;
    }

    @RabbitListener(queues = {
            RabbitConfig.QUEUE_PRODUCT_VIEW,
            RabbitConfig.QUEUE_PRODUCT_FAVORITE,
            RabbitConfig.QUEUE_PRODUCT_CONTACT,
            RabbitConfig.QUEUE_SEARCH,
            RabbitConfig.QUEUE_SESSION
    })
    // @Transactional: INSERT do evento e recálculo do score commitam juntos; se o recálculo falhar,
    // o evento sofre rollback e a mensagem é rejeitada (nunca fica evento gravado sem score atualizado).
    @Transactional
    public void persist(EventoMessage message) {
        Evento evento = new Evento();
        evento.setTipo(message.tipo());

        // Entidades "vazias" só com o id: o Hibernate precisa apenas do id para gravar a FK,
        // então não faz um SELECT de cada relação.
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
            // Referência, e não um Produto vazio: o recálculo, na mesma transação, lê preço e categoria deste objeto.
            evento.setProduto(produtoRepository.getReferenceById(message.produtoId()));
        }
        if (message.categoriaId() != null) {
            evento.setCategoria(categoriaRepository.getReferenceById(message.categoriaId()));
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
