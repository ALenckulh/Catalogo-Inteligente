package com.catalogo.catalog.service;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Set;

import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.catalogo.catalog.dto.ImagemUploadResponse;
import com.catalogo.catalog.entity.ImagemArquivo;
import com.catalogo.catalog.repository.ImagemArquivoRepository;
import com.catalogo.shared.ApiException;

/**
 * Guarda imagens como BLOB no Postgres. Único ponto a trocar numa migração para object storage
 * (salvar → put no bucket; buscar → redirect para a URL do bucket/CDN).
 */
@Service
public class ImagemArquivoService {

    private static final Logger log = LoggerFactory.getLogger(ImagemArquivoService.class);

    /** Carência: protege o upload de um formulário que ainda não foi salvo. */
    static final int CARENCIA_HORAS = 24;

    static final Set<String> TIPOS_ACEITOS = Set.of("image/jpeg", "image/png", "image/webp");

    private final ImagemArquivoRepository repository;
    private final Tika tika = new Tika();

    public ImagemArquivoService(ImagemArquivoRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ImagemUploadResponse salvar(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw invalida("Arquivo vazio");
        }
        byte[] bytes;
        try {
            bytes = arquivo.getBytes();
        } catch (IOException e) {
            throw invalida("Não foi possível ler o arquivo");
        }
        // Tipo pelos magic bytes — o Content-Type do multipart vem do cliente.
        String tipo = tika.detect(bytes);
        if (!TIPOS_ACEITOS.contains(tipo)) {
            throw invalida("Formato não suportado. Envie JPEG, PNG ou WebP");
        }
        ImagemArquivo img = new ImagemArquivo();
        img.setContentType(tipo);
        img.setTamanho(bytes.length);
        img.setConteudo(bytes);
        img = repository.save(img);
        return new ImagemUploadResponse(img.getId(), "produtos/imagens/" + img.getId());
    }

    @Transactional(readOnly = true)
    public ImagemArquivo buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Imagem não encontrada", HttpStatus.NOT_FOUND));
    }

    /**
     * Remove arquivos órfãos com mais de 24h: upload sem salvar o produto, foto trocada ou removida,
     * produto apagado. Produto inativo ainda referencia as fotos, então elas ficam.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public int limparOrfas() {
        int removidas = repository.deleteOrfasAntesDe(OffsetDateTime.now().minusHours(CARENCIA_HORAS));
        log.info("Limpeza de imagens órfãs: {} removida(s)", removidas);
        return removidas;
    }

    private static ApiException invalida(String msg) {
        return new ApiException("INVALID_IMAGE", msg, HttpStatus.BAD_REQUEST);
    }
}
