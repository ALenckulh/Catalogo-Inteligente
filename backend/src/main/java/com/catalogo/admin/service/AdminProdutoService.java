package com.catalogo.admin.service;

import com.catalogo.catalog.repository.ImagemArquivoRepository;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.admin.dto.PatchProdutoRequest;
import com.catalogo.admin.dto.ProdutoInput;
import com.catalogo.catalog.dto.ProdutoResponse;
import com.catalogo.catalog.entity.Categoria;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.entity.ProdutoImagem;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.shared.ApiException;
import com.catalogo.shared.PageResponse;

@Service
public class AdminProdutoService {

    private final ProdutoRepository produtoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ImagemArquivoRepository imagemArquivoRepository;

    public AdminProdutoService(
            ProdutoRepository produtoRepository,
            CategoriaRepository categoriaRepository,
            ImagemArquivoRepository imagemArquivoRepository
    ) {
        this.produtoRepository = produtoRepository;
        this.categoriaRepository = categoriaRepository;
        this.imagemArquivoRepository = imagemArquivoRepository;
    }

    private static final Pattern IMAGEM_ENVIADA = Pattern.compile("produtos/imagens/(\\d{1,18})");
    private static final Pattern IMAGEM_EXTERNA = Pattern.compile("https?://\\S+");
    private static final Set<String> SORT_FIELDS = Set.of("nome", "slug", "preco", "updatedAt");

    /** @param sort "campo,asc|desc" com campo em {@link #SORT_FIELDS}; inválido ou nulo = id desc. */
    @Transactional(readOnly = true)
    public PageResponse<ProdutoResponse> listar(String q, Boolean ativo, Integer page, Integer limit, String sort) {
        int pageIndex = page == null || page < 0 ? 0 : page;
        int size = limit == null || limit < 1 ? 20 : Math.min(limit, 100);
        String query = q == null || q.isBlank() ? null : q.trim();
        PageRequest pageable = PageRequest.of(pageIndex, size, parseSort(sort));
        Page<Produto> result = produtoRepository.adminSearch(query, ativo, pageable);
        return PageResponse.from(result.map(p -> ProdutoResponse.from(p, true)));
    }

    private static Sort parseSort(String sort) {
        if (sort != null) {
            String[] parts = sort.split(",", -1);
            String field = parts[0].trim();
            if (SORT_FIELDS.contains(field)) {
                boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
                // id como desempate: paginação estável quando há valores iguais.
                return Sort.by(desc ? Sort.Direction.DESC : Sort.Direction.ASC, field).and(Sort.by("id"));
            }
        }
        return Sort.by(Sort.Direction.DESC, "id");
    }

    @Transactional(readOnly = true)
    public ProdutoResponse getById(Long id) {
        Produto p = produtoRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Produto não encontrado", HttpStatus.NOT_FOUND));
        return ProdutoResponse.from(p, true);
    }

    @Transactional
    public ProdutoResponse criar(ProdutoInput input) {
        if (produtoRepository.existsBySlugIgnoreCase(input.slug().trim())) {
            throw new ApiException("SLUG_EXISTS", "Slug já existe", HttpStatus.CONFLICT);
        }
        Categoria cat = categoriaRepository.findById(input.categoriaId())
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Categoria não encontrada", HttpStatus.NOT_FOUND));

        Produto p = new Produto();
        applyCreate(p, input, cat);
        p = produtoRepository.save(p);
        return ProdutoResponse.from(produtoRepository.findByIdWithDetails(p.getId()).orElse(p), true);
    }

    @Transactional
    public ProdutoResponse patch(Long id, PatchProdutoRequest input) {
        Produto p = produtoRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Produto não encontrado", HttpStatus.NOT_FOUND));

        if (input.nome() != null) {
            p.setNome(input.nome());
        }
        if (input.slug() != null && !input.slug().equalsIgnoreCase(p.getSlug())) {
            if (produtoRepository.existsBySlugIgnoreCase(input.slug().trim())) {
                throw new ApiException("SLUG_EXISTS", "Slug já existe", HttpStatus.CONFLICT);
            }
            p.setSlug(input.slug().trim());
        }
        if (input.descricao() != null) {
            p.setDescricao(input.descricao());
        }
        if (input.preco() != null) {
            p.setPreco(input.preco());
        }
        if (input.categoriaId() != null) {
            Categoria cat = categoriaRepository.findById(input.categoriaId())
                    .orElseThrow(() -> new ApiException("NOT_FOUND", "Categoria não encontrada", HttpStatus.NOT_FOUND));
            p.setCategoria(cat);
        }
        if (input.ativo() != null) {
            p.setAtivo(input.ativo());
        }
        if (input.fichaTecnica() != null) {
            p.setFichaTecnica(limparFicha(input.fichaTecnica()));
        }
        if (input.imagens() != null) {
            replaceImagens(p, input.imagens());
        }
        p.setUpdatedAt(OffsetDateTime.now());
        produtoRepository.save(p);
        return ProdutoResponse.from(p, true);
    }

    @Transactional
    public void deletar(Long id) {
        Produto p = produtoRepository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Produto não encontrado", HttpStatus.NOT_FOUND));
        p.setAtivo(false);
        p.setUpdatedAt(OffsetDateTime.now());
    }

    private void applyCreate(Produto p, ProdutoInput input, Categoria cat) {
        p.setNome(input.nome());
        p.setSlug(input.slug().trim());
        p.setDescricao(input.descricao());
        p.setPreco(input.preco());
        p.setCategoria(cat);
        p.setAtivo(Boolean.TRUE.equals(input.ativo()));
        if (input.fichaTecnica() != null) {
            p.setFichaTecnica(limparFicha(input.fichaTecnica()));
        }
        if (input.imagens() != null) {
            replaceImagens(p, input.imagens());
        }
        OffsetDateTime now = OffsetDateTime.now();
        p.setCreatedAt(now);
        p.setUpdatedAt(now);
    }

    /** Sem espaços nas pontas e sem linha em branco na ficha pública; mantém a ordem. */
    private static Map<String, Object> limparFicha(Map<String, Object> ficha) {
        Map<String, Object> limpa = new LinkedHashMap<>();
        ficha.forEach((chave, valor) -> {
            Object v = valor instanceof String s ? s.trim() : valor;
            if (chave != null && !chave.isBlank() && v != null && !"".equals(v)) {
                limpa.put(chave.trim(), v);
            }
        });
        return limpa;
    }

    private void replaceImagens(Produto p, java.util.List<ProdutoInput.ImagemInput> imagens) {
        p.getImagens().clear();
        short i = 0;
        for (ProdutoInput.ImagemInput img : imagens) {
            if (img.url() == null || img.url().isBlank()) {
                continue;
            }
            requireImagemValida(img.url());
            ProdutoImagem pi = new ProdutoImagem();
            pi.setProduto(p);
            pi.setUrl(img.url());
            pi.setAltText(img.altText());
            pi.setOrdem(img.ordem() != null ? img.ordem() : i);
            pi.setCreatedAt(OffsetDateTime.now());
            p.getImagens().add(pi);
            i++;
        }
    }

    /** Arquivo enviado ao catálogo (que exista) ou endereço http(s). */
    private void requireImagemValida(String url) {
        Matcher arquivo = IMAGEM_ENVIADA.matcher(url);
        boolean valida = arquivo.matches()
                ? imagemArquivoRepository.existsById(Long.valueOf(arquivo.group(1)))
                : IMAGEM_EXTERNA.matcher(url).matches();
        if (!valida) {
            throw new ApiException("VALIDATION_ERROR", "Imagem inválida ou inexistente", HttpStatus.BAD_REQUEST);
        }
    }
}
