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

- **Banner de cookies (S4):** na primeira visita, opções Aceitar todos / Apenas essenciais / Personalizar. Sem consentimento comportamental → sem coleta de eventos; recomendação só por Popularidade Global ([04 §10.2](04-ESPECIFICACAO-TECNICA.md)). Preferência válida 12 meses.
- **Eventos:** `POST /api/eventos` publica na fila e retorna rápido — não bloqueia UI ([RNF02](02-REQUISITOS.md)).
- **Desktop-first**, responsivo; WCAG 2.1 AA ([RNF10](02-REQUISITOS.md), [RNF11](02-REQUISITOS.md)).
- **Header público:** logo → `/`; links Catálogo, Sobre; se autenticado: Favoritos, Conta; se visitante: Entrar / Cadastrar. Sem link para `/admin`.
- **Header admin:** sidebar com Dashboard, Usuários, Produtos, Configuração, Conta; logout.

#### 4.0.1 Métricas → triggers

Mapa das métricas de interesse ([04 §3](04-ESPECIFICACAO-TECNICA.md)) para enum `tipo_evento` ([08 §3](08-MODELO-DE-DADOS.md)), tela e ação de UI. **Gate:** sem consentimento de cookies comportamentais (S4 / cadastro) → zero `POST /api/eventos`.

| Métrica (04 §3) | `tipo_evento` / origem | Tela(s) | Trigger UI | Payload / regra |
|---|---|---|---|---|
| Clique na página do produto | `VISUALIZACAO_PRODUTO` | 6 | Mount/hydration da ficha `/produtos/[slug]` (1× por abertura de página) | `produto_id`; alimenta retorno multi-sessão e sequência no backend |
| Favoritar produto | `FAVORITAR` / `DESFAVORITAR` | 6, 7 | Clique favoritar na ficha; remover em favoritos (`Popconfirm`) | `produto_id` |
| Contato sobre produto | `CONTATO_WHATSAPP` + `conversao=LEVE` | 6 | Clique CTA “Entrar em contato” (só auth) | `produto_id`; pausa decay 60d ([04 §5.4](04-ESPECIFICACAO-TECNICA.md)) |
| Contato sobre lista de favoritos | `CONTATO_WHATSAPP` + `conversao=FORTE` | 7 | Clique CTA “Entrar em contato” em item de `/favoritos` (favoritos = proxy do antigo "carrinho") | `produto_id` |
| Pesquisas | `PESQUISA` | 5 | Submit / Enter ou botão busca em `/produtos` (termo não vazio; debounce se digitação contínua) | `metadados.termo` |
| Filtros aplicados | `FILTRO_APLICADO` | 5 | Aplicar/alterar categoria ou faixa de preço (debounce ~300ms após mudança estável) | `metadados.filtros` (`categoria_id`, `precoMin`, `precoMax`) |
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
| **Layout** | Header + hero curto (título + 1 frase) + seção “Destaques” (grid de cards) + seção “Categorias em evidência” + footer. Sem stats, badges de urgência ou overlays. |
| **Conteúdo e campos** | Card produto: `produto.nome`, imagem principal (`produto_imagem` ordem 0), `produto.preco`, `categoria.nome`. Autenticado: ordenação por `score_produto.valor`. Visitante: Popularidade Global ([04 §6](04-ESPECIFICACAO-TECNICA.md)). |
| **Componentes** | `Layout`, `Card`, `Typography`, `Tag` (categoria), `Empty`, `Spin`, `Button` (ver catálogo). |
| **APIs** | `GET /api/produtos?limit=&destaque=true`; `GET /api/categorias`. |
| **Eventos / triggers** | Sem telemetria própria. Clique no card → só navega para `/produtos/[slug]`; `VISUALIZACAO_PRODUTO` dispara na tela 6. Contribui indiretamente à sequência de navegação quando a ficha abre. Ver §4.0.1. |
| **Estados** | Loading: skeleton/Spin. Empty: “Nenhum produto disponível”. Sem consentimento: mesma UI, ordenação só global. |
| **Rastreabilidade** | RF08, RF09, RNF01, RNF12 |

#### 2 — Login (`/entrar`)

| Item | Spec |
|---|---|
| **Objetivo** | Autenticar PF/PJ com e-mail e senha. |
| **Rota / auth** | Pública. Se já autenticado → redirect `/`. Admin **não** entra por esta rota. |
| **Layout** | Formulário centralizado, largura máxima ~400px; links “Criar conta” e “Esqueci a senha”. |
| **Conteúdo e campos** | `usuario.email`, senha (não persistida). |
| **Componentes** | `Form`, `Input`, `Input.Password`, `Button`, `Alert`, `Typography.Link`. |
| **APIs** | `POST /api/auth/login`. |
| **Eventos / triggers** | Sem métrica de interesse. Side-effect: se cookie de visitante + histórico → modal de migração ([04 §7](04-ESPECIFICACAO-TECNICA.md)). |
| **Estados** | Erro credenciais: Alert. Rate limit: mensagem genérica ([RNF06](02-REQUISITOS.md)). Loading no submit. |
| **Rastreabilidade** | RF05, RNF04, RNF06 |

#### 3 — Cadastro (`/cadastro`)

| Item | Spec |
|---|---|
| **Objetivo** | Criar conta PF ou PJ com consentimentos LGPD. |
| **Rota / auth** | Pública. Autenticado → `/`. |
| **Layout** | `Radio` PF/PJ no topo; campos condicionais; bloco LGPD; submit. |
| **Conteúdo e campos** | Comuns: `email`, senha, `telefone` (opc), `email_alternativo` (opc). **PF:** `cpf`, `nome_completo`, `idade` (opc). **PJ:** `cnpj`, `razao_social`. LGPD: Termos + Privacidade (obrigatório); cookies comportamentais (opc); contato proativo (opc) → `consentimento_lgpd` ([08 §4.3](08-MODELO-DE-DADOS.md)). |
| **Componentes** | `Form`, `Radio`, `Input`, `Input.Password`, `Checkbox`, `Button`, `Modal` (migração). |
| **APIs** | `POST /api/auth/signup`; após sucesso, se houver visitante: endpoint de migração (detalhe em [04 §7](04-ESPECIFICACAO-TECNICA.md)). |
| **Eventos / triggers** | Sem métrica de interesse. Checkbox cookies comportamentais habilita coleta futura (gate §4.0.1). Pós-sucesso: modal migração de histórico se houver visitante. |
| **Estados** | Validação CPF/CNPJ/e-mail; submit bloqueado sem termos; Modal “Associar histórico desta sessão?” Sim/Não. |
| **Rastreabilidade** | RF01–RF04, RF19, RNF08, RNF09 |

#### 4 — Recuperar senha (`/recuperar-senha`)

| Item | Spec |
|---|---|
| **Objetivo** | Redefinir senha em duas etapas. |
| **Rota / auth** | Pública. |
| **Layout** | `Steps` (1 Solicitar · 2 Redefinir) ou duas rotas query `?token=`. |
| **Conteúdo e campos** | Etapa 1: `email`. Etapa 2: nova senha + confirmação. |
| **Componentes** | `Steps`, `Form`, `Input`, `Input.Password`, `Button`, `Result` (sucesso). |
| **APIs** | `POST /api/auth/password-reset`; `POST /api/auth/password-reset/confirm`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | E-mail enviado (mesmo se inexistente — não enumerar usuários). Token inválido/expirado: Alert + link reenviar. |
| **Rastreabilidade** | RF06, RNF06 |

#### 5 — Catálogo (`/produtos`)

| Item | Spec |
|---|---|
| **Objetivo** | Listar produtos com busca, filtros e ordenação por intenção. |
| **Rota / auth** | Pública. |
| **Layout** | Sidebar ou drawer de filtros (desktop: lateral; mobile: Drawer) + grid/lista + `Pagination`. |
| **Conteúdo e campos** | Lista: `nome`, imagem, `preco`, `categoria`. Filtros: `categoria_id` (hierarquia `parent_id`), faixa de preço. Busca: termo livre. Sort default: score (auth) ou popularidade (visitante). |
| **Componentes** | `Input.Search`, `Select`/`TreeSelect` (categoria), `Slider` ou inputs preço, `Card`, `Pagination`, `Empty`, `Spin`, `Drawer`. |
| **APIs** | `GET /api/produtos?q=&categoria=&precoMin=&precoMax=&page=`; `GET /api/categorias`. |
| **Eventos / triggers** | Com consentimento (§4.0.1): **`PESQUISA`** — submit/Enter/botão busca com termo não vazio → `metadados.termo`. **`FILTRO_APLICADO`** — mudança estável de categoria ou faixa de preço (debounce ~300ms) → `metadados.filtros` (`categoria_id`, `precoMin`, `precoMax`). Clique no card → navega; view na tela 6. Paginação sem evento próprio. |
| **Estados** | Empty: “Nenhum produto encontrado” + limpar filtros. Loading na troca de página/filtro. |
| **Rastreabilidade** | RF08–RF11, RF17 |

#### 6 — Produto individual (`/produtos/[slug]`)

| Item | Spec |
|---|---|
| **Objetivo** | Ficha completa para decisão B2B + CTA de contato. |
| **Rota / auth** | Pública. CTA WhatsApp e favoritar: **somente autenticado** ([04 §12](04-ESPECIFICACAO-TECNICA.md)). Visitante: CTA secundário “Entrar para contatar”. |
| **Layout** | Breadcrumb; galeria (esquerda) + info (direita); abaixo `Descriptions`/abas ficha técnica; sticky CTA em mobile. |
| **Conteúdo e campos** | `produto.nome`, `descricao`, `preco`, `categoria`, `ficha_tecnica` (JSONB → pares chave/valor), `produto_imagem` (url, alt_text, ordem). |
| **Componentes** | `Breadcrumb`, `Image`/carrossel, `Typography`, `Descriptions`, `Button`, `Popconfirm` (desfavoritar se necessário), `Tag`, `Divider`. |
| **APIs** | `GET /api/produtos/{slug}`; `POST/DELETE /api/favoritos/{produtoId}`; `POST /api/eventos`. |
| **Eventos / triggers** | Com consentimento (§4.0.1): **`VISUALIZACAO_PRODUTO`** — 1× no mount/hydration (`produto_id`). **`TEMPO_PAGINA`** — heartbeat com aba visível; flush no unmount → `metadados.segundos_ativos`. **`SCROLL_DEPTH`** — marcos 25/50/75/100% (1× por marco por visita) → `metadados.pct`. **`FAVORITAR` / `DESFAVORITAR`** — clique no controle de favorito (auth). **`CONTATO_WHATSAPP` + `conversao=LEVE`** — CTA “Entrar em contato” (auth); pausa decay 60d ([04 §5.4](04-ESPECIFICACAO-TECNICA.md)). *Derivados (sem evento extra):* retorno multi-sessão e sequência de navegação a partir das views. |
| **Estados** | 404 se slug inexistente/inativo. Loading. Sem consentimento: página ok, sem telemetria. |
| **Rastreabilidade** | RF12–RF16, RF14 |

#### 7 — Favoritos (`/favoritos`)

| Item | Spec |
|---|---|
| **Objetivo** | Lista de desejos com atalho de contato (conversão forte). |
| **Rota / auth** | Autenticado PF/PJ. Visitante → `/entrar?next=/favoritos`. |
| **Layout** | Lista/grid de cards; ação remover; CTA “Entrar em contato” por item. |
| **Conteúdo e campos** | Join `favorito` + `produto` (+ imagem). |
| **Componentes** | `Card`/`List`, `Button`, `Popconfirm` (remover), `Empty`. |
| **APIs** | `GET /api/favoritos`; `DELETE /api/favoritos/{produtoId}`; `POST /api/eventos`. |
| **Eventos / triggers** | Com consentimento (§4.0.1): **`DESFAVORITAR`** — confirmar remoção (`Popconfirm`) → `produto_id`. **`CONTATO_WHATSAPP` + `conversao=FORTE`** — CTA “Entrar em contato” do item (proxy de contato sobre múltiplos produtos acumulados, [04 §8.1](04-ESPECIFICACAO-TECNICA.md)) → `produto_id`. |
| **Estados** | Empty: “Nenhum favorito” + link para `/produtos`. |
| **Rastreabilidade** | RF13, RF14 |

#### 8 — Conta (`/conta`)

| Item | Spec |
|---|---|
| **Objetivo** | Gerir dados, consentimentos LGPD e pedidos de direitos do titular; ajuda. |
| **Rota / auth** | Autenticado PF/PJ. |
| **Layout** | `Tabs`: Dados · Privacidade · Ajuda. |
| **Conteúdo e campos** | **Dados:** campos editáveis de `usuario` (exceto tipo). **Privacidade:** toggles `consentimento_lgpd` (COOKIES_COMPORTAMENTAIS, CONTATO_PROATIVO); botões Exportar / Solicitar exclusão → `solicitacao_lgpd`. **Ajuda:** FAQ estático + link suporte. |
| **Componentes** | `Tabs`, `Form`, `Switch`/`Checkbox`, `Button`, `Modal.confirm` (exclusão), `Alert`, `Collapse` (FAQ). |
| **APIs** | `GET/PATCH /api/conta`; `POST /api/conta/consentimentos`; `GET /api/conta/exportar`; `DELETE /api/conta` (ou POST solicitação). |
| **Eventos / triggers** | Sem métrica de interesse. **Gate:** revogar `COOKIES_COMPORTAMENTAIS` → parar coleta imediatamente ([04 §11](04-ESPECIFICACAO-TECNICA.md)); ver §4.0.1. |
| **Estados** | Confirmação destrutiva com verbo “Excluir conta” ([09 §3](09-NORMAS-DE-USABILIDADE.md)). Export: download JSON/CSV. |
| **Rastreabilidade** | RF28–RF30, RNF08, RNF09 |

---

### 4.2 Área administrativa (dono do catálogo)

Papel acessado pela conta `usuario.tipo = ADMIN` — referido no texto como **"dono do catálogo"**. Rota `/admin/*` e autenticação distinta ([RNF07](02-REQUISITOS.md)).

#### A1 — Login admin (`/admin/entrar`)

| Item | Spec |
|---|---|
| **Objetivo** | Autenticar apenas `usuario.tipo = ADMIN`. |
| **Rota / auth** | Pública sob `/admin`. Sem link na área pública. PF/PJ rejeitados mesmo com senha correta. |
| **Layout** | Formulário simples (e-mail + senha). |
| **Componentes** | `Form`, `Input`, `Input.Password`, `Button`, `Alert`. |
| **APIs** | `POST /api/admin/auth/login`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | Credenciais inválidas / não-admin: mesma mensagem genérica. |
| **Rastreabilidade** | RF05, RF07, RNF07 |

#### A2 — Dashboard (`/admin`)

| Item | Spec |
|---|---|
| **Objetivo** | Visão rápida de saúde do catálogo e leads priorizados. |
| **Rota / auth** | Admin. |
| **Layout** | Faixa de `Statistic` (KPIs) + tabela/lista de leads (score desc) + opcional gráfico distribuição. |
| **Conteúdo e campos** | KPIs sugeridos: nº usuários ativos, produtos ativos, contatos (7d), leads com score alto. Lead row: `usuario` (nome/razão), tipo, top categoria (`score_categoria`), score máximo produto, última atividade. |
| **Componentes** | `Statistic`, `Row`/`Col`, `Table`, `Tag`, `Progress`/`Chart`. |
| **APIs** | `GET /api/admin/dashboard`. |
| **Eventos / triggers** | Sem métrica de interesse (somente leitura de scores já calculados). |
| **Estados** | Empty leads: “Nenhum lead com score ainda”. |
| **Rastreabilidade** | RF20 |

#### A3 — Lista de usuários (`/admin/usuarios`)

| Item | Spec |
|---|---|
| **Objetivo** | Explorar clientes com sinais de intenção. |
| **Rota / auth** | Admin. |
| **Layout** | Filtros (tipo PF/PJ, categoria, faixa score) + `Table` paginada. |
| **Conteúdo e campos** | Colunas: identificador (nome/razão), `tipo`, e-mail, telefone, score top, categorias interesse, indício próxima compra (produto com maior `score_produto`). |
| **Componentes** | `Table`, `Select`, `Input.Search`, `Tag`, `Button` (abrir detalhe). |
| **APIs** | `GET /api/admin/usuarios?…`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Rastreabilidade** | RF21 |

#### A4 — Detalhe de usuário (`/admin/usuarios/[id]`)

| Item | Spec |
|---|---|
| **Objetivo** | Qualificar lead: scores, preço, histórico; registrar compra; contactar. |
| **Rota / auth** | Admin (dono do catálogo). |
| **Layout** | Cabeçalho (dados + botão WhatsApp/copiar telefone) + `Tabs`: Scores · Faixa de preço · Compras. |
| **Conteúdo e campos** | Scores: tabelas `score_produto`, `score_categoria`. Faixa: `faixa_preco_usuario.mediana_com_conversao`, `mediana_sem_conversao`, `gap_preco` — indicador visual se gap sugere barreira de preço ([04 §8](04-ESPECIFICACAO-TECNICA.md)). Compras: lista `compra` + form (produto único, preço unitário, qtd, valor total, data, observações — uma linha por produto, ver [08 §5.6](08-MODELO-DE-DADOS.md); vários produtos no mesmo dia = múltiplos submits). Aviso se `< 3` compras: métrica zerada no score ([04 §9.2](04-ESPECIFICACAO-TECNICA.md)). |
| **Componentes** | `Descriptions`, `Tabs`, `Table`, `Form`, `Select` (produto pageable), `DatePicker`, `InputNumber`, `Alert`, `Button`. |
| **APIs** | `GET /api/admin/usuarios/{id}`; `POST /api/admin/usuarios/{id}/compras`. |
| **Eventos / triggers** | Sem `tipo_evento` comportamental. **Histórico de compras ([04 §3.3](04-ESPECIFICACAO-TECNICA.md)):** submit do form “Registrar compra” → insert `compra` (não fila de eventos). WhatsApp do dono do catálogo é contato externo — **não** dispara `CONTATO_WHATSAPP` do consumidor. Ver §4.0.1. |
| **Estados** | Sem telefone: desabilitar WhatsApp + tooltip. |
| **Rastreabilidade** | RF22, RF24 |

#### A5 — Catálogo admin (`/admin/produtos`)

| Item | Spec |
|---|---|
| **Objetivo** | Listar e gerir produtos. |
| **Rota / auth** | Admin. |
| **Layout** | Busca + `Table` + ações Editar / (Des)ativar / Excluir. Botão “Novo produto”. |
| **Conteúdo e campos** | `nome`, `slug`, `preco`, `categoria`, `ativo`, updated_at. |
| **Componentes** | `Table`, `Input.Search`, `Tag`, `Button`, `Popconfirm` (excluir). |
| **APIs** | `GET/DELETE /api/admin/produtos`; PATCH para `ativo`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Rastreabilidade** | RF23 |

#### A6 / A7 — Novo / Editar produto (`/admin/produtos/novo`, `/admin/produtos/[id]/editar`)

| Item | Spec |
|---|---|
| **Objetivo** | Criar ou atualizar produto + imagens. |
| **Rota / auth** | Admin. Mesmo formulário; A7 pré-preenche. |
| **Layout** | Form em seções: Dados · Ficha técnica · Imagens. |
| **Conteúdo e campos** | `nome`, `slug` (auto a partir do nome, editável), `descricao`, `preco`, `categoria_id`, `ativo`, `ficha_tecnica` (editor chave/valor → JSONB), imagens (`url`, `alt_text`, `ordem`). |
| **Componentes** | `Form`, `Input`, `Select`, `Switch`, `Button`, upload/lista de URLs. |
| **APIs** | `POST /api/admin/produtos`; `PATCH /api/admin/produtos/{id}`. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Estados** | Validação preço ≥ 0; slug único. Sucesso → redirect lista ou detalhe. |
| **Rastreabilidade** | RF23 |

#### A8 — Conta admin (`/admin/conta`)

| Item | Spec |
|---|---|
| **Objetivo** | Admin altera próprios dados de acesso. |
| **Rota / auth** | Admin. |
| **Conteúdo e campos** | `email`, `telefone`, troca de senha (atual + nova). |
| **Componentes** | `Form`, `Input`, `Input.Password`, `Button`. |
| **APIs** | `GET/PATCH` conta admin (espelho de `/api/conta` ou endpoint admin dedicado). |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Rastreabilidade** | RF26 |

#### A9 — Configuração de scoring (`/admin/configuracao`)

| Item | Spec |
|---|---|
| **Objetivo** | Ajustar pesos, λ e boost pós-conversão sem redeploy ([RNF13](02-REQUISITOS.md)). |
| **Rota / auth** | Admin (dono do catálogo). |
| **Layout** | `Tabs`: Pesos de métricas · Decaimento (λ e boost). |
| **Conteúdo e campos** | **Pesos:** linhas `peso_metrica` por `tipo_evento` + `peso`. **Decay:** `lambda` + `boost_conversao` global (`categoria_id` NULL) + por categoria (`parametro_decay`, ver [08 §4.16](08-MODELO-DE-DADOS.md)). |
| **Componentes** | `Tabs`, `Table` editável ou `Form.List`, `InputNumber`, `Select` (categoria), `Button`, `Popconfirm` (reset defaults). |
| **APIs** | `GET/PATCH /api/admin/configuracao/pesos`; `GET/PATCH /api/admin/configuracao/decay` ([11 §3.8](11-API-ENDPOINTS.md)). |
| **Eventos / triggers** | Sem métrica de interesse (configura pesos das métricas da §4.0.1; não as dispara). |
| **Estados** | Validação pesos ≥ 0; feedback “Salvo” via `message`. |
| **Rastreabilidade** | RF25, RNF13 |

---

### 4.3 Apoio

#### S0 — Sobre (`/sobre`)

| Item | Spec |
|---|---|
| **Objetivo** | Apresentação acadêmica do TCC (PAC): problema, scoring, modelos, cronograma. |
| **Rota / auth** | Pública. |
| **Layout** | Seções: Hero, About, ScoringEngine, ModelsTable, Timeline, Footer. Link no header “Sobre”. |
| **Eventos / triggers** | Sem métrica de interesse. |
| **Rastreabilidade** | RNF12 (tom sóbrio) |

#### S1 — Política de Privacidade (`/privacidade`)

Texto legal LGPD; link no cadastro e footer. **Eventos / triggers:** sem métrica de interesse.

#### S2 — Termos de Uso (`/termos`)

Texto legal; aceite obrigatório no cadastro ([RF03](02-REQUISITOS.md)). **Eventos / triggers:** sem métrica de interesse.

#### S3 — 404

Mensagem clara + CTA “Ir para a vitrine” (`/`) e “Ver catálogo” (`/produtos`). **Eventos / triggers:** sem métrica de interesse.

#### S4 — Banner de cookies (global)

Ver §4.0 e §4.0.1. Componente no root layout; não é rota. **Trigger de gate:** Aceitar todos / Personalizar com cookies comportamentais → habilita coleta; Apenas essenciais / rejeitar → zero `POST /api/eventos`, ordenação só Popularidade Global.

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
| RNF07 | A1–A9 |
| RNF08–RNF09 | 3, 8, S1, S2, S4 |
| RNF10–RNF12 | todas (UI) |
| RNF13 | A9 |
