-- Tabelas de catálogo: categoria, produto, produto_imagem, favorito.
-- Ver frontend/docs/08-MODELO-DE-DADOS.md §4.4–4.7.

CREATE TABLE categoria (
    id          BIGSERIAL PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    slug        VARCHAR(140) NOT NULL UNIQUE,
    parent_id   BIGINT REFERENCES categoria(id) ON DELETE RESTRICT,
    descricao   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE produto (
    id             BIGSERIAL PRIMARY KEY,
    nome           VARCHAR(200) NOT NULL,
    slug           VARCHAR(220) NOT NULL UNIQUE,
    descricao      TEXT,
    ficha_tecnica  JSONB,
    preco          NUMERIC(12,2) NOT NULL,
    categoria_id   BIGINT NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    ativo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE produto_imagem (
    id          BIGSERIAL PRIMARY KEY,
    produto_id  BIGINT NOT NULL REFERENCES produto(id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    ordem       SMALLINT NOT NULL DEFAULT 0,
    alt_text    VARCHAR(200),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE favorito (
    usuario_id  BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    produto_id  BIGINT NOT NULL REFERENCES produto(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, produto_id)
);
