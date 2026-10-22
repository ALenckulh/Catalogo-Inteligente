# Padrão — Services e HTTP

Camada de dados do frontend: axios client + funções por domínio. Complementa [../10-ARQUITETURA-FRONTEND.md](../10-ARQUITETURA-FRONTEND.md), [../11-API-ENDPOINTS.md](../11-API-ENDPOINTS.md) e [HOOKS.md](HOOKS.md).

---

## 1. Estrutura

```
lib/
├── api/
│   ├── config.ts      # USE_MOCK, API_BASE_URL, keys localStorage
│   ├── client.ts      # axios instance + ApiError
│   ├── produtos.ts
│   ├── categorias.ts
│   ├── auth.ts
│   ├── favoritos.ts
│   ├── conta.ts
│   ├── eventos.ts
│   ├── admin.ts
│   └── index.ts       # barrel
├── mocks/
│   ├── data.ts        # seed
│   └── delay.ts
└── types/             # DTOs camelCase
```

Páginas e hooks **nunca** chamam axios direto — só `lib/api/*`.

## 2. `USE_MOCK`

Constante em `lib/api/config.ts` (default `true`).

- `true` → service lê/escreve `lib/mocks` + `delay()`
- `false` → service usa `apiClient` (backend real)

Troca futura: flip da flag (e `NEXT_PUBLIC_API_URL`). Sem factory/interface extra.

## 3. Axios client

`lib/api/client.ts`:

- `baseURL` = `process.env.NEXT_PUBLIC_API_URL` ?? `http://localhost:8080/api`
- Request interceptor: `Authorization: Bearer <token>` (`ci_auth_token`) e `X-Visitante-Cookie-Id` (`ci_visitante_id`)
- `ApiError` / `toApiError` mapeiam body `{ code, message }` ([11 §1](../11-API-ENDPOINTS.md))

## 4. Forma de um service

```ts
export async function listProdutos(query: ProdutosQuery = {}): Promise<Page<Produto>> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Page<Produto>>('/produtos', { params: query })
    return data
  }
  await delay()
  // …filtro sobre mock
}
```

Assinaturas alinhadas aos endpoints de [11-API-ENDPOINTS.md](../11-API-ENDPOINTS.md).

## 5. Auth mock

- Contas seed: ver `lib/mocks/data.ts`
- Senha de todos: `senha123`
- Sessão: `localStorage` (`ci_auth_token` + `ci_auth_user`) via `persistSession` / `readStoredUser`
- `CurrentUserProvider` orquestra login/logout

## 6. Eventos

`trackEvent` em `lib/api/eventos.ts`. **Gate:** caller só chama se `useCookieConsent().canTrackBehavioral`.

## 7. Hooks de dados (quando criar)

Seguir [HOOKS.md](HOOKS.md) §4.3: `AbortController` + cleanup. Passar `signal` ao axios (`apiClient.get(url, { signal })`) quando sair do mock.

## 8. Checklist

- [ ] Import de dados via `@/lib/api`, não axios solto na página
- [ ] Tipos em `@/lib/types`
- [ ] Mock e HTTP real na mesma função (`USE_MOCK`)
- [ ] Erros de API viram `ApiError` / `toApiError` antes de feedback UI
