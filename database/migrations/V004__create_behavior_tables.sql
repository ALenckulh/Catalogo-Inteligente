-- Tabelas de comportamento: sessao, evento, compra.
-- Ver frontend/docs/08-MODELO-DE-DADOS.md §4.8–4.10.

CREATE TABLE sessao (
    id             BIGSERIAL PRIMARY KEY,
    visitante_id   BIGINT REFERENCES visitante(id) ON DELETE CASCADE,
    usuario_id     BIGINT REFERENCES usuario(id)   ON DELETE CASCADE,
    dispositivo    VARCHAR(50),
    user_agent     VARCHAR(500),
    canal_origem   VARCHAR(100),
    ip_hash        VARCHAR(64),
    iniciada_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    encerrada_em   TIMESTAMPTZ,
    CONSTRAINT sessao_proprietario_chk
        CHECK (visitante_id IS NOT NULL OR usuario_id IS NOT NULL)
);

CREATE TABLE evento (
    id             BIGSERIAL PRIMARY KEY,
    tipo           tipo_evento NOT NULL,
    sessao_id      BIGINT NOT NULL REFERENCES sessao(id) ON DELETE CASCADE,
    usuario_id     BIGINT REFERENCES usuario(id)   ON DELETE CASCADE,
    visitante_id   BIGINT REFERENCES visitante(id) ON DELETE CASCADE,
    produto_id     BIGINT REFERENCES produto(id)   ON DELETE SET NULL,
    categoria_id   BIGINT REFERENCES categoria(id) ON DELETE SET NULL,
    conversao      tipo_conversao,
    metadados      JSONB,
    ocorrido_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ
);

CREATE TABLE compra (
    id              BIGSERIAL PRIMARY KEY,
    usuario_id      BIGINT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    produto_id      BIGINT NOT NULL REFERENCES produto(id) ON DELETE RESTRICT,
    preco_unitario  NUMERIC(12,2) NOT NULL,
    quantidade      INTEGER NOT NULL DEFAULT 1,
    valor_total     NUMERIC(12,2) NOT NULL,
    data_compra     DATE NOT NULL,
    registrado_por  BIGINT NOT NULL REFERENCES usuario(id),
    observacoes     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
