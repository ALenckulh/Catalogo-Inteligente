# API — Catálogo de Endpoints

Catálogo REST do backend Spring Boot. Expande o esboço de [05-ARQUITETURA.md §4](05-ARQUITETURA.md). Telas: [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md). Requisitos: [02-REQUISITOS.md](02-REQUISITOS.md). Entidades: [08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md). Triggers de eventos: [03 §4.0.1](03-PAGINAS-E-UX.md).

---

## 1. Convenções

| Item | Regra |
|---|---|
| Base pública | `/api` |
| Base admin | `/api/admin` ([RNF07](02-REQUISITOS.md) — rota e auth distintas) |
| Auth | JWT ou sessão. Níveis: `público` · `auth` (PF/PJ) · `admin` · `visitante+cookie` |
| IDs | `produtoId` / `usuarioId` = `BIGINT`. Produto na URL pública usa `slug` |
| Erros | HTTP status + body `{ "code": string, "message": string }` |
| Eventos | `POST /api/eventos` publica na fila e responde rápido ([RNF02](02-REQUISITOS.md)) |
| Leitura | Meta &lt; 500ms em condições normais ([RNF03](02-REQUISITOS.md)) |
| Soft delete | Consultas filtram `deleted_at IS NULL` onde aplicável ([08](08-MODELO-DE-DADOS.md)) |
| Identificação visitante | Header `X-Visitante-Cookie-Id: <uuid>` em toda chamada pública enquanto não autenticado |

### Rate limit ([RNF06](02-REQUISITOS.md))

| Endpoint | Limite | Chave |
|---|---|---|
| `POST /api/auth/login`, `POST /api/admin/auth/login`, `POST /api/auth/signup`, `POST /api/auth/password-reset` | 5 req/min | IP |
| `POST /api/eventos` | 60 req/min | `sessao_id` (ou `X-Visitante-Cookie-Id` quando sem sessão) |
| Demais endpoints autenticados | 120 req/min | `usuario_id` |

Excedido → `429 Too Many Requests` com header `Retry-After`.

Cadastro de admin (**RF07**): fora da API de self-service — seed / processo de TI.

---

## 2. Matriz tela → endpoints

IDs de tela conforme [03](03-PAGINAS-E-UX.md).

| Tela | Rota UI | Endpoints |
|---|---|---|
| 1 Vitrine | `/` | `GET /api/produtos?destaque=…`, `GET /api/categorias` |
| 2 Login | `/entrar` | `POST /api/auth/login`, `POST /api/auth/migrar-historico` |
| 3 Cadastro | `/cadastro` | `POST /api/auth/signup`, `POST /api/auth/migrar-historico` |
| 4 Recuperar senha | `/recuperar-senha` | `POST /api/auth/password-reset`, `…/confirm` |
| 5 Catálogo | `/produtos` | `GET /api/produtos`, `GET /api/categorias`, `POST /api/eventos` |
| 6 Produto | `/produtos/[slug]` | `GET /api/produtos/{slug}`, favoritos, `POST /api/eventos` |
| 7 Favoritos | `/favoritos` | `GET/DELETE /api/favoritos…`, `POST /api/eventos` |
| 8 Conta | `/conta` | `GET/PATCH /api/conta`, consentimentos, exportar, LGPD |
| Global | bootstrap | `POST /api/visitantes/sessao`, `POST /api/auth/logout` |
| A1 | `/admin/entrar` | `POST /api/admin/auth/login` |
| A2 | `/admin` | `GET /api/admin/dashboard` |
| A3 | `/admin/usuarios` | `GET /api/admin/usuarios` |
| A4 | `/admin/usuarios/[id]` | `GET …/usuarios/{id}`, `POST …/compras` |
| A5 | `/admin/produtos` | `GET/DELETE/PATCH /api/admin/produtos…` |
| A6 | `/admin/produtos/novo` | `POST /api/admin/produtos` |
| A7 | `/admin/produtos/[id]/editar` | `PATCH /api/admin/produtos/{id}` |
| A8 | `/admin/conta` | `GET/PATCH /api/admin/conta` |
| A9 | `/admin/configuracao` | `GET/PATCH …/pesos`, `GET/PATCH …/decay` |

S0–S3 (sobre, privacidade, termos, 404): sem API de negócio.

---

## 3. Catálogo detalhado

Formato de cada entrada: **Method Path** — auth · telas · RF · entidades · notas.

### 3.1 Auth e sessão

#### `POST /api/auth/signup`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 3 |
| **RF** | RF01–RF04 |
| **Entidades** | `usuario`, `consentimento_lgpd` |
| **Body** | `tipo` (`PF`\|`PJ`), `email`, `senha`, campos PF (`cpf`, `nome_completo`, `idade?`) ou PJ (`cnpj`, `razao_social`), `telefone?`, `email_alternativo?`, consentimentos: termos + privacidade (obrig.), cookies comportamentais?, contato proativo? |
| **Resposta** | `201` + token/sessão + `usuario` (sem `senha_hash`) |

#### `POST /api/auth/login`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 2 |
| **RF** | RF05 |
| **Entidades** | `usuario` |
| **Body** | `email`, `senha` |
| **Notas** | Rate limit ([RNF06](02-REQUISITOS.md)). Só `tipo` PF/PJ. Admin usa rota admin. |

#### `POST /api/auth/logout`

| | |
|---|---|
| **Auth** | auth (ou admin) |
| **Telas** | header global |
| **RF** | — |
| **Notas** | Invalida sessão/token. |

#### `POST /api/auth/password-reset`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 4 (etapa 1) |
| **RF** | RF06 |
| **Body** | `email` |
| **Notas** | Resposta genérica (não enumerar e-mails). Rate limit. |

#### `POST /api/auth/password-reset/confirm`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 4 (etapa 2) |
| **RF** | RF06 |
| **Body** | `token`, `nova_senha` |

#### `POST /api/auth/migrar-historico`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 2, 3 (modal pós-login/signup) |
| **RF** | RF19 |
| **Entidades** | `visitante`, `evento`, `sessao` |
| **Body** | `aceitar: boolean` (associa cookie atual ao `usuario_id` ou descarta) |
| **Notas** | [04 §7](04-ESPECIFICACAO-TECNICA.md). Preenche `visitante.usuario_id` / `migrado_em`. |

#### `POST /api/visitantes/sessao`

| | |
|---|---|
| **Auth** | público |
| **Telas** | global (primeira visita / refresh de sessão) |
| **RF** | RF18 |
| **Entidades** | `visitante`, `sessao` |
| **Body** | `cookie_id?` (UUID), `fingerprint?`, contexto (`dispositivo`, `user_agent`, `canal_origem`) |
| **Resposta** | `cookie_id`, `sessao_id` (cliente persiste cookie) |

#### `POST /api/admin/auth/login`

| | |
|---|---|
| **Auth** | público sob `/admin` |
| **Telas** | A1 |
| **RF** | RF05, RF07 |
| **Body** | `email`, `senha` |
| **Notas** | Só `usuario.tipo = ADMIN`. Mesma mensagem genérica se PF/PJ tentar. |

---

### 3.2 Catálogo (consumidor)

#### `GET /api/produtos`

| | |
|---|---|
| **Auth** | público (comportamento muda se auth) |
| **Telas** | 1, 5 |
| **RF** | RF08–RF11 |
| **Entidades** | `produto`, `produto_imagem`, `categoria`, `score_produto` (se auth) |
| **Query** | `q`, `categoria` (id ou slug), `precoMin`, `precoMax`, `page`, `limit`, `destaque` (boolean — vitrine) |
| **Notas** | Ordenação: score pessoal se autenticado com histórico suficiente; senão Popularidade Global ([04 §6](04-ESPECIFICACAO-TECNICA.md), RF09). Só `ativo = true`. |

#### `GET /api/produtos/{slug}`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 6 |
| **RF** | RF12 |
| **Entidades** | `produto`, `produto_imagem`, `categoria` |
| **Resposta** | ficha + imagens ordenadas + `favoritado` (boolean) se auth |
| **Notas** | `404` se inexistente/inativo. |

#### `GET /api/categorias`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 1, 5 |
| **RF** | RF11 |
| **Entidades** | `categoria` |
| **Resposta** | árvore ou lista flat com `parent_id` |

---

### 3.3 Favoritos

#### `GET /api/favoritos`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 7 |
| **RF** | RF13 |
| **Entidades** | `favorito`, `produto`, `produto_imagem` |

#### `POST /api/favoritos/{produtoId}`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 6 |
| **RF** | RF13 |
| **Notas** | Idempotente. UI também emite `FAVORITAR` via `/api/eventos` ([03 §4.0.1](03-PAGINAS-E-UX.md)). |

#### `DELETE /api/favoritos/{produtoId}`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 6, 7 |
| **RF** | RF13 |
| **Notas** | UI emite `DESFAVORITAR` via `/api/eventos`. |

---

### 3.4 Eventos comportamentais

#### `POST /api/eventos`

| | |
|---|---|
| **Auth** | visitante+cookie **ou** auth; **exige** consentimento comportamental |
| **Telas** | 5, 6, 7 |
| **RF** | RF14–RF18 |
| **Entidades** | `evento`, `sessao` (publish → fila → worker) |
| **Headers** | `X-Visitante-Cookie-Id: <uuid>` quando não autenticado |
| **Body** | `tipo` (`tipo_evento`), `produto_id?`, `categoria_id?`, `conversao?` (`LEVE`\|`FORTE`), `metadados?` (JSONB), `sessao_id` (BIGINT retornado por `POST /api/visitantes/sessao`) |
| **Resposta** | `202 Accepted` com body `{ "aceito": true }` — não espera persistência completa |
| **Notas** | Sem consentimento → `403`. Triggers e payloads: [03 §4.0.1](03-PAGINAS-E-UX.md). Contato WhatsApp pausa decay ([04 §5.4](04-ESPECIFICACAO-TECNICA.md)). |

Tipos principais: `VISUALIZACAO_PRODUTO`, `FAVORITAR`, `DESFAVORITAR`, `CONTATO_WHATSAPP`, `PESQUISA`, `FILTRO_APLICADO`, `SCROLL_DEPTH`, `TEMPO_PAGINA`.

---

### 3.5 Conta e LGPD (consumidor)

#### `GET /api/conta`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **Entidades** | `usuario`, consentimentos vigentes |

#### `PATCH /api/conta`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **Body** | campos editáveis (e-mail, telefone, nome/razão, etc.); troca de senha: `senha_atual`, `nova_senha` |
| **Notas** | Não altera `tipo`. |

#### `POST /api/conta/consentimentos`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 (também implícito no signup) |
| **RF** | RF04, RF28 |
| **Entidades** | `consentimento_lgpd` |
| **Body** | `tipo`, `aceito`, `versao_termos` |
| **Notas** | Revogar cookies → parar coleta ([04 §11](04-ESPECIFICACAO-TECNICA.md)). |

#### `GET /api/conta/exportar`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **RF** | RF29 |
| **Query** | `formato=json\|csv` |
| **Notas** | Portabilidade; pode criar `solicitacao_lgpd` tipo `EXPORTACAO` se assíncrono. |

#### `POST /api/conta/solicitacoes-lgpd`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **RF** | RF29–RF30 |
| **Entidades** | `solicitacao_lgpd` |
| **Body** | `tipo` (`EXPORTACAO`\|`EXCLUSAO`\|`REVOGACAO_CONSENTIMENTO`\|`CORRECAO`), `detalhes?` |
| **Resposta** | `201` + status `PENDENTE` |

#### `DELETE /api/conta`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **RF** | RF30 |
| **Notas** | **Soft delete com anonimização de PII** ([08 §5.2](08-MODELO-DE-DADOS.md)): preenche `deleted_at` e zera `nome_completo`, `cpf`, `cnpj`, `razao_social`, `email`, `telefone`, `email_alternativo`; mantém `usuario_id` em eventos/compras/scores para preservar valor estatístico. Preferível enfileirar via `solicitacoes-lgpd` e confirmar antes de executar. |

---

### 3.6 Admin — dashboard e usuários

#### `GET /api/admin/dashboard`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A2 |
| **RF** | RF20 |
| **Resposta** | KPIs + lista de leads (score desc): usuário, tipo, top categoria, score max, última atividade |

#### `GET /api/admin/usuarios`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A3 |
| **RF** | RF21 |
| **Query** | `tipo`, `categoria`, `scoreMin`, `q`, `page`, `limit` |
| **Entidades** | `usuario`, `score_produto`, `score_categoria` |

#### `GET /api/admin/usuarios/{id}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A4 |
| **RF** | RF22 |
| **Resposta** | dados cadastrais + scores produto/categoria + `faixa_preco_usuario` + lista `compra` |
| **Entidades** | `usuario`, `score_produto`, `score_categoria`, `faixa_preco_usuario`, `compra` |

#### `POST /api/admin/usuarios/{id}/compras`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A4 |
| **RF** | RF24 |
| **Entidades** | `compra` |
| **Body** | `produto_id`, `preco_unitario`, `quantidade`, `valor_total`, `data_compra`, `observacoes?` |
| **Notas** | `registrado_por` = admin logado. Se &lt; 3 compras do cliente, peso histórico = 0 no score ([04 §9.2](04-ESPECIFICACAO-TECNICA.md)). |

---

### 3.7 Admin — produtos

#### `GET /api/admin/produtos`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A5 |
| **RF** | RF23 |
| **Query** | `q`, `ativo`, `page`, `limit` |
| **Notas** | Inclui inativos. |

#### `POST /api/admin/produtos`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A6 |
| **RF** | RF23 |
| **Entidades** | `produto`, `produto_imagem` |
| **Body** | `nome`, `slug`, `descricao?`, `preco`, `categoria_id`, `ativo`, `ficha_tecnica?`, `imagens[]` (`url`, `alt_text`, `ordem`) |
| **Notas** | **Imagens: URLs externas apenas no MVP** (CDN/S3/host do cliente). Upload direto fora do escopo — ver [05 §5](05-ARQUITETURA.md) e [04 §13](04-ESPECIFICACAO-TECNICA.md). |

#### `PATCH /api/admin/produtos/{id}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A5 (toggle ativo), A7 |
| **RF** | RF23 |
| **Body** | campos parciais do produto + imagens |

#### `DELETE /api/admin/produtos/{id}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A5 |
| **RF** | RF23 |
| **Notas** | Soft delete ou hard conforme política; UI com `Popconfirm` ([09](09-NORMAS-DE-USABILIDADE.md)). |

---

### 3.8 Admin — conta e configuração

#### `GET /api/admin/conta` · `PATCH /api/admin/conta`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A8 |
| **RF** | RF26 |
| **Body (PATCH)** | `email`, `telefone`, `senha_atual` + `nova_senha` |

#### `GET /api/admin/configuracao/pesos` · `PATCH /api/admin/configuracao/pesos`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A9 |
| **RF** | RF25, RNF13 |
| **Entidades** | `peso_metrica` |
| **Body (PATCH)** | lista `{ tipo_evento, peso }` |

#### `GET /api/admin/configuracao/decay` · `PATCH /api/admin/configuracao/decay`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A9 |
| **RF** | RF25, RNF13 |
| **Entidades** | `parametro_decay` |
| **Body (PATCH)** | `{ categoria_id: null\|id, lambda, boost_conversao }` (global + por categoria) |

---

### 3.9 Admin — solicitações LGPD

Fluxo administrativo para processar os pedidos criados por `POST /api/conta/solicitacoes-lgpd`.

#### `GET /api/admin/solicitacoes-lgpd`

| | |
|---|---|
| **Auth** | admin |
| **RF** | RF29, RF30 |
| **Entidades** | `solicitacao_lgpd`, `usuario` |
| **Query** | `status` (`PENDENTE`\|`EM_PROCESSAMENTO`\|`ATENDIDA`\|`REJEITADA`), `tipo`, `page`, `limit` |
| **Resposta** | lista ordenada por `solicitado_em DESC`, com dados do titular (ou "titular excluído" quando `usuario.deleted_at IS NOT NULL`) |

#### `PATCH /api/admin/solicitacoes-lgpd/{id}`

| | |
|---|---|
| **Auth** | admin |
| **RF** | RF29, RF30 |
| **Entidades** | `solicitacao_lgpd` |
| **Body** | `status` (`EM_PROCESSAMENTO`\|`ATENDIDA`\|`REJEITADA`), `observacoes?` |
| **Notas** | Transição para `ATENDIDA` em pedidos de `EXCLUSAO` executa o soft delete anonimizado ([08 §5.2](08-MODELO-DE-DADOS.md)); `EXPORTACAO` disponibiliza arquivo para download. Preenche `atendido_em = now()` em `ATENDIDA`/`REJEITADA`. |

---

## 4. Lacunas fechadas vs [05 §4](05-ARQUITETURA.md)

Itens neste doc que não estavam no esboço de arquitetura:

| Endpoint | Motivo |
|---|---|
| `POST /api/auth/logout` | Encerrar sessão |
| `POST /api/auth/migrar-historico` | RF19 / telas 2–3 |
| `POST /api/visitantes/sessao` | RF18 cookie/sessão |
| `POST /api/conta/solicitacoes-lgpd` | RF29–30 + tabela `solicitacao_lgpd` |
| `GET/PATCH /api/admin/conta` | RF26 / A8 |
| `GET/PATCH /api/admin/configuracao/decay` | RF25 λ / A9 |

O esboço em 05 permanece como índice curto; **este arquivo é a fonte de verdade** para implementação.

---

## 5. Fora de escopo (API)

- Heatmap ([04 §3.4](04-ESPECIFICACAO-TECNICA.md))
- Endpoints de treino/inferência ML síncronos (batch separado)
- Integração CRM / webhooks externos ([04 §13](04-ESPECIFICACAO-TECNICA.md))
- Self-signup de admin (RF07)
- Carrinho / pagamento (fora do produto)

---

## 6. Matriz RF → endpoints (resumo)

| RF | Endpoints |
|---|---|
| RF01–04 | `POST /api/auth/signup`, consentimentos |
| RF05 | `POST /api/auth/login`, `POST /api/admin/auth/login` |
| RF06 | `password-reset`, `password-reset/confirm` |
| RF07 | sem endpoint público de signup admin |
| RF08–11 | `GET /api/produtos`, `GET /api/categorias` |
| RF12 | `GET /api/produtos/{slug}` |
| RF13 | favoritos CRUD |
| RF14–18 | `POST /api/eventos`, `POST /api/visitantes/sessao` |
| RF19 | `POST /api/auth/migrar-historico` |
| RF20 | `GET /api/admin/dashboard` |
| RF21–22 | `GET /api/admin/usuarios…` |
| RF23 | admin produtos CRUD |
| RF24 | `POST /api/admin/usuarios/{id}/compras` |
| RF25 | `configuracao/pesos`, `configuracao/decay` |
| RF26 | `GET/PATCH /api/admin/conta` |
| RF28–30 | consentimentos, exportar, solicitacoes-lgpd (consumidor + admin), `DELETE /api/conta` |
