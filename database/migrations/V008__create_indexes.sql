-- Índices secundários. Índices criados implicitamente por PK e UNIQUE não aparecem aqui.
-- Ver frontend/docs/08-MODELO-DE-DADOS.md §4 (coluna "Índices" de cada tabela).

-- usuario: consultas por tipo filtrando ativos (não deletados)
CREATE INDEX usuario_tipo_idx ON usuario (tipo) WHERE deleted_at IS NULL;

-- visitante: lookup por cookie_id já indexado via UNIQUE; aqui adiciona por usuario_id
CREATE INDEX visitante_usuario_idx ON visitante (usuario_id);

-- consentimento_lgpd: busca por titular + tipo + momento
CREATE INDEX consentimento_lgpd_usuario_idx
    ON consentimento_lgpd (usuario_id, tipo, aceito_em DESC);

-- categoria: hierarquia por parent
CREATE INDEX categoria_parent_idx ON categoria (parent_id);

-- produto: catálogo de produtos ativos
CREATE INDEX produto_categoria_idx ON produto (categoria_id);
CREATE INDEX produto_ativo_idx     ON produto (ativo) WHERE ativo = TRUE;

-- produto_imagem: ordem de exibição
CREATE INDEX produto_imagem_produto_idx ON produto_imagem (produto_id, ordem);

-- favorito: consulta inversa (quem favoritou um produto)
CREATE INDEX favorito_produto_idx ON favorito (produto_id);

-- sessao
CREATE INDEX sessao_visitante_idx  ON sessao (visitante_id);
CREATE INDEX sessao_usuario_idx    ON sessao (usuario_id);
CREATE INDEX sessao_iniciada_idx   ON sessao (iniciada_em);

-- evento: histórico pessoal, popularidade por produto, migração de visitante
CREATE INDEX evento_usuario_ocorrido_idx   ON evento (usuario_id, ocorrido_em DESC);
CREATE INDEX evento_produto_ocorrido_idx   ON evento (produto_id, ocorrido_em DESC);
CREATE INDEX evento_visitante_ocorrido_idx ON evento (visitante_id, ocorrido_em DESC);
-- Índice GIN opcional para consultas em metadados JSONB (ex: busca por termo)
CREATE INDEX evento_metadados_gin_idx      ON evento USING GIN (metadados);

-- compra
CREATE INDEX compra_usuario_data_idx ON compra (usuario_id, data_compra DESC);
CREATE INDEX compra_produto_data_idx ON compra (produto_id, data_compra DESC);

-- score_produto: ranking por score decrescente
CREATE INDEX score_produto_rank_idx ON score_produto (usuario_id, valor DESC);

-- produto_aresta: travessia do grafo em ambas as direções
CREATE INDEX produto_aresta_origem_idx  ON produto_aresta (origem_produto_id);
CREATE INDEX produto_aresta_destino_idx ON produto_aresta (destino_produto_id);

-- solicitacao_lgpd: fila de pedidos pendentes do titular
CREATE INDEX solicitacao_lgpd_usuario_idx
    ON solicitacao_lgpd (usuario_id, solicitado_em DESC);
