package com.catalogo.shared;

import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpStatus;

/** Regras dos dados da conta, as mesmas no cadastro, em "Minha conta", na conta do admin e na recuperação de senha. */
public final class DadosConta {

    /** O BCrypt recusa senha acima de 72 bytes. */
    private static final int SENHA_MAX_BYTES = 72;
    private static final int TEXTO_MAX = 255;

    private DadosConta() {
    }

    public static String nomeCompleto(String raw) {
        String nome = raw == null ? "" : raw.trim();
        if (nome.isEmpty()) {
            throw invalido("Nome completo é obrigatório");
        }
        if (nome.length() < 3) {
            throw invalido("Nome completo deve ter no mínimo 3 caracteres");
        }
        return limitado(nome, "Nome completo");
    }

    public static String razaoSocial(String raw) {
        String razao = raw == null ? "" : raw.trim();
        if (razao.isEmpty()) {
            throw invalido("Razão social é obrigatória");
        }
        if (razao.length() < 2) {
            throw invalido("Razão social deve ter no mínimo 2 caracteres");
        }
        return limitado(razao, "Razão social");
    }

    /** Opcional: nula passa. */
    public static Short idade(Short idade) {
        if (idade != null && (idade < 18 || idade > 120)) {
            throw invalido("Idade deve ser um número entre 18 e 120");
        }
        return idade;
    }

    /** Opcional: em branco vira nulo. Guarda só os dígitos. */
    public static String telefone(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String digits = Documentos.onlyDigits(raw);
        int len = digits.length();
        boolean ok = len == 10 || len == 11
                || ((len == 12 || len == 13) && digits.startsWith("55"));
        if (!ok) {
            throw invalido("Telefone inválido");
        }
        return digits;
    }

    /** Opcional: em branco vira nulo. */
    public static String emailAlternativo(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String email = raw.trim().toLowerCase();
        int at = email.indexOf('@');
        if (at <= 0 || at != email.lastIndexOf('@') || at == email.length() - 1 || !email.substring(at).contains(".")) {
            throw invalido("E-mail alternativo inválido");
        }
        return limitado(email, "E-mail alternativo");
    }

    public static String senha(String senha) {
        if (senha == null || senha.length() < 6) {
            throw invalido("A senha deve ter no mínimo 6 caracteres");
        }
        if (senha.getBytes(StandardCharsets.UTF_8).length > SENHA_MAX_BYTES) {
            throw invalido("A senha deve ter no máximo 72 caracteres");
        }
        return senha;
    }

    private static String limitado(String texto, String campo) {
        if (texto.length() > TEXTO_MAX) {
            throw invalido(campo + " deve ter no máximo 255 caracteres");
        }
        return texto;
    }

    private static ApiException invalido(String mensagem) {
        return new ApiException("VALIDATION_ERROR", mensagem, HttpStatus.BAD_REQUEST);
    }
}
