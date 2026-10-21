-- Tabelas de núcleo: usuario, visitante, consentimento_lgpd.
-- Ver frontend/docs/08-MODELO-DE-DADOS.md §4.1–4.3.

-- pgcrypto habilita crypt() / gen_salt() usados para hash de senha no seed.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuario (
    id                 BIGSERIAL PRIMARY KEY,
    tipo               tipo_usuario NOT NULL,
    email              VARCHAR(255) NOT NULL UNIQUE,
    senha_hash         VARCHAR(255) NOT NULL,
    telefone           VARCHAR(20),
    email_alternativo  VARCHAR(255),
    cpf                CHAR(11),
    nome_completo      VARCHAR(255),
    idade              SMALLINT,
    cnpj               CHAR(14),
    razao_social       VARCHAR(255),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at         TIMESTAMPTZ,
    CONSTRAINT usuario_pf_campos_chk
        CHECK (tipo <> 'PF' OR (cpf IS NOT NULL AND nome_completo IS NOT NULL)),
    CONSTRAINT usuario_pj_campos_chk
        CHECK (tipo <> 'PJ' OR (cnpj IS NOT NULL AND razao_social IS NOT NULL))
);

CREATE UNIQUE INDEX usuario_cpf_uq  ON usuario (cpf)  WHERE cpf  IS NOT NULL;
CREATE UNIQUE INDEX usuario_cnpj_uq ON usuario (cnpj) WHERE cnpj IS NOT NULL;

CREATE TABLE visitante (
    id           BIGSERIAL PRIMARY KEY,
    cookie_id    UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    fingerprint  VARCHAR(255),
    usuario_id   BIGINT REFERENCES usuario(id) ON DELETE SET NULL,
    migrado_em   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consentimento_lgpd (
    id             BIGSERIAL PRIMARY KEY,
    usuario_id     BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    tipo           tipo_consentimento NOT NULL,
    aceito         BOOLEAN NOT NULL,
    versao_termos  VARCHAR(20) NOT NULL,
    aceito_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_origem      INET
);
