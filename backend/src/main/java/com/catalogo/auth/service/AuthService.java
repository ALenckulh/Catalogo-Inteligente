package com.catalogo.auth.service;

import com.catalogo.auth.entity.TokenRevogado;
import com.catalogo.auth.repository.TokenRevogadoRepository;
import com.catalogo.shared.DadosConta;
import io.jsonwebtoken.Claims;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
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

    /** Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails estão cadastrados. */
    private static final String AUTH_FAIL = "Credenciais inválidas";

    private final UsuarioRepository usuarioRepository;
    private final ConsentimentoLgpdRepository consentimentoRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final TokenRevogadoRepository tokenRevogadoRepository;

    public AuthService(
            UsuarioRepository usuarioRepository,
            ConsentimentoLgpdRepository consentimentoRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService,
            TokenRevogadoRepository tokenRevogadoRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.consentimentoRepository = consentimentoRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.tokenRevogadoRepository = tokenRevogadoRepository;
    }

    /**
     * Cadastro PF/PJ: proíbe ADMIN, exige aceite de termos e privacidade, checa e-mail/CPF/CNPJ únicos (409),
     * valida CPF/CNPJ pelo dígito verificador, idade e telefone, e grava a senha com BCrypt.
     * Cada consentimento LGPD vira uma linha própria em consentimento_lgpd (histórico que serve de prova).
     */
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

        String telefone = DadosConta.telefone(request.telefone());
        String emailAlt = DadosConta.emailAlternativo(request.emailAlternativo());

        Usuario usuario = new Usuario();
        usuario.setTipo(request.tipo());
        usuario.setEmail(request.email().trim().toLowerCase());
        usuario.setSenhaHash(passwordEncoder.encode(DadosConta.senha(request.senha())));
        usuario.setTelefone(telefone);
        usuario.setEmailAlternativo(emailAlt);

        if (request.tipo() == TipoUsuario.PF) {
            String nome = DadosConta.nomeCompleto(request.nomeCompleto());
            String cpf = Documentos.onlyDigits(request.cpf());
            if (!Documentos.isValidCpf(cpf)) {
                throw new ApiException("VALIDATION_ERROR", "CPF inválido", HttpStatus.BAD_REQUEST);
            }
            if (usuarioRepository.existsByCpf(cpf)) {
                throw new ApiException("CPF_EXISTS", "CPF já cadastrado", HttpStatus.CONFLICT);
            }
            usuario.setCpf(cpf);
            usuario.setNomeCompleto(nome);
            usuario.setIdade(DadosConta.idade(request.idade()));
        } else if (request.tipo() == TipoUsuario.PJ) {
            String razaoSocial = DadosConta.razaoSocial(request.razaoSocial());
            String cnpj = Documentos.onlyDigits(request.cnpj());
            if (!Documentos.isValidCnpj(cnpj)) {
                throw new ApiException("VALIDATION_ERROR", "CNPJ inválido", HttpStatus.BAD_REQUEST);
            }
            if (usuarioRepository.existsByCnpj(cnpj)) {
                throw new ApiException("CNPJ_EXISTS", "CNPJ já cadastrado", HttpStatus.CONFLICT);
            }
            usuario.setCnpj(cnpj);
            usuario.setRazaoSocial(razaoSocial);
        }

        usuario = usuarioRepository.save(usuario);
        saveConsent(usuario, TipoConsentimento.TERMOS_USO, true);
        saveConsent(usuario, TipoConsentimento.POLITICA_PRIVACIDADE, true);
        // Nascem ligados por legítimo interesse, avisado no cadastro (docs/04 §10.1); desligar é em /conta.
        saveConsent(usuario, TipoConsentimento.COOKIES_COMPORTAMENTAIS,
                !Boolean.FALSE.equals(request.cookiesComportamentais()));
        saveConsent(usuario, TipoConsentimento.CONTATO_PROATIVO, !Boolean.FALSE.equals(request.contatoProativo()));

        return session(usuario);
    }

    /**
     * Login PF/PJ: 1) busca pelo e-mail ignorando contas apagadas; 2) recusa ADMIN (que entra por
     * /api/admin/auth/login); 3) compara a senha com o hash BCrypt; 4) devolve { token JWT, usuario } sem o hash.
     */
    @Transactional(readOnly = true)
    public AuthSessionResponse loginConsumidor(LoginRequest request) {
        Usuario usuario = findForLogin(request.email());
        if (usuario.getTipo() == TipoUsuario.ADMIN) {
            throw new ApiException("UNAUTHORIZED", AUTH_FAIL, HttpStatus.UNAUTHORIZED);
        }
        verifyPassword(usuario, request.senha());
        return session(usuario);
    }

    /** Mesmo fluxo do login de consumidor, mas só aceita ADMIN. */
    @Transactional(readOnly = true)
    public AuthSessionResponse loginAdmin(LoginRequest request) {
        Usuario usuario = findForLogin(request.email());
        if (usuario.getTipo() != TipoUsuario.ADMIN) {
            throw new ApiException("UNAUTHORIZED", AUTH_FAIL, HttpStatus.UNAUTHORIZED);
        }
        verifyPassword(usuario, request.senha());
        return session(usuario);
    }

    /**
     * Recuperação de senha, etapa 1: gera um token aleatório (UUID sem hífens) válido por 2 h, anula os anteriores
     * e o envia por e-mail.
     * Responde a mesma mensagem exista ou não o e-mail, para não revelar cadastros.
     */
    @Transactional
    public MessageResponse requestPasswordReset(PasswordResetRequest request) {
        usuarioRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(request.email().trim()).ifPresent(usuario -> {
            passwordResetTokenRepository.invalidarPendentes(usuario.getId(), OffsetDateTime.now());
            PasswordResetToken reset = new PasswordResetToken();
            reset.setUsuario(usuario);
            reset.setToken(UUID.randomUUID().toString().replace("-", ""));
            reset.setExpiraEm(OffsetDateTime.now().plusHours(2));
            reset.setCreatedAt(OffsetDateTime.now());
            passwordResetTokenRepository.save(reset);
            emailService.enviarCodigoDeSenha(usuario.getEmail(), reset.getToken());
        });
        return new MessageResponse("Se o e-mail existir, enviaremos instruções de recuperação");
    }

    /** Etapa 2: recusa token já usado (usado_em) ou expirado; troca a senha, encerra as sessões e marca o token como usado. */
    @Transactional
    public MessageResponse confirmPasswordReset(PasswordResetConfirmRequest request) {
        PasswordResetToken reset = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new ApiException("INVALID_TOKEN", "Token inválido ou expirado", HttpStatus.BAD_REQUEST));
        if (reset.getUsadoEm() != null || reset.getExpiraEm().isBefore(OffsetDateTime.now())) {
            throw new ApiException("INVALID_TOKEN", "Token inválido ou expirado", HttpStatus.BAD_REQUEST);
        }
        Usuario usuario = reset.getUsuario();
        usuario.trocarSenha(passwordEncoder.encode(DadosConta.senha(request.novaSenha())));
        reset.setUsadoEm(OffsetDateTime.now());
        return new MessageResponse("Senha atualizada");
    }

    /** Encerra só este token; token antigo, sem jti, vale até vencer. */
    @Transactional
    public MessageResponse logout(String token) {
        Claims claims = jwtService.parse(token);
        if (claims.getId() != null) {
            tokenRevogadoRepository.save(new TokenRevogado(
                    UUID.fromString(claims.getId()),
                    claims.getExpiration().toInstant().atOffset(ZoneOffset.UTC)));
        }
        return new MessageResponse("Logout realizado");
    }

    @Scheduled(cron = "0 10 3 * * *")
    @Transactional
    public void apagarTokensVencidos() {
        tokenRevogadoRepository.apagarVencidos(OffsetDateTime.now());
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
        c.setVersaoTermos(ConsentimentoLgpd.VERSAO_TERMOS);
        c.setAceitoEm(OffsetDateTime.now());
        consentimentoRepository.save(c);
    }
}
