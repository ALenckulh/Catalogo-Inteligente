package com.catalogo.admin.repository;

import com.catalogo.shared.BuscaTexto;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Repository;

import com.catalogo.admin.domain.NivelInteresse;
import com.catalogo.auth.domain.TipoUsuario;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

/** Dashboard e lista de clientes do admin em SQL nativo (agregações que ficariam ilegíveis em JPQL). */
@Repository
public class AdminAnalyticsRepository {

    @PersistenceContext
    private EntityManager em;

    public long countContatosSince(OffsetDateTime since) {
        Number n = (Number) em.createNativeQuery("""
                SELECT COUNT(*) FROM evento
                WHERE deleted_at IS NULL
                  AND tipo = 'CONTATO_WHATSAPP'
                  AND ocorrido_em >= :since
                """)
                .setParameter("since", since)
                .getSingleResult();
        return n.longValue();
    }

    public long countLeadsScoreAlto(double minScore) {
        Number n = (Number) em.createNativeQuery("""
                SELECT COUNT(DISTINCT sp.usuario_id)
                FROM score_produto sp
                JOIN usuario u ON u.id = sp.usuario_id
                WHERE u.deleted_at IS NULL AND u.tipo <> 'ADMIN' AND sp.valor >= :min
                """)
                .setParameter("min", minScore)
                .getSingleResult();
        return n.longValue();
    }

    /**
     * Clientes com maior nota: subquery com MAX(valor) por usuário + dois LEFT JOIN LATERAL, um para a
     * categoria de maior nota (ORDER BY valor DESC LIMIT 1) e outro para a última atividade.
     * LATERAL deixa a subquery "enxergar" o u.id da linha externa.
     */
    @SuppressWarnings("unchecked")
    public List<Object[]> topLeads(int limit) {
        // Avoid Hibernate rewriting PG casts (:: / CAST ... AS text) into bogus Java types.
        return em.createNativeQuery("""
                SELECT u.id,
                       COALESCE(u.nome_completo, u.razao_social, u.email) AS nome,
                       u.tipo,
                       u.email,
                       u.telefone,
                       mx.max_score,
                       tc.cat_nome,
                       ua.ultima
                FROM usuario u
                JOIN (
                    SELECT usuario_id, MAX(valor) AS max_score
                    FROM score_produto
                    WHERE usuario_id IS NOT NULL
                    GROUP BY usuario_id
                ) mx ON mx.usuario_id = u.id
                LEFT JOIN LATERAL (
                    SELECT c.nome AS cat_nome
                    FROM score_categoria sc
                    JOIN categoria c ON c.id = sc.categoria_id
                    WHERE sc.usuario_id = u.id
                    ORDER BY sc.valor DESC, sc.categoria_id
                    LIMIT 1
                ) tc ON TRUE
                LEFT JOIN LATERAL (
                    SELECT MAX(e.ocorrido_em) AS ultima
                    FROM evento e
                    WHERE e.usuario_id = u.id AND e.deleted_at IS NULL
                ) ua ON TRUE
                WHERE u.deleted_at IS NULL
                ORDER BY mx.max_score DESC, u.id
                LIMIT 50
                """)
                .getResultList()
                .stream()
                .filter(row -> {
                    Object[] r = (Object[]) row;
                    return r[2] == null || !"ADMIN".equalsIgnoreCase(String.valueOf(r[2]));
                })
                .limit(limit)
                .toList();
    }

    /**
     * "Temperatura" dos usuários ativos (não ADMIN) pelo maior score de produto:
     * QUENTE (≥ alto), MORNO (≥ morno), FRIO (&lt; morno) e SEM_SCORE (nenhum score).
     * Sempre retorna os 4 níveis, nessa ordem, mesmo com contagem zero.
     */
    @SuppressWarnings("unchecked")
    public List<Object[]> scoreDistribution(double alto, double morno) {
        return em.createNativeQuery("""
                WITH mx AS (
                    SELECT u.id, MAX(sp.valor) AS v
                    FROM usuario u
                    LEFT JOIN score_produto sp ON sp.usuario_id = u.id
                    WHERE u.deleted_at IS NULL AND u.tipo <> 'ADMIN'
                    GROUP BY u.id
                )
                SELECT n.faixa, COUNT(mx.id)
                FROM (VALUES (0, 'QUENTE'), (1, 'MORNO'), (2, 'FRIO'), (3, 'SEM_SCORE')) AS n(ord, faixa)
                LEFT JOIN mx ON n.ord = CASE
                                          WHEN mx.v IS NULL THEN 3
                                          WHEN mx.v >= :alto THEN 0
                                          WHEN mx.v >= :morno THEN 1
                                          ELSE 2
                                        END
                GROUP BY n.ord, n.faixa
                ORDER BY n.ord
                """)
                .setParameter("alto", alto)
                .setParameter("morno", morno)
                .getResultList();
    }

    /**
     * Contatos WhatsApp por dia desde {@code since} até hoje, com zero nos dias sem contato.
     * generate_series cria uma linha para cada dia do período e o LEFT JOIN com evento conta os contatos;
     * assim dia sem contato aparece com 0 em vez de sumir do gráfico.
     */
    @SuppressWarnings("unchecked")
    public List<Object[]> contatosPorDia(OffsetDateTime since) {
        return em.createNativeQuery("""
                SELECT CAST(d AS date) AS dia, COUNT(e.id)
                FROM generate_series(CAST(CAST(:since AS date) AS timestamp),
                                     CAST(CURRENT_DATE AS timestamp),
                                     interval '1 day') AS d
                LEFT JOIN evento e
                       ON CAST(e.ocorrido_em AS date) = CAST(d AS date)
                      AND e.ocorrido_em >= :since
                      AND e.deleted_at IS NULL
                      AND e.tipo = 'CONTATO_WHATSAPP'
                GROUP BY d
                ORDER BY d
                """)
                .setParameter("since", since)
                .getResultList();
    }

    /**
     * Usuários ativos (não ADMIN) cuja categoria de maior score é a categoria — top 10.
     * Empates contam o usuário em todas as categorias empatadas.
     */
    @SuppressWarnings("unchecked")
    public List<Object[]> leadsPorCategoria() {
        return em.createNativeQuery("""
                SELECT c.nome, COUNT(DISTINCT sc.usuario_id)
                FROM score_categoria sc
                JOIN categoria c ON c.id = sc.categoria_id
                JOIN usuario u ON u.id = sc.usuario_id
                JOIN (
                    SELECT usuario_id, MAX(valor) AS maxv
                    FROM score_categoria
                    WHERE usuario_id IS NOT NULL
                    GROUP BY usuario_id
                ) tops ON tops.usuario_id = sc.usuario_id AND tops.maxv = sc.valor
                WHERE u.deleted_at IS NULL AND u.tipo <> 'ADMIN'
                GROUP BY c.nome
                ORDER BY COUNT(DISTINCT sc.usuario_id) DESC
                LIMIT 10
                """)
                .getResultList();
    }

    /** Filtros da lista de clientes; nulo = sem filtro. */
    public record FiltroUsuarios(
            TipoUsuario tipo,
            String categoria,
            BigDecimal scoreMin,
            NivelInteresse nivel,
            String q,
            Boolean ativo
    ) {
    }

    /** pt-BR ignora acento e caixa na ordem; a collation padrão do Postgres Alpine põe "Ônibus" depois do Z. */
    private static final String PT_BR = " COLLATE \"pt-BR-x-icu\"";

    /** Colunas ordenáveis da lista de clientes: nome público → expressão SQL. */
    private static final Map<String, String> ORDENACAO_USUARIOS = Map.of(
            "nome", "COALESCE(u.nome_completo, u.razao_social)" + PT_BR,
            "email", "u.email" + PT_BR,
            "scoreMaxProduto", "mx.max_score",
            "topCategoria", "tc.cat_nome" + PT_BR,
            "ultimaAtividade", "ua.ultima"
    );

    /**
     * Página de clientes: [id, nota máxima, top categoria, última atividade]. Uma consulta só; os LATERAL
     * calculam os três valores por cliente, para que filtro, ordenação e paginação rodem no banco.
     *
     * @param sort "campo,asc|desc" com campo em {@link #ORDENACAO_USUARIOS}; inválido ou nulo = id desc.
     */
    @SuppressWarnings("unchecked")
    public List<Object[]> usuarios(FiltroUsuarios filtro, String sort, int limit, long offset) {
        Map<String, Object> params = new HashMap<>();
        String sql = "SELECT u.id, mx.max_score, tc.cat_nome, ua.ultima"
                + fromUsuarios(filtro, params)
                + " ORDER BY " + orderByUsuarios(sort)
                + " LIMIT :limit OFFSET :offset";
        params.put("limit", limit);
        params.put("offset", offset);
        return comParametros(sql, params).getResultList();
    }

    public long countUsuarios(FiltroUsuarios filtro) {
        Map<String, Object> params = new HashMap<>();
        String sql = "SELECT COUNT(*)" + fromUsuarios(filtro, params);
        return ((Number) comParametros(sql, params).getSingleResult()).longValue();
    }

    private Query comParametros(String sql, Map<String, Object> params) {
        Query query = em.createNativeQuery(sql);
        params.forEach(query::setParameter);
        return query;
    }

    /** Só entra no SQL o filtro preenchido: parâmetro nulo sem tipo quebra em query nativa no Postgres. */
    private static String fromUsuarios(FiltroUsuarios f, Map<String, Object> params) {
        StringBuilder sql = new StringBuilder("""

                FROM usuario u
                LEFT JOIN LATERAL (
                    SELECT MAX(sp.valor) AS max_score
                    FROM score_produto sp
                    WHERE sp.usuario_id = u.id
                ) mx ON TRUE
                LEFT JOIN LATERAL (
                    SELECT c.nome AS cat_nome
                    FROM score_categoria sc
                    JOIN categoria c ON c.id = sc.categoria_id
                    WHERE sc.usuario_id = u.id
                    ORDER BY sc.valor DESC, sc.categoria_id
                    LIMIT 1
                ) tc ON TRUE
                LEFT JOIN LATERAL (
                    SELECT MAX(e.ocorrido_em) AS ultima
                    FROM evento e
                    WHERE e.usuario_id = u.id AND e.deleted_at IS NULL
                ) ua ON TRUE
                WHERE u.tipo <> 'ADMIN'
                """);
        if (f.tipo() != null) {
            // Nome de enum Java, nunca texto do cliente; como parâmetro exigiria cast para tipo_usuario.
            sql.append(" AND u.tipo = '").append(f.tipo().name()).append("'");
        }
        if (f.ativo() != null) {
            sql.append(f.ativo() ? " AND u.deleted_at IS NULL" : " AND u.deleted_at IS NOT NULL");
        }
        filtroTexto(f.q(), sql, params);
        if (f.categoria() != null && !f.categoria().isBlank()) {
            sql.append(" AND LOWER(tc.cat_nome) = :categoria");
            params.put("categoria", f.categoria().trim().toLowerCase(Locale.ROOT));
        }
        if (f.scoreMin() != null) {
            sql.append(" AND mx.max_score >= :scoreMin");
            params.put("scoreMin", f.scoreMin());
        }
        if (f.nivel() != null) {
            switch (f.nivel()) {
                case QUENTE -> {
                    sql.append(" AND mx.max_score >= :alto");
                    params.put("alto", NivelInteresse.ALTO);
                }
                case MORNO -> {
                    sql.append(" AND mx.max_score >= :morno AND mx.max_score < :alto");
                    params.put("morno", NivelInteresse.MORNO_MIN);
                    params.put("alto", NivelInteresse.ALTO);
                }
                case FRIO -> {
                    sql.append(" AND mx.max_score < :morno");
                    params.put("morno", NivelInteresse.MORNO_MIN);
                }
                case SEM_SCORE -> sql.append(" AND mx.max_score IS NULL");
            }
        }
        return sql.toString();
    }

    /** Nome, razão social ou e-mail; se a busca for só de números, também CPF, CNPJ e telefone (gravados só com dígitos). */
    static void filtroTexto(String q, StringBuilder sql, Map<String, Object> params) {
        List<String> padroes = BuscaTexto.padroes(q);
        if (padroes.isEmpty()) {
            return;
        }
        List<String> palavras = new ArrayList<>();
        for (int i = 0; i < padroes.size(); i++) {
            String nome = "q" + i;
            palavras.add(Stream.of("u.email", "u.nome_completo", "u.razao_social")
                    .map(c -> "unaccent(LOWER(" + c + ")) LIKE unaccent(:" + nome + ") ESCAPE '" + BuscaTexto.ESCAPE + "'")
                    .collect(Collectors.joining(" OR ", "(", ")")));
            params.put(nome, padroes.get(i));
        }
        sql.append(" AND (").append(String.join(" AND ", palavras));
        String digitos = BuscaTexto.digitos(q);
        if (digitos != null) {
            // '55' na frente: acha o telefone digitado com ou sem o DDI, seja qual for a forma gravada.
            sql.append(" OR u.cpf LIKE :digitos OR u.cnpj LIKE :digitos OR '55' || u.telefone LIKE :digitos");
            params.put("digitos", "%" + digitos + "%");
        }
        sql.append(")");
    }

    /** Sem valor = menor que todos (primeiro no crescente); id como desempate deixa a paginação estável. */
    static String orderByUsuarios(String sort) {
        if (sort != null) {
            String[] parts = sort.split(",", -1);
            String coluna = ORDENACAO_USUARIOS.get(parts[0].trim());
            if (coluna != null) {
                boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
                return coluna + (desc ? " DESC NULLS LAST" : " ASC NULLS FIRST") + ", u.id";
            }
        }
        return "u.id DESC";
    }
}
