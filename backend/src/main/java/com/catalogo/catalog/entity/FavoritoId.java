package com.catalogo.catalog.entity;

import java.io.Serializable;
import java.util.Objects;

public class FavoritoId implements Serializable {

    private Long usuarioId;
    private Long produtoId;

    public FavoritoId() {
    }

    public FavoritoId(Long usuarioId, Long produtoId) {
        this.usuarioId = usuarioId;
        this.produtoId = produtoId;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public Long getProdutoId() {
        return produtoId;
    }

    public void setProdutoId(Long produtoId) {
        this.produtoId = produtoId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof FavoritoId that)) {
            return false;
        }
        return Objects.equals(usuarioId, that.usuarioId) && Objects.equals(produtoId, that.produtoId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(usuarioId, produtoId);
    }
}
