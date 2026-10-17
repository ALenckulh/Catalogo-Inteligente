# Modelo de Dados

Modelagem relacional do sistema. SGBD: **PostgreSQL** (ver [05-ARQUITETURA.md](05-ARQUITETURA.md)).

## 1. Convenções

- **Nomenclatura:** `snake_case`, singular (`produto`, não `produtos`).
- **Chave primária:** `id BIGSERIAL` por padrão. UUID (`gen_random_uuid()`) apenas onde a chave for exposta publicamente ou gerada no cliente (ex: `visitante.cookie_id`).
- **Timestamps:** `TIMESTAMPTZ` com UTC. Toda tabela tem `created_at` e `updated_at` (mantidos via trigger ou JPA Auditing).
- **Soft delete:** `deleted_at TIMESTAMPTZ NULL` em tabelas sujeitas ao direito de exclusão LGPD (ver [04-ESPECIFICACAO-TECNICA.md §10.3](04-ESPECIFICACAO-TECNICA.md)). Consultas filtram `WHERE deleted_at IS NULL`.
- **Foreign keys:** `ON DELETE RESTRICT` por padrão; `CASCADE` apenas onde a semântica exige (ex: imagens dependem do produto).
- **Enums:** tipos nativos `CREATE TYPE ... AS ENUM (...)`.
- **Dinheiro:** `NUMERIC(12,2)`. Evitar `FLOAT` para valores monetários.
- **Scores:** `NUMERIC(5,2)` no intervalo [0, 100].

## 2. Diagrama ER (visão simplificada)

```
                 ┌──────────────────┐
                 │  consentimento_  │
                 │       lgpd       │────┐
                 └──────────────────┘    │
                                         │ N
                                         ▼
┌──────────────┐  1    N  ┌──────────┐  1
│  visitante   │─────────▶│ usuario  │────────────┐
└──────┬───────┘          └────┬─────┘            │
       │ 1                     │ 1                │ 1
       │                       │                  │
       │  N      ┌────────┐  N │                  │ N
       └────────▶│ evento │◀───┤                  │
                 └───┬────┘    │                  ▼
                     │ N       │             ┌──────────┐
                     ▼         │ N           │ favorito │
                 ┌────────┐    ├────────────▶└────┬─────┘
                 │ sessao │    │                  │ N
                 └────────┘    │ N                │
                               │                  ▼ 1
                               ▼             ┌──────────┐  N    1  ┌───────────┐
                            ┌──────┐   N     │ produto  │─────────▶│ categoria │
                            │compra│────────▶└────┬─────┘          └─────┬─────┘
                            └──────┘              │ 1                    │ auto-ref
                                                  │                      │ (parent_id)
                                                  ▼ N                    │
                                            ┌──────────────┐             │
                                            │produto_imagem│             │
                                            └──────────────┘             │
                                                                         │
     ┌─────────────────┐   ┌─────────────────┐   ┌───────────────────┐  │
     │ score_produto   │   │ score_categoria │   │faixa_preco_usuario│  │
     └─────────────────┘   └─────────────────┘   └───────────────────┘  │
                                                                         │
                            ┌──────────────────┐                         │
                            │ produto_aresta   │  grafo (Camada 3)       │
                            └──────────────────┘                         │

   Configuração:  peso_metrica, parametro_decay
   LGPD:          solicitacao_lgpd
```

## 3. Enums

```sql
CREATE TYPE tipo_usuario AS ENUM ('PF', 'PJ', 'ADMIN');

CREATE TYPE tipo_evento AS ENUM (
  'VISUALIZACAO_PRODUTO',
  'FAVORITAR',
  'DESFAVORITAR',
  'CONTATO_WHATSAPP',
  'PESQUISA',
  'FILTRO_APLICADO',
  'SCROLL_DEPTH',
  'TEMPO_PAGINA'
);

CREATE TYPE tipo_conversao AS ENUM (
  'LEVE',       -- clicou em contato
  'FORTE',      -- contato via lista de desejos / carrinho
  'CONFIRMADA'  -- compra registrada pelo admin
);

CREATE TYPE tipo_aresta AS ENUM (
  'CO_OCORRENCIA',       -- visitas em sequência
  'CO_COMPRA',           -- aparece no mesmo histórico de compras
  'PERTENCE_CATEGORIA'   -- produto → categoria
);

CREATE TYPE tipo_consentimento AS ENUM (
  'TERMOS_USO',
  'POLITICA_PRIVACIDADE',
  'COOKIES_COMPORTAMENTAIS',
  'CONTATO_PROATIVO'
);

CREATE TYPE tipo_solicitacao_lgpd AS ENUM (
  'EXPORTACAO',
  'EXCLUSAO',
  'REVOGACAO_CONSENTIMENTO',
  'CORRECAO'
);

CREATE TYPE status_solicitacao_lgpd AS ENUM (
  'PENDENTE',
  'EM_PROCESSAMENTO',
  'ATENDIDA',
  'REJEITADA'
);
```

## 4. Tabelas

### 4.1 `usuario`

Tabela única para PF, PJ e Admin. Discriminada por `tipo`. Campos específicos ficam NULL conforme o tipo.
Atende [RF01, RF02, RF07](02-REQUISITOS.md).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `tipo` | `tipo_usuario` | NOT NULL | Discriminador PF / PJ / ADMIN |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Login |
| `senha_hash` | `VARCHAR(255)` | NOT NULL | bcrypt/argon2 ([RNF04](02-REQUISITOS.md)) |
| `telefone` | `VARCHAR(20)` | NULL | Opcional |
| `email_alternativo` | `VARCHAR(255)` | NULL | Opcional |
| `cpf` | `CHAR(11)` | NULL, UNIQUE WHERE NOT NULL | Obrigatório se `tipo = 'PF'` |
| `nome_completo` | `VARCHAR(255)` | NULL | Obrigatório se `tipo = 'PF'` |
| `idade` | `SMALLINT` | NULL | Opcional PF |
| `cnpj` | `CHAR(14)` | NULL, UNIQUE WHERE NOT NULL | Obrigatório se `tipo = 'PJ'` |
| `razao_social` | `VARCHAR(255)` | NULL | Obrigatório se `tipo = 'PJ'` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft delete LGPD |

**Constraints:**
- `CHECK (tipo <> 'PF' OR (cpf IS NOT NULL AND nome_completo IS NOT NULL))`
- `CHECK (tipo <> 'PJ' OR (cnpj IS NOT NULL AND razao_social IS NOT NULL))`

**Índices:** `email`, `(tipo)` parcial `WHERE deleted_at IS NULL`.

### 4.2 `visitante`

Visitante anônimo rastreado por cookie/fingerprint ([04-ESPECIFICACAO-TECNICA.md §2.3, §7](04-ESPECIFICACAO-TECNICA.md)).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `cookie_id` | `UUID` | NOT NULL, UNIQUE | Identificador público do cookie |
| `fingerprint` | `VARCHAR(255)` | NULL | Fallback secundário |
| `usuario_id` | `BIGINT` | NULL, FK `usuario(id)` ON DELETE SET NULL | Preenchido após migração de histórico |
| `migrado_em` | `TIMESTAMPTZ` | NULL | Quando o histórico foi associado ao usuário |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Primeira visita |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Última atividade |

**Índices:** `cookie_id`, `usuario_id`.

### 4.3 `consentimento_lgpd`

Registro versionado dos consentimentos do usuário.
Atende [RF03, RF04, RF28, RNF09](02-REQUISITOS.md).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `usuario_id` | `BIGINT` | NOT NULL, FK `usuario(id)` ON DELETE CASCADE | |
| `tipo` | `tipo_consentimento` | NOT NULL | |
| `aceito` | `BOOLEAN` | NOT NULL | |
| `versao_termos` | `VARCHAR(20)` | NOT NULL | Ex: "1.2.0" |
| `aceito_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Timestamp do aceite/revogação |
| `ip_origem` | `INET` | NULL | Para auditoria |

**Índices:** `(usuario_id, tipo, aceito_em)`.

### 4.4 `categoria`

Hierarquia opcional via `parent_id` (auto-referência).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `nome` | `VARCHAR(120)` | NOT NULL | |
| `slug` | `VARCHAR(140)` | NOT NULL, UNIQUE | URL-friendly |
| `parent_id` | `BIGINT` | NULL, FK `categoria(id)` ON DELETE RESTRICT | Hierarquia |
| `descricao` | `TEXT` | NULL | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |

**Índices:** `slug`, `parent_id`.

### 4.5 `produto`

Item do catálogo. FK para `categoria` (1 categoria por produto).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `nome` | `VARCHAR(200)` | NOT NULL | |
| `slug` | `VARCHAR(220)` | NOT NULL, UNIQUE | URL amigável |
| `descricao` | `TEXT` | NULL | |
| `ficha_tecnica` | `JSONB` | NULL | Especificações estruturadas |
| `preco` | `NUMERIC(12,2)` | NOT NULL | Preço de referência |
| `categoria_id` | `BIGINT` | NOT NULL, FK `categoria(id)` ON DELETE RESTRICT | |
| `ativo` | `BOOLEAN` | NOT NULL DEFAULT true | Produto visível no catálogo |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |

**Índices:** `slug`, `categoria_id`, `(ativo)` parcial `WHERE ativo = true`.

### 4.6 `produto_imagem`

Imagens de produto como URLs externas (CDN, S3, disco).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `produto_id` | `BIGINT` | NOT NULL, FK `produto(id)` ON DELETE CASCADE | |
| `url` | `VARCHAR(500)` | NOT NULL | URL completa |
| `ordem` | `SMALLINT` | NOT NULL DEFAULT 0 | Ordem de exibição |
| `alt_text` | `VARCHAR(200)` | NULL | Acessibilidade ([RNF11](02-REQUISITOS.md)) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |

**Índices:** `(produto_id, ordem)`.

### 4.7 `favorito`

Relação N:N entre usuário e produto.
Atende [RF13](02-REQUISITOS.md).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `usuario_id` | `BIGINT` | NOT NULL, FK `usuario(id)` ON DELETE CASCADE | |
| `produto_id` | `BIGINT` | NOT NULL, FK `produto(id)` ON DELETE CASCADE | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Quando favoritou |

**PK composta:** `(usuario_id, produto_id)`.
**Índices:** `produto_id` (para consultas inversas).

### 4.8 `sessao`

Agrupamento de eventos de uma mesma visita; dados de contexto (dispositivo, canal) ficam aqui, evitando duplicação em cada evento.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `visitante_id` | `BIGINT` | NULL, FK `visitante(id)` ON DELETE CASCADE | Visitante anônimo |
| `usuario_id` | `BIGINT` | NULL, FK `usuario(id)` ON DELETE CASCADE | Usuário autenticado |
| `dispositivo` | `VARCHAR(50)` | NULL | mobile / desktop / tablet |
| `user_agent` | `VARCHAR(500)` | NULL | |
| `canal_origem` | `VARCHAR(100)` | NULL | organic, direct, referral, campaign:X |
| `ip_hash` | `VARCHAR(64)` | NULL | Hash do IP (anonimizado) |
| `iniciada_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |
| `encerrada_em` | `TIMESTAMPTZ` | NULL | Última interação |

**Constraints:** `CHECK (visitante_id IS NOT NULL OR usuario_id IS NOT NULL)`.
**Índices:** `visitante_id`, `usuario_id`, `iniciada_em`.

### 4.9 `evento`

Toda interação comportamental coletada. É a tabela de maior volume do sistema.
Alimenta o scoring da Camada 2 ([04-ESPECIFICACAO-TECNICA.md §4.2](04-ESPECIFICACAO-TECNICA.md)).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `tipo` | `tipo_evento` | NOT NULL | |
| `sessao_id` | `BIGINT` | NOT NULL, FK `sessao(id)` ON DELETE CASCADE | |
| `usuario_id` | `BIGINT` | NULL, FK `usuario(id)` ON DELETE CASCADE | Desnormalizado para consultas |
| `visitante_id` | `BIGINT` | NULL, FK `visitante(id)` ON DELETE CASCADE | Desnormalizado para consultas |
| `produto_id` | `BIGINT` | NULL, FK `produto(id)` ON DELETE SET NULL | Produto associado (quando aplicável) |
| `categoria_id` | `BIGINT` | NULL, FK `categoria(id)` ON DELETE SET NULL | Categoria associada (ex: filtro) |
| `conversao` | `tipo_conversao` | NULL | Preenchido quando tipo = CONTATO_WHATSAPP |
| `metadados` | `JSONB` | NULL | Payload específico (termos de busca, scroll %, tempo, filtros) |
| `ocorrido_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | Base para o decay |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft delete LGPD |

**Índices:**
- `(usuario_id, ocorrido_em)` — leitura do histórico pessoal para scoring.
- `(produto_id, ocorrido_em)` — leitura por produto para popularidade.
- `(visitante_id, ocorrido_em)` — migração de histórico.
- GIN em `metadados` se houver busca por chaves JSONB.

### 4.10 `compra`

Histórico de compras registrado manualmente pelo admin.
Atende [RF24](02-REQUISITOS.md) e [04-ESPECIFICACAO-TECNICA.md §9](04-ESPECIFICACAO-TECNICA.md).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `usuario_id` | `BIGINT` | NOT NULL, FK `usuario(id)` ON DELETE RESTRICT | Cliente |
| `produto_id` | `BIGINT` | NOT NULL, FK `produto(id)` ON DELETE RESTRICT | |
| `preco_unitario` | `NUMERIC(12,2)` | NOT NULL | Preço praticado |
| `quantidade` | `INTEGER` | NOT NULL DEFAULT 1 | |
| `valor_total` | `NUMERIC(12,2)` | NOT NULL | Pode diferir de preço × qtde |
| `data_compra` | `DATE` | NOT NULL | Data real da transação |
| `registrado_por` | `BIGINT` | NOT NULL, FK `usuario(id)` | Admin que lançou |
| `observacoes` | `TEXT` | NULL | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft delete LGPD |

**Índices:** `(usuario_id, data_compra)`, `(produto_id, data_compra)`.

### 4.11 `score_produto`

Cache do score produto×usuário. Recalculado em batch pelos workers; evita recomputar em toda leitura.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `usuario_id` | `BIGINT` | NOT NULL, FK `usuario(id)` ON DELETE CASCADE | |
| `produto_id` | `BIGINT` | NOT NULL, FK `produto(id)` ON DELETE CASCADE | |
| `valor` | `NUMERIC(5,2)` | NOT NULL | [0, 100] |
| `calculado_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |

**PK composta:** `(usuario_id, produto_id)`.
**Índices:** `(usuario_id, valor DESC)` para ranking.

### 4.12 `score_categoria`

Análogo a `score_produto`, para categorias.

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `usuario_id` | `BIGINT` | NOT NULL, FK `usuario(id)` ON DELETE CASCADE | |
| `categoria_id` | `BIGINT` | NOT NULL, FK `categoria(id)` ON DELETE CASCADE | |
| `valor` | `NUMERIC(5,2)` | NOT NULL | [0, 100] |
| `calculado_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |

**PK composta:** `(usuario_id, categoria_id)`.

### 4.13 `faixa_preco_usuario`

Faixa de preço calculada com e sem conversão, por usuário ([04-ESPECIFICACAO-TECNICA.md §8](04-ESPECIFICACAO-TECNICA.md)).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `usuario_id` | `BIGINT` | PK, FK `usuario(id)` ON DELETE CASCADE | |
| `mediana_com_conversao` | `NUMERIC(12,2)` | NULL | |
| `mediana_sem_conversao` | `NUMERIC(12,2)` | NULL | |
| `gap_preco` | `NUMERIC(12,2)` | NULL | Diferença (sinal de barreira de preço) |
| `calculado_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |

### 4.14 `produto_aresta` (Camada 3 — grafo)

Arestas do grafo de produtos. Modelado agora; cálculo e uso do PPR podem ser trabalhos futuros ([04-ESPECIFICACAO-TECNICA.md §4.4, §13](04-ESPECIFICACAO-TECNICA.md)).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `origem_produto_id` | `BIGINT` | NOT NULL, FK `produto(id)` ON DELETE CASCADE | |
| `destino_produto_id` | `BIGINT` | NOT NULL, FK `produto(id)` ON DELETE CASCADE | |
| `tipo` | `tipo_aresta` | NOT NULL | |
| `peso` | `NUMERIC(6,4)` | NOT NULL | Força da relação |
| `qtd_observacoes` | `INTEGER` | NOT NULL DEFAULT 0 | Quantos usuários distintos reforçam a aresta |
| `atualizado_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |

**Constraints:** `UNIQUE (origem_produto_id, destino_produto_id, tipo)`.
**Índices:** `origem_produto_id`, `destino_produto_id`.

### 4.15 `peso_metrica`

Pesos ajustáveis das métricas de scoring. Permite ajuste sem redeploy ([RNF13](02-REQUISITOS.md)).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `tipo_evento` | `tipo_evento` | PK | |
| `peso` | `NUMERIC(5,4)` | NOT NULL | Multiplicador aplicado no score |
| `atualizado_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |
| `atualizado_por` | `BIGINT` | NULL, FK `usuario(id)` | Admin que ajustou |

### 4.16 `parametro_decay`

Taxa de decaimento λ por categoria (ou global com `categoria_id IS NULL`).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `categoria_id` | `BIGINT` | NULL, FK `categoria(id)` ON DELETE CASCADE | NULL = valor global |
| `lambda` | `NUMERIC(6,5)` | NOT NULL | Ex: 0.00500 |
| `atualizado_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |
| `atualizado_por` | `BIGINT` | NULL, FK `usuario(id)` | |

**Constraints:** `UNIQUE (categoria_id)` — uma linha por categoria + uma linha global.

### 4.17 `solicitacao_lgpd`

Registro de solicitações do titular (exportação, exclusão, correção).
Atende [RF29, RF30](02-REQUISITOS.md) e [04-ESPECIFICACAO-TECNICA.md §10.3](04-ESPECIFICACAO-TECNICA.md).

| Coluna | Tipo | Constraints | Descrição |
|---|---|---|---|
| `id` | `BIGSERIAL` | PK | |
| `usuario_id` | `BIGINT` | NOT NULL, FK `usuario(id)` ON DELETE RESTRICT | |
| `tipo` | `tipo_solicitacao_lgpd` | NOT NULL | |
| `status` | `status_solicitacao_lgpd` | NOT NULL DEFAULT 'PENDENTE' | |
| `solicitado_em` | `TIMESTAMPTZ` | NOT NULL DEFAULT now() | |
| `atendido_em` | `TIMESTAMPTZ` | NULL | |
| `observacoes` | `TEXT` | NULL | |

**Índices:** `(usuario_id, solicitado_em)`.

## 5. Notas de projeto

### 5.1 Por que `metadados JSONB` em `evento`

Diferentes tipos de evento carregam payloads diferentes:
- `PESQUISA`: `{"termo": "parafuso M6", "resultados": 12}`
- `SCROLL_DEPTH`: `{"percentual": 85}`
- `TEMPO_PAGINA`: `{"segundos": 42}`
- `FILTRO_APLICADO`: `{"filtros": {"preco_max": 500}}`

Colocar cada payload numa coluna separada inflaria o schema. JSONB preserva flexibilidade com indexação GIN quando necessário.

### 5.2 Soft delete e LGPD

Tabelas com `deleted_at`:
- `usuario`, `favorito`, `evento`, `compra`.

Quando o usuário solicita exclusão ([RF30](02-REQUISITOS.md)):
- Marca `deleted_at = now()` em suas linhas, OU
- Faz hard delete + anonimiza referências históricas (ex: `compra.usuario_id = NULL` com observação "titular excluído").

A escolha entre as duas estratégias deve ser documentada na política de retenção e implementada consistentemente.

### 5.3 Migração de histórico de visitante

Ao criar conta ([04-ESPECIFICACAO-TECNICA.md §7](04-ESPECIFICACAO-TECNICA.md)):

```sql
UPDATE visitante
   SET usuario_id = :novo_usuario_id,
       migrado_em = now()
 WHERE cookie_id = :cookie_atual;

UPDATE evento
   SET usuario_id = :novo_usuario_id
 WHERE visitante_id = (SELECT id FROM visitante WHERE cookie_id = :cookie_atual);

UPDATE sessao
   SET usuario_id = :novo_usuario_id
 WHERE visitante_id = (SELECT id FROM visitante WHERE cookie_id = :cookie_atual);
```

### 5.4 Cache de scores

As tabelas `score_produto` e `score_categoria` são **cache** — não são a fonte da verdade. A fonte é a tabela `evento` + o algoritmo descrito em [04-ESPECIFICACAO-TECNICA.md §4](04-ESPECIFICACAO-TECNICA.md). O recálculo é feito pelos workers em batch (ex: a cada N minutos, ou sob demanda após eventos de alta intenção como `CONTATO_WHATSAPP`).

### 5.5 Histórico de preços (consideração)

A tabela `produto` guarda o preço atual. Se o preço mudar, cálculos antigos de faixa de preço podem ficar inconsistentes.

Opções:
- Aceitar essa inconsistência no TCC (menor complexidade).
- Em versão futura, criar `produto_preco_historico (produto_id, preco, vigente_de, vigente_ate)`.

Para o escopo do TCC, **aceitar a inconsistência** é recomendado — manter preço atual em `produto`.

### 5.6 Compra com múltiplos produtos

Uma compra registrada manualmente pelo admin pode ter vários produtos. O schema atual trata **uma linha por produto** da compra (como item de pedido). Se for necessário agrupar, pode-se adicionar `pedido_id BIGINT` em `compra` referenciando uma tabela `pedido` futura. Para o escopo do TCC, uma linha por produto é suficiente.
