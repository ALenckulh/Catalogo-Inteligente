-- Tabela de solicitações LGPD.
-- Ver frontend/docs/08-MODELO-DE-DADOS.md §4.17.

CREATE TABLE solicitacao_lgpd (
    id             BIGSERIAL PRIMARY KEY,
    usuario_id     BIGINT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    tipo           tipo_solicitacao_lgpd NOT NULL,
    status         status_solicitacao_lgpd NOT NULL DEFAULT 'PENDENTE',
    solicitado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    atendido_em    TIMESTAMPTZ,
    observacoes    TEXT
);
