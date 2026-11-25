package com.catalogo.auth;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import com.catalogo.auth.service.EmailService;

class EmailServiceTest {

    private final JavaMailSender sender = mock(JavaMailSender.class);
    private final EmailService service = new EmailService(sender, "de@x.c");

    @Test
    void enviaOCodigoParaOEmailDaConta() {
        service.enviarCodigoDeSenha("ana@x.c", "abc123");

        ArgumentCaptor<SimpleMailMessage> cap = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(cap.capture());
        assertArrayEquals(new String[] {"ana@x.c"}, cap.getValue().getTo());
        assertEquals("de@x.c", cap.getValue().getFrom());
        assertTrue(cap.getValue().getText().contains("abc123"));
    }

    @Test
    void smtpForaNaoDerrubaNada() {
        doThrow(new MailSendException("fora")).when(sender).send(any(SimpleMailMessage.class));
        assertDoesNotThrow(() -> service.enviarCodigoDeSenha("ana@x.c", "abc123"));
    }
}
