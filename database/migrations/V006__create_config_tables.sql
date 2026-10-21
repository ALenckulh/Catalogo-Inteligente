-- Tabelas de configuração: peso_metrica, parametro_decay.
-- Ver frontend/docs/08-MODELO-DE-DADOS.md §4.15–4.16.

CREATE TABLE peso_metrica (
    tipo_evento       tipo_evento PRIMARY KEY,
    peso              NUMERIC(5,4) NOT NULL,
    atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_por    BIGINT REFERENCES usuario(id)
);

CREATE TABLE parametro_decay (
    id              BIGSERIAL PRIMARY KEY,
    categoria_id    BIGINT UNIQUE REFERENCES categoria(id) ON DELETE CASCADE,
    lambda          NUMERIC(6,5) NOT NULL,
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_por  BIGINT REFERENCES usuario(id)
);
