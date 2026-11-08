# Padrão — Hooks custom

Convenções para hooks React do Catálogo Inteligente. Complementa [../10-ARQUITETURA-FRONTEND.md](../10-ARQUITETURA-FRONTEND.md).

---

## 1. Quando criar um hook custom

Crie quando pelo menos uma destas verdades couberem:

- **Compor múltiplos effects/estados** que juntos formam uma lógica reutilizável (debounce, local storage, listener de janela).
- **Encapsular lógica repetida** em 2+ componentes (ex: carregar lista paginada, orquestrar notificação após mutação).
- **Isolar efeito colateral** (listener global, subscription, setup/cleanup).

❌ **Não crie hook** para:
- Formatação pura — função em `lib/formatters.ts`.
- Estado 100% local sem efeito — `useState` direto no componente.
- Chamada de API única usada em 1 lugar — `fetch` inline.

Teste YAGNI: se o hook é usado 1 vez e cabe em 10 linhas no componente, não vale a abstração.

## 2. Localização

| Escopo | Pasta |
|---|---|
| 2+ rotas | `lib/hooks/useXxx.ts` |
| 1 rota (co-locado) | `app/{rota}/_hooks/useXxx.ts` |

Promova de co-locado para global **só** quando a segunda rota precisar — não antes.

## 3. Nomenclatura

- Sempre `useAlgo` (regra de hook do React).
- Nome descreve o **papel**, não a implementação: `useAppNotification`, não `useAntdNotification`.
- Hooks que retornam dados: `use{Entity}` ou `use{Entity}List` (ex: `useProduto`, `useProdutoList`).
- Hooks que retornam ação: `use{Verbo}{Entity}` (`useCreateProduto`, `useDeleteFavorito`).

## 4. Padrões por categoria

### 4.1 Hooks de UI

Envolvem um recurso visual do antd que precisa de `contextHolder`. Exemplo canônico:

```ts
// lib/hooks/useAppNotification.ts
'use client'
import { notification } from 'antd'

export function useAppNotification() {
  const [api, contextHolder] = notification.useNotification()
  return { api, contextHolder }
}
```

Uso:

```tsx
'use client'
import { useAppNotification } from '@/lib/hooks/useAppNotification'

function MinhaTela() {
  const { api, contextHolder } = useAppNotification()
  return (
    <>
      {contextHolder}
      <Button onClick={() => api.success({ message: 'Salvo!' })}>Salvar</Button>
    </>
  )
}
```

### 4.2 Hooks de estado derivado

Pequenos, sem efeito pesado. Exemplos clássicos:

```ts
// lib/hooks/useDebounce.ts
'use client'
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}
```

### 4.3 Hooks de dados (fetch nativo)

Padrão enquanto o projeto **não** adotar React Query:

```ts
// app/produtos/_hooks/useProdutos.ts
'use client'
import { useEffect, useState } from 'react'

interface Produto { id: number; nome: string; preco: number }

export function useProdutos(categoriaId?: number) {
  const [data, setData] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    setError(null)
    const url = categoriaId ? `/api/produtos?categoriaId=${categoriaId}` : '/api/produtos'
    fetch(url, { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Produto[]>
      })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') setError(e as Error) })
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [categoriaId])

  return { data, loading, error }
}
```

Pontos obrigatórios:
- `AbortController` + `signal` no `fetch`.
- `cleanup` cancela a request pendente ao desmontar / mudar deps.
- Erro de `AbortError` **não** vai para `setError`.
- Tipagem explícita do retorno (`Promise<Produto[]>`).

### 4.4 Hooks compostos

Combinam o hook de dados com UI (ex: carregar + notificar erro):

```ts
export function useProdutosWithFeedback(categoriaId?: number) {
  const { data, loading, error } = useProdutos(categoriaId)
  const { api, contextHolder } = useAppNotification()
  useEffect(() => {
    if (error) api.error({ message: 'Erro ao carregar produtos', description: error.message })
  }, [error, api])
  return { data, loading, error, contextHolder }
}
```

> **Nota:** se adotarmos **React Query**, este doc será expandido com padrões `useQuery`/`useMutation`, `queryKeys` tipados, invalidação. Até lá, `useState` + `useEffect` + `fetch` é a norma.

## 5. Anti-padrões

- ❌ `useState` + `useEffect(() => fetch(...), [])` **sem** `AbortController` nem cleanup — vaza request e warning de `setState` em componente desmontado.
- ❌ Hook que apenas encapsula `useState` sem adicionar lógica — polui a API para nada.
- ❌ `queryKey`/URL hardcoded em string dentro do effect — extrai para constante.
- ❌ String de mensagem solta (`'Erro ao salvar'`) espalhada por hooks — centralizar em `lib/messages.ts` quando houver 3+ ocorrências.
- ❌ Hook de dados importando outro hook de UI diretamente — mantém hook de dados "puro"; UI compõe no uso.

## 6. Testes (opcional por enquanto)

Sem framework de teste instalado. Quando chegar (Vitest + Testing Library sugeridos):
- Testar borda do service (`fetch` mock), não detalhe interno do hook.
- `renderHook` da Testing Library + `waitFor` para estados assíncronos.
- Mutações: testar payload enviado e callback de sucesso.

## 7. Checklist

- [ ] Nome `useAlgo` que descreve papel, não implementação.
- [ ] Posição correta: `lib/hooks/` se global, `_hooks/` se co-locado.
- [ ] Fetch com `AbortController` + cleanup.
- [ ] Retorno tipado explícito.
- [ ] Sem string de mensagem repetida — centralizada se precisar.
- [ ] Dependências do `useEffect` corretas (nada ausente, nada supérfluo).
