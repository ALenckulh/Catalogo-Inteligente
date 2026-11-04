package com.catalogo.lgpd.repository;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class CompraAnonymizeRepository {

    @PersistenceContext
    private EntityManager em;

    public int softDeleteByUsuarioId(Long usuarioId) {
        return em.createNativeQuery("""
                UPDATE compra SET deleted_at = now()
                WHERE usuario_id = :usuarioId AND deleted_at IS NULL
                """)
                .setParameter("usuarioId", usuarioId)
                .executeUpdate();
    }
}
