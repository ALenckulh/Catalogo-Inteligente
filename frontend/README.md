# Frontend — Catálogo Inteligente

## Env

Copy `.env.example` → `.env.local`:

- `NEXT_PUBLIC_API_URL=http://localhost:8080/api`
- `NEXT_PUBLIC_USE_MOCK=false` → live Spring API; `true` → `lib/mocks`

## Stack local

1. `database/`: `docker compose up -d` then `docker compose --profile migrate run --rm flyway`
2. Backend: `./gradlew bootRun` (Postgres + Rabbit)
3. Frontend: `npm run dev` → http://localhost:3000

Seed admin: `admin@catalogo.local` / `admin123`

## Smoke (live API)

- `GET /api/health`
- Auth: `/entrar`, `/cadastro`, `/admin`
- Catálogo: `/produtos`, `/produtos/[slug]`
- Visitante: aceitar cookies → eventos 202; favoritos com login
- Conta: patch, export JSON, exclusão
- Ranking: após eventos + consentimento, ordem do catálogo muda vs cold start
- Admin: dashboard, produto CRUD, compra, pesos/decay

