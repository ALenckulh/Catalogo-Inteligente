package com.catalogo.scoring.repository;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Reassign visitante scores → usuario on migrar-historico.
 * Conflict: keep max(valor), drop visitante row.
 */
@Repository
public class ScoreMigrationRepository {

    @PersistenceContext
    private EntityManager em;

    public void reassignVisitanteToUsuario(Long usuarioId, Long visitanteId) {
        mergeMaxProduto(usuarioId, visitanteId);
        deleteConflictingProduto(usuarioId, visitanteId);
        reassignRemainingProduto(usuarioId, visitanteId);

        mergeMaxCategoria(usuarioId, visitanteId);
        deleteConflictingCategoria(usuarioId, visitanteId);
        reassignRemainingCategoria(usuarioId, visitanteId);

        mergeFaixa(usuarioId, visitanteId);
        deleteConflictingFaixa(usuarioId, visitanteId);
        reassignRemainingFaixa(usuarioId, visitanteId);
    }

    private void mergeMaxProduto(Long usuarioId, Long visitanteId) {
        em.createNativeQuery("""
                UPDATE score_produto u
                SET valor = GREATEST(u.valor, v.valor), calculado_em = now()
                FROM score_produto v
                WHERE u.usuario_id = :uid
                  AND v.visitante_id = :vid
                  AND u.produto_id = v.produto_id
                """)
                .setParameter("uid", usuarioId)
                .setParameter("vid", visitanteId)
                .executeUpdate();
    }

    private void deleteConflictingProduto(Long usuarioId, Long visitanteId) {
        em.createNativeQuery("""
                DELETE FROM score_produto v
                USING score_produto u
                WHERE v.visitante_id = :vid
                  AND u.usuario_id = :uid
                  AND v.produto_id = u.produto_id
                """)
                .setParameter("uid", usuarioId)
                .setParameter("vid", visitanteId)
                .executeUpdate();
    }

    private void reassignRemainingProduto(Long usuarioId, Long visitanteId) {
        em.createNativeQuery("""
                UPDATE score_produto
                SET usuario_id = :uid, visitante_id = NULL
                WHERE visitante_id = :vid
                """)
                .setParameter("uid", usuarioId)
                .setParameter("vid", visitanteId)
                .executeUpdate();
    }

    private void mergeMaxCategoria(Long usuarioId, Long visitanteId) {
        em.createNativeQuery("""
                UPDATE score_categoria u
                SET valor = GREATEST(u.valor, v.valor), calculado_em = now()
                FROM score_categoria v
                WHERE u.usuario_id = :uid
                  AND v.visitante_id = :vid
                  AND u.categoria_id = v.categoria_id
                """)
                .setParameter("uid", usuarioId)
                .setParameter("vid", visitanteId)
                .executeUpdate();
    }

    private void deleteConflictingCategoria(Long usuarioId, Long visitanteId) {
        em.createNativeQuery("""
                DELETE FROM score_categoria v
                USING score_categoria u
                WHERE v.visitante_id = :vid
                  AND u.usuario_id = :uid
                  AND v.categoria_id = u.categoria_id
                """)
                .setParameter("uid", usuarioId)
                .setParameter("vid", visitanteId)
                .executeUpdate();
    }

    private void reassignRemainingCategoria(Long usuarioId, Long visitanteId) {
        em.createNativeQuery("""
                UPDATE score_categoria
                SET usuario_id = :uid, visitante_id = NULL
                WHERE visitante_id = :vid
                """)
                .setParameter("uid", usuarioId)
                .setParameter("vid", visitanteId)
                .executeUpdate();
    }

    private void mergeFaixa(Long usuarioId, Long visitanteId) {
        em.createNativeQuery("""
                UPDATE faixa_preco_usuario u
                SET mediana_com_conversao = COALESCE(u.mediana_com_conversao, v.mediana_com_conversao),
                    mediana_sem_conversao = COALESCE(u.mediana_sem_conversao, v.mediana_sem_conversao),
                    gap_preco = COALESCE(u.gap_preco, v.gap_preco),
                    calculado_em = now()
                FROM faixa_preco_usuario v
                WHERE u.usuario_id = :uid AND v.visitante_id = :vid
                """)
                .setParameter("uid", usuarioId)
                .setParameter("vid", visitanteId)
                .executeUpdate();
    }

    private void deleteConflictingFaixa(Long usuarioId, Long visitanteId) {
        em.createNativeQuery("""
                DELETE FROM faixa_preco_usuario v
                USING faixa_preco_usuario u
                WHERE v.visitante_id = :vid AND u.usuario_id = :uid
                """)
                .setParameter("uid", usuarioId)
                .setParameter("vid", visitanteId)
                .executeUpdate();
    }

    private void reassignRemainingFaixa(Long usuarioId, Long visitanteId) {
        em.createNativeQuery("""
                UPDATE faixa_preco_usuario
                SET usuario_id = :uid, visitante_id = NULL
                WHERE visitante_id = :vid
                """)
                .setParameter("uid", usuarioId)
                .setParameter("vid", visitanteId)
                .executeUpdate();
    }
}
