-- Arquivos de imagem enviados pelo admin (BLOB). Tabela separada de produto_imagem
-- para que os bytes nunca entrem nos JOIN FETCH de listagem; produto_imagem.url
-- referencia o arquivo como 'produtos/imagens/{id}' (relativo à base da API).
CREATE TABLE imagem_arquivo (
    id            BIGSERIAL PRIMARY KEY,
    content_type  VARCHAR(50)  NOT NULL,
    tamanho       INTEGER      NOT NULL,
    conteudo      BYTEA        NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
