package com.catalogo.config;

import java.sql.SQLException;
import java.sql.SQLRecoverableException;
import java.sql.SQLTransientException;
import java.util.List;

import org.springframework.amqp.listener.ConditionalRejectingErrorHandler;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.transaction.CannotCreateTransactionException;

/**
 * Decide o destino da mensagem cujo processamento falhou:
 * passageira (banco fora, deadlock) → volta para a fila e nada se perde; a espera por conexão do pool (30 s)
 * evita que ela gire em falso. Qualquer outra (dado inválido) falharia sempre → events.dlq.
 */
class FalhaPassageira extends ConditionalRejectingErrorHandler.DefaultExceptionStrategy {

    /** Classes de SQLState: conexão, transação abortada, falta de recurso, banco desligando. */
    private static final List<String> SQLSTATE = List.of("08", "40", "53", "57P");

    @Override
    protected boolean isUserCauseFatal(Throwable cause) {
        return !passageira(cause);
    }

    static boolean passageira(Throwable erro) {
        for (Throwable t = erro; t != null; t = t.getCause()) {
            if (t instanceof TransientDataAccessException
                    || t instanceof DataAccessResourceFailureException
                    || t instanceof CannotCreateTransactionException
                    || t instanceof SQLTransientException
                    || t instanceof SQLRecoverableException
                    || (t instanceof SQLException sql && sql.getSQLState() != null
                            && SQLSTATE.stream().anyMatch(sql.getSQLState()::startsWith))) {
                return true;
            }
        }
        return false;
    }
}
