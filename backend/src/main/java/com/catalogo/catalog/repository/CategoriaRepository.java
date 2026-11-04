package com.catalogo.catalog.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.catalogo.catalog.entity.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
}
