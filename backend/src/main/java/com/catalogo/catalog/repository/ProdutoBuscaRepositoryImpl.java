package com.catalogo.catalog.repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;

import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.catalogo.catalog.entity.Produto;
import com.catalogo.shared.BuscaTexto;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

class ProdutoBuscaRepositoryImpl implements ProdutoBuscaRepository {

    /** Textos que ordenam ignorando acento e caixa; a collation padrão do Postgres Alpine põe "Óleo" depois do Z. */
    private static final Set<String> ORDENA_EM_PT_BR = Set.of("nome", "slug");
    /** Com aspas: o Hibernate escreve o nome da collation como recebe. */
    private static final String PT_BR = "\"pt-BR-x-icu\"";

    @PersistenceContext
    private EntityManager em;

    @Override
    public List<Long> searchIds(String q, Collection<Long> categoriaIds, BigDecimal precoMin, BigDecimal precoMax) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<Produto> p = cq.from(Produto.class);
        List<Predicate> filtros = texto(cb, p, q, "nome", "descricao");
        filtros.add(cb.isTrue(p.get("ativo")));
        if (categoriaIds != null) {
            filtros.add(p.get("categoria").get("id").in(categoriaIds));
        }
        if (precoMin != null) {
            filtros.add(cb.greaterThanOrEqualTo(p.get("preco"), precoMin));
        }
        if (precoMax != null) {
            filtros.add(cb.lessThanOrEqualTo(p.get("preco"), precoMax));
        }
        cq.select(p.get("id")).where(filtros.toArray(Predicate[]::new));
        return comTexto(em.createQuery(cq), q).getResultList();
    }

    @Override
    public Page<Produto> adminSearch(String q, Boolean ativo, Pageable pageable) {
        HibernateCriteriaBuilder cb = (HibernateCriteriaBuilder) em.getCriteriaBuilder();
        CriteriaQuery<Produto> cq = cb.createQuery(Produto.class);
        Root<Produto> p = cq.from(Produto.class);
        cq.select(p).where(filtrosAdmin(cb, p, q, ativo)).orderBy(ordem(cb, p, pageable.getSort()));
        List<Produto> itens = comTexto(em.createQuery(cq), q)
                .setFirstResult(Math.toIntExact(Math.min(pageable.getOffset(), Integer.MAX_VALUE)))
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        CriteriaQuery<Long> total = cb.createQuery(Long.class);
        Root<Produto> t = total.from(Produto.class);
        total.select(cb.count(t)).where(filtrosAdmin(cb, t, q, ativo));
        return new PageImpl<>(itens, pageable, comTexto(em.createQuery(total), q).getSingleResult());
    }

    private static Predicate[] filtrosAdmin(CriteriaBuilder cb, Root<Produto> p, String q, Boolean ativo) {
        List<Predicate> filtros = texto(cb, p, q, "nome", "slug");
        if (ativo != null) {
            filtros.add(cb.equal(p.get("ativo"), ativo));
        }
        return filtros.toArray(Predicate[]::new);
    }

    /** Cada palavra em pelo menos um dos campos, sem acento. Os valores entram em {@link #comTexto}. */
    private static List<Predicate> texto(CriteriaBuilder cb, Root<Produto> p, String q, String... campos) {
        List<Predicate> todas = new ArrayList<>();
        for (int i = 0; i < BuscaTexto.padroes(q).size(); i++) {
            Expression<String> padrao = cb.function("unaccent", String.class, cb.parameter(String.class, "q" + i));
            List<Predicate> algum = new ArrayList<>();
            for (String campo : campos) {
                Expression<String> valor = cb.function("unaccent", String.class, cb.lower(p.get(campo)));
                algum.add(cb.like(valor, padrao, BuscaTexto.ESCAPE));
            }
            todas.add(cb.or(algum.toArray(Predicate[]::new)));
        }
        return todas;
    }

    private static <X> TypedQuery<X> comTexto(TypedQuery<X> query, String q) {
        List<String> padroes = BuscaTexto.padroes(q);
        for (int i = 0; i < padroes.size(); i++) {
            query.setParameter("q" + i, padroes.get(i));
        }
        return query;
    }

    private static List<Order> ordem(HibernateCriteriaBuilder cb, Root<Produto> p, Sort sort) {
        return sort.stream().<Order>map(o -> {
            Expression<?> campo = ORDENA_EM_PT_BR.contains(o.getProperty())
                    ? cb.collate(p.get(o.getProperty()), PT_BR)
                    : p.get(o.getProperty());
            return o.isAscending() ? cb.asc(campo) : cb.desc(campo);
        }).toList();
    }
}
