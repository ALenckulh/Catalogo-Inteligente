# API — Catálogo de Endpoints

Catálogo REST do backend Spring Boot. Visão geral da arquitetura: [05-ARQUITETURA.md](05-ARQUITETURA.md). Telas: [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md). Requisitos: [02-REQUISITOS.md](02-REQUISITOS.md). Entidades: [08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md). Triggers de eventos: [03 §4.0.1](03-PAGINAS-E-UX.md). Contrato JSON alinhado aos DTOs do front ([SERVICES.md](padroes/SERVICES.md)).

---

## 1. Convenções

| Item | Regra |
|---|---|
| Base pública | `/api` |
| Base admin | `/api/admin` ([RNF07](02-REQUISITOS.md) — rota e auth distintas) |
| Auth | JWT no header `Authorization: Bearer` (24 h). Níveis: `público` · `auth` (logado) · `admin` · `visitante+cookie`. Sem token válido → `401`; papel errado → `403 FORBIDDEN`. `/conta`, `/favoritos` e `/auth/migrar-historico` são só de cliente (PF/PJ) |
| IDs | `produtoId` / `usuarioId` = `BIGINT`. Produto na URL pública usa `slug` |
| **JSON wire** | **camelCase** em request/response (ex.: `emailAlternativo`, `produtoId`, `fichaTecnica`). Colunas DB permanecem snake_case ([08](08-MODELO-DE-DADOS.md)); mapear no backend (ex. Jackson). |
| Erros | HTTP status + body `{ "code": string, "message": string }`. `400 VALIDATION_ERROR` (campo, parâmetro ou texto maior que o limite), `404 NOT_FOUND` (também rota inexistente), `405 METHOD_NOT_ALLOWED`, `409` (duplicado), `415 UNSUPPORTED_MEDIA_TYPE`, `503 SERVICE_UNAVAILABLE` (banco fora do ar; nunca 401) |
| Busca `q` | Cada palavra precisa aparecer, em qualquer ordem, sem diferenciar acento nem maiúscula; `%` e `_` são texto |
| Senha | De 6 a 72 caracteres (limite do BCrypt, em bytes) no cadastro, em `/conta`, na conta do admin e na recuperação |
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
| `POST /api/auth/login`, `POST /api/admin/auth/login`, `POST /api/auth/signup`, `POST /api/auth/password-reset`, `POST /api/auth/password-reset/confirm` | 5 req/min | IP |
| `POST /api/eventos` | 60 req/min | `X-Visitante-Cookie-Id` (ou IP, sem o header) |
| `POST /api/visitantes/sessao` | 30 req/min | IP |
| Demais rotas, com login (menos `/api/eventos`) | 120 req/min | usuário |

Excedido → `429 Too Many Requests` (`RATE_LIMIT`) com header `Retry-After`.

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
| 8 Conta | `/conta` | `GET/PATCH /api/conta`, `POST …/consentimentos`, `GET …/exportar`, `DELETE /api/conta` |
| Global | primeiro evento / saída | `POST /api/visitantes/sessao`, `POST /api/auth/logout` |
| A1 | `/admin/entrar` | `POST /api/admin/auth/login` |
| A2 | `/admin` | `GET /api/admin/dashboard` |
| A3 | `/admin/usuarios` | `GET /api/admin/usuarios` |
| A4 | `/admin/usuarios/[id]` | `GET …/usuarios/{id}`, `POST/PUT/DELETE …/compras` |
| A5 | `/admin/produtos` | `GET/PATCH /api/admin/produtos…` |
| A6 | `/admin/produtos/novo` | `POST /api/admin/produtos`, `POST …/imagens` |
| A7 | `/admin/produtos/[id]/editar` | `GET /api/admin/produtos/{id}`, `PATCH /api/admin/produtos/{id}`, `POST …/imagens` |
| A8 | `/admin/conta` | `GET/PATCH /api/admin/conta` |
| A9 | `/admin/configuracao` | `GET/PATCH …/pesos`, `GET/PATCH …/decay`, `DELETE …/decay/{categoriaId}`, `POST …/simular`, `POST …/recalcular` |
| A11 | `/admin/projeto` | `GET …/pesos`, `GET …/decay` |

S0–S3 e A10 (design-system): sem API de negócio. Sem tela: `POST /api/conta/solicitacoes-lgpd`, `GET/PATCH /api/admin/solicitacoes-lgpd`, `DELETE /api/admin/produtos/{id}` e `GET /api/health`.

---

## 3. Catálogo detalhado

Formato de cada entrada: **Method Path** — auth · telas · RF · entidades · notas.

### 3.0 Saúde

#### `GET /api/health`

| | |
|---|---|
| **Auth** | público |
| **Resposta** | `{ "status": "UP" }` |

---

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
| **Telas** | 8, A8 |
| **RF** | — |
| **Notas** | Encerra só este token (`token_revogado`); as outras sessões da pessoa seguem. Trocar ou redefinir a senha encerra todas. |

#### `POST /api/auth/password-reset`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 4 (etapa 1) |
| **RF** | RF06 |
| **Body** | `email` |
| **Notas** | Resposta genérica (não enumerar e-mails). Se a conta existe, envia por e-mail um código válido por 2 horas e anula os anteriores. Rate limit. |

#### `POST /api/auth/password-reset/confirm`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 4 (etapa 2) |
| **RF** | RF06 |
| **Body** | `token`, `novaSenha` (alias legado `nova_senha` aceito) |
| **Notas** | Encerra todas as sessões da conta. Rate limit. |

#### `POST /api/auth/migrar-historico`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 2, 3 (modal pós-login/signup) |
| **RF** | RF19 |
| **Entidades** | `visitante`, `evento`, `sessao` |
| **Body** | `aceitar: boolean` (associa o histórico do cookie atual à conta ou o descarta) |
| **Notas** | [04 §7](04-ESPECIFICACAO-TECNICA.md). `true`: preenche `visitante.usuario_id` / `migrado_em`, passa ao usuário só eventos e sessões ainda sem dono e recalcula as notas da conta. `false`: descarta o que ainda é anônimo ([08 §5.3](08-MODELO-DE-DADOS.md)). |

#### `POST /api/visitantes/sessao`

| | |
|---|---|
| **Auth** | público; com token, a sessão é do usuário |
| **Telas** | 5, 6, 7 e header (no primeiro evento da visita) |
| **RF** | RF18 |
| **Entidades** | `visitante`, `sessao` |
| **Body** | `cookieId?` (UUID), `aceiteCookies` (boolean), contexto (`dispositivo`, `userAgent`, `canalOrigem`) |
| **Resposta** | `cookieId` (null com token: sessão sem visitante), `sessaoId`. O cliente guarda o cookie por 30 dias e o esquece no logout |
| **Notas** | Cada chamada insere uma sessão. O front só chama no primeiro evento da visita (com aceite dos cookies comportamentais) e reaproveita a sessão enquanto houver evento a cada 30 min. `cookieId` desconhecido → `400 INVALID_COOKIE`; o front cria outro visitante. Sem `aceiteCookies: true`, ou logado sem consentimento → `403 CONSENT_REQUIRED`. |

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

#### `GET /api/produtos/imagens/{id}`

| | |
|---|---|
| **Auth** | público |
| **Telas** | 2, 6 (card e galeria) |
| **Entidades** | `imagem_arquivo` |
| **Resposta** | Bytes da imagem com o `Content-Type` salvo, `Cache-Control: public, max-age=31536000, immutable` e `X-Content-Type-Options: nosniff` |
| **Notas** | `404` se inexistente. O front resolve `produto_imagem.url` relativa contra a base da API (`imagemSrc`). Ver [M16](13-MUDANCAS-DE-ESCOPO.md). |

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
| **Notas** | `400 VALIDATION_ERROR`: `produtoId` inexistente ou inativo (`DESFAVORITAR` aceita inativo), `categoriaId` inexistente, produto ausente quando o tipo exige (todos, menos `PESQUISA` e `FILTRO_APLICADO`), `FAVORITAR`/`DESFAVORITAR` sem login, `conversao` fora de `CONTATO_WHATSAPP` ou `CONFIRMADA` (que é a compra), `metadados` acima de 10 mil caracteres ou com o caractere nulo. `COMPRA` e `RETORNO_PAGINA` (só pesos) também dão 400. Logado sem consentimento, ou visitante sem aceite gravado → `403 CONSENT_REQUIRED`. `sessaoId` de outro usuário, de outro visitante ou sem o dono certo → `400 INVALID_SESSAO`. `sessaoId` obrigatório quando a sessão de visitante já foi criada via `POST /api/visitantes/sessao`; até lá o back pode resolver a sessão pelo header de cookie. Front envia `{ tipo, produtoId?, categoriaId?, conversao?, metadados?, sessaoId }` e, em `INVALID_SESSAO` ou `INVALID_COOKIE`, reabre a sessão e reenvia uma vez. `PESQUISA` com `produtoId` = cliente abriu um resultado da busca (soma no produto); `FILTRO_APLICADO` com `categoriaId` = filtro por categoria (soma na nota da categoria) — ver [13 — M1/M2](13-MUDANCAS-DE-ESCOPO.md). Triggers: [03 §4.0.1](03-PAGINAS-E-UX.md). Contato WhatsApp pausa decay ([04 §5.4](04-ESPECIFICACAO-TECNICA.md)). |

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
| **Notas** | Mesmas regras do cadastro: nome com 3 a 255 caracteres, idade de 18 a 120, telefone e e-mail alternativo válidos (`""` limpa os dois últimos). Front consome os quatro primeiros campos. Não altera `tipo`. Trocar a senha encerra as outras sessões, e a resposta traz um `token` novo para esta (nulo nos demais casos). Senha atual errada: `400 INVALID_PASSWORD` (não 401, que o front trata como sessão expirada). |

#### `POST /api/conta/consentimentos`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 (também implícito no signup) |
| **RF** | RF04, RF28 |
| **Entidades** | `consentimento_lgpd` |
| **Body** | `{ "consentimentos": [{ "tipo", "aceito", "versaoTermos" }] }` |
| **Notas** | Batch. A data (`aceitoEm`, na resposta) é sempre a do servidor. Revogar cookies → parar coleta ([04 §11](04-ESPECIFICACAO-TECNICA.md)). |

#### `GET /api/conta/exportar`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **RF** | RF29 |
| **Query** | `formato=json\|csv` |
| **Notas** | Portabilidade: usuário, consentimentos vigentes, favoritos, eventos, compras (sem as observações internas) e solicitações. No CSV, texto que começa com `=`, `+`, `-` ou `@` ganha um apóstrofo, para a planilha não executar. Síncrono; grava uma `solicitacao_lgpd` `EXPORTACAO` já `ATENDIDA`. |

#### `POST /api/conta/solicitacoes-lgpd`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **RF** | RF29–RF30 |
| **Entidades** | `solicitacao_lgpd` |
| **Body** | `tipo` (`EXPORTACAO`\|`EXCLUSAO`\|`REVOGACAO_CONSENTIMENTO`\|`CORRECAO`), `detalhes?` |
| **Resposta** | `201` + status `PENDENTE` |
| **Notas** | Nenhuma tela usa: a exportação e a exclusão da tela Conta têm rotas próprias. |

#### `DELETE /api/conta`

| | |
|---|---|
| **Auth** | auth |
| **Telas** | 8 |
| **RF** | RF30 |
| **Notas** | **Soft delete com anonimização de PII** ([08 §5.2](08-MODELO-DE-DADOS.md)): preenche `deleted_at` e zera PII; mantém `usuario_id` em eventos/compras/scores. A tela pede confirmação antes. Grava uma `solicitacao_lgpd` `EXCLUSAO` já `ATENDIDA`. |

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
| | `leads[]`: `{ usuarioId, nome, tipo, email, telefone, scoreMaxProduto, topCategoria, ultimaAtividade, proximaCompra }` — os 10 clientes com maior nota |
| | `series`: `{ distribuicaoScores[{ faixa, quantidade }], contatosPorDia[{ data, quantidade }], leadsPorCategoria[{ categoria, quantidade }] }` — `distribuicaoScores`: sempre 4 níveis, nesta ordem, em `faixa`: `QUENTE` (score máx. de produto ≥ 70), `MORNO` (≥ 40), `FRIO` (< 40), `SEM_SCORE` (sem score); `quantidade` = usuários ativos (não ADMIN); a soma = `kpis.usuariosAtivos`. `contatosPorDia`: 14 dias corridos até hoje, com `quantidade = 0` nos dias sem contato. `leadsPorCategoria`: top 10, `quantidade` = usuários ativos cuja categoria de maior score é a categoria. |

#### `GET /api/admin/usuarios`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A3 |
| **RF** | RF21 |
| **Query** | `tipo?`, `categoria?` (**nome** da categoria, match case-insensitive em `topCategoria`), `scoreMin?` †, `nivel?` (`QUENTE` ≥ 70, `MORNO` ≥ 40, `FRIO` < 40, `SEM_SCORE` sem score — pelo score máx. de produto; enum `NivelInteresse`), `q?` (nome, e-mail; com 3 dígitos ou mais, também CPF, CNPJ e telefone), `ativo?` (boolean), `page?`, `limit?` (até 100 por página), `sort?` (`campo,asc\|desc`; campos `nome`, `email`, `scoreMaxProduto`, `topCategoria`, `ultimaAtividade`; outro valor = mais recentes primeiro) |
| **Resposta** | `Page<AdminUsuarioListItem>` — campos de `Usuario` + `scoreMaxProduto`, `topCategoria`, `ultimaAtividade`, **`ativo`** (`deleted_at IS NULL`), `proximaCompra` (nome do produto ativo de maior nota sem compra nos últimos 30 dias; null se não houver) |
| **Entidades** | `usuario`, `score_produto`, `score_categoria` |

† Front ainda não envia `scoreMin`.

#### `GET /api/admin/usuarios/{id}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A4 |
| **RF** | RF22 |
| **Resposta** | `AdminUsuarioDetalhe`: `{ usuario, contatoProativo (boolean ou null = nunca respondeu), scoresProduto[{ produtoId, produtoNome, valor }], scoresCategoria[{ categoriaId, categoriaNome, valor }], faixaPreco[{ medianaComConversao, medianaSemConversao, gapPreco }], compras[] }` |
| **Entidades** | `usuario`, `score_produto`, `score_categoria`, `faixa_preco_usuario`, `compra` |

#### `POST /api/admin/usuarios/{id}/compras`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A4 |
| **RF** | RF24 |
| **Entidades** | `compra` |
| **Body** | `produtoId`, `precoUnitario` (2 casas), `quantidade`, `data` (ISO date `YYYY-MM-DD`), `observacoes?` (até 500) |
| **Notas** | `registradoPor` = admin logado. `valorTotal` = preço × quantidade, calculado no backend. Data futura (dia de Brasília) → `400`; produto inativo é aceito. Com menos de 3 compras, elas não somam pontos na nota, mas valem como conversão ([04 §9.2](04-ESPECIFICACAO-TECNICA.md)). |

#### `PUT /api/admin/usuarios/{id}/compras/{compraId}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A4 |
| **RF** | RF24 |
| **Entidades** | `compra` |
| **Body** | Mesmo do `POST`. |
| **Resposta** | `CompraResponse` atualizada. |
| **Notas** | `404` se a compra não for do usuário ou já estiver excluída. Mantém `registradoPor`; recalcula o score do cliente. |

#### `DELETE /api/admin/usuarios/{id}/compras/{compraId}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A4 |
| **RF** | RF24 |
| **Entidades** | `compra` |
| **Resposta** | `204 No Content` |
| **Notas** | Soft delete (`deleted_at = now()`); a compra sai de todas as leituras. `404` nas mesmas condições do `PUT`. Recalcula o score do cliente. |

---

### 3.7 Admin — produtos

#### `GET /api/admin/produtos`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A5 |
| **RF** | RF23 |
| **Query** | `q?`, `ativo?`, `page?`, `limit?` (até 100 por página), `sort?` (`campo,asc\|desc`; campos `nome`, `slug`, `preco`, `updatedAt`; outro valor = mais recentes primeiro) |
| **Resposta** | `Page<Produto>` |
| **Notas** | Inclui inativos. |

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
| **Body** | `nome` (até 200), `slug` (até 220), `descricao?`, `preco` (10 dígitos e 2 casas), `categoriaId`, `ativo`, `fichaTecnica?` (`Record<string,string>`), `imagens?[]` (`url` até 500, `altText?` até 200, `ordem`) |
| **Notas** | `slug`: letras minúsculas sem acento, números e hífen, diferente de `imagens`. `imagens[].url` aceita `http(s)` ou a referência devolvida pelo upload (`produtos/imagens/{id}`), que precisa existir. A ficha é gravada sem espaços nas pontas e sem linha em branco. Ver [M16](13-MUDANCAS-DE-ESCOPO.md). |

#### `POST /api/admin/produtos/imagens`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A6, A7 |
| **RF** | RF23 |
| **Entidades** | `imagem_arquivo` |
| **Body** | `multipart/form-data`, campo `arquivo` |
| **Resposta** | `201` `{ id, url }`, sendo `url = "produtos/imagens/{id}"` o valor a enviar em `imagens[].url` |
| **Notas** | O tipo é detectado pelos magic bytes (Apache Tika), e só JPEG, PNG e WebP passam. Os erros são `400 INVALID_IMAGE` (formato inválido ou arquivo vazio) e `413 FILE_TOO_LARGE` (acima de 5MB). O front comprime para WebP de até 1MB e 1600px antes de enviar. |

#### `PATCH /api/admin/produtos/{id}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A5 (toggle ativo), A7 |
| **RF** | RF23 |
| **Body** | campos parciais do `POST` (incl. `fichaTecnica`, `imagens` — substituição da lista quando enviado). Campo enviado segue a regra do `POST` (`400`). `fichaTecnica: {}` esvazia a ficha |

#### `DELETE /api/admin/produtos/{id}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A5 |
| **RF** | RF23 |
| **Notas** | Soft delete (`ativo=false`). Sem botão na UI: a lista usa (Des)ativar. |

---

### 3.8 Admin — conta e configuração

#### `GET /api/admin/conta` · `PATCH /api/admin/conta`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A8 |
| **RF** | RF26 |
| **Body (PATCH)** | `email?`, `telefone?`, `senhaAtual?` + `novaSenha?` (validados como no cadastro) |
| **Resposta (PATCH)** | `{ usuario, token }` — `token` só vem ao trocar a senha, que encerra as outras sessões |
| **Notas** | `telefone` ausente ou nulo não altera; `""` limpa. `novaSenha` exige `senhaAtual`; se ela estiver errada, `400 INVALID_PASSWORD`. |

#### `GET /api/admin/configuracao/pesos` · `PATCH /api/admin/configuracao/pesos`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A9 |
| **RF** | RF25, RNF13 |
| **Entidades** | `peso_metrica` |
| **GET** | `PesoMetrica[]` — `{ tipoEvento, peso }`; inclui `COMPRA` e `RETORNO_PAGINA`, que só têm peso |
| **Body (PATCH)** | `{ "pesos": [{ "tipoEvento", "peso" }] }` — `peso` de 0 a 9,9999 |

#### `GET /api/admin/configuracao/decay` · `PATCH /api/admin/configuracao/decay`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A9 |
| **RF** | RF25, RNF13 |
| **Entidades** | `parametro_decay` |
| **GET** | `ParametroDecay[]` — `{ categoriaId, categoriaNome?, lambda, boostConversao, boostRecorrencia, pausaDias }` (`categoriaId` null = global; `pausaDias` só vale no global) |
| **Body (PATCH)** | `{ "items": [{ "categoriaId", "lambda", "boostConversao", "boostRecorrencia"?, "pausaDias"? }] }` (bulk; upsert — cria o ajuste da categoria se não existir). `lambda` de 0,001 a 0,1; `boostConversao` e `boostRecorrencia` de 1 a 1,5; `pausaDias` de 0 a 180. Opcional ausente não altera |

#### `DELETE /api/admin/configuracao/decay/{categoriaId}`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A9 |
| **RF** | RF25 |
| **Entidades** | `parametro_decay` |
| **Resposta** | `ParametroDecay[]` atualizado. Remove o ajuste próprio da categoria, que volta a usar os valores globais. A linha global não tem rota de remoção. Ver [13 — M13](13-MUDANCAS-DE-ESCOPO.md). |

#### `POST /api/admin/configuracao/simular`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A9 (prévia) |
| **Body** | `{ "pesos": [{ tipoEvento, peso }], "decay": [{ categoriaId, lambda, boostConversao, boostRecorrencia?, pausaDias? }] }` — valores **propostos** (não grava nada). |
| **Resposta** | `{ impacto, precisao }`. **impacto:** recalcula agora, a partir dos eventos (365 dias) e compras, a nota máx. de cada cliente ativo (não ADMIN) com os parâmetros salvos e com os propostos → `clientesAnalisados`, `atual[]`/`proposta[]` (`{ nivel, quantidade }` para QUENTE/MORNO/FRIO/SEM_SCORE), `notaMediaAtual/Proposta`, `mudamDeNivel`, `mudancas[]` (top 10: `{ usuarioId, nome, nivelAtual, nivelProposto, notaAtual, notaProposta }`); categoria favorita (maior nota de categoria) de cada cliente nos dois cenários → `mudamDeCategoria`, `categoriasAtual[]`/`categoriasProposta[]` (`{ categoriaId, nome, quantidade }`, as mesmas até 6 categorias nos dois), `mudancasCategoria[]` (top 10: `{ usuarioId, nome, categoriaAtual, categoriaProposta }`, null = nenhuma). **precisao (backtest):** corte = percentil 70 dos horários dos eventos; notas com o histórico anterior ao corte; acerto pelas conversões (contato WhatsApp, evento com `conversao`, compra) a partir do corte, clientes e visitantes → `corte` (null se histórico insuficiente), `amostras`, `conversoes`, `confianca` (BAIXA < 10 conversões ≤ MEDIA < 30 ≤ ALTA), `atual`/`proposta`: `{ precisaoQuentes, recallQuentes, auc, acertoTop3, quentes }` (frações 0–1; null = indefinido). |
| **Cálculo** | Mesmo `ScoreCalculator` do motor (a prévia bate com o que será gravado). |

#### `POST /api/admin/configuracao/recalcular`

| | |
|---|---|
| **Auth** | admin |
| **Telas** | A9 (após salvar, opcional) |
| **Resposta** | `{ "recalculados": number }` — recalcula e grava `score_produto`/`score_categoria`/`faixa_preco_usuario` de todo cliente ou visitante com evento, compra ou nota já gravada (menos conta excluída), com os parâmetros salvos; apaga a nota que não tem mais sinal. Síncrono (volume atual). |

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
| **Notas** | Transição para `ATENDIDA` em pedidos de `EXCLUSAO` executa o soft delete anonimizado ([08 §5.2](08-MODELO-DE-DADOS.md)); `REVOGACAO_CONSENTIMENTO` grava a recusa de cookies comportamentais e de contato proativo; `EXPORTACAO` só muda o status (não gera arquivo). `atendidoEm` é preenchido em `ATENDIDA`/`REJEITADA` e limpo ao reabrir (`EM_PROCESSAMENTO`). |

---

## 4. Endpoints acrescentados ao esboço original

Itens que não estavam no esboço inicial da arquitetura:

| Endpoint | Motivo |
|---|---|
| `POST /api/auth/logout` | Encerrar sessão |
| `POST /api/auth/migrar-historico` | RF19 / telas 2–3 |
| `POST /api/visitantes/sessao` | RF18 cookie/sessão |
| `POST /api/conta/solicitacoes-lgpd` | RF29–30 + tabela `solicitacao_lgpd` |
| `GET/PATCH /api/admin/conta` | RF26 / A8 |
| `GET/PATCH /api/admin/configuracao/decay`, `DELETE …/decay/{categoriaId}` | RF25 λ / A9 |
| `GET /api/admin/produtos/{id}` | A7 pré-preenche formulário |

**Este arquivo é a fonte de verdade** da API.

---

## 5. Fora de escopo (API)

- Heatmap ([04 §3.4](04-ESPECIFICACAO-TECNICA.md))
- Treino ou inferência de modelos de ML (trabalho futuro)
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
| RF24 | `POST/PUT/DELETE /api/admin/usuarios/{id}/compras…` |
| RF25 | `configuracao/pesos`, `configuracao/decay`, `configuracao/simular`, `configuracao/recalcular` |
| RF26 | `GET/PATCH /api/admin/conta` |
| RF28–30 | consentimentos, exportar, solicitacoes-lgpd (consumidor + admin), `DELETE /api/conta` |
