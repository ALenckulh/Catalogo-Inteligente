package com.catalogo.shared;

import jakarta.servlet.http.HttpServletRequest;
import java.sql.SQLException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

/**
 * Converte exceções no JSON { code, message } com o status HTTP certo, para o front tratar erros de um jeito só.
 * Os services lançam ApiException(code, message, status); qualquer erro não previsto vira 500 sem stack trace.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException ex) {
        return ResponseEntity
                .status(ex.getStatus())
                .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    /** Bean Validation (@Valid) → 400 VALIDATION_ERROR com o primeiro campo inválido. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String message = fieldError != null
                ? fieldError.getField() + ": " + fieldError.getDefaultMessage()
                : "Validação inválida";
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("VALIDATION_ERROR", message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", "Payload inválido"));
    }

    /** Upload acima de 5 MB → 413. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity
                .status(HttpStatus.CONTENT_TOO_LARGE)
                .body(new ErrorResponse("FILE_TOO_LARGE", "Arquivo maior que o limite de 5MB"));
    }

    /** Parâmetro de URL com tipo errado (?page=abc, /usuarios/xyz) → 400. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return resposta(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getName() + ": valor inválido");
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponse> handleMultipart(MultipartException ex) {
        return resposta(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Envio de arquivo inválido");
    }

    /** Rede de segurança: o que a validação deixar passar e o banco recusar é erro de quem enviou, não 500. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleIntegridade(DataIntegrityViolationException ex) {
        log.warn("Dado recusado pelo banco: {}", ex.getMostSpecificCause().getMessage());
        boolean duplicado = ex.getMostSpecificCause() instanceof SQLException sql && "23505".equals(sql.getSQLState());
        return duplicado
                ? resposta(HttpStatus.CONFLICT, "CONFLICT", "Registro já existe")
                : resposta(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dado fora do limite permitido");
    }

    /** Banco fora do ar → 503 (passageiro), como no filtro JWT. */
    @ExceptionHandler({CannotCreateTransactionException.class, DataAccessResourceFailureException.class})
    public ResponseEntity<ErrorResponse> handleBancoFora(Exception ex) {
        log.error("Banco indisponível", ex);
        return resposta(HttpStatus.SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE", "Serviço indisponível");
    }

    /**
     * Erros do próprio Spring MVC já trazem o status (rota inexistente 404, método 405, formato 415, parâmetro
     * ausente 400). O resto é 500 INTERNAL_ERROR sem expor detalhes ao cliente, com a causa no log.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        if (ex instanceof org.springframework.web.ErrorResponse mvc && mvc.getStatusCode().is4xxClientError()) {
            HttpStatus status = HttpStatus.valueOf(mvc.getStatusCode().value());
            ResponseEntity.BodyBuilder resposta = ResponseEntity.status(status).headers(mvc.getHeaders());
            return switch (status) {
                case NOT_FOUND -> resposta.body(new ErrorResponse("NOT_FOUND", "Rota não encontrada"));
                case METHOD_NOT_ALLOWED -> resposta.body(new ErrorResponse("METHOD_NOT_ALLOWED", "Método não permitido"));
                case UNSUPPORTED_MEDIA_TYPE ->
                        resposta.body(new ErrorResponse("UNSUPPORTED_MEDIA_TYPE", "Formato do corpo não suportado"));
                // O cliente não aceita JSON: um corpo daria o mesmo erro de novo.
                case NOT_ACCEPTABLE -> resposta.build();
                default -> resposta.body(new ErrorResponse("BAD_REQUEST", "Requisição inválida"));
            };
        }
        // Sem a query string: a busca do admin pode ter CPF.
        log.error("Erro não tratado em {} {}", request.getMethod(), request.getRequestURI(), ex);
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Erro interno");
    }

    private static ResponseEntity<ErrorResponse> resposta(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new ErrorResponse(code, message));
    }
}
