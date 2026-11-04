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
                SELECT COUNT(DISTINCT usuario_id) FROM score_produto
                WHERE usuario_id IS NOT NULL AND valor >= :min
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

    @SuppressWarnings("unchecked")
    public List<Object[]> scoreDistribution() {
        return em.createNativeQuery("""
                SELECT
                  CASE
                    WHEN valor < 20 THEN '0-20'
                    WHEN valor < 40 THEN '20-40'
                    WHEN valor < 60 THEN '40-60'
                    WHEN valor < 80 THEN '60-80'
                    ELSE '80-100'
                  END AS faixa,
                  COUNT(*)
                FROM score_produto
                WHERE usuario_id IS NOT NULL
                GROUP BY 1
                ORDER BY 1
                """)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> contatosPorDia(OffsetDateTime since) {
        return em.createNativeQuery("""
                SELECT CAST(ocorrido_em AS date) AS dia, COUNT(*)
                FROM evento
                WHERE deleted_at IS NULL
                  AND tipo = 'CONTATO_WHATSAPP'
                  AND ocorrido_em >= :since
                GROUP BY 1
                ORDER BY 1
                """)
                .setParameter("since", since)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Object[]> leadsPorCategoria() {
        return em.createNativeQuery("""
                SELECT c.nome, COUNT(DISTINCT sc.usuario_id)
                FROM score_categoria sc
                JOIN categoria c ON c.id = sc.categoria_id
                JOIN (
                    SELECT usuario_id, MAX(valor) AS maxv
                    FROM score_categoria
                    WHERE usuario_id IS NOT NULL
                    GROUP BY usuario_id
                ) tops ON tops.usuario_id = sc.usuario_id AND tops.maxv = sc.valor
                WHERE sc.usuario_id IS NOT NULL
                GROUP BY c.nome
                ORDER BY COUNT(DISTINCT sc.usuario_id) DESC
                LIMIT 20
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
