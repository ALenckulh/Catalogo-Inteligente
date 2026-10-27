# Páginas e Experiência do Usuário

Especificação das páginas do Catálogo Inteligente: filosofia visual, sitemap, componentes, detalhamento por tela, fluxos críticos e matriz RF × tela.

Fontes cruzadas: [02-REQUISITOS.md](02-REQUISITOS.md), [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md), [05-ARQUITETURA.md](05-ARQUITETURA.md), [08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md), [09-NORMAS-DE-USABILIDADE.md](09-NORMAS-DE-USABILIDADE.md).

---

## 1. Filosofia Visual

### 1.1 Posicionamento

A interface do Catálogo Inteligente é deliberadamente **minimalista e sóbria**, em oposição direta aos marketplaces de massa como **AliExpress e Shopee**. Estes últimos saturam a tela de banners animados, badges piscantes, selos de urgência, cores em alto contraste e gamificação para estimular compras por impulso. Esse padrão visual serve um público consumidor de varejo B2C médio, com decisões rápidas e tickets baixos.

**O nosso público é diferente.** O usuário deste sistema é majoritariamente **B2B** — um comprador profissional buscando itens específicos, geralmente com ticket relevante, que **precisa falar com o dono do catálogo** antes de decidir. Esse perfil valoriza clareza, ficha técnica legível, previsibilidade e profissionalismo — não gamificação de carrinho.

### 1.2 Diretrizes concretas

- **Paleta neutra:** branco, tons de cinza e uma única cor de acento. Sem gradientes agressivos.
- **Tipografia hierárquica clara**, boa legibilidade em desktop (público B2B navega mais em desktop; mobile é suporte).
- **Sem urgência fake**: zero contadores do tipo "3 pessoas vendo agora", "últimas unidades", "oferta termina em…".
- **Sem badges piscantes** ou selos competindo por atenção na listagem de produtos.
- **Fotos de produto limpas**, com espaço generoso para ficha técnica rica e descrições detalhadas.
- **CTA primário consistente** em páginas de produto e lista de favoritos (usuário autenticado): **"Entrar em contato"** (WhatsApp), estilo discreto porém inconfundível. Visitante **não** vê este CTA ([04 §12](04-ESPECIFICACAO-TECNICA.md)).
- **Densidade informacional controlada**: cada tela tem um foco claro; informação secundária em painéis colapsáveis ou abas.
- **Sem carrinho/pagamento** — conversão final fora da plataforma ([01-VISAO-GERAL.md](01-VISAO-GERAL.md)).

### 1.3 Design System: Ant Design

A base de componentes é o **Ant Design (antd)**. Justificativas:

- Biblioteca madura, com componentes profissionais prontos (tabelas, formulários, modais, breadcrumb) adequados ao perfil **enterprise/B2B**.
- Design tokens permitem configurar a paleta neutra sem reescrever componentes.
- Boa cobertura de acessibilidade (foco visível, ARIA, navegação por teclado), ajudando a atender [RNF11](02-REQUISITOS.md).
- Set de ícones próprio consistente.
- Reduz o tempo de desenvolvimento visual, permitindo foco no diferencial do projeto (scoring e ML).

Antd deve ser **customizado via tokens**, não sobrescrito via CSS. Importação sempre via `@/components/ui` ([10-ARQUITETURA-FRONTEND.md](10-ARQUITETURA-FRONTEND.md) §4). Qualquer componente que não exista no antd pode ser composto a partir dos existentes antes de adicionar nova dependência. Cores só via tokens ([09-NORMAS-DE-USABILIDADE.md](09-NORMAS-DE-USABILIDADE.md) §2).

---

## 2. Sitemap

### 2.1 Área pública (consumidor PF e PJ)

PF e PJ compartilham todos os fluxos; o tipo de cadastro é escolhido na página de cadastro e condiciona apenas os campos solicitados e os identificadores (CPF vs CNPJ).

| # | Página | Rota | Descrição |
|---|---|---|---|
| 1 | Vitrine | `/` | Visitante: Popularidade Global; autenticado: score personalizado |
| 2 | Login | `/entrar` | E-mail + senha (PF e PJ) |
| 3 | Cadastro | `/cadastro` | Escolha PF vs PJ; checkboxes LGPD |
| 4 | Esqueceu a senha | `/recuperar-senha` | Duas etapas (solicitar + redefinir) |
| 5 | Catálogo | `/produtos` | Listagem com busca, filtros, ordenação por score |
| 6 | Produto individual | `/produtos/[slug]` | Ficha técnica, galeria, favoritar, CTA WhatsApp |
| 7 | Lista de desejos | `/favoritos` | Favoritos + contato (conversão forte) |
| 8 | Configurações e ajuda | `/conta` | Dados, consentimentos LGPD, FAQ, suporte |

### 2.2 Área administrativa (uso interno)

Cadastro de admins feito pela TI; sem auto-signup. Rota separada da área pública ([RNF07](02-REQUISITOS.md)).

| # | Página | Rota | Descrição |
|---|---|---|---|
| A1 | Login admin | `/admin/entrar` | Sem link na área pública |
| A2 | Dashboard | `/admin` | KPIs + leads priorizados por score |
| A3 | Lista de usuários | `/admin/usuarios` | Filtros, score, próxima compra, categorias |
| A4 | Detalhe de usuário | `/admin/usuarios/[id]` | Scores, faixas de preço, histórico, registrar compra |
| A5 | Catálogo admin | `/admin/produtos` | Lista com busca e CRUD |
| A6 | Cadastro de produto | `/admin/produtos/novo` | Formulário de criação |
| A7 | Edição de produto | `/admin/produtos/[id]/editar` | Reutiliza formulário de criação |
| A8 | Minha conta | `/admin/conta` | E-mail, senha, telefone |
| A9 | Configuração de scoring | `/admin/configuracao` | Pesos de métricas (`peso_metrica`) e λ (`parametro_decay`) |
| A10 | Design system | `/admin/design-system` | Catálogo interno de tokens e componentes (uso admin) |

### 2.3 Páginas de apoio

| # | Página | Rota | Motivo |
|---|---|---|---|
| S0 | Sobre o projeto (TCC) | `/sobre` | Landing acadêmica (Hero, scoring, cronograma). |
| S1 | Política de Privacidade | `/privacidade` | Exigência LGPD |
| S2 | Termos de Uso | `/termos` | Exigência LGPD |
| S3 | Erro 404 | — | Boa prática de UX |
| S4 | Banner de cookies | — (global) | LGPD; primeira visita ([RF27](02-REQUISITOS.md)) |

---

## 3. Componentes Ant Design (mapeamento)

| Categoria | Componentes antd |
|---|---|
| Layout | `Layout`, `Menu`, `Breadcrumb`, `Divider`, `Flex`, `Space`, `Row`, `Col` |
| Formulários | `Form`, `Input`, `Input.Password`, `Select`, `DatePicker`, `Checkbox`, `Radio` |
| Dados | `Table`, `List`, `Card`, `Descriptions`, `Statistic`, `Tag`, `Empty` |
| Navegação | `Tabs`, `Pagination`, `Steps`, `Breadcrumb` |
| Feedback | `Modal`, `Drawer`, `message`, `notification`, `Popconfirm`, `Spin`, `Alert` |
| Dashboard admin | `Statistic`, `Progress`, `Timeline` + gráficos (`@ant-design/charts`, ver [10 §1](10-ARQUITETURA-FRONTEND.md)) |

---

## 4. Especificação por tela

Convenção de seções em cada tela: **Objetivo · Rota/auth · Layout · Conteúdo e campos · Componentes · APIs · Eventos / triggers · Estados · Rastreabilidade**. Triggers de métricas de interesse: §4.0.1.

### 4.0 Comportamentos globais

- **Banner de cookies (S4):** barra fixa inferior na primeira visita (título “Cookies e privacidade” + texto curto). Ações: Aceitar todos / Apenas essenciais / Personalizar. **Personalizar** abre `Modal` com Alert (essenciais sempre ativos), `Checkbox` de cookies comportamentais e “Salvar preferências”. Sem consentimento comportamental → sem coleta de eventos; recomendação só por Popularidade Global ([04 §10.2](04-ESPECIFICACAO-TECNICA.md)). Preferência válida 12 meses.
- **Eventos:** `POST /api/eventos` publica na fila e retorna rápido — não bloqueia UI ([RNF02](02-REQUISITOS.md)).
- **Desktop-first**, responsivo; WCAG 2.1 AA ([RNF10](02-REQUISITOS.md), [RNF11](02-REQUISITOS.md)).
- **Skip-link:** layout público inclui link “Pular para o conteúdo” → `#main-content`.
- **Header público:** sticky; logo → `/`; links Catálogo, Sobre (estado ativo conforme pathname); se autenticado: Favoritos, Conta (label = `displayName`: nome/razão/e-mail), **Sair** (logout); se visitante: Entrar / Cadastrar. Sem link para `/admin`.
- **Footer público:** marca + links Catálogo / Sobre / Privacidade / Termos de Uso + linha de copyright “Uso acadêmico (TCC)”.
- **Redirect `?next=`:** `/entrar` lê `next` (default `/`) e redireciona após login ou se já autenticado. Visitante em rotas autenticadas e CTAs “Entrar para…” usam o mesmo padrão (`/entrar?next=…`).
- **Header admin:** sider (“Catálogo Inteligente” / subtítulo “Admin”), colapsável (`breakpoint=lg`); menu Dashboard, Usuários, Produtos, Configuração, **Design system**, Conta; top bar com e-mail do admin + logout (ícone, tooltip “Sair”) → `/admin/entrar`. `/admin/entrar` renderiza **fora** do shell (sem sider). Visitante no shell: CTA “Entrar” → `/admin/entrar`.
- **ProdutoCard:** componente compartilhado (vitrine, catálogo, favoritos): `Card` hoverable, capa 1:1, `Tag` categoria, nome (ellipsis), preço BRL; clique → `/produtos/[slug]`.
- **Forms admin:** labels com tooltips de ajuda nos campos (padrão das telas A1, A4, A6–A8).

#### 4.0.1 Métricas → triggers

Mapa das métricas de interesse ([04 §3](04-ESPECIFICACAO-TECNICA.md)) para enum `tipo_evento` ([08 §3](08-MODELO-DE-DADOS.md)), tela e ação de UI. **Gate:** sem consentimento de cookies comportamentais (S4 / cadastro) → zero `POST /api/eventos`.

| Métrica (04 §3) | `tipo_evento` / origem | Tela(s) | Trigger UI | Payload / regra |
|---|---|---|---|---|
| Clique na página do produto | `VISUALIZACAO_PRODUTO` | 6 | Mount/hydration da ficha `/produtos/[slug]` (1× por abertura de página) | `produto_id`; alimenta retorno multi-sessão e sequência no backend |
| Favoritar produto | `FAVORITAR` / `DESFAVORITAR` | 6, 7 | Clique favoritar na ficha; remover em favoritos (`Popconfirm`) | `produto_id` |
| Contato sobre produto | `CONTATO_WHATSAPP` + `conversao=LEVE` | 6 | Clique CTA “Entrar em contato” (só auth) | `produto_id`; pausa decay 60d ([04 §5.4](04-ESPECIFICACAO-TECNICA.md)) |
| Contato sobre lista de favoritos | `CONTATO_WHATSAPP` + `conversao=FORTE` | 7 | Clique CTA “Entrar em contato” em item de `/favoritos` (favoritos = proxy do antigo "carrinho") | `produto_id` |
| Pesquisas | `PESQUISA` | 5 | Submit / Enter ou botão busca em `/produtos` (termo não vazio; debounce se digitação contínua) | `metadados.termo` |
| Filtros aplicados | `FILTRO_APLICADO` | 5 | Aplicar/alterar categoria, termo `q` ou faixa de preço (debounce ~300ms após mudança estável) | `metadados.filtros` (`categoria_id`, `q`; spec também `precoMin`, `precoMax`) |
| Tempo ativo na página | `TEMPO_PAGINA` | 6 | Heartbeat enquanto aba visível (`visibilitychange`); flush no unmount | `metadados.segundos_ativos`, `produto_id` |
| Scroll depth | `SCROLL_DEPTH` | 6 | Cruzar marcos 25/50/75/100% do documento (uma vez por marco por visita à página) | `metadados.pct`, `produto_id` |
| Retorno multi-sessão | *derivado* (N× `VISUALIZACAO_PRODUTO` em sessões distintas) | 6 | Sem evento extra no cliente | Worker/scoring conta revisitas |
| Sequência de navegação | *derivado* (ordem de `VISUALIZACAO_PRODUTO` na `sessao`) | 6 (+ 1/5 só navegam) | Sem evento extra; cada view na ficha entra na sequência | Camada 3 / arestas ([04 §3.1](04-ESPECIFICACAO-TECNICA.md)) |
| Sazonalidade / tempo entre visitas | *contextual* via `sessao` + timestamps | — | Abertura de sessão (já existente); sem UI dedicada | Backend |
| Histórico de compras | tabela `compra` (não `tipo_evento`) | A4 | Submit do form “Registrar compra” | RF24; se &lt; 3 compras do cliente, peso = 0 ([04 §9](04-ESPECIFICACAO-TECNICA.md)) |

Heatmap ([04 §3.4](04-ESPECIFICACAO-TECNICA.md)): fora de escopo — Trabalho Futuro.

---

### 4.1 Área pública

#### 1 — Vitrine (`/`)

| Item | Spec |
|---|---|
| **Objetivo** | Apresentar produtos e categorias com maior probabilidade de interesse, sem saturar a tela. |
| **Rota / auth** | Pública. Visitante e autenticado (PF/PJ). |
| **Layout** | Header + hero curto (título + 1 frase + CTA “Ver catálogo”) + seção “Destaques” (grid de `ProdutoCard`) + seção “Categorias em evidência” + footer. Sem stats, badges de urgência ou overlays. |
| **Conteúdo e campos** | Card produto via `ProdutoCard` (§4.0). Destaques: `GET` com `destaque=true`, **`limit=4`**. Categorias: só raiz (`parent_id` null); cada `Tag` navega para `/produtos?categoria={id}`. Autenticado: ordenação por `score_produto.valor`. Visitante: Popularidade Global ([04 §6](04-ESPECIFICACAO-TECNICA.md)). |
| **Componentes** | `Layout`, `ProdutoCard`, `Typography`, `Tag` (categoria), `Empty`, `Spin`, `Button` (ver catálogo), `Row`/`Col`. |
| **APIs** | `GET /api/produtos?limit=4&destaque=true`; `GET /api/categorias`. |
| **Eventos / triggers** | Sem telemetria própria. Clique no card → só navega para `/produtos/[slug]`; `VISUALIZACAO_PRODUTO` dispara na tela 6. Contribui indiretamente à sequência de navegação quando a ficha abre. Ver §4.0.1. |
| **Estados** | Loading: Spin. Empty destaques: “Nenhum produto disponível”. Empty categorias: “Nenhuma categoria cadastrada”. Sem consentimento: mesma UI, ordenação só global. |
| **Rastreabilidade** | RF08, RF09, RNF01, RNF12 |

#### 2 — Login (`/entrar`)

| Item | Spec |
|---|---|
| **Objetivo** | Autenticar PF/PJ com e-mail e senha. |
| **Rota / auth** | Pública. Se já autenticado → redirect para `next` (default `/`). Admin **não** entra por esta rota. |
| **Layout** | `Card` centralizado, largura máxima ~400px; título “Entrar” + subtítulo; links “Criar conta” e “Esqueci a senha”. |
| **Conteúdo e campos** | `usuario.email`, senha (não persistida); tooltips nos campos. Query `?next=` (§4.0). |
| **Componentes** | `Card`, `Form`, `Input`, `Input.Password`, `Button`, `Alert`, `Typography.Link`. |
| **APIs** | `POST /api/auth/login`. |
| **Eventos / triggers** | Sem métrica de interesse. Side-effect: se cookie de visitante + histórico → modal de migração ([04 §7](04-ESPECIFICACAO-TECNICA.md)). |
| **Estados** | Erro credenciais: Alert. Rate limit: mensagem genérica ([RNF06](02-REQUISITOS.md)). Loading no submit. |
| **Rastreabilidade** | RF05, RNF04, RNF06 |

#### 3 — Cadastro (`/cadastro`)

| Item | Spec |
|---|---|
| **Objetivo** | Criar conta PF ou PJ com consentimentos LGPD. |
| **Rota / auth** | Pública. Autenticado → `/`. |
| **Layout** | `Card` (~480px); `Radio` PF/PJ no topo; campos condicionais; bloco LGPD; submit; link “Já tem conta? Entrar” → `/entrar`. |
| **Conteúdo e campos** | Comuns: `email`, senha (mín. 6 no mock), `telefone` (opc), `email_alternativo` (opc). **PF:** `cpf`, `nome_completo`, `idade` (opc). **PJ:** `cnpj`, `razao_social`. LGPD: Termos + Privacidade (obrigatório); cookies comportamentais (opc); contato proativo (opc) → `consentimento_lgpd` ([08 §4.3](08-MODELO-DE-DADOS.md)). Tooltips nos campos. |
| **Componentes** | `Card`, `Form`, `Radio`, `Input`, `Input.Password`, `Checkbox`, `Button`, `Modal` (migração). |
| **APIs** | `POST /api/auth/signup`; após sucesso, se houver visitante: endpoint de migração (detalhe em [04 §7](04-ESPECIFICACAO-TECNICA.md)). |
| **Eventos / triggers** | Sem métrica de interesse. Checkbox cookies comportamentais habilita coleta futura (gate §4.0.1). Pós-sucesso: modal migração de histórico se houver visitante. |
| **Estados** | Validação CPF/CNPJ/e-mail; submit bloqueado sem termos; Modal “Associar histórico desta sessão?” Sim/Não. |
| **Rastreabilidade** | RF01–RF04, RF19, RNF08, RNF09 |

#### 4 — Recuperar senha (`/recuperar-senha`)

| Item | Spec |
|---|---|
| **Objetivo** | Redefinir senha em duas etapas. |
| **Rota / auth** | Pública. |
| **Layout** | `Card` + `Steps` (1 Solicitar · 2 Redefinir); link “Voltar ao login” → `/entrar`. |
| **Conteúdo e campos** | Etapa 1: `email`. Pós-envio: Alert informativo. Etapa 2: campo **Token** (mock, default `mock-reset`) + nova senha + confirmação. |
| **Componentes** | `Card`, `Steps`, `Form`, `Input`, `Input.Password`, `Button`, `Alert`, `Result` (sucesso). |
| **APIs** | `POST /api/auth/password-reset`; `POST /api/auth/password-reset/confirm`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | E-mail enviado (mesmo se inexistente — não enumerar usuários). Token inválido/expirado: Alert. Sucesso: `Result` + botão “Ir para entrar”. |
| **Rastreabilidade** | RF06, RNF06 |

#### 5 — Catálogo (`/produtos`)

| Item | Spec |
|---|---|
| **Objetivo** | Listar produtos com busca, filtros e ordenação por intenção. |
| **Rota / auth** | Pública. |
| **Layout** | Desktop: sidebar de filtros + grid; mobile: botão Filtros + `Drawer`. Busca no topo; `Pagination` (`pageSize` 12). Query sync: `?q=&categoria=&precoMin=&precoMax=&page=`. |
| **Conteúdo e campos** | Lista: `nome`, imagem, `preco`, `categoria` via `ProdutoCard`. Filtros: `TreeSelect` hierárquico (`parent_id` + descendentes), `precoMin`/`precoMax`, termo `q`. Sort default: score (auth) ou popularidade (visitante). |
| **Componentes** | `Input.Search`, `TreeSelect`, `InputNumber` (preço), `Drawer`, `ProdutoCard`, `Pagination`, `Empty`, `Spin`, `Button` (limpar / filtros). |
| **APIs** | `GET /api/produtos?q=&categoria=&precoMin=&precoMax=&page=&limit=12`; `GET /api/categorias`. |
| **Eventos / triggers** | Com consentimento (§4.0.1): **`PESQUISA`** — submit/Enter/botão busca com termo não vazio → `metadados.termo`. **`FILTRO_APLICADO`** — mudança estável de categoria ou `q` (debounce ~300ms) → `metadados.filtros` (`categoria_id`, `q`; spec também `precoMin`/`precoMax`). Clique no card → navega; view na tela 6. Paginação sem evento próprio. |
| **Estados** | Empty: “Nenhum produto encontrado” + botão Limpar filtros. Loading na troca de página/filtro. |
| **Rastreabilidade** | RF08–RF11, RF17 |

#### 6 — Produto individual (`/produtos/[slug]`)

| Item | Spec |
|---|---|
| **Objetivo** | Ficha completa para decisão B2B + CTA de contato. |
| **Rota / auth** | Pública. CTA WhatsApp e favoritar: **somente autenticado** ([04 §12](04-ESPECIFICACAO-TECNICA.md)). Visitante: CTA secundário “Entrar para contatar” → `/entrar?next=/produtos/[slug]`. |
| **Layout** | Breadcrumb Vitrine → Catálogo → nome; imagem principal (esquerda) + info (direita); abaixo `Descriptions` ficha técnica; sticky CTA em mobile (spec). |
| **Conteúdo e campos** | `produto.nome`, `descricao`, `preco`, `categoria`, `ficha_tecnica` (JSONB → pares chave/valor), imagem ordem 0 (mock: sem carrossel; spec prevê galeria). |
| **Componentes** | `Breadcrumb`, `Image`, `Typography`, `Descriptions`, `Button` (ícones WhatsApp / Heart), `Tag`, `Divider`. Toggle favorito imediato na ficha (sem `Popconfirm`; Popconfirm só em favoritos). |
| **APIs** | `GET /api/produtos/{slug}`; `POST/DELETE /api/favoritos/{produtoId}`; `POST /api/eventos`. |
| **Eventos / triggers** | Com consentimento (§4.0.1): **`VISUALIZACAO_PRODUTO`** — 1× no mount/hydration (`produto_id`). **`TEMPO_PAGINA`** — heartbeat com aba visível; flush no unmount → `metadados.segundos_ativos`. **`SCROLL_DEPTH`** — marcos 25/50/75/100% (1× por marco por visita) → `metadados.pct`. **`FAVORITAR` / `DESFAVORITAR`** — clique no controle de favorito (auth). **`CONTATO_WHATSAPP` + `conversao=LEVE`** — CTA “Entrar em contato” (auth); pausa decay 60d ([04 §5.4](04-ESPECIFICACAO-TECNICA.md)). *Derivados (sem evento extra):* retorno multi-sessão e sequência de navegação a partir das views. |
| **Estados** | Slug inexistente/inativo: `notFound()` (página 404). Loading. Sem consentimento: página ok, sem telemetria. |
| **Rastreabilidade** | RF12–RF16, RF14 |

#### 7 — Favoritos (`/favoritos`)

| Item | Spec |
|---|---|
| **Objetivo** | Lista de desejos com atalho de contato (conversão forte). |
| **Rota / auth** | Autenticado PF/PJ. Visitante → `/entrar?next=/favoritos`. |
| **Layout** | Grid de `ProdutoCard`; ação remover; CTA “Entrar em contato” por item. |
| **Conteúdo e campos** | Join `favorito` + `produto` (+ imagem). |
| **Componentes** | `ProdutoCard`, `Button`, `Popconfirm` (remover), `Empty`. |
| **APIs** | `GET /api/favoritos`; `DELETE /api/favoritos/{produtoId}`; `POST /api/eventos`. |
| **Eventos / triggers** | Com consentimento (§4.0.1): **`DESFAVORITAR`** — confirmar remoção (`Popconfirm`) → `produto_id`. **`CONTATO_WHATSAPP` + `conversao=FORTE`** — CTA “Entrar em contato” do item (proxy de contato sobre múltiplos produtos acumulados, [04 §8.1](04-ESPECIFICACAO-TECNICA.md)) → `produto_id`. |
| **Estados** | Empty: “Nenhum favorito” + link para `/produtos`. |
| **Rastreabilidade** | RF13, RF14 |

#### 8 — Conta (`/conta`)

| Item | Spec |
|---|---|
| **Objetivo** | Gerir dados, consentimentos LGPD e pedidos de direitos do titular; ajuda. |
| **Rota / auth** | Autenticado PF/PJ. Visitante → `/entrar?next=/conta`. |
| **Layout** | `Tabs`: Dados · Privacidade · Ajuda. |
| **Conteúdo e campos** | **Dados:** somente leitura — e-mail, CPF/CNPJ, razão social (PJ). Editáveis — `nomeCompleto` (PF), `telefone` (máscara no blur), `emailAlternativo`; Salvar → toast “Dados salvos”. **Privacidade:** `Switch` COOKIES_COMPORTAMENTAIS e CONTATO_PROATIVO + botão **“Salvar preferências”**; Exportar (mock) / Solicitar exclusão → `solicitacao_lgpd`. **Ajuda:** `Collapse` com 3 itens (contato WhatsApp; cookies/recomendações; suporte com links `/sobre` e `/privacidade`). |
| **Componentes** | `Tabs`, `Form`, `Switch`, `Button`, `Modal.confirm` (exclusão), `Alert`, `Collapse` (FAQ), `notification`. |
| **APIs** | `GET/PATCH /api/conta`; `POST /api/conta/consentimentos`; `GET /api/conta/exportar`; `DELETE /api/conta` (ou POST solicitação). |
| **Eventos / triggers** | Sem métrica de interesse. **Gate:** revogar `COOKIES_COMPORTAMENTAIS` → parar coleta imediatamente ([04 §11](04-ESPECIFICACAO-TECNICA.md)); ver §4.0.1. |
| **Estados** | Confirmação destrutiva com verbo “Excluir conta” ([09 §3](09-NORMAS-DE-USABILIDADE.md)); após exclusão: `logout` + redirect `/`. Export: download JSON/CSV (mock). |
| **Rastreabilidade** | RF28–RF30, RNF08, RNF09 |

---

### 4.2 Área administrativa (dono do catálogo)

Papel acessado pela conta `usuario.tipo = ADMIN` — referido no texto como **"dono do catálogo"**. Rota `/admin/*` e autenticação distinta ([RNF07](02-REQUISITOS.md)).

#### A1 — Login admin (`/admin/entrar`)

| Item | Spec |
|---|---|
| **Objetivo** | Autenticar apenas `usuario.tipo = ADMIN`. |
| **Rota / auth** | Pública sob `/admin`. Sem link na área pública. PF/PJ rejeitados mesmo com senha correta. Admin já autenticado → `/admin`. Fora do `AdminShell` (sem sider). |
| **Layout** | `Card` centralizado (~400px); título “Admin — Entrar”; subtítulo “Acesso restrito ao dono do catálogo.” |
| **Conteúdo e campos** | E-mail + senha; tooltips; submit com ícone `LoginOutlined`. |
| **Componentes** | `Card`, `Form`, `Input`, `Input.Password`, `Button`, `Alert`. |
| **APIs** | `POST /api/admin/auth/login`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | Credenciais inválidas / não-admin: mesma mensagem genérica. |
| **Rastreabilidade** | RF05, RF07, RNF07 |

#### A2 — Dashboard (`/admin`)

| Item | Spec |
|---|---|
| **Objetivo** | Visão rápida de saúde do catálogo (KPIs + gráficos). |
| **Rota / auth** | Admin. |
| **Layout** | Faixa de `Statistic` (KPIs com help) + 3 gráficos (`series`). |
| **Conteúdo e campos** | KPIs (tooltip de definição): **Usuários ativos** — PF/PJ com `deleted_at` nulo (exclui ADMIN); link Ver → `/admin/usuarios`. **Produtos ativos** — `ativo=true`; link Ver → `/admin/produtos`. **Contatos (7d)** — eventos `CONTATO_WHATSAPP` (sem link Ver). **Leads score alto** — `score_produto` máx. **≥ 70** (sem link Ver). Gráficos: distribuição de scores (faixas 0–20…81–100), contatos WhatsApp (14d), interesse por categoria. |
| **Componentes** | `Statistic`, `Tooltip` + `InfoCircleOutlined`, `Button`/`Link` (Eye), `Row`/`Col`, `Card`, `@ant-design/charts` (`Column`, `Line`, `Bar`), `Spin`. |
| **APIs** | `GET /api/admin/dashboard`. |
| **Eventos / triggers** | Sem métrica de interesse (somente leitura de agregados já calculados). |
| **Estados** | Loading: Spin (auth + dados). |
| **Rastreabilidade** | RF20 |

#### A3 — Lista de usuários (`/admin/usuarios`)

| Item | Spec |
|---|---|
| **Objetivo** | Explorar clientes com sinais de intenção. |
| **Rota / auth** | Admin. |
| **Layout** | `Input.Search` (`q`) + `Select` tipo PF/PJ + `Select` categoria (filtra `topCategoria`) + `Table` paginada (`pageSize` 20). (Spec também prevê faixa score.) |
| **Conteúdo e campos** | Colunas: identificador (nome/razão, sortable), `tipo` (filtro de coluna PF/PJ), e-mail (sortable), telefone, status `ativo` (filtro Ativo/Inativo), score máx. (sortable), top categoria (sortable), última atividade (sortable), ações. |
| **Componentes** | `Table`, `Select`, `Input.Search`, `Tag`, `Button` icon-only `EyeOutlined` + tooltip (abrir detalhe). |
| **APIs** | `GET /api/admin/usuarios?…`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | Loading auth/dados: Spin. |
| **Rastreabilidade** | RF21 |

#### A4 — Detalhe de usuário (`/admin/usuarios/[id]`)

| Item | Spec |
|---|---|
| **Objetivo** | Qualificar lead: scores, preço, histórico; registrar compra; contactar. |
| **Rota / auth** | Admin (dono do catálogo). |
| **Layout** | Link “← Usuários” → `/admin/usuarios`; cabeçalho (nome + e-mail + botão WhatsApp com telefone formatado / mensagem pré-preenchida) + `Tabs`: Scores · Faixa de preço · Compras. |
| **Conteúdo e campos** | Scores: tabelas `score_produto` / `score_categoria` (sortable). Faixa: `mediana_com_conversao`, `mediana_sem_conversao`, `gap_preco` — `Alert` warning se **`gapPreco > 10`** (“Gap sugere possível barreira de preço”, [04 §8](04-ESPECIFICACAO-TECNICA.md)). Compras: tabela (Produto, Qtd, Total, Data) + form (produto com `showSearch`, preço unitário, qtd, data, observações; **`valorTotal` auto** = preço × qtd — uma linha por produto, [08 §5.6](08-MODELO-DE-DADOS.md)). Aviso se `< 3` compras: métrica zerada no score ([04 §9.2](04-ESPECIFICACAO-TECNICA.md)). Pós-submit: toast “Compra registrada”, reset form, reload. |
| **Componentes** | `Descriptions`, `Tabs`, `Table`, `Form`, `Select` (`showSearch`), `DatePicker`, `InputNumber`, `Alert`, `Button`, `notification`. |
| **APIs** | `GET /api/admin/usuarios/{id}`; `POST /api/admin/usuarios/{id}/compras`. |
| **Eventos / triggers** | Sem `tipo_evento` comportamental. **Histórico de compras ([04 §3.3](04-ESPECIFICACAO-TECNICA.md)):** submit do form “Registrar compra” → insert `compra` (não fila de eventos). WhatsApp do dono do catálogo é contato externo — **não** dispara `CONTATO_WHATSAPP` do consumidor. Ver §4.0.1. |
| **Estados** | Sem telefone: desabilitar WhatsApp + tooltip. Loading: Spin. |
| **Rastreabilidade** | RF22, RF24 |

#### A5 — Catálogo admin (`/admin/produtos`)

| Item | Spec |
|---|---|
| **Objetivo** | Listar e gerir produtos. |
| **Rota / auth** | Admin. |
| **Layout** | Busca + `Table` (`pageSize` 20) + ações icon+tooltip: Editar / (Des)ativar / Excluir. Botão “Novo produto”. |
| **Conteúdo e campos** | Colunas: `nome`, `slug`, `preco`, `categoria`, `ativo` (filtro Sim/Não), `updated_at` — Nome/Slug/Preço/Categoria/Atualizado sortable. |
| **Componentes** | `Table`, `Input.Search`, `Tag`, `Button` (ícones Edit / Stop|Check / Delete), `Popconfirm` (título “Remover produto do catálogo?”, ok “Remover”), `notification` (toggle ativo). |
| **APIs** | `GET/DELETE /api/admin/produtos`; PATCH para `ativo`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | Loading: Spin. |
| **Rastreabilidade** | RF23 |

#### A6 / A7 — Novo / Editar produto (`/admin/produtos/novo`, `/admin/produtos/[id]/editar`)

| Item | Spec |
|---|---|
| **Objetivo** | Criar ou atualizar produto + imagens. |
| **Rota / auth** | Admin. Mesmo formulário; A7 pré-preenche. Títulos de página “Novo produto” / “Editar produto”. |
| **Layout** | Form em seções: Dados · Ficha técnica (`Form.List` chave/valor) · Imagens (`Form.List` url/alt/ordem) + ações Salvar / **Cancelar** → `/admin/produtos`. |
| **Conteúdo e campos** | `nome`, `slug` (auto a partir do nome até edição manual), `descricao`, `preco`, `categoria_id`, `ativo` (default **`true`** na criação), `ficha_tecnica` (spec), imagens (spec). Tooltips nos campos. |
| **Componentes** | `Form`, `Input`, `Select`, `Switch`, `Button` (Save / Close), `Alert` (erro). |
| **APIs** | `POST /api/admin/produtos`; `PATCH /api/admin/produtos/{id}`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | Validação preço ≥ 0; slug único. Sucesso → toast + redirect **sempre** à lista. |
| **Rastreabilidade** | RF23 |

#### A8 — Conta admin (`/admin/conta`)

| Item | Spec |
|---|---|
| **Objetivo** | Admin altera próprios dados de acesso. |
| **Rota / auth** | Admin. |
| **Layout** | Título + parágrafo de apoio (“Altere e-mail, telefone ou senha (mock).”). |
| **Conteúdo e campos** | `email`, `telefone`, senha atual + nova (opcional: “deixe em branco para manter”; mock: senha UI-only, PATCH envia e-mail/telefone). Tooltips. |
| **Componentes** | `Form`, `Input`, `Input.Password`, `Button`, `Alert`, `notification`. |
| **APIs** | `GET/PATCH` conta admin (espelho de `/api/conta` ou endpoint admin dedicado). |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | Erro: Alert. Sucesso: “Conta atualizada”. Loading auth: Spin. |
| **Rastreabilidade** | RF26 |

#### A9 — Configuração de scoring (`/admin/configuracao`)

| Item | Spec |
|---|---|
| **Objetivo** | Ajustar pesos, λ e boost pós-conversão sem redeploy ([RNF13](02-REQUISITOS.md)). |
| **Rota / auth** | Admin (dono do catálogo). |
| **Layout** | `Tabs`: Pesos de métricas · Decaimento (λ e boost). **Salvar independente por aba.** |
| **Conteúdo e campos** | **Pesos:** tabela editável `tipo_evento` + `peso` (`InputNumber`); **Reset defaults** (`Popconfirm`) só nesta aba — defaults dos 8 `tipo_evento` (VISUALIZACAO…TEMPO_PAGINA). **Decay:** colunas Escopo (Global vs `categoriaNome`), λ, Boost conversão; linhas vindas da API/mock (sem UI para adicionar categoria no mock). |
| **Componentes** | `Tabs`, `Table` editável, `InputNumber`, `Button`, `Popconfirm` (reset pesos), `message`. |
| **APIs** | `GET/PATCH /api/admin/configuracao/pesos`; `GET/PATCH /api/admin/configuracao/decay` ([11 §3.8](11-API-ENDPOINTS.md)). |
| **Eventos / triggers** | Sem métrica de interesse (configura pesos das métricas da §4.0.1; não as dispara). |
| **Estados** | Validação pesos ≥ 0; `message.success` “Pesos salvos” / “Decaimento salvo”. Loading: Spin. |
| **Rastreabilidade** | RF25, RNF13 |

#### A10 — Design system (`/admin/design-system`)

| Item | Spec |
|---|---|
| **Objetivo** | Catálogo interno de tokens e componentes de `@/components/ui` (uso admin / desenvolvimento). |
| **Rota / auth** | Admin. Item na sidebar “Design system”. |
| **Layout** | Título + intro; `Tabs`: **Cores** (swatches Primary/Secondary/Neutral + semânticos) · **Button** (variants × colors + demo tooltip) · **Formulário** · **Card/Alert** (shadows sm/md/lg; tipos de Alert) · **Dados** (Tag, Badge, Spin, Table, Empty). |
| **Componentes** | `Tabs`, `Button`, `Form`, `Card`, `Alert`, `Tag`, `Badge`, `Spin`, `Table`, `Empty`, tokens de `palette`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | Loading auth: Spin. |
| **Rastreabilidade** | — (ferramenta interna; não RF de negócio) |

---

### 4.3 Apoio

#### S0 — Sobre (`/sobre`)

| Item | Spec |
|---|---|
| **Objetivo** | Apresentação acadêmica do TCC (PAC): problema, scoring, modelos, cronograma. |
| **Rota / auth** | Pública. Link no header “Sobre”. |
| **Layout** | Seções empilhadas (coexistem com `PublicFooter` global): |
| | **Hero:** eyebrow PAC VIII / instituição; H1; pitch; `Tag`s de stack; CTAs “Ver o Motor de Scoring” + GitHub; card ilustrativo de score (`Statistic` + métricas). |
| | **About:** 4 cards (Problema, Solução, Diferencial, Conformidade) + `Alert` hipótese central. |
| | **ScoringEngine:** card da fórmula Σ peso×evento×e⁻λt; 6 cards de peso com `Progress`; `Steps` verticais Camadas 1–4 (status implementado / futuro). |
| | **ModelsTable:** `Table` comparando KNN, Grafo/PPR, Regras+Decay, Sequenciais, Matrix Factorization (colunas: interpretabilidade, esparsidade, vol. mín., anônimo, cold start, calibração B2B, escalabilidade, status). |
| | **Timeline:** 4 fases (semanas 1–4 Fundação · 5–8 Motor · 9–12 Avançadas · 13–16 Validação) com bullets de entrega. |
| | **Footer acadêmico:** autor, e-mail, instituição; âncoras internas; 4 referências DOI; PAC VIII / MIT. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Rastreabilidade** | RNF12 (tom sóbrio) |

#### S1 — Política de Privacidade (`/privacidade`)

Texto legal LGPD (mock 1.0); link no cadastro e footer. Seções: **Dados coletados** · **Finalidade** · **Direitos do titular**. **Eventos / triggers:** sem métrica de interesse.

#### S2 — Termos de Uso (`/termos`)

Texto legal (mock 1.0); aceite obrigatório no cadastro ([RF03](02-REQUISITOS.md)). Seções: **Objeto** · **Contas** · **Uso aceitável**. **Eventos / triggers:** sem métrica de interesse.

#### S3 — 404

`Result` status 404; título “Página não encontrada”; subtítulo sobre URL/produto ausente; CTAs “Ir para a vitrine” (`/`) e “Ver catálogo” (`/produtos`). **Eventos / triggers:** sem métrica de interesse.

#### S4 — Banner de cookies (global)

Ver §4.0 e §4.0.1. Componente no root layout; não é rota. Banner fixo inferior + Modal Personalizar. **Trigger de gate:** Aceitar todos / Personalizar com cookies comportamentais → habilita coleta; Apenas essenciais / rejeitar → zero `POST /api/eventos`, ordenação só Popularidade Global.

---

## 5. Fluxos críticos

1. **Visitante → cadastra / login → migração de histórico** (telas 3, 2)
   Navega com cookie `visitante`; ao autenticar, Modal pergunta se associa histórico ([04 §7](04-ESPECIFICACAO-TECNICA.md), [RF19](02-REQUISITOS.md)).

2. **Autenticado → WhatsApp no produto** (tela 6)
   `CONTATO_WHATSAPP` + `conversao=LEVE`; pausa decay 60 dias ([04 §5.4](04-ESPECIFICACAO-TECNICA.md)); lead sobe no dashboard (A2).

3. **Autenticado → WhatsApp nos favoritos** (tela 7)
   Mesmo evento com `conversao=FORTE` ([04 §8.1](04-ESPECIFICACAO-TECNICA.md)).

4. **Dono do catálogo → detalhe → WhatsApp** (tela A4)
   Vê scores + faixas de preço + gap; copia telefone / abre WhatsApp externo.

5. **Dono do catálogo → registra compra** (tela A4)
   `POST .../compras`; se total de compras do cliente `< 3`, peso do histórico = 0 no score ([04 §9.2](04-ESPECIFICACAO-TECNICA.md), [RF24](02-REQUISITOS.md)).

---

## 6. Matriz RF × tela

| RF | Telas principais |
|---|---|
| RF01–RF04 | 3 |
| RF05 | 2, A1 |
| RF06 | 4 |
| RF07 | A1 (TI cria admin fora do self-service) |
| RF08–RF09 | 1, 5 |
| RF10–RF11 | 5 |
| RF12, RF14–RF16 | 6 |
| RF13 | 6, 7 |
| RF17 | 5 |
| RF18 | S4 + coleta global |
| RF19 | 2, 3 |
| RF20 | A2 |
| RF21 | A3 |
| RF22 | A4 |
| RF23 | A5–A7 |
| RF24 | A4 |
| RF25 | A9 |
| RF26 | A8 |
| RF27 | S4 |
| RF28–RF30 | 8 |
| RNF01 | 1 |
| RNF02 | eventos em 5, 6, 7 |
| RNF07 | A1–A10 |
| RNF08–RNF09 | 3, 8, S1, S2, S4 |
| RNF10–RNF12 | todas (UI) |
| RNF13 | A9 |
