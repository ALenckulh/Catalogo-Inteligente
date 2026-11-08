# Normas de Usabilidade — Catálogo Inteligente

Referência de desenvolvimento + checklist de code review. Lista as decisões de UI/UX que valem para toda a aplicação. Adaptado de padrões consolidados em design systems internos; aqui foca no stack do TCC (Next.js + Ant Design + wrappers `@/components/ui`).

---

## 1. Uso de componentes

**Prioridade:**
1. Wrapper em `@/components/ui/*` (Button, Input, Form, Card, Select).
2. Componente antd re-exportado em `@/components/ui` (Tag, Modal, Table, …).
3. Componente antd importado direto de `antd` — só se o barrel não expor.
4. HTML "cru" — apenas para **landmarks semânticos** (`<main>`, `<section aria-labelledby>`, `<nav>`, `<footer>` quando não houver `Layout.Footer`) e `<a>` de skip-link.

Nunca criar botão/input/tabela customizado em HTML/CSS enquanto houver antd equivalente.

### 1.1 Props com valor default

Evite passar props iguais ao default do componente — polui o JSX e esconde a configuração que de fato muda:

```tsx
// ❌ redundante
<Button variant="outlined" color="default" size="middle">Exportar</Button>

// ✅
<Button>Exportar</Button>
```

### 1.2 Hierarquia de variantes de Button

Wrapper `@/components/ui/Button` — ênfase visual (maior → menor):

`solid` → `outlined` → `dashed` → `filled` → `text` → `link`

O wrapper decide o default pela cor: `color="primary"` nasce `solid`; `variant="link"` nasce `primary`; o resto nasce `outlined`, inclusive `color="danger"`. Assim, um `<Button>` sem props nunca compete com o CTA. No máximo **um** `solid` + `color="primary"` por contexto de tela/form (CTA principal). Em tabelas, ações por linha usam `text` — nunca solid repetido em cada row.

| Variante | Quando usar |
|---|---|
| `solid` + `primary` | Única ação principal da tela/form (Salvar, Novo, Entrar, WhatsApp) |
| `outlined` + `primary` | CTA repetido em lista ou grade (Entrar em contato em cada favorito) |
| `outlined` | Secundária no mesmo grupo (Cancelar, Reset, Exportar) |
| `outlined` + `danger` | Ação destrutiva de página (Solicitar exclusão da conta), separada das demais por `Divider` |
| `dashed` / `filled` | Casos raros (adicionar item em lista, destaque suave) — evitar no admin atual |
| `text` | Ações em **tabela** / toolbar densa (Abrir, Editar, Ativar, Excluir) e navegação no header |
| `link` | Navegação auxiliar leve (Ver do KPI, Limpar filtros, Desfazer) |

**O header não disputa com a página:** "Cadastrar" é `outlined`. O CTA da tela é sempre da página.

**Exceção única:** no banner de cookies, "Aceitar todos" é `solid` mesmo quando a página tem CTA. O banner é transitório e some na primeira decisão.

**Botão que navega:** use `href` no próprio `Button`, nunca `<Link><Button>`. O aninhamento gera `<a><button>` e duas paradas de Tab. Com `href` interno, o wrapper renderiza `<a>` real, navega pelo router e preserva Ctrl/clique do meio.

**Ícones:**
- **Tabela / ações por linha:** só ícone (`variant="text"`) + `tooltip` — sem children de texto.
- **CTA e secundários de página/form:** texto permanece; acrescente `icon` ao lado quando houver ícone óbvio do Ant Design (`SaveOutlined`, `PlusOutlined`, etc.).
- **Navegação leve (`link`):** ícone + texto curto (ex.: `EyeOutlined` + "Ver").

```tsx
// CTA da página — texto + ícone
<Button color="primary" icon={<PlusOutlined />}>Novo produto</Button>

// Secundário ao lado do CTA — texto + ícone
<Button icon={<CloseOutlined />}>Cancelar</Button>

// Célula de ações da tabela — só ícone + tooltip
<Button variant="text" size="small" icon={<EyeOutlined />} tooltip="Abrir" />
<Button variant="text" size="small" color="danger" icon={<DeleteOutlined />} tooltip="Excluir" />

// Navegação leve
<Button variant="link" size="small" icon={<EyeOutlined />}>Ver</Button>
```

## 2. Uso de cores

Toda cor usada em TSX/CSS deve vir de um token:

- **CSS/CSS Modules:** `var(--primary)`, `var(--text-neutral-strong)`, `var(--surface-neutral-subtle)`.
- **TSX inline style:** `color: 'var(--primary)'` **ou** `color: palette.primary[400]` importando `@/lib/theme/tokens`.
- **ThemeConfig do antd:** já mapeia os tokens — para `colorPrimary` etc. não é preciso prop custom.

❌ Nunca hardcode `#3D6F94`, `#F5F5F5`, `rgba(...)` em componente.

### 2.1 Grafia do projeto

Sempre **Catálogo Inteligente** (com acento no "a" e "C" + "I" maiúsculos). "catálogo" só como substantivo comum ("um catálogo de produtos").

### 2.2 Primária só em ação

Cor primária (`--primary`) representa affordance — reserve para elementos interativos (botão principal, link, badge de status ativo). Em texto puro use `--text-neutral-*`; para destaque secundário, `--secondary`.

## 3. Confirmação de deleção

Toda ação destrutiva (deletar, cancelar negociação, excluir conta) **exige confirmação**:

- Inline em grid → `Popconfirm`.
- Em modal/form → `modal.confirm` de `App.useApp()`, que herda tema e idioma. O `Modal.confirm` estático não herda.

**Ação reversível não é destrutiva:** o que dá para refazer em um clique (remover favorito) executa na hora e mostra `notification` com o botão **Desfazer**, por 8 segundos. Confirmar antes custa um clique em toda remoção; desfazer só custa quando o usuário errou.

Texto obrigatório: pergunta explícita + consequência. Botão primário com **verbo específico** ("Excluir", "Remover", "Cancelar negociação") — nunca "OK"/"Confirmar".

```tsx
<Popconfirm
  message="Remover produto do catálogo?"
  description="Esta ação é permanente e não pode ser desfeita."
  okText="Remover"
  cancelText="Cancelar"
  onConfirm={handleDelete}
>
  <Button variant="text" color="danger" icon={<DeleteOutlined />} tooltip="Excluir" />
</Popconfirm>
```

## 4. Ícones de status

Padrão único para toda a app:

| Status | Ícone |
|---|---|
| Erro | `CloseCircleOutlined` |
| Atenção | `WarningOutlined` |
| Sucesso | `CheckCircleOutlined` (ou `CheckOutlined` em contexto compacto) |
| Informação | `InfoCircleOutlined` |

Nunca misturar com ícones de outra família (ex: `BellOutlined` para alerta).

## 5. Tooltip em notificações/alertas

Em `notification`/`Alert`/`message` que exibam **apenas um ícone** (sem texto adjacente), envolva com `Tooltip` para descrever a ação acessivelmente:

```tsx
<Tooltip title="Expandir detalhes do erro">
  <Button variant="text" icon={<InfoCircleOutlined />} tooltip="Expandir detalhes do erro" />
</Tooltip>
```

## 6. Tabelas

- **Filtro + ordenação** em toda coluna de dados tabulares (`sorter`, `filters`/`filterDropdown`).
- `size="small"` em telas internas (admin dashboard).
- `pagination` com `pageSize` razoável (10/20/50).
- "Nenhum registro" via `Empty` — não via string crua "No data".

### 6.1 Decimais

Monetário / percentual / médias: sempre **2 casas**. Use helper em `lib/formatters.ts`:

```ts
export const toMoney = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
```

## 7. Tags

Default `bordered`. **Preenchida** só em status crítico (erro grave, bloqueio):

```tsx
<Tag color="success">Ativo</Tag>              {/* default: bordered */}
<Tag color="error" bordered={false}>Bloqueado</Tag>
```

## 8. Botões e ícones

- **Só ícone** (tabela / toolbar densa): obrigatório `tooltip` (prop do wrapper) ou `aria-label`. Preferência em células de ação.
- **CTA / secundário de formulário:** texto + `icon` quando houver ícone semântico claro. Não omita o verbo ("Salvar", "Cancelar").

```tsx
// Tabela — ícone-only
<Button variant="text" icon={<EditOutlined />} tooltip="Editar produto" />

// CTA — texto + ícone
<Button color="primary" icon={<SaveOutlined />}>Salvar</Button>
```

## 9. Overflow

Texto que pode estourar precisa truncar + revelar via `Tooltip`:

```tsx
<Tooltip message={produto.nome}>
  <Text ellipsis style={{ maxWidth: 240 }}>{produto.nome}</Text>
</Tooltip>
```

## 10. Modais

- `centered`: default em todos os modais da app.
- **Título** descreve a ação: "Editar produto", "Excluir usuário" (não "Formulário", "Confirmar").
- **Botão primário** com verbo da ação ("Salvar", "Excluir"); **secundário** sempre "Cancelar".
- Evitar modal para texto curto — prefira `message`/`notification`.

## 11. Edição inline

Em grids de admin, prefira edição **inline na linha** (via `editable` do antd Table) a abrir modal, quando o campo for simples (texto curto, status, select).

## 12. Estados de bloqueio

### 12.1 Botão disabled

Sempre que `disabled` for condicional, exponha o motivo via `tooltip`:

```tsx
<Button disabled={!form.isDirty} tooltip={!form.isDirty ? 'Nenhuma alteração para salvar' : undefined}>
  Salvar
</Button>
```

### 12.2 Campo disabled

Campo bloqueado deve ter `placeholder` descritivo + `tooltip` no `FormItem` com o motivo:

```tsx
<FormItem label="CNPJ" tooltip="Carregado automaticamente após validação do e-mail">
  <Input disabled placeholder="Preenchido após validação" />
</FormItem>
```

## 13. Formulários

### 13.1 Tooltip no FormItem

`FormItem` **sempre** com `tooltip` explicando o campo (contexto / aceite / origem do dado). Isso é lido por screen readers e aparece com o ícone de interrogação.

**Exceção:** `FormItem` sem `label` (checkbox de aceite) não renderiza `tooltip`. Nesse caso, o próprio texto do checkbox explica, com link para o documento (§20).

### 13.2 Composição

Todo input vive em `FormItem` dentro de `Form` — nunca `<Input>` solto fora de form. **Exceção:** busca e filtros de lista, que aplicam sozinhos e não têm submit; levam `aria-label`.

### 13.3 Placeholder padronizado

| Tipo | Padrão |
|---|---|
| Texto livre | `Informe o ${campo}` |
| Select | `Selecione o/a ${campo}` |
| DatePicker | `Selecione a data de ${campo}` |
| Monetário | `R$ 0,00` |

Campos obrigatórios adicionam ` *` ao final via prop `required` do antd — não editar o placeholder manualmente.

## 14. Acessibilidade

### 14.1 IDs únicos

Todo elemento interativo com `id` deve ser único, semântico e estável. Preferir `id="produto-${slug}-favoritar"` a `id="btn1"`.

### 14.2 ARIA

- `<main>`, `<nav>`, `<section>` com `aria-labelledby` apontando para o heading.
- Botão só com ícone: `aria-label` ou `tooltip`.
- Lista de items visuais sem `<ul>`: usar `role="list"` + `role="listitem"`.

### 14.3 Idioma

`<html lang="pt-BR">` já configurado em `app/layout.tsx`.

### 14.4 Skip-link

Toda rota com conteúdo principal expõe `<a href="#main-content" className="skip-link">` no topo. Ver `app/globals.css` para a classe.

## 15. Feedback — matriz

| Situação | Padrão |
|---|---|
| Sucesso em ação (salvar, criar) | `notification.success(...)` via `useAppNotification` |
| Erro em submissão de form | `Alert type="error"` no topo do form (não notification) |
| Erro em ação sem form (ex: delete em grid) | `notification.error(...)` |
| Info passageira (sem ação) | `message.info(...)` |
| Confirmação destrutiva | `Popconfirm`/`Modal.confirm` (seção 3) |

**Regra:** nunca duplicar — se o erro já foi mostrado em `Alert` no topo do form, não emitir `notification` paralelo.

### Hook canônico

`useAppNotification` em `@/lib/hooks/useAppNotification` — expõe `api` + `contextHolder`. Montar o `contextHolder` dentro do componente que usa.

Feedback que precisa sobreviver a um redirect (ex.: "Conta criada") usa `message` de `App.useApp()`: o `contextHolder` da página desmonta junto com ela.

## 16. Layout e grade

Toda página pública usa as classes de `app/globals.css`. Nada de `maxWidth` ou `padding` de página inline.

| Classe | Uso |
|---|---|
| `.page` | Container padrão: largura máxima 1200px (1152px úteis), coluna com gap de seção |
| `.page--narrow` | Leitura e formulário longo (`/conta`, páginas legais): 720px úteis |
| `.page--auth` + `.auth-card` | Card centralizado de 400px (`.auth-card--wide`: 640px, cadastro) |
| `.page--prose` | Texto corrido, sem o gap de seção |
| `.shell-inner` | Header, footer e banner: mesma grade do `.page`, para o conteúdo alinhar com o logo |

Elementos com `.page` podem ser `Flex` do antd. Por isso os seletores em `globals.css` têm especificidade dupla (`.page.page`): o reset do `Flex` tem o mesmo peso de uma classe simples e é injetado depois.

## 17. Responsividade

O público é B2B e usa monitores corporativos pequenos. O desenho continua desktop-first; mobile é suporte ([RNF10](02-REQUISITOS.md)).

**Telas-alvo:** 1366×768, 1280×720 e 1024×768 (mínimo sem perda de função). 375px precisa funcionar, sem scroll horizontal.

**Breakpoints:** os do antd Grid, também usados em `@media`: 576, 768, 992, 1200 e 1600.

| Largura | Comportamento |
|---|---|
| < 768 | Nav e ações do header vão para `Drawer`; CTA do produto fixo no rodapé |
| < 992 | Sidebar de filtros vira `Drawer`; busca do header some |
| ≥ 992 | Layout completo |

**Regras de altura** (telas de 720px têm cerca de 590px úteis depois da barra do navegador e da tarefa):

- Nunca usar `100vh` em hero ou seção de conteúdo.
- O CTA principal aparece **sem scroll** em 1366×768. Na ficha, o CTA vem antes da descrição.
- A primeira linha de cards aparece inteira em 1366×768, mesmo com o banner de cookies aberto.
- Imagem de destaque limitada com `max-height: min(60vh, 480px)`.
- Formulário longo usa duas colunas a partir de 576px (`Col xs={24} sm={12}`).
- Mostrar ou esconder por largura usa `.hide-below-md`, `.hide-from-md`, `.hide-below-lg` e `.hide-from-lg`. Não usar `useBreakpoint` em conteúdo renderizado no servidor, para evitar mismatch de hidratação.
- Elemento fixo não pode esconder o fim da página: o banner de cookies é `sticky` no fim do `body`, justamente para o footer continuar alcançável.

## 18. Tipografia

Escala fechada, definida em `lib/theme/antdTheme.ts`. Texto usa `Typography`; tamanho explícito só via `var(--font-size-*)`.

| Papel | Componente | Tamanho |
|---|---|---|
| Título da página | `Title level={1}` | 28px |
| Seção | `Title level={2}` | 22px |
| Subseção, título de card | `Title level={3}` | 18px |
| Rótulo de grupo | `Title level={4}` ou `Text strong` | 14px |
| Corpo | `Text`, `Paragraph` | 14px |
| Apoio, legenda, rodapé | `Text type="secondary"` + `--font-size-base` | 12px |
| Preço na ficha | `Text` semibold + `--font-size-2xl` | 22px |
| Lead e H1 de landing (só `/sobre`) | `--font-size-xl` e `--font-size-4xl` | 18px e 36px |

- **Exatamente um H1 por página**, inclusive login e 404.
- Nunca pular nível (H1 → H3). Escolha o nível pela estrutura e o tamanho vem junto.
- Tamanhos fora da tabela não são permitidos (13, 15, 17, 24, 56…).
- Atenção aos nomes: `--font-size-lg` é o corpo (14px) e `--font-size-base` é o apoio (12px).
- Texto de interface fala com o usuário. Termos internos ("mock", "conversão", "CTA", "enumerar usuários") não aparecem na tela.

## 19. Espaçamento

Só valores da escala `--space-*`. Em `Flex`, prefira `gap="small"` (8), `"middle"` (16) e `"large"` (24).

| Relação | Valor |
|---|---|
| Item dentro de um grupo (rótulo e campo, botões lado a lado) | 8 |
| Grupos dentro de uma seção; título de seção e conteúdo | 16 |
| Título da página e conteúdo | 16 |
| Entre seções da página | 32 (`.page`) |
| Seções de landing (`/sobre`) | 64 |
| Grade de cards | `gutter={[16, 16]}` |
| Sidebar e conteúdo | `gutter={[24, 24]}` |

Separação entre blocos de natureza diferente usa `Divider`, nunca espaço extra.

## 20. Fluxo e esforço cognitivo

Antes de adicionar um clique, uma etapa ou uma confirmação, pergunte se o sistema pode decidir ou aplicar sozinho.

- **Aplicar sem botão:** filtros aplicam ao mudar. Campo digitado usa debounce de 400ms. Nada de botão "Aplicar".
- **Salvar sem botão:** `Switch` salva ao alternar, com `loading` e rollback em caso de erro. Formulário com vários campos mantém "Salvar".
- **URL é a fonte de verdade:** filtro, busca e página vivem na query string e são lidos dela. Link compartilhado, voltar e recarregar mantêm o estado.
- **Nunca perder o contexto:** todo caminho para login ou cadastro leva `?next=`, passado adiante entre `/entrar` e `/cadastro`, sempre validado por `safeNext` (`lib/navigation.ts`). Link que sai de um formulário abre em nova aba.
- **Desfazer em vez de confirmar:** ver §3.
- **Bom default:** comece pela opção mais provável para o público (cadastro inicia em PJ) e reaproveite o que já se sabe (consentimento dado no banner vem marcado no cadastro).
- **Pedir só o necessário:** campo opcional fica rotulado "(opcional)" ou recolhido em `Collapse`.
- **Aceite único, documento à mão:** o cadastro tem um só checkbox obrigatório. O texto dele abre os documentos em modal, sem sair do formulário, e "Li e aceito" no modal já marca o checkbox. Abrir o modal nunca marca nada sozinho.
- **Consentimento opcional não entra no aceite:** cookies comportamentais e contato proativo nunca vão embutidos nos termos (LGPD art. 8º §4). Ficam no banner e em `/conta`, onde também são revogados.
- **Saída fica longe:** "Sair" não aparece em header, menu ou Drawer. Ação rara e que encerra a sessão fica no fim da tela de conta, como `variant="text"`, tanto na área pública quanto no admin.
- **Busca sempre à mão:** o header oferece busca fora do catálogo, para não exigir navegação antes de buscar.
- **Um gate, uma verdade:** o estado que controla o comportamento é o estado mostrado. O switch de cookies lê o consentimento local que libera a coleta, não uma cópia do servidor.

## 21. Estados de página

Toda página com dados trata os quatro estados:

| Estado | Padrão |
|---|---|
| Carregando | `PageLoading`; o conteúdo estático (hero, título) não espera a API |
| Erro de carga | `PageError` com "Tentar novamente" (`components/layout/PageStates.tsx`). Toda promise de carga tem `.catch` |
| Vazio | `Empty` com a próxima ação (Ver catálogo, Limpar filtros) |
| Dados | Atualização otimista quando possível, sem spinner cobrindo a grade |

Erro de carga nunca aparece como vazio: "Nenhum produto encontrado" só quando a API respondeu. Respostas fora de ordem são descartadas com flag `cancelled` no efeito.

---

## Checklist de code review

Marcar antes de abrir PR:

- [ ] Zero import de `antd` direto onde `@/components/ui` cobre.
- [ ] Zero HTML cru (`<div>`, `<p>`, `<h*>`, `<a>`, `<table>`, `<button>`) onde há antd equivalente — exceto landmarks e skip-link.
- [ ] Zero cor hex em TSX/CSS; só tokens (`var(--...)` ou `palette.*`).
- [ ] Ação destrutiva com `Popconfirm`/`Modal.confirm` + verbo específico no botão.
- [ ] Ícones de status seguem a tabela da §4.
- [ ] Tags em `bordered` default; preenchida só em crítico.
- [ ] Botão só com ícone tem `tooltip` ou `aria-label`.
- [ ] Overflow truncado com `Tooltip` revelando o texto completo.
- [ ] Modal com `centered` + verbo específico no botão primário.
- [ ] `FormItem` tem `tooltip` e `placeholder` padronizado.
- [ ] Todo elemento interativo tem `id` único/estável quando precisar.
- [ ] Sucesso via `notification`; erro em form via `Alert`; sem duplicação.
- [ ] `useAppNotification` para disparar notification; sem `antd.notification.open` solto.
- [ ] Lista de dados tem filtro/ordenação em todas as colunas e `Empty` para "sem dados".
- [ ] Monetário/percentual/média com 2 casas decimais.
- [ ] `<section>` com `aria-labelledby` apontando para o heading do bloco.
- [ ] Props iguais ao default do antd foram removidas.
- [ ] Um único `solid` + `primary` por tela; botão que navega usa `href`, sem `<Link><Button>`.
- [ ] Página usa `.page` e variantes; sem `maxWidth`/`padding` de página inline.
- [ ] Sem overflow horizontal em 1024px e 375px; CTA principal sem scroll em 1366×768.
- [ ] Um H1 por página, sem pular nível; tamanhos só da escala (§18).
- [ ] Espaçamento só da escala `--space-*` (§19).
- [ ] Sem texto interno na tela ("mock", "conversão", "CTA").
- [ ] Nenhum "Aplicar"/"Salvar" onde dá para aplicar sozinho; estado de lista na URL.
- [ ] Caminho para login/cadastro preserva `?next=`, validado por `safeNext`.
- [ ] Ação reversível usa Desfazer, não confirmação.
- [ ] "Sair" só na tela de conta; consentimento opcional fora do aceite de termos.
- [ ] Página trata carregando, erro com retry, vazio e dados (§21).
