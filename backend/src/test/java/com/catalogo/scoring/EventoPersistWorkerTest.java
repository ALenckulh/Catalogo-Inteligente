package com.catalogo.scoring;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.UsuarioRepository;
import java.time.OffsetDateTime;
import java.util.Map;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
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
    ProdutoRepository produtoRepository;
    @Mock
    CategoriaRepository categoriaRepository;
    @Mock
    ScoreEngine scoreEngine;
    @Mock
    UsuarioRepository usuarioRepository;

    EventoPersistWorker worker;

    @BeforeEach
    void setUp() {
        worker = new EventoPersistWorker(
                eventoRepository, produtoRepository, categoriaRepository, scoreEngine, usuarioRepository);
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
                4L,
                null,
                Map.of(),
                OffsetDateTime.now()
        );

        when(usuarioRepository.travarAtivoParaGravarEvento(9L)).thenReturn(Optional.of(new Usuario()));
        Produto produto = new Produto();
        Categoria categoria = new Categoria();
        when(produtoRepository.getReferenceById(3L)).thenReturn(produto);
        when(categoriaRepository.getReferenceById(4L)).thenReturn(categoria);

        worker.persist(msg);

        // Referência gerenciada: com um Produto só com id, o recálculo não via preço nem categoria.
        ArgumentCaptor<Evento> cap = ArgumentCaptor.forClass(Evento.class);
        verify(eventoRepository).save(cap.capture());
        assertSame(produto, cap.getValue().getProduto());
        assertSame(categoria, cap.getValue().getCategoria());
        verify(scoreEngine).recalc(eq(9L), isNull());
    }

    /** Gravar deixaria um evento ativo na conta anonimizada e apagaria as notas dela. */
    @Test
    void eventoDeContaExcluidaEDescartado() {
        when(usuarioRepository.travarAtivoParaGravarEvento(9L)).thenReturn(Optional.empty());

        worker.persist(new EventoMessage(
                TipoEvento.PESQUISA, 1L, 9L, null, null, null, null, Map.of(), OffsetDateTime.now()));

        verifyNoInteractions(eventoRepository, scoreEngine);
    }

    @Test
    void eventoDeVisitanteNaoConsultaUsuario() {
        worker.persist(new EventoMessage(
                TipoEvento.PESQUISA, 1L, null, 5L, null, null, null, Map.of(), OffsetDateTime.now()));

        verifyNoInteractions(usuarioRepository);
        verify(scoreEngine).recalc(isNull(), eq(5L));
    }
}
