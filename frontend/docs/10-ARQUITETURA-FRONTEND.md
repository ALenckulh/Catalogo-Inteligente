# Arquitetura — Frontend

Guia de estrutura de pastas, padrões de código e decisões do frontend do Catálogo Inteligente. Para o modelo de dados ver [08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md); para UX ver [09-NORMAS-DE-USABILIDADE.md](09-NORMAS-DE-USABILIDADE.md).

Links irmãos:
- [padroes/HOOKS.md](padroes/HOOKS.md) — convenções para hooks custom
- [padroes/CONTEXTS.md](padroes/CONTEXTS.md) — convenções para React Context

---

## 1. Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Node | — | ≥ 20 |
| TypeScript | strict | ^5 |
| Framework | **Next.js (App Router)** | 16.2.x |
| React | — | 19.x |
| Design System | **Ant Design** | 6.3.x |
| Registry SSR | `@ant-design/nextjs-registry` | ^1 |
| Ícones | `@ant-design/icons` | ^6 |
| Datas | `dayjs` | ^1 |
| Gráficos | `@ant-design/charts` | ^2 — usado em A2 (dashboard admin); reusa o tema antd sem config extra |
| Lint | ESLint flat | ^9 |

**Alias:** `@/*` → raiz `frontend/` (via `tsconfig.json`).

Scripts:
- `npm run dev` — dev server (Turbopack).
- `npm run build` — build de produção.
- `npm start` — serve o build.
- `npm run lint` — ESLint.
- `npx tsc --noEmit` — type-check manual.

Gates antes de PR: `tsc --noEmit` → `lint` → `build`.

## 2. Estrutura de pastas

```
frontend/
├── app/                              # App Router — rotas por pasta
│   ├── layout.tsx                    # root (imports de CSS, Providers)
│   ├── providers.tsx                 # 'use client' — AntdRegistry + ConfigProvider
│   ├── globals.css                   # reset + classes utilitárias universais
│   ├── design-tokens.css             # CSS vars (fonte da verdade visual)
│   ├── not-found.tsx                 # 404 global (S3)
│   ├── (public)/                     # route group — rotas públicas
│   │   ├── layout.tsx                # layout do app público
│   │   ├── page.tsx                  # Vitrine "/"
│   │   ├── _components/              # componentes CO-LOCADOS da vitrine
│   │   ├── entrar/page.tsx           # /entrar
│   │   ├── cadastro/page.tsx         # /cadastro
│   │   ├── recuperar-senha/page.tsx  # /recuperar-senha
│   │   ├── produtos/
│   │   │   ├── page.tsx              # /produtos (lista)
│   │   │   ├── _components/
│   │   │   └── [slug]/page.tsx       # /produtos/{slug}
│   │   ├── favoritos/page.tsx
│   │   ├── conta/page.tsx
│   │   ├── sobre/page.tsx            # /sobre — landing acadêmica (S0)
│   │   ├── privacidade/page.tsx      # /privacidade (S1)
│   │   └── termos/page.tsx           # /termos (S2)
│   └── admin/                        # /admin/*
│       ├── layout.tsx                # layout com sidebar
│       ├── page.tsx                  # dashboard
│       ├── _components/
│       ├── entrar/page.tsx           # /admin/entrar (A1 — sem link na área pública)
│       ├── usuarios/
│       ├── produtos/
│       ├── conta/page.tsx            # /admin/conta (A8)
│       └── configuracao/page.tsx     # /admin/configuracao (A9)
├── components/
│   └── ui/                           # wrappers e re-exports do antd
│       ├── index.ts                  # barrel único
│       ├── Button/
│       ├── Input/
│       ├── Form/
│       ├── Card/
│       └── Select/                   # com pageable async
├── lib/
│   ├── theme/
│   │   ├── tokens.ts                 # TS espelho de design-tokens.css
│   │   └── antdTheme.ts              # ThemeConfig do antd
│   ├── hooks/                        # hooks globais (2+ rotas)
│   │   └── useAppNotification.ts
│   └── contexts/                     # React Contexts globais (ver CONTEXTS.md)
├── docs/                             # documentação do projeto
└── public/                           # assets estáticos
```

### 2.1 Convenções de pasta

- **Co-location:** componentes específicos de uma rota ficam em `app/{rota}/_components/`. Pasta com `_` é "private folder" do Next — não gera rota.
- **Globais:** componentes usados em 2+ rotas sobem para `components/ui/`.
- **Route groups** (`(public)/`, podendo surgir `(auth)/`, etc.): agrupam layouts sem afetar a URL.
- **5 arquivos por pasta → cria subpasta**. Mantém `_components/` navegável.

## 3. Nomenclatura

- `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` — nomes reservados do Next.
- `[slug]` / `[id]` — segmentos dinâmicos.
- **PascalCase** em componentes (`Hero.tsx`), **camelCase** em hooks (`useAppNotification.ts`) e utilitários (`formatMoney.ts`).
- Co-locar `_hooks/` ou `_contexts/` dentro de `app/{rota}/` quando a lógica for exclusiva da rota.

## 4. UI reutilizável

Importação **sempre** pelo barrel:

```ts
import { Button, Form, FormItem, Input, Table, Tag } from '@/components/ui'
```

Nunca `import { Button } from 'antd'` direto — o wrapper existe para padronizar props extras (`variant`, `color`, `shadow`, `tooltip`) e permitir trocar o DS no futuro. Para componentes que **não** têm wrapper (Tag, Modal, Table, Statistic, Progress, Timeline, Steps, Divider, Space, Flex, Row, Col, Typography, Alert, Spin, Empty, Popconfirm, Tooltip, Badge, Breadcrumb, Pagination, Descriptions, DatePicker, Checkbox, Radio, Drawer, Result, List, Tabs, Layout) o barrel re-exporta direto do antd — mesmo caminho de import.

## 5. `lib/`

### 5.1 `lib/theme/`

- `tokens.ts` — paletas 0-900, semantic (text/border/surface), spacing, typography, radius, z-index, breakpoints — como objeto TS.
- `antdTheme.ts` — `ThemeConfig` do antd mapeando os tokens. Montado em `app/providers.tsx`.

CSS vars reais ficam em `app/design-tokens.css` (fonte de verdade visual, importada no `app/layout.tsx` antes de `globals.css`).

### 5.2 `lib/hooks/`

Hooks compartilhados por 2+ rotas. Ver [padroes/HOOKS.md](padroes/HOOKS.md).

Exemplo instalado: `useAppNotification` — wrapper de `notification.useNotification()`.

### 5.3 `lib/contexts/`

React Context compartilhado (ex: tema do app, flags de usuário logado). Ver [padroes/CONTEXTS.md](padroes/CONTEXTS.md).

## 6. Roteamento (App Router)

- **Server Components por padrão.** Marque `'use client'` só quando precisar de `useState`/`useEffect`/`useRef`/handlers/eventos de DOM.
- Antd rendera no cliente (CSS-in-JS). O `AntdRegistry` em `providers.tsx` coleta estilos no SSR para evitar flash.
- Fetching: `fetch()` em server component (streaming/cache nativo) é o padrão. Em client components, usar o padrão `AbortController` descrito em [padroes/HOOKS.md](padroes/HOOKS.md). React Query entra quando o pattern repetido valer a abstração — até lá, YAGNI.

## 7. i18n

Pt-BR único até o momento. `ConfigProvider locale={ptBR}` em `providers.tsx` resolve datas, pluralizações e textos nativos do antd. Se precisar de outros idiomas no futuro: adotar `next-intl` (preferir sobre i18next pelo integração com App Router).

## 8. Fluxo de dependência

```
app/{rota}/page.tsx          (server)
      │
      ├─> _components/*       (client quando preciso)
      │
      └─> @/components/ui + @/lib/hooks + @/lib/theme
                 │
                 └─> antd
```

Regras:
- Rota não importa de outra rota — apenas de `components/ui`, `lib/*`, ou dos próprios `_components/`.
- `_components/` da rota A **não** é importado pela rota B. Se precisar, promove para `components/ui/` ou `components/{feature}/`.
- `lib/` nunca importa de `app/` ou de `components/`.

## 9. Como criar uma tela nova

Passo a passo para `/produtos/[slug]`:

1. Criar `app/(public)/produtos/[slug]/page.tsx` com default export de função React.
2. Se tiver sub-componentes exclusivos → `app/(public)/produtos/[slug]/_components/`.
3. Lógica compartilhada com outras rotas → `components/ui/` ou `lib/hooks/`.
4. Verificar que a página respeita [09-NORMAS-DE-USABILIDADE.md] (checklist).
5. `npm run build` — verificar que a rota aparece no output.
6. Se precisar de dados: `fetch(...)` no server component (ou hook em client quando houver interação).

## 10. ADRs — decisões arquiteturais

### ADR-01: Next.js 16 App Router
- **Contexto:** TCC precisa de SSR para SEO (produtos públicos) + rotas dinâmicas (`[slug]`).
- **Decisão:** App Router (não Pages Router). React 19 + Server Components.
- **Trade-off:** API mais nova com breaking changes vs. estabilidade. Vale pelo potencial de ensino/escrita no TCC.

### ADR-02: Ant Design 6 como design system
- **Contexto:** Precisa de UI pronta para catálogo + admin em prazo curto (TCC).
- **Decisão:** antd 6. Cobre 90% das necessidades (Table, Form, Modal, Statistic, Progress, Timeline, Steps).
- **Alternativas:** MUI (mais pesado), shadcn (muito manual). Antd ganha por maturidade e tabela.

### ADR-03: Co-location via `_components/`
- **Contexto:** Risco de inflar `components/` com componentes de uma rota só.
- **Decisão:** `_components/` ao lado da rota que usa. Promove para `components/ui/` só quando reusar.
- **Benefício:** Deletar a rota deleta seus componentes.

### ADR-04: Route groups `(public)` / `admin/`
- **Contexto:** Layouts diferentes (header público vs. sidebar admin).
- **Decisão:** `(public)` como route group (parênteses não entram na URL) + `admin/` como segmento normal (para proteger via middleware futuro).

### ADR-05: Wrapper fino sobre antd
- **Contexto:** Risco de over-engineering (wrapper para cada componente antd).
- **Decisão:** Wrapper só quando houver prop custom ou lógica (Button com `variant`+`color`+`tooltip`; Card com `shadow`; Select com `Pageable`). Caso contrário, re-export direto no barrel.
- **Regra:** antd direto > wrapper. Adicionar wrapper quando a terceira customização repetida aparecer.

### ADR-06: CSS Vars + ThemeConfig
- **Contexto:** antd aceita tokens via `ThemeConfig`, mas há CSS fora do antd (globals, inline).
- **Decisão:** Fonte da verdade em `app/design-tokens.css`. `lib/theme/tokens.ts` espelha em TS. `antdTheme.ts` mapeia para antd.
- **Benefício:** Design muda em um lugar.

---

## Glossário

- **Barrel:** `components/ui/index.ts` — ponto único de import.
- **Route group:** pasta entre parênteses — agrupa sem afetar URL.
- **Server component:** React 19 — renderiza no servidor, zero JS no cliente.
- **Co-location:** componente/hook/context na mesma pasta da rota que usa.
- **Token:** CSS var ou constante TS representando valor de design (cor, spacing, radius…).
