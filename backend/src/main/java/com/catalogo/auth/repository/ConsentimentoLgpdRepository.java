package com.catalogo.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.auth.domain.TipoConsentimento;
import com.catalogo.auth.entity.ConsentimentoLgpd;

public interface ConsentimentoLgpdRepository extends JpaRepository<ConsentimentoLgpd, Long> {

    Optional<ConsentimentoLgpd> findFirstByUsuario_IdAndTipoOrderByAceitoEmDesc(
            Long usuarioId,
            TipoConsentimento tipo
    );

    List<ConsentimentoLgpd> findByUsuario_IdOrderByAceitoEmDesc(Long usuarioId);
}
