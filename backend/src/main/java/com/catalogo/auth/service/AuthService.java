package com.catalogo.auth.service;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.domain.TipoConsentimento;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.dto.AuthSessionResponse;
import com.catalogo.auth.dto.LoginRequest;
import com.catalogo.auth.dto.MessageResponse;
import com.catalogo.auth.dto.PasswordResetConfirmRequest;
import com.catalogo.auth.dto.PasswordResetRequest;
import com.catalogo.auth.dto.SignupRequest;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.entity.ConsentimentoLgpd;
import com.catalogo.auth.entity.PasswordResetToken;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.ConsentimentoLgpdRepository;
import com.catalogo.auth.repository.PasswordResetTokenRepository;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.auth.security.JwtService;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.Documentos;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String TERMOS_VERSAO = "1.0";
    private static final String AUTH_FAIL = "Credenciais inválidas";

    private final UsuarioRepository usuarioRepository;
    private final ConsentimentoLgpdRepository consentimentoRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            ConsentimentoLgpdRepository consentimentoRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.consentimentoRepository = consentimentoRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthSessionResponse signup(SignupRequest request) {
        if (request.tipo() == TipoUsuario.ADMIN) {
            throw new ApiException("FORBIDDEN", "Cadastro de admin não permitido", HttpStatus.FORBIDDEN);
        }
        if (!Boolean.TRUE.equals(request.aceitaTermos()) || !Boolean.TRUE.equals(request.aceitaPrivacidade())) {
            throw new ApiException("VALIDATION_ERROR", "Aceite de termos e privacidade é obrigatório", HttpStatus.BAD_REQUEST);
        }
        if (usuarioRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException("EMAIL_EXISTS", "E-mail já cadastrado", HttpStatus.CONFLICT);
        }

        String telefone = normalizeTelefone(request.telefone());
        String emailAlt = normalizeEmailAlternativo(request.emailAlternativo());

        Usuario usuario = new Usuario();
        usuario.setTipo(request.tipo());
        usuario.setEmail(request.email().trim().toLowerCase());
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuario.setTelefone(telefone);
        usuario.setEmailAlternativo(emailAlt);

        if (request.tipo() == TipoUsuario.PF) {
            if (request.nomeCompleto() == null || request.nomeCompleto().isBlank()) {
                throw new ApiException("VALIDATION_ERROR", "Nome completo é obrigatório", HttpStatus.BAD_REQUEST);
            }
            if (request.nomeCompleto().trim().length() < 3) {
                throw new ApiException("VALIDATION_ERROR", "Nome completo deve ter no mínimo 3 caracteres", HttpStatus.BAD_REQUEST);
            }
            String cpf = Documentos.onlyDigits(request.cpf());
            if (!Documentos.isValidCpf(cpf)) {
                throw new ApiException("VALIDATION_ERROR", "CPF inválido", HttpStatus.BAD_REQUEST);
            }
            if (usuarioRepository.existsByCpf(cpf)) {
                throw new ApiException("CPF_EXISTS", "CPF já cadastrado", HttpStatus.CONFLICT);
            }
            Short idade = request.idade();
            if (idade != null && (idade < 18 || idade > 120)) {
                throw new ApiException("VALIDATION_ERROR", "Idade deve ser um número entre 18 e 120", HttpStatus.BAD_REQUEST);
            }
            usuario.setCpf(cpf);
            usuario.setNomeCompleto(request.nomeCompleto().trim());
            usuario.setIdade(idade);
        } else if (request.tipo() == TipoUsuario.PJ) {
            if (request.razaoSocial() == null || request.razaoSocial().isBlank()) {
                throw new ApiException("VALIDATION_ERROR", "Razão social é obrigatória", HttpStatus.BAD_REQUEST);
            }
            if (request.razaoSocial().trim().length() < 2) {
                throw new ApiException("VALIDATION_ERROR", "Razão social deve ter no mínimo 2 caracteres", HttpStatus.BAD_REQUEST);
            }
            String cnpj = Documentos.onlyDigits(request.cnpj());
            if (!Documentos.isValidCnpj(cnpj)) {
                throw new ApiException("VALIDATION_ERROR", "CNPJ inválido", HttpStatus.BAD_REQUEST);
            }
            if (usuarioRepository.existsByCnpj(cnpj)) {
                throw new ApiException("CNPJ_EXISTS", "CNPJ já cadastrado", HttpStatus.CONFLICT);
            }
            usuario.setCnpj(cnpj);
            usuario.setRazaoSocial(request.razaoSocial().trim());
        }

        usuario = usuarioRepository.save(usuario);
        saveConsent(usuario, TipoConsentimento.TERMOS_USO, true);
        saveConsent(usuario, TipoConsentimento.POLITICA_PRIVACIDADE, true);
        if (request.cookiesComportamentais() != null) {
            saveConsent(usuario, TipoConsentimento.COOKIES_COMPORTAMENTAIS, request.cookiesComportamentais());
        }
        if (request.contatoProativo() != null) {
            saveConsent(usuario, TipoConsentimento.CONTATO_PROATIVO, request.contatoProativo());
        }

        return session(usuario);
    }

    private static String normalizeTelefone(String raw) {
        String digits = Documentos.onlyDigits(raw);
        if (digits == null || digits.isBlank()) {
            return null;
        }
        int len = digits.length();
        boolean ok = len == 10 || len == 11
                || ((len == 12 || len == 13) && digits.startsWith("55"));
        if (!ok) {
            throw new ApiException("VALIDATION_ERROR", "Telefone inválido", HttpStatus.BAD_REQUEST);
        }
        return digits;
    }

    private static String normalizeEmailAlternativo(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String email = raw.trim().toLowerCase();
        int at = email.indexOf('@');
        if (at <= 0 || at != email.lastIndexOf('@') || at == email.length() - 1 || !email.substring(at).contains(".")) {
            throw new ApiException("VALIDATION_ERROR", "E-mail alternativo inválido", HttpStatus.BAD_REQUEST);
        }
        return email;
    }

    @Transactional(readOnly = true)
    public AuthSessionResponse loginConsumidor(LoginRequest request) {
        Usuario usuario = findForLogin(request.email());
        if (usuario.getTipo() == TipoUsuario.ADMIN) {
            throw new ApiException("UNAUTHORIZED", AUTH_FAIL, HttpStatus.UNAUTHORIZED);
        }
        verifyPassword(usuario, request.senha());
        return session(usuario);
    }

    @Transactional(readOnly = true)
    public AuthSessionResponse loginAdmin(LoginRequest request) {
        Usuario usuario = findForLogin(request.email());
        if (usuario.getTipo() != TipoUsuario.ADMIN) {
            throw new ApiException("UNAUTHORIZED", AUTH_FAIL, HttpStatus.UNAUTHORIZED);
        }
        verifyPassword(usuario, request.senha());
        return session(usuario);
    }

    @Transactional
    public MessageResponse requestPasswordReset(PasswordResetRequest request) {
        usuarioRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(request.email().trim()).ifPresent(usuario -> {
            PasswordResetToken reset = new PasswordResetToken();
            reset.setUsuario(usuario);
            reset.setToken(UUID.randomUUID().toString().replace("-", ""));
            reset.setExpiraEm(OffsetDateTime.now().plusHours(2));
            reset.setCreatedAt(OffsetDateTime.now());
            passwordResetTokenRepository.save(reset);
            // ponytail: no SMTP in Phase 1 — log token in dev; add mailer when needed
            log.info("password-reset token for {}: {}", usuario.getEmail(), reset.getToken());
        });
        return new MessageResponse("Se o e-mail existir, enviaremos instruções de recuperação");
    }

    @Transactional
    public MessageResponse confirmPasswordReset(PasswordResetConfirmRequest request) {
        PasswordResetToken reset = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new ApiException("INVALID_TOKEN", "Token inválido ou expirado", HttpStatus.BAD_REQUEST));
        if (reset.getUsadoEm() != null || reset.getExpiraEm().isBefore(OffsetDateTime.now())) {
            throw new ApiException("INVALID_TOKEN", "Token inválido ou expirado", HttpStatus.BAD_REQUEST);
        }
        Usuario usuario = reset.getUsuario();
        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        reset.setUsadoEm(OffsetDateTime.now());
        return new MessageResponse("Senha atualizada");
    }

    private Usuario findForLogin(String email) {
        return usuarioRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email.trim())
                .orElseThrow(() -> new ApiException("UNAUTHORIZED", AUTH_FAIL, HttpStatus.UNAUTHORIZED));
    }

    private void verifyPassword(Usuario usuario, String senha) {
        if (!passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            throw new ApiException("UNAUTHORIZED", AUTH_FAIL, HttpStatus.UNAUTHORIZED);
        }
    }

    private AuthSessionResponse session(Usuario usuario) {
        return new AuthSessionResponse(jwtService.generate(usuario), UsuarioResponse.from(usuario));
    }

    private void saveConsent(Usuario usuario, TipoConsentimento tipo, boolean aceito) {
        ConsentimentoLgpd c = new ConsentimentoLgpd();
        c.setUsuario(usuario);
        c.setTipo(tipo);
        c.setAceito(aceito);
        c.setVersaoTermos(TERMOS_VERSAO);
        c.setAceitoEm(OffsetDateTime.now());
        consentimentoRepository.save(c);
    }
}
