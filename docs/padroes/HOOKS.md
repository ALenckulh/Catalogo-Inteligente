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

Envolvem um recurso visual do antd. Exemplo canônico:

```ts
// lib/hooks/useAppNotification.ts
'use client'
import { App } from '@/components/ui'

/** Avisos do <App> da raiz: continuam na tela depois de navegar. */
export function useAppNotification() {
  const { notification: api } = App.useApp()
  return { api }
}
```

Uso:

```tsx
'use client'
import { useAppNotification } from '@/lib/hooks/useAppNotification'

function MinhaTela() {
  const { api } = useAppNotification()
  return <Button onClick={() => api.success({ title: 'Salvo!' })}>Salvar</Button>
}
```

### 4.2 Hooks de acesso

Exigem um estado para a tela existir. `useRequireAdmin` redireciona para `/admin/entrar?next=…` quem não é admin; `useTrackEvent` devolve uma função que só envia evento com consentimento.

### 4.3 Hooks de dados

Chamam funções de `lib/api` ([SERVICES.md](SERVICES.md)) e descartam resposta atrasada. Exemplo do projeto: `useTabelaPaginada`, que guarda só a página pedida e numera as buscas:

```ts
const seq = useRef(0)

async function reload() {
  const id = ++seq.current
  const res = await buscar({ page, limit: PAGE_SIZE, sort })
  if (id !== seq.current) return // chegou depois de uma busca mais nova
  setItems(res.items)
}
```

Para uma carga simples na própria tela, use uma flag no efeito:

```ts
useEffect(() => {
  let cancelled = false
  listProdutos(query)
    .then((p) => { if (!cancelled) setData(p.items) })
    .catch(() => { if (!cancelled) setFalhou(true) })
  return () => { cancelled = true }
}, [query])
```

Pontos obrigatórios:
- Dados só por `@/lib/api`, nunca `fetch` ou axios na tela.
- Resposta atrasada descartada (flag `cancelled` ou contador).
- Erro tratado: a tela mostra `PageError`, não lista vazia ([09 §21](../09-NORMAS-DE-USABILIDADE.md)).

## 5. Anti-padrões

- ❌ Carga em `useEffect` **sem** descarte de resposta atrasada — a tela mostra dado antigo ou atualiza depois de desmontada.
- ❌ Hook que apenas encapsula `useState` sem adicionar lógica — polui a API para nada.
- ❌ `queryKey`/URL hardcoded em string dentro do effect — extrai para constante.
- ❌ String de mensagem solta (`'Erro ao salvar'`) espalhada por hooks — centralizar em `lib/messages.ts` quando houver 3+ ocorrências.
- ❌ Hook de dados importando outro hook de UI diretamente — mantém hook de dados "puro"; UI compõe no uso.

## 6. Testes

Vitest + Testing Library. Exemplo: `lib/hooks/useTabelaPaginada.test.ts`.
- Testar o comportamento que a tela vê, não detalhe interno do hook.
- `renderHook` + `waitFor` para estados assíncronos.

## 7. Checklist

- [ ] Nome `useAlgo` que descreve papel, não implementação.
- [ ] Posição correta: `lib/hooks/` se global, `_hooks/` se co-locado.
- [ ] Resposta atrasada descartada.
- [ ] Retorno tipado explícito.
- [ ] Sem string de mensagem repetida — centralizada se precisar.
- [ ] Dependências do `useEffect` corretas (nada ausente, nada supérfluo).
