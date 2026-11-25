-- Sair da conta encerra aquele token; trocar ou redefinir a senha encerra todos os anteriores.

CREATE TABLE token_revogado (
    jti       UUID PRIMARY KEY,
    -- Depois disto o próprio token já não vale: a linha pode ser apagada.
    expira_em TIMESTAMPTZ NOT NULL
);

ALTER TABLE usuario ADD COLUMN sessoes_validas_desde TIMESTAMPTZ;
