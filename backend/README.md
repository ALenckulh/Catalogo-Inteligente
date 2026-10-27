# Backend — Catálogo Inteligente

API Spring Boot do Catálogo Inteligente. Arquitetura: [frontend/docs/12-ARQUITETURA-BACKEND.md](../frontend/docs/12-ARQUITETURA-BACKEND.md). Contrato REST: [11-API-ENDPOINTS.md](../frontend/docs/11-API-ENDPOINTS.md).

## Pré-requisitos

- JDK 25+ (LTS). Sem JDK 25 local, o Gradle baixa via Foojay toolchain (`settings.gradle.kts`)
- Docker Desktop (Postgres + RabbitMQ + Flyway)
- Stack: Spring Boot **4.1.x** + Java **25** — ver [12-ARQUITETURA-BACKEND.md](../frontend/docs/12-ARQUITETURA-BACKEND.md)

## Infra local

Na pasta `database/`:

```bash
cp .env.example .env
docker compose up -d postgres rabbitmq
docker compose run --rm flyway migrate
```

Schema: só via Flyway em `database/migrations/` (a app **não** roda migrations).

## Rodar a API

```bash
./gradlew bootRun
```

- Health: `GET http://localhost:8080/api/health` → `{ "status": "UP" }`
- Perfil padrão: `dev` (`application-dev.yml`)

## Testes / build

```bash
./gradlew test
./gradlew build
```

Gates antes de PR: `test` → `build`.

## Estrutura

Pacotes por domínio (`auth`, `catalog`, `eventos`, `scoring`, `admin`, `lgpd`, `visitante`) + `config` + `shared`. Endpoints de negócio entram depois do scaffold.
