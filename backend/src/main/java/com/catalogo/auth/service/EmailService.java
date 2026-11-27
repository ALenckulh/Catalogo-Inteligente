package com.catalogo.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String remetente;

    public EmailService(JavaMailSender mailSender, @Value("${catalogo.mail.remetente}") String remetente) {
        this.mailSender = mailSender;
        this.remetente = remetente;
    }

    /**
     * Assíncrono: a resposta de "recuperar senha" não espera o SMTP, e por isso leva o mesmo tempo exista
     * ou não a conta. A falha vai para o log sem o código.
     */
    @Async
    public void enviarCodigoDeSenha(String para, String codigo) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(para);
        mensagem.setSubject("Recuperação de senha");
        mensagem.setText("""
                Olá,

                Recebemos um pedido para redefinir a senha da sua conta no catálogo da Renova.

                Código: %s

                Digite esse código na tela "Recuperar senha". Ele vale por 2 horas e deixa de valer se você pedir outro.

                Se não foi você, ignore esta mensagem: sua senha continua a mesma.
                """.formatted(codigo));
        try {
            mailSender.send(mensagem);
        } catch (MailException ex) {
            log.error("Falha ao enviar o e-mail de recuperação de senha", ex);
        }
    }
}
