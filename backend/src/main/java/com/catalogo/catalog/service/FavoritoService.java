package com.catalogo.catalog.service;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.catalog.dto.FavoritoResponse;
import com.catalogo.catalog.entity.Favorito;
import com.catalogo.catalog.entity.Produto;
import com.catalogo.catalog.repository.FavoritoRepository;
import com.catalogo.catalog.repository.ProdutoRepository;
import com.catalogo.shared.ApiException;

@Service
public class FavoritoService {

    private final FavoritoRepository favoritoRepository;
    private final ProdutoRepository produtoRepository;

    public FavoritoService(FavoritoRepository favoritoRepository, ProdutoRepository produtoRepository) {
        this.favoritoRepository = favoritoRepository;
        this.produtoRepository = produtoRepository;
    }

    @Transactional(readOnly = true)
    public List<FavoritoResponse> listar(Long usuarioId) {
        return favoritoRepository.findAtivosByUsuarioId(usuarioId).stream()
                .map(FavoritoResponse::from)
                .toList();
    }

    @Transactional
    public void favoritar(Long usuarioId, Long produtoId) {
        Produto produto = produtoRepository.findById(produtoId)
                .filter(Produto::isAtivo)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Produto não encontrado", HttpStatus.NOT_FOUND));

        Favorito favorito = favoritoRepository.findByUsuarioIdAndProdutoId(usuarioId, produtoId)
                .orElseGet(() -> {
                    Favorito f = new Favorito();
                    f.setUsuarioId(usuarioId);
                    f.setProdutoId(produto.getId());
                    f.setCreatedAt(OffsetDateTime.now());
                    return f;
                });
        favorito.setDeletedAt(null);
        favoritoRepository.save(favorito);
    }

    @Transactional
    public void desfavoritar(Long usuarioId, Long produtoId) {
        favoritoRepository.findByUsuarioIdAndProdutoId(usuarioId, produtoId).ifPresent(f -> {
            if (f.getDeletedAt() == null) {
                f.setDeletedAt(OffsetDateTime.now());
            }
        });
    }
}
