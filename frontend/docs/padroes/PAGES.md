# Padrão — Páginas (App Router)

Convenções para `page.tsx` do Catálogo Inteligente. Complementa [../10-ARQUITETURA-FRONTEND.md](../10-ARQUITETURA-FRONTEND.md) e [../09-NORMAS-DE-USABILIDADE.md](../09-NORMAS-DE-USABILIDADE.md).

---

## 1. Client vs Server

- Páginas que usam antd via `@/components/ui`, hooks ou `localStorage` → **`'use client'`** (ou extrair `*Content.tsx` client).
- Evitar importar o barrel `@/components/ui` em Server Components: o mix client/server no barrel quebra prerender (elemento `undefined`).

## 2. Auth

| Área | Gate |
|---|---|
| Público autenticado (`/favoritos`, `/conta`) | `useCurrentUser` + redirect `/entrar?next=…` |
| Admin | `useRequireAdmin` → `/admin/entrar` |

## 3. Dados

- Só `@/lib/api/*` (nunca axios na página).
- Fetch em `useEffect` com `setTimeout(0)` para satisfazer `react-hooks/set-state-in-effect` (hidratação / load assíncrono).
- `useSearchParams` → componente filho + `<Suspense>` na `page.tsx`.

## 4. Co-location

- UI exclusiva da rota → `app/.../_components/`
- Hook exclusivo → `_hooks/`
- Card de produto compartilhado → `components/ProdutoCard.tsx`

## 5. Eventos

`useTrackEvent()` — só dispara se `canTrackBehavioral`.

## 6. Checklist

- [ ] Import UI pelo barrel
- [ ] FormItem com `tooltip` + placeholder padronizado
- [ ] Destrutivo com `Popconfirm` / `Modal.confirm` + verbo específico
- [ ] Empty / Spin / Alert conforme [09](../09-NORMAS-DE-USABILIDADE.md) §15
