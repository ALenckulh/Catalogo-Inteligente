-- Alinha scoring (XOR usuario/visitante), boost_conversao, favorito.deleted_at
-- e password_reset_token com frontend/docs/08-MODELO-DE-DADOS.md.
-- Não edita V001–V011 (checksum Flyway). Cache de scores é rebuildado (dev).

-- ---------------------------------------------------------------------------
-- 1. favorito.deleted_at (LGPD §5.2)
-- ---------------------------------------------------------------------------
ALTER TABLE favorito
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS favorito_ativos_idx
    ON favorito (usuario_id)
    WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. parametro_decay.boost_conversao + unique parcial (uma global + uma/cat)
-- ---------------------------------------------------------------------------
ALTER TABLE parametro_decay
    ADD COLUMN IF NOT EXISTS boost_conversao NUMERIC(3,2) NOT NULL DEFAULT 1.00;

-- Remove UNIQUE implícito de categoria_id (permite vários NULL em PG).
ALTER TABLE parametro_decay
    DROP CONSTRAINT IF EXISTS parametro_decay_categoria_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS parametro_decay_categoria_uq
    ON parametro_decay (categoria_id)
    WHERE categoria_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS parametro_decay_global_uq
    ON parametro_decay ((TRUE))
    WHERE categoria_id IS NULL;

UPDATE parametro_decay
   SET boost_conversao = 1.00
 WHERE categoria_id IS NULL
   AND boost_conversao IS DISTINCT FROM 1.00;

-- ---------------------------------------------------------------------------
-- 3. Rebuild score_produto / score_categoria / faixa_preco_usuario (XOR)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS score_produto CASCADE;
DROP TABLE IF EXISTS score_categoria CASCADE;
DROP TABLE IF EXISTS faixa_preco_usuario CASCADE;

CREATE TABLE score_produto (
    id            BIGSERIAL PRIMARY KEY,
    usuario_id    BIGINT REFERENCES usuario(id) ON DELETE CASCADE,
    visitante_id  BIGINT REFERENCES visitante(id) ON DELETE CASCADE,
    produto_id    BIGINT NOT NULL REFERENCES produto(id) ON DELETE CASCADE,
    valor         NUMERIC(5,2) NOT NULL,
    calculado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT score_produto_xor_chk
        CHECK ((usuario_id IS NULL) <> (visitante_id IS NULL))
);

CREATE UNIQUE INDEX score_produto_usuario_uq
    ON score_produto (usuario_id, produto_id)
    WHERE usuario_id IS NOT NULL;

CREATE UNIQUE INDEX score_produto_visitante_uq
    ON score_produto (visitante_id, produto_id)
    WHERE visitante_id IS NOT NULL;

CREATE INDEX score_produto_usuario_rank_idx
    ON score_produto (usuario_id, valor DESC)
    WHERE usuario_id IS NOT NULL;

CREATE INDEX score_produto_visitante_rank_idx
    ON score_produto (visitante_id, valor DESC)
    WHERE visitante_id IS NOT NULL;

CREATE TABLE score_categoria (
    id            BIGSERIAL PRIMARY KEY,
    usuario_id    BIGINT REFERENCES usuario(id) ON DELETE CASCADE,
    visitante_id  BIGINT REFERENCES visitante(id) ON DELETE CASCADE,
    categoria_id  BIGINT NOT NULL REFERENCES categoria(id) ON DELETE CASCADE,
    valor         NUMERIC(5,2) NOT NULL,
    calculado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT score_categoria_xor_chk
        CHECK ((usuario_id IS NULL) <> (visitante_id IS NULL))
);

CREATE UNIQUE INDEX score_categoria_usuario_uq
    ON score_categoria (usuario_id, categoria_id)
    WHERE usuario_id IS NOT NULL;

CREATE UNIQUE INDEX score_categoria_visitante_uq
    ON score_categoria (visitante_id, categoria_id)
    WHERE visitante_id IS NOT NULL;

CREATE TABLE faixa_preco_usuario (
    id                      BIGSERIAL PRIMARY KEY,
    usuario_id              BIGINT REFERENCES usuario(id) ON DELETE CASCADE,
    visitante_id            BIGINT REFERENCES visitante(id) ON DELETE CASCADE,
    mediana_com_conversao   NUMERIC(12,2),
    mediana_sem_conversao   NUMERIC(12,2),
    gap_preco               NUMERIC(12,2),
    calculado_em            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT faixa_preco_xor_chk
        CHECK ((usuario_id IS NULL) <> (visitante_id IS NULL))
);

CREATE UNIQUE INDEX faixa_preco_usuario_uq
    ON faixa_preco_usuario (usuario_id)
    WHERE usuario_id IS NOT NULL;

CREATE UNIQUE INDEX faixa_preco_visitante_uq
    ON faixa_preco_usuario (visitante_id)
    WHERE visitante_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. password_reset_token (RF06)
-- ---------------------------------------------------------------------------
CREATE TABLE password_reset_token (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token       VARCHAR(64) NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ NOT NULL,
    usado_em    TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX password_reset_token_usuario_idx
    ON password_reset_token (usuario_id, created_at DESC);
