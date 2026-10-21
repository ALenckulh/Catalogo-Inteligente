-- Tabelas de scoring (cache) e grafo da Camada 3.
-- Ver frontend/docs/08-MODELO-DE-DADOS.md §4.11–4.14.

CREATE TABLE score_produto (
    usuario_id    BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    produto_id    BIGINT NOT NULL REFERENCES produto(id) ON DELETE CASCADE,
    valor         NUMERIC(5,2) NOT NULL,
    calculado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, produto_id)
);

CREATE TABLE score_categoria (
    usuario_id    BIGINT NOT NULL REFERENCES usuario(id)   ON DELETE CASCADE,
    categoria_id  BIGINT NOT NULL REFERENCES categoria(id) ON DELETE CASCADE,
    valor         NUMERIC(5,2) NOT NULL,
    calculado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, categoria_id)
);

CREATE TABLE faixa_preco_usuario (
    usuario_id              BIGINT PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
    mediana_com_conversao   NUMERIC(12,2),
    mediana_sem_conversao   NUMERIC(12,2),
    gap_preco               NUMERIC(12,2),
    calculado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE produto_aresta (
    id                   BIGSERIAL PRIMARY KEY,
    origem_produto_id    BIGINT NOT NULL REFERENCES produto(id) ON DELETE CASCADE,
    destino_produto_id   BIGINT NOT NULL REFERENCES produto(id) ON DELETE CASCADE,
    tipo                 tipo_aresta NOT NULL,
    peso                 NUMERIC(6,4) NOT NULL,
    qtd_observacoes      INTEGER NOT NULL DEFAULT 0,
    atualizado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT produto_aresta_uq UNIQUE (origem_produto_id, destino_produto_id, tipo)
);
