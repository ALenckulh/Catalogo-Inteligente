# API — Catálogo de Endpoints

Catálogo REST do backend Spring Boot. Expande o esboço de [05-ARQUITETURA.md §4](05-ARQUITETURA.md). Telas: [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md). Requisitos: [02-REQUISITOS.md](02-REQUISITOS.md). Entidades: [08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md). Triggers de eventos: [03 §4.0.1](03-PAGINAS-E-UX.md). Contrato JSON alinhado aos DTOs do front ([SERVICES.md](padroes/SERVICES.md)).

---

## 1. Convenções

| Item | Regra |
|---|---|
| Base pública | `/api` |
| Base admin | `/api/admin` ([RNF07](02-REQUISITOS.md) — rota e auth distintas) |
| Auth | JWT ou sessão. Níveis: `público` · `auth` (PF/PJ) · `admin` · `visitante+cookie` |
| IDs | `produtoId` / `usuarioId` = `BIGINT`. Produto na URL pública usa `slug` |
| **JSON wire** | **camelCase** em request/response (ex.: `emailAlternativo`, `produtoId`, `fichaTecnica`). Colunas DB permanecem snake_case ([08](08-MODELO-DE-DADOS.md)); mapear no backend (ex. Jackson). |
| Erros | HTTP status + body `{ "code": string, "message": string }` |
| **Page&lt;T&gt;** | Listas paginadas: `{ "items": T[], "page": number, "limit": number, "total": number }` |
| **AuthSession** | Login/signup: `{ "token": string, "usuario": Usuario }` — `usuario` sem hash de senha |
| Eventos | `POST /api/eventos` publica na fila e responde rápido ([RNF02](02-REQUISITOS.md)) |
| Leitura | Meta &lt; 500ms em condições normais ([RNF03](02-REQUISITOS.md)) |
| Soft delete | Consultas filtram `deleted_at IS NULL` onde aplicável ([08](08-MODELO-DE-DADOS.md)) |
| Identificação visitante | Header `X-Visitante-Cookie-Id: <uuid>` em toda chamada pública enquanto não autenticado |

### Schemas de referência (wire)

**Usuario** (resumo): `id`, `tipo`, `email`, `telefone`, `emailAlternativo`, `cpf`, `nomeCompleto`, `idade`, `cnpj`, `razaoSocial`, `createdAt`, `updatedAt`.

**Categoria:** `id`, `nome`, `slug`, `parentId`, `descricao`.

**ProdutoImagem:** `id`, `produtoId`, `url`, `ordem`, `altText`.

**Produto:** `id`, `nome`, `slug`, `descricao`, `fichaTecnica` (`Record<string,string>` \| null), `preco`, `categoriaId`, `categoria?`, `ativo`, `imagens[]`, `createdAt`, `updatedAt`. Em `GET /produtos/{slug}` autenticado: `favoritado?: boolean` (opcional — o front também consulta `GET /favoritos`).

### Rate limit ([RNF06](02-REQUISITOS.md))

| Endpoint | Limite | Chave |
|---|---|---|
| `POST /api/auth/login`, `POST /api/admin/auth/login`, `POST /api/auth/signup`, `POST /api/auth/password-reset` | 5 req/min | IP |
| `POST /api/eventos` | 60 req/min | `sessaoId` (ou `X-Visitante-Cookie-Id` quando sem sessão) |
| Demais endpoints autenticados | 120 req/min | `usuarioId` |

Excedido → `429 Too Many Requests` com header `Retry-After`.

Cadastro de admin (**RF07**): fora da API de self-service — seed / processo de TI.

---

## 2. Matriz tela → endpoints

IDs de tela conforme [03](03-PAGINAS-E-UX.md).

| Tela | Rota UI | Endpoints |
|---|---|---|
| 1 Vitrine | `/` | `GET /api/produtos?destaque=…`, `GET /api/categorias` |
| 2 Login | `/entrar` | `POST /api/auth/login`, `POST /api/auth/migrar-historico` † |
| 3 Cadastro | `/cadastro` | `POST /api/auth/signup`, `POST /api/auth/migrar-historico` † |
| 4 Recuperar senha | `/recuperar-senha` | `POST /api/auth/password-reset`, `…/confirm` |
| 5 Catálogo | `/produtos` | `GET /api/produtos`, `GET /api/categorias`, `POST /api/eventos` |
| 6 Produto | `/produtos/[slug]` | `GET /api/produtos/{slug}`, favoritos, `POST /api/eventos` |
| 7 Favoritos | `/favoritos` | `GET/DELETE /api/favoritos…`, `POST /api/eventos` |
| 8 Conta | `/conta` | `GET/PATCH /api/conta`, consentimentos, exportar †, LGPD † |
| Global | bootstrap | `POST /api/visitantes/sessao` †, `POST /api/auth/logout` |
| A1 | `/admin/entrar` | `POST /api/admin/auth/login` |
| A2 | `/admin` | `GET /api/admin/dashboard` |
| A3 | `/admin/usuarios` | `GET /api/admin/usuarios` |
| A4 | `/admin/usuarios/[id]` | `GET …/usuarios/{id}`, `POST …/compras` |
| A5 | `/admin/produtos` | `GET/DELETE/PATCH /api/admin/produtos…` |
| A6 | `/admin/produtos/novo` | `POST /api/admin/produtos` |
| A7 | `/admin/produtos/[id]/editar` | `GET /api/admin/produtos/{id}`, `PATCH /api/admin/produtos/{id}` |
| A8 | `/admin/conta` | `GET/PATCH /api/admin/conta` |
| A9 | `/admin/configuracao` | `GET/PATCH …/pesos`, `GET/PATCH …/decay` |

† Front mock ainda não consome (doc-only / prioridade futura). S0–S3 e A10 (design-system): sem API de negócio.

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
| **Body** | `tipo` (`PF`\|`PJ`), `email`, `senha`, `telefone?`, `emailAlternativo?`; **PF:** `cpf`, `nomeCompleto`, `idade?`; **PJ:** `cnpj`, `razaoSocial`; `aceitaTermos` (bool), `aceitaPrivacidade` (bool), `cookiesComportamentais?`, `contatoProativo?` |
| **Resposta** | `201` + `AuthSession` |

#### `POST /api/auth/login`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 2 |
| **RF** | RF05 |
| **Entidades** | `usuario` |
| **Body** | `email`, `senha` |
| **Resposta** | `200` + `AuthSession` |
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
| **Body** | `token`, `novaSenha` (alias legado `nova_senha` aceito) |

#### `POST /api/auth/migrar-historico`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 2, 3 (modal pós-login/signup) |
| **RF** | RF19 |
| **Entidades** | `visitante`, `evento`, `sessao` |
| **Body** | `aceitar: boolean` (associa cookie atual ao `usuarioId` ou descarta) |
| **Notas** | [04 §7](04-ESPECIFICACAO-TECNICA.md). Front ainda não consome. Preenche `visitante.usuario_id` / `migrado_em`. |

#### `POST /api/visitantes/sessao`

| | |
|---|---|
| **Auth** | público |
| **Telas** | global (primeira visita / refresh de sessão) |
| **RF** | RF18 |
| **Entidades** | `visitante`, `sessao` |
| **Body** | `cookieId?` (UUID), `fingerprint?`, contexto (`dispositivo`, `userAgent`, `canalOrigem`) |
| **Resposta** | `cookieId`, `sessaoId` (cliente persiste cookie) |
| **Notas** | Front ainda não consome; necessário para telemetria completa de visitante. |

#### `POST /api/admin/auth/login`

| | |
|---|---|
| **Auth** | público sob `/admin` |
| **Telas** | A1 |
| **RF** | RF05, RF07 |
| **Body** | `email`, `senha` |
| **Resposta** | `200` + `AuthSession` |
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
| **Query** | `q?`, `categoria?` (**id numérico**), `precoMin?`, `precoMax?`, `page?`, `limit?`, `destaque?` (boolean — vitrine) |
| **Resposta** | `Page<Produto>` |
| **Notas** | `categoria`: filtra produtos nessa categoria **e em todos os descendentes** da árvore (`parentId`). Ordenação: score pessoal se autenticado com histórico suficiente; senão Popularidade Global ([04 §6](04-ESPECIFICACAO-TECNICA.md), RF09). Só `ativo = true`. |

#### `GET /api/produtos/{slug}`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 6 |
| **RF** | RF12 |
| **Entidades** | `produto`, `produto_imagem`, `categoria` |
| **Resposta** | `Produto` (ficha + `imagens` ordenadas por `ordem` + `categoria?`); se auth: `favoritado?` |
| **Notas** | **`404`** se inexistente ou inativo. |

#### `GET /api/categorias`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 1, 5 |
| **RF** | RF11 |
| **Entidades** | `categoria` |
| **Resposta** | lista flat `Categoria[]` com `parentId` (cliente monta árvore) |

---

### 3.3 Favoritos

#### `GET /api/favoritos`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 7 |
| **RF** | RF13 |
| **Entidades** | `favorito`, `produto`, `produto_imagem` |
| **Resposta** | lista com join produto (+ imagem) |

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
| **Body** | `tipo` (`TipoEvento`), `produtoId?`, `categoriaId?`, `conversao?` (`LEVE`\|`FORTE`\|`CONFIRMADA`), `metadados?` (objeto), `sessaoId?` |
| **Resposta** | `202 Accepted` com body `{ "aceito": true }` — não espera persistência completa |
| **Notas** | Sem consentimento → `403`. `sessaoId` obrigatório quando a sessão de visitante já foi criada via `POST /api/visitantes/sessao`; até lá o back pode resolver a sessão pelo header de cookie. Front atual envia `{ tipo, produtoId?, conversao?, metadados? }`. Triggers: [03 §4.0.1](03-PAGINAS-E-UX.md). Contato WhatsApp pausa decay ([04 §5.4](04-ESPECIFICACAO-TECNICA.md)). |

Tipos principais: `VISUALIZACAO_PRODUTO`, `FAVORITAR`, `DESFAVORITAR`, `CONTATO_WHATSAPP`, `PESQUISA`, `FILTRO_APLICADO`, `SCROLL_DEPTH`, `TEMPO_PAGINA`.

---

### 3.5 Conta e LGPD (consumidor)

#### `GET /api/conta`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **Entidades** | `usuario`, consentimentos vigentes |
| **Resposta** | `Usuario` (+ consentimentos se aplicável) |

#### `PATCH /api/conta`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **Body** | parcial: `telefone?`, `emailAlternativo?`, `nomeCompleto?`, `idade?`; troca de senha (opcional): `senhaAtual`, `novaSenha` |
| **Notas** | Front consome os quatro primeiros campos. Não altera `tipo`. |

#### `POST /api/conta/consentimentos`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 (também implícito no signup) |
| **RF** | RF04, RF28 |
| **Entidades** | `consentimento_lgpd` |
| **Body** | `{ "consentimentos": [{ "tipo", "aceito", "versaoTermos", "aceitoEm?" }] }` |
| **Notas** | Batch. Revogar cookies → parar coleta ([04 §11](04-ESPECIFICACAO-TECNICA.md)). |

#### `GET /api/conta/exportar`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **RF** | RF29 |
| **Query** | `formato=json\|csv` |
| **Notas** | Portabilidade; pode criar `solicitacao_lgpd` tipo `EXPORTACAO` se assíncrono. Front ainda não chama (botão mock). |

#### `POST /api/conta/solicitacoes-lgpd`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **RF** | RF29–RF30 |
| **Entidades** | `solicitacao_lgpd` |
| **Body** | `tipo` (`EXPORTACAO`\|`EXCLUSAO`\|`REVOGACAO_CONSENTIMENTO`\|`CORRECAO`), `detalhes?` |
| **Resposta** | `201` + status `PENDENTE` |
| **Notas** | Front ainda não consome (exclusão mock via `DELETE /api/conta`). |

#### `DELETE /api/conta`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **RF** | RF30 |
| **Notas** | **Soft delete com anonimização de PII** ([08 §5.2](08-MODELO-DE-DADOS.md)): preenche `deleted_at` e zera PII; mantém `usuario_id` em eventos/compras/scores. Preferível enfileirar via `solicitacoes-lgpd` e confirmar antes de executar. |

---

### 3.6 Admin — dashboard e usuários

#### `GET /api/admin/dashboard`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A2 |
| **RF** | RF20 |
| **Resposta** | `AdminDashboard`: |
| | `kpis`: `{ usuariosAtivos, produtosAtivos, contatos7d, leadsScoreAlto }` |
| | `leads[]`: `{ usuarioId, nome, tipo, email, telefone, scoreMaxProduto, topCategoria, ultimaAtividade }` |
| | `series`: `{ distribuicaoScores[{ faixa, quantidade }], contatosPorDia[{ data, quantidade }], leadsPorCategoria[{ categoria, quantidade }] }` |

#### `GET /api/admin/usuarios`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A3 |
| **RF** | RF21 |
| **Query** | `tipo?`, `categoria?` (**nome** da categoria, match case-insensitive em `topCategoria`), `scoreMin?` †, `q?`, `page?`, `limit?` |
| **Resposta** | `Page<AdminUsuarioListItem>` — campos de `Usuario` + `scoreMaxProduto`, `topCategoria`, `ultimaAtividade`, **`ativo`** (`deleted_at IS NULL`) |
| **Entidades** | `usuario`, `score_produto`, `score_categoria` |

† Front ainda não envia `scoreMin`.

#### `GET /api/admin/usuarios/{id}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A4 |
| **RF** | RF22 |
| **Resposta** | `AdminUsuarioDetalhe`: `{ usuario, scoresProduto[{ produtoId, produtoNome, valor }], scoresCategoria[{ categoriaId, categoriaNome, valor }], faixaPreco[{ medianaComConversao, medianaSemConversao, gapPreco }], compras[] }` |
| **Entidades** | `usuario`, `score_produto`, `score_categoria`, `faixa_preco_usuario`, `compra` |

#### `POST /api/admin/usuarios/{id}/compras`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A4 |
| **RF** | RF24 |
| **Entidades** | `compra` |
| **Body** | `produtoId`, `precoUnitario`, `quantidade`, `valorTotal`, `data` (ISO date `YYYY-MM-DD`), `observacoes?` |
| **Notas** | `registradoPor` = admin logado. Se &lt; 3 compras do cliente, peso histórico = 0 no score ([04 §9.2](04-ESPECIFICACAO-TECNICA.md)). |

---

### 3.7 Admin — produtos

#### `GET /api/admin/produtos`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A5 |
| **RF** | RF23 |
| **Query** | `q?`, `ativo?` †, `page?`, `limit?` |
| **Resposta** | `Page<Produto>` |
| **Notas** | Inclui inativos. † Front ainda não envia `ativo`. |

#### `GET /api/admin/produtos/{id}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A7 |
| **RF** | RF23 |
| **Resposta** | `Produto` completo (`fichaTecnica`, `imagens[]`, `categoria?`) |
| **Notas** | `404` se inexistente. Usado para pré-preencher o formulário de edição. |

#### `POST /api/admin/produtos`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A6 |
| **RF** | RF23 |
| **Entidades** | `produto`, `produto_imagem` |
| **Body** | `nome`, `slug`, `descricao?`, `preco`, `categoriaId`, `ativo`, `fichaTecnica?` (`Record<string,string>`), `imagens?[]` (`url`, `altText?`, `ordem`) |
| **Notas** | **Imagens: URLs externas apenas no MVP** (CDN/S3/host do cliente). Upload direto fora do escopo — ver [05 §5](05-ARQUITETURA.md) e [04 §13](04-ESPECIFICACAO-TECNICA.md). |

#### `PATCH /api/admin/produtos/{id}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A5 (toggle ativo), A7 |
| **RF** | RF23 |
| **Body** | campos parciais do `POST` (incl. `fichaTecnica`, `imagens` — substituição da lista quando enviado) |

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
| **Body (PATCH)** | `email?`, `telefone?`, `senhaAtual?` + `novaSenha?` |
| **Notas** | Front hoje envia sobretudo `email`/`telefone`; campos de senha documentados para quando a UI ligar. |

#### `GET /api/admin/configuracao/pesos` · `PATCH /api/admin/configuracao/pesos`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A9 |
| **RF** | RF25, RNF13 |
| **Entidades** | `peso_metrica` |
| **GET** | `PesoMetrica[]` — `{ tipoEvento, peso }` |
| **Body (PATCH)** | `{ "pesos": [{ "tipoEvento", "peso" }] }` |

#### `GET /api/admin/configuracao/decay` · `PATCH /api/admin/configuracao/decay`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A9 |
| **RF** | RF25, RNF13 |
| **Entidades** | `parametro_decay` |
| **GET** | `ParametroDecay[]` — `{ categoriaId, categoriaNome?, lambda, boostConversao }` (`categoriaId` null = global) |
| **Body (PATCH)** | `{ "items": [{ "categoriaId", "lambda", "boostConversao" }] }` (bulk) |

---

### 3.9 Admin — solicitações LGPD

Fluxo administrativo para processar os pedidos criados por `POST /api/conta/solicitacoes-lgpd`. Front ainda não consome.

#### `GET /api/admin/solicitacoes-lgpd`

| | |
|---|---|
| **Auth** | admin |
| **RF** | RF29, RF30 |
| **Entidades** | `solicitacao_lgpd`, `usuario` |
| **Query** | `status` (`PENDENTE`\|`EM_PROCESSAMENTO`\|`ATENDIDA`\|`REJEITADA`), `tipo`, `page`, `limit` |
| **Resposta** | lista ordenada por `solicitadoEm DESC`, com dados do titular (ou "titular excluído" quando soft-deleted) |

#### `PATCH /api/admin/solicitacoes-lgpd/{id}`

| | |
|---|---|
| **Auth** | admin |
| **RF** | RF29, RF30 |
| **Entidades** | `solicitacao_lgpd` |
| **Body** | `status` (`EM_PROCESSAMENTO`\|`ATENDIDA`\|`REJEITADA`), `observacoes?` |
| **Notas** | Transição para `ATENDIDA` em pedidos de `EXCLUSAO` executa o soft delete anonimizado ([08 §5.2](08-MODELO-DE-DADOS.md)); `EXPORTACAO` disponibiliza arquivo para download. Preenche `atendidoEm` em `ATENDIDA`/`REJEITADA`. |

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
| `GET /api/admin/produtos/{id}` | A7 pré-preenche formulário |

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
| RF23 | admin produtos CRUD (`GET/POST/PATCH/DELETE`, incl. `GET …/{id}`) |
| RF24 | `POST /api/admin/usuarios/{id}/compras` |
| RF25 | `configuracao/pesos`, `configuracao/decay` |
| RF26 | `GET/PATCH /api/admin/conta` |
| RF28–30 | consentimentos, exportar, solicitacoes-lgpd (consumidor + admin), `DELETE /api/conta` |
