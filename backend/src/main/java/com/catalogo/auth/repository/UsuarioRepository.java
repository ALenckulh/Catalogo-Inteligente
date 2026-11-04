package com.catalogo.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    Optional<Usuario> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByCpf(String cpf);

    boolean existsByCnpj(String cnpj);

    long countByTipoNotAndDeletedAtIsNull(TipoUsuario tipo);

    @Query("""
            SELECT COUNT(u) FROM Usuario u
            WHERE u.deletedAt IS NULL AND u.tipo <> com.catalogo.auth.domain.TipoUsuario.ADMIN
            """)
    long countConsumidoresAtivos();

    @Query("""
            SELECT u FROM Usuario u
            WHERE u.id = :id
            """)
    Optional<Usuario> findByIdIncludingDeleted(@Param("id") Long id);
}
