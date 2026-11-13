package com.catalogo.catalog;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import com.catalogo.catalog.dto.ImagemUploadResponse;
import com.catalogo.catalog.entity.ImagemArquivo;
import com.catalogo.catalog.repository.ImagemArquivoRepository;
import com.catalogo.catalog.service.ImagemArquivoService;
import com.catalogo.shared.ApiException;

@ExtendWith(MockitoExtension.class)
class ImagemArquivoServiceTest {

    static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n', 0, 0, 0, 13, 'I', 'H', 'D', 'R'};

    @Mock
    ImagemArquivoRepository repository;

    ImagemArquivoService service;

    @BeforeEach
    void setUp() {
        service = new ImagemArquivoService(repository);
    }

    @Test
    void salvaPngComTipoDetectadoEDevolveReferencia() {
        when(repository.save(any(ImagemArquivo.class))).thenAnswer(inv -> {
            ImagemArquivo img = inv.getArgument(0);
            img.setId(42L);
            return img;
        });
        // Content-Type do cliente mentindo: o salvo é o detectado.
        ImagemUploadResponse res = service.salvar(new MockMultipartFile("arquivo", "x.bin", "application/octet-stream", PNG));

        assertEquals("produtos/imagens/42", res.url());
        ArgumentCaptor<ImagemArquivo> cap = ArgumentCaptor.forClass(ImagemArquivo.class);
        verify(repository).save(cap.capture());
        assertEquals("image/png", cap.getValue().getContentType());
        assertEquals(PNG.length, cap.getValue().getTamanho());
        assertArrayEquals(PNG, cap.getValue().getConteudo());
    }

    @Test
    void rejeitaTextoMesmoDeclaradoComoPng() {
        MockMultipartFile falso = new MockMultipartFile("arquivo", "x.png", "image/png", "olá, não sou imagem".getBytes());
        ApiException ex = assertThrows(ApiException.class, () -> service.salvar(falso));
        assertEquals("INVALID_IMAGE", ex.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(repository, never()).save(any());
    }

    @Test
    void rejeitaSvgEVazio() {
        MockMultipartFile svg = new MockMultipartFile("arquivo", "x.svg", "image/svg+xml",
                "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>".getBytes());
        assertThrows(ApiException.class, () -> service.salvar(svg));
        assertThrows(ApiException.class, () -> service.salvar(new MockMultipartFile("arquivo", new byte[0])));
        verify(repository, never()).save(any());
    }

    @Test
    void limparOrfasUsaCarenciaDe24h() {
        when(repository.deleteOrfasAntesDe(any())).thenReturn(3);
        OffsetDateTime antes = OffsetDateTime.now();

        assertEquals(3, service.limparOrfas());

        ArgumentCaptor<OffsetDateTime> cap = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(repository).deleteOrfasAntesDe(cap.capture());
        long minutos = Duration.between(cap.getValue(), antes).toMinutes();
        assertTrue(Math.abs(minutos - 24 * 60) <= 1, "limite deve ser ~now-24h");
    }

    @Test
    void buscarInexistenteDa404() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> service.buscar(1L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }
}
