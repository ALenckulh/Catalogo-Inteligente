package com.catalogo.admin.repository;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

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
                    ORDER BY sc.valor DESC
                    LIMIT 1
                ) tc ON TRUE
                LEFT JOIN LATERAL (
                    SELECT MAX(e.ocorrido_em) AS ultima
                    FROM evento e
                    WHERE e.usuario_id = u.id AND e.deleted_at IS NULL
                ) ua ON TRUE
                WHERE u.deleted_at IS NULL
                ORDER BY mx.max_score DESC
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

    @SuppressWarnings("unchecked")
    public List<Object[]> usuarioEnrichment(Long usuarioId) {
        return em.createNativeQuery("""
                SELECT
                  (SELECT MAX(valor) FROM score_produto WHERE usuario_id = :uid),
                  (SELECT c.nome FROM score_categoria sc
                     JOIN categoria c ON c.id = sc.categoria_id
                    WHERE sc.usuario_id = :uid
                    ORDER BY sc.valor DESC LIMIT 1),
                  (SELECT MAX(ocorrido_em) FROM evento
                    WHERE usuario_id = :uid AND deleted_at IS NULL)
                """)
                .setParameter("uid", usuarioId)
                .getResultList();
    }
}
