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
<Button variant="solid" color="default" size="middle">Salvar</Button>

// ✅
<Button>Salvar</Button>
```

## 2. Uso de cores

Toda cor usada em TSX/CSS deve vir de um token:

- **CSS/CSS Modules:** `var(--primary)`, `var(--text-neutral-strong)`, `var(--surface-neutral-subtle)`.
- **TSX inline style:** `color: 'var(--primary)'` **ou** `color: palette.primary[400]` importando `@/lib/theme/tokens`.
- **ThemeConfig do antd:** já mapeia os tokens — para `colorPrimary` etc. não é preciso prop custom.

❌ Nunca hardcode `#00ABB5`, `#F5F5F5`, `rgba(...)` em componente.

### 2.1 Grafia do projeto

Sempre **Catálogo Inteligente** (com acento no "a" e "C" + "I" maiúsculos). "catálogo" só como substantivo comum ("um catálogo de produtos").

### 2.2 Primária só em ação

Cor primária (`--primary`) representa affordance — reserve para elementos interativos (botão principal, link, badge de status ativo). Em texto puro use `--text-neutral-*`; para destaque secundário, `--secondary`.

## 3. Confirmação de deleção

Toda ação destrutiva (deletar, cancelar negociação, remover favorito definitivamente) **exige confirmação**:

- Inline em grid → `Popconfirm`.
- Em modal/form → `Modal.confirm`.

Texto obrigatório: pergunta explícita + consequência. Botão primário com **verbo específico** ("Excluir", "Remover", "Cancelar negociação") — nunca "OK"/"Confirmar".

```tsx
<Popconfirm
  title="Remover produto do catálogo?"
  description="Esta ação é permanente e não pode ser desfeita."
  okText="Remover"
  cancelText="Cancelar"
  onConfirm={handleDelete}
>
  <Button color="danger" icon={<DeleteOutlined />} />
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
  <Button type="text" icon={<InfoCircleOutlined />} />
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

## 8. Botões só com ícone

Qualquer `Button` sem texto visível **exige `tooltip`** (prop do wrapper `@/components/ui/Button`) ou `aria-label`:

```tsx
<Button icon={<EditOutlined />} tooltip="Editar produto" />
```

## 9. Overflow

Texto que pode estourar precisa truncar + revelar via `Tooltip`:

```tsx
<Tooltip title={produto.nome}>
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

### 13.2 Composição

Todo input vive em `FormItem` dentro de `Form` — nunca `<Input>` solto fora de form.

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
