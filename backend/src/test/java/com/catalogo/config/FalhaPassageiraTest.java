package com.catalogo.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.SQLException;
import java.sql.SQLTransientConnectionException;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.listener.ListenerExecutionFailedException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.transaction.TransactionSystemException;

class FalhaPassageiraTest {

    private final FalhaPassageira estrategia = new FalhaPassageira();

    @Test
    void dadoInvalidoVaiParaADlq() {
        assertTrue(fatal(new DataIntegrityViolationException("fk", new SQLException("fk", "23503"))));
        assertTrue(fatal(new NumberFormatException("NaN")));
        assertTrue(fatal(new IllegalStateException(new SQLException("u0000", "22P05"))));
        assertTrue(fatal(new NullPointerException()));
    }

    @Test
    void falhaPassageiraVoltaParaAFila() {
        assertFalse(fatal(new CannotCreateTransactionException("sem conexão", new SQLTransientConnectionException())));
        assertFalse(fatal(new DataAccessResourceFailureException("banco fora")));
        assertFalse(fatal(new PessimisticLockingFailureException("deadlock")));
        assertFalse(fatal(new TransactionSystemException("commit", new SQLException("queda", "08006"))));
        assertFalse(fatal(new RuntimeException(new SQLException("desligando", "57P01"))));
        assertFalse(fatal(new RuntimeException(new SQLException("deadlock", "40P01"))));
    }

    /** O container entrega a falha do listener embrulhada. */
    private boolean fatal(Throwable causa) {
        return estrategia.isFatal(new ListenerExecutionFailedException("x", causa, new Message(new byte[0])));
    }
}
