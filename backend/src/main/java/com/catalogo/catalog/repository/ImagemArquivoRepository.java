package com.catalogo.catalog.repository;

import java.time.OffsetDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.catalogo.catalog.entity.ImagemArquivo;

public interface ImagemArquivoRepository extends JpaRepository<ImagemArquivo, Long> {

    /** Apaga arquivos criados antes de `limite` que nenhum produto_imagem.url referencia. */
    @Modifying(clearAutomatically = true)
    @Query(value = """
            DELETE FROM imagem_arquivo a
            WHERE a.created_at < :limite
              AND NOT EXISTS (
                SELECT 1 FROM produto_imagem p
                WHERE p.url = 'produtos/imagens/' || a.id
              )
            """, nativeQuery = true)
    int deleteOrfasAntesDe(@Param("limite") OffsetDateTime limite);
}
