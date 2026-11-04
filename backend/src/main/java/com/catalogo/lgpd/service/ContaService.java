package com.catalogo.lgpd.service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.auth.domain.TipoConsentimento;
import com.catalogo.auth.dto.MessageResponse;
import com.catalogo.auth.dto.UsuarioResponse;
import com.catalogo.auth.entity.ConsentimentoLgpd;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.ConsentimentoLgpdRepository;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.catalog.entity.Favorito;
import com.catalogo.catalog.repository.FavoritoRepository;
import com.catalogo.eventos.entity.Evento;
import com.catalogo.eventos.repository.EventoRepository;
import com.catalogo.lgpd.domain.StatusSolicitacaoLgpd;
import com.catalogo.lgpd.domain.TipoSolicitacaoLgpd;
import com.catalogo.lgpd.dto.ConsentimentoItemRequest;
import com.catalogo.lgpd.dto.ConsentimentoResponse;
import com.catalogo.lgpd.dto.ConsentimentosBatchRequest;
import com.catalogo.lgpd.dto.ContaResponse;
import com.catalogo.lgpd.dto.ExportEventoItem;
import com.catalogo.lgpd.dto.ExportacaoResponse;
import com.catalogo.lgpd.dto.PatchContaRequest;
import com.catalogo.lgpd.dto.SolicitacaoLgpdRequest;
import com.catalogo.lgpd.dto.SolicitacaoLgpdResponse;
import com.catalogo.lgpd.entity.SolicitacaoLgpd;
import com.catalogo.lgpd.repository.CompraAnonymizeRepository;
import com.catalogo.lgpd.repository.SolicitacaoLgpdRepository;
import com.catalogo.shared.ApiException;

@Service
public class ContaService {

    private final UsuarioRepository usuarioRepository;
    private final ConsentimentoLgpdRepository consentimentoRepository;
    private final SolicitacaoLgpdRepository solicitacaoRepository;
    private final FavoritoRepository favoritoRepository;
    private final EventoRepository eventoRepository;
    private final CompraAnonymizeRepository compraAnonymizeRepository;
    private final PasswordEncoder passwordEncoder;

    public ContaService(
            UsuarioRepository usuarioRepository,
            ConsentimentoLgpdRepository consentimentoRepository,
            SolicitacaoLgpdRepository solicitacaoRepository,
            FavoritoRepository favoritoRepository,
            EventoRepository eventoRepository,
            CompraAnonymizeRepository compraAnonymizeRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.consentimentoRepository = consentimentoRepository;
        this.solicitacaoRepository = solicitacaoRepository;
        this.favoritoRepository = favoritoRepository;
        this.eventoRepository = eventoRepository;
        this.compraAnonymizeRepository = compraAnonymizeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public ContaResponse getConta(Long usuarioId) {
        Usuario usuario = requireUsuario(usuarioId);
        return new ContaResponse(UsuarioResponse.from(usuario), latestConsentimentos(usuarioId));
    }

    @Transactional
    public ContaResponse patchConta(Long usuarioId, PatchContaRequest request) {
        Usuario usuario = requireUsuario(usuarioId);

        if (request.telefone() != null) {
            usuario.setTelefone(request.telefone());
        }
        if (request.emailAlternativo() != null) {
            usuario.setEmailAlternativo(request.emailAlternativo());
        }
        if (request.nomeCompleto() != null) {
            usuario.setNomeCompleto(request.nomeCompleto());
        }
        if (request.idade() != null) {
            usuario.setIdade(request.idade());
        }

        boolean changingPassword = request.novaSenha() != null && !request.novaSenha().isBlank();
        if (changingPassword) {
            if (request.senhaAtual() == null || request.senhaAtual().isBlank()) {
                throw new ApiException("VALIDATION_ERROR", "senhaAtual obrigatória para trocar senha", HttpStatus.BAD_REQUEST);
            }
            if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
                throw new ApiException("UNAUTHORIZED", "Senha atual inválida", HttpStatus.UNAUTHORIZED);
            }
            usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        }

        usuarioRepository.save(usuario);
        return new ContaResponse(UsuarioResponse.from(usuario), latestConsentimentos(usuarioId));
    }

    @Transactional
    public List<ConsentimentoResponse> salvarConsentimentos(Long usuarioId, ConsentimentosBatchRequest request) {
        Usuario usuario = requireUsuario(usuarioId);
        List<ConsentimentoResponse> saved = new ArrayList<>();
        for (ConsentimentoItemRequest item : request.consentimentos()) {
            ConsentimentoLgpd c = new ConsentimentoLgpd();
            c.setUsuario(usuario);
            c.setTipo(item.tipo());
            c.setAceito(Boolean.TRUE.equals(item.aceito()));
            c.setVersaoTermos(item.versaoTermos());
            c.setAceitoEm(item.aceitoEm() != null ? item.aceitoEm() : OffsetDateTime.now());
            consentimentoRepository.save(c);
            saved.add(ConsentimentoResponse.from(c));
        }
        return saved;
    }

    @Transactional
    public ExportacaoResponse exportar(Long usuarioId) {
        return buildExportAndMarkSolicitacao(usuarioId);
    }

    @Transactional
    public String exportarCsv(Long usuarioId) {
        ExportacaoResponse data = buildExportAndMarkSolicitacao(usuarioId);
        StringBuilder sb = new StringBuilder();
        sb.append("secao,campo,valor\n");
        UsuarioResponse u = data.usuario();
        csvRow(sb, "usuario", "id", u.id());
        csvRow(sb, "usuario", "email", u.email());
        csvRow(sb, "usuario", "nomeCompleto", u.nomeCompleto());
        csvRow(sb, "usuario", "telefone", u.telefone());
        csvRow(sb, "usuario", "emailAlternativo", u.emailAlternativo());
        csvRow(sb, "usuario", "cpf", u.cpf());
        csvRow(sb, "usuario", "cnpj", u.cnpj());
        csvRow(sb, "usuario", "razaoSocial", u.razaoSocial());
        csvRow(sb, "usuario", "idade", u.idade());
        for (ConsentimentoResponse c : data.consentimentos()) {
            csvRow(sb, "consentimento", c.tipo().name(), c.aceito() + "|" + c.versaoTermos() + "|" + c.aceitoEm());
        }
        for (Long produtoId : data.favoritosProdutoIds()) {
            csvRow(sb, "favorito", "produtoId", produtoId);
        }
        for (ExportEventoItem e : data.eventos()) {
            csvRow(sb, "evento", e.tipo().name(), e.ocorridoEm() + "|produtoId=" + e.produtoId());
        }
        return sb.toString();
    }

    private ExportacaoResponse buildExportAndMarkSolicitacao(Long usuarioId) {
        Usuario usuario = requireUsuario(usuarioId);
        List<ConsentimentoResponse> consents = latestConsentimentos(usuarioId);
        List<Long> favoritoIds = favoritoRepository.findAtivosByUsuarioId(usuarioId).stream()
                .map(Favorito::getProdutoId)
                .toList();
        List<ExportEventoItem> eventos = eventoRepository.findAtivosByUsuarioId(usuarioId).stream()
                .map(this::toExportEvento)
                .toList();

        SolicitacaoLgpd solicitacao = newSolicitacao(usuario, TipoSolicitacaoLgpd.EXPORTACAO, "Exportação síncrona");
        solicitacao.setStatus(StatusSolicitacaoLgpd.ATENDIDA);
        solicitacao.setAtendidoEm(OffsetDateTime.now());
        solicitacaoRepository.save(solicitacao);

        return new ExportacaoResponse(UsuarioResponse.from(usuario), consents, favoritoIds, eventos);
    }

    @Transactional
    public SolicitacaoLgpdResponse criarSolicitacao(Long usuarioId, SolicitacaoLgpdRequest request) {
        Usuario usuario = requireUsuario(usuarioId);
        SolicitacaoLgpd s = newSolicitacao(usuario, request.tipo(), request.detalhes());
        solicitacaoRepository.save(s);
        return SolicitacaoLgpdResponse.from(s);
    }

    @Transactional
    public MessageResponse excluirConta(Long usuarioId) {
        Usuario usuario = requireUsuario(usuarioId);
        anonymizeUsuario(usuario);

        SolicitacaoLgpd solicitacao = newSolicitacao(usuario, TipoSolicitacaoLgpd.EXCLUSAO, "Exclusão via DELETE /api/conta");
        solicitacao.setStatus(StatusSolicitacaoLgpd.ATENDIDA);
        solicitacao.setAtendidoEm(OffsetDateTime.now());
        solicitacaoRepository.save(solicitacao);

        return new MessageResponse("Conta anonimizada");
    }

    /** Soft-delete + PII wipe (08 §5.2). Idempotent if already deleted. */
    @Transactional
    public void anonymizeUsuario(Usuario usuario) {
        if (usuario.getDeletedAt() != null) {
            return;
        }
        Long usuarioId = usuario.getId();
        favoritoRepository.softDeleteByUsuarioId(usuarioId);
        eventoRepository.softDeleteByUsuarioId(usuarioId);
        compraAnonymizeRepository.softDeleteByUsuarioId(usuarioId);

        usuario.setDeletedAt(OffsetDateTime.now());
        usuario.setNomeCompleto(null);
        usuario.setCpf(null);
        usuario.setCnpj(null);
        usuario.setRazaoSocial(null);
        usuario.setEmail("anon_" + usuarioId + "@removido.local");
        usuario.setSenhaHash("!");
        usuario.setTelefone(null);
        usuario.setEmailAlternativo(null);
        usuario.setIdade(null);
        usuarioRepository.save(usuario);
    }

    private List<ConsentimentoResponse> latestConsentimentos(Long usuarioId) {
        Map<TipoConsentimento, ConsentimentoLgpd> latest = new EnumMap<>(TipoConsentimento.class);
        for (ConsentimentoLgpd c : consentimentoRepository.findByUsuario_IdOrderByAceitoEmDesc(usuarioId)) {
            latest.putIfAbsent(c.getTipo(), c);
        }
        return latest.values().stream().map(ConsentimentoResponse::from).toList();
    }

    private Usuario requireUsuario(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND));
        if (usuario.getDeletedAt() != null) {
            throw new ApiException("NOT_FOUND", "Usuário não encontrado", HttpStatus.NOT_FOUND);
        }
        return usuario;
    }

    private SolicitacaoLgpd newSolicitacao(Usuario usuario, TipoSolicitacaoLgpd tipo, String observacoes) {
        SolicitacaoLgpd s = new SolicitacaoLgpd();
        s.setUsuario(usuario);
        s.setTipo(tipo);
        s.setStatus(StatusSolicitacaoLgpd.PENDENTE);
        s.setSolicitadoEm(OffsetDateTime.now());
        s.setObservacoes(observacoes);
        return s;
    }

    private ExportEventoItem toExportEvento(Evento e) {
        Long produtoId = e.getProduto() != null ? e.getProduto().getId() : null;
        return new ExportEventoItem(e.getTipo(), e.getOcorridoEm(), produtoId);
    }

    private static void csvRow(StringBuilder sb, String secao, String campo, Object valor) {
        sb.append(secao).append(',')
                .append(escapeCsv(campo)).append(',')
                .append(escapeCsv(valor == null ? "" : String.valueOf(valor)))
                .append('\n');
    }

    private static String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return '"' + value.replace("\"", "\"\"") + '"';
        }
        return value;
    }
}
