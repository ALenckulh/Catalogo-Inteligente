# Padrão — React Context

Convenções para `React.createContext` + Provider no Catálogo Inteligente. Complementa [../10-ARQUITETURA-FRONTEND.md](../10-ARQUITETURA-FRONTEND.md) e [HOOKS.md](HOOKS.md).

---

## 1. Quando usar Context

Use quando o estado é compartilhado entre **vários filhos de uma árvore React** e passar por props seria doloroso ("prop drilling"). Exemplos:

- Preferências do usuário logado (nome, tipo, permissões).
- Estado de abertura/fechamento de modal global.
- Toast/notificação centralizada que qualquer tela pode disparar.
- Configurações de layout (tema do usuário, densidade da tabela).

**Não use Context para:**
- Dado que vem de API — isso é cache, use fetch/React Query.
- Estado de UI local a uma tela — `useState` no componente.
- Dado estático — constante exportada em `lib/`.
- Estado de formulário — `Form.useForm()` do antd.

Teste: se o Provider montaria em 1 só rota, provavelmente é `useState` com prop drilling de 1 nível. Não é Context.

## 2. Tríade de arquivos

Separe sempre em dois arquivos (`react-refresh` reclama se Provider + hook saírem do mesmo módulo `.tsx`):

```
{Nome}Context.ts     ← tipos + createContext + hook use{Nome}
{Nome}Provider.tsx   ← 'use client' + Provider
```

## 3. Localização

| Escopo | Pasta |
|---|---|
| App inteiro (todas as rotas) | `lib/contexts/{Nome}/` |
| Módulo (todas as telas de admin, p.ex.) | `components/{modulo}/_contexts/{Nome}/` |
| Uma rota | `app/{rota}/_contexts/{Nome}/` |

Provider global é montado em `app/providers.tsx` **dentro** do `ConfigProvider`.

## 4. Template

### 4.1 Context + hook

```ts
// lib/contexts/CurrentUser/CurrentUserContext.ts
import { createContext, useContext } from 'react'

export interface CurrentUser {
  id: number
  nome: string
  tipo: 'PF' | 'PJ' | 'ADMIN'
}

export interface CurrentUserValue {
  user: CurrentUser | null
  logout: () => void
}

export const CurrentUserContext = createContext<CurrentUserValue | null>(null)

export function useCurrentUser(): CurrentUserValue {
  const ctx = useContext(CurrentUserContext)
  if (!ctx) {
    throw new Error('useCurrentUser must be used within <CurrentUserProvider>')
  }
  return ctx
}
```

### 4.2 Provider

```tsx
// lib/contexts/CurrentUser/CurrentUserProvider.tsx
'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  CurrentUserContext,
  type CurrentUser,
  type CurrentUserValue,
} from './CurrentUserContext'

interface Props {
  initialUser: CurrentUser | null
  children: React.ReactNode
}

export function CurrentUserProvider({ initialUser, children }: Props) {
  const [user, setUser] = useState<CurrentUser | null>(initialUser)

  const logout = useCallback(() => {
    setUser(null)
    // chamar service de logout aqui
  }, [])

  const value = useMemo<CurrentUserValue>(() => ({ user, logout }), [user, logout])

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  )
}
```

### 4.3 Uso

```tsx
'use client'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'

function MenuPerfil() {
  const { user, logout } = useCurrentUser()
  if (!user) return null
  return <Button onClick={logout}>Sair ({user.nome})</Button>
}
```

### 4.4 Montagem global

```tsx
// app/providers.tsx
'use client'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { antdTheme } from '@/lib/theme/antdTheme'
import { CurrentUserProvider } from '@/lib/contexts/CurrentUser/CurrentUserProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={antdTheme} locale={ptBR}>
        <CurrentUserProvider initialUser={null}>{children}</CurrentUserProvider>
      </ConfigProvider>
    </AntdRegistry>
  )
}
```

## 5. Regras

- `createContext<T | null>(null)` + hook que **lança erro** se usado fora do Provider. Nunca default value "falso" (`{}`, string vazia).
- `value` do Provider **sempre** em `useMemo` (callbacks em `useCallback`) — senão todo filho rerenderiza em cada tick.
- Hook `use{Nome}` é a **única** forma de ler o Context. Não exporte o Context cru (exceto para tests ou para componer com outro Provider).
- Provider é client component (`'use client'`) — Context do React só funciona no cliente.
- Nome do erro no `throw` ajuda debug: `useX must be used within <XProvider>`.

## 6. Anti-padrões

- ❌ Context para dado que vem de API — isso é cache, não state. Mantém a request na borda (hook de dados) e usa Context só para o usuário logado / sessão.
- ❌ Provider global para estado de uma só tela — monta mais embaixo.
- ❌ `createContext<T>(fakeDefault)` que esconde o erro de montagem — hook sem Provider deve explodir.
- ❌ `value={{ ...coisas }}` sem `useMemo` — rerenderiza tudo que consome.
- ❌ Provider + hook no mesmo `.tsx` + `eslint-disable react-refresh` — separe em dois arquivos.
- ❌ Vários Providers paralelos para o mesmo recurso (um `MessageProvider` custom + `message.useMessage()` do antd em cima) — escolha um canal.

## 7. Notificação / mensagens: use o canal do antd

O antd já expõe Context interno para `notification.useNotification()`, `message.useMessage()`, `Modal.useModal()`. **Não** envolva em Context próprio. O hook `useAppNotification` (`lib/hooks/useAppNotification.ts`) é um simples wrapper — não um Provider novo.

Se quiser disparar `notification` de dentro de um hook de mutação, injeta a `api` via parâmetro em vez de criar outro Context:

```ts
function useSalvarProduto(api: ReturnType<typeof useAppNotification>['api']) { /* … */ }
```

## 8. Testes (quando chegar)

Testando componente consumidor:

```tsx
import { render } from '@testing-library/react'
import { CurrentUserContext } from '@/lib/contexts/CurrentUser/CurrentUserContext'

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CurrentUserContext.Provider value={{ user: { id: 1, nome: 'Teste', tipo: 'PF' }, logout: vi.fn() }}>
    {children}
  </CurrentUserContext.Provider>
)
```

Expor o Context cru é aceito **só para teste** — produção segue consumindo pelo hook.

## 9. Contexts instalados

| Context | Pasta | Papel |
|---|---|---|
| `CurrentUser` | `lib/contexts/CurrentUser/` | Sessão PF/PJ/ADMIN (mock via `lib/api/auth` + localStorage) |
| `CookieConsent` | `lib/contexts/CookieConsent/` | Preferência S4 (12 meses); `canTrackBehavioral` gate de `trackEvent` |

Montados em `app/providers.tsx` dentro do `ConfigProvider`. Banner: `components/layout/CookieBanner.tsx`.

## 10. Checklist

- [ ] Tipos + `createContext` + hook em `*Context.ts` (não `.tsx`).
- [ ] Provider em `*Provider.tsx` com `'use client'`.
- [ ] `createContext<T | null>(null)` e hook lança erro fora do Provider.
- [ ] `value` em `useMemo`; callbacks em `useCallback`.
- [ ] Localização correta (global vs. módulo vs. rota).
- [ ] Não duplica canal já fornecido pelo antd.
