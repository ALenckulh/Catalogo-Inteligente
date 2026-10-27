# Arquitetura — Backend

Guia de estrutura de pacotes, padrões de código e decisões do backend do Catálogo Inteligente. Para o modelo de dados ver [08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md); para o contrato REST ver [11-API-ENDPOINTS.md](11-API-ENDPOINTS.md); visão em camadas do sistema em [05-ARQUITETURA.md](05-ARQUITETURA.md); scoring em [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md).

Links irmãos:
- [05-ARQUITETURA.md](05-ARQUITETURA.md) — camadas, mensageria, esboço da API
- [08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md) — tabelas, enums, constraints
- [11-API-ENDPOINTS.md](11-API-ENDPOINTS.md) — fonte de verdade dos endpoints
- [`database/README.md`](../../database/README.md) — PostgreSQL + Flyway local

---

## 1. Stack

| Camada | Tecnologia | Versão / nota |
|---|---|---|
| Linguagem | **Java** | 25 (LTS) |
| Framework | **Spring Boot** | 4.x |
| Build | **Gradle** (Kotlin DSL) | Wrapper no repo |
| Segurança | Spring Security + **JWT** (JJWT) | Stateless |
| Persistência | Spring Data JPA (Hibernate) | PostgreSQL |
| Mapeamento DTO | **MapStruct** | Compile-time |
| JSON | Jackson | camelCase no wire |
| Migrations | **Flyway** | Scripts em `database/migrations/` |
| Mensageria | **RabbitMQ** | Filas de eventos + DLQ |
| Rate limit | Bucket4j (in-memory no MVP) | Limites em [11 §1](11-API-ENDPOINTS.md) |
| Scoring batch / ML | Worker Spring + Python (batch) | Camadas 1–3 em [04](04-ESPECIFICACAO-TECNICA.md) |
| Dev local | Docker Compose | `database/` (+ RabbitMQ) |

Scripts (raiz `backend/`):
- `./gradlew bootRun` — sobe a API (perfil `dev`).
- `./gradlew test` — testes unitários/integração.
- `./gradlew build` — compile + test + jar.

Gates antes de PR: `test` → `build`.

---

## 2. Estrutura de pastas

```
backend/
├── src/main/java/com/catalogo/
│   ├── CatalogoApplication.java
│   ├── config/                   # SecurityConfig, JacksonConfig, RabbitConfig, RateLimitConfig
│   ├── auth/                     # signup, login, logout, password-reset, migrar-historico
│   │   ├── controller/
│   │   ├── service/
│   │   ├── dto/
│   │   ├── repository/
│   │   └── entity/               # PasswordResetToken (e afins)
│   ├── visitante/                # POST /api/visitantes/sessao, cookie tracking
│   ├── catalog/                  # produto, categoria, imagem, favorito
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── dto/
│   │   ├── entity/
│   │   └── mapper/               # MapStruct
│   ├── eventos/                  # POST /api/eventos — producer → fila
│   ├── scoring/                  # consumer, engine Camadas 1–3
│   │   ├── worker/
│   │   ├── engine/               # decay, pesos, popularidade global, PPR
│   │   └── repository/
│   ├── admin/                    # dashboard, usuarios, produtos, conta, configuracao
│   ├── lgpd/                     # consentimentos, solicitações, exportar, anonimização
│   └── shared/                   # PageResponse<T>, ErrorResponse, exceções comuns
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-prod.yml      # secrets via env — não versionar segredos
└── src/test/
```

### 2.1 Convenções de pacote

- **Pacote por domínio/módulo**, não por camada técnica global (`controllers/`, `services/` na raiz). Dentro de cada módulo: `controller` / `service` / `repository` / `dto` / `entity` / `mapper`.
- `shared/` só para tipos **transversais** (`PageResponse<T>`, `ErrorResponse`, `@ControllerAdvice`).
- Um módulo não importa `controller` de outro; reutiliza `service`/`repository`/`entity` quando necessário.
- **5+ arquivos no mesmo nível → subpasta** (ex.: `catalog/produto/`, `catalog/favorito/`).

---

## 3. Nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Pacote | lowercase | `com.catalogo.catalog` |
| Classe | PascalCase | `ProdutoService`, `AuthController` |
| Método / campo Java | camelCase | `findBySlug`, `emailAlternativo` |
| Coluna DB | snake_case | `email_alternativo` |
| JSON wire | camelCase | `emailAlternativo`, `fichaTecnica` |
| Enum Java | alinhado ao PG | `TipoUsuario.PF`, `TipoEvento.FAVORITAR` |
| Migration | Flyway | `V012__descricao.sql` em `database/migrations/` |
| Fila RabbitMQ | ponto | `events.product.view` |

---

## 4. Convenções de código

| Item | Regra |
|---|---|
| **JSON wire** | camelCase. Jackson sem `SNAKE_CASE` global. Colunas DB permanecem snake_case ([11 §1](11-API-ENDPOINTS.md), [08 §1](08-MODELO-DE-DADOS.md)). |
| **Paginação** | `PageResponse<T>`: `{ "items", "page", "limit", "total" }` — wrapper sobre Spring `Page`. |
| **Erros** | HTTP status + `{ "code", "message" }`. `@ControllerAdvice` global. |
| **Soft delete** | Filtro `deleted_at IS NULL` nas entidades aplicáveis (Hibernate `@SQLRestriction` / equivalente). |
| **Timestamps** | `TIMESTAMPTZ` ↔ `OffsetDateTime`. JPA Auditing para `createdAt` / `updatedAt`. |
| **Dinheiro** | `BigDecimal` (`NUMERIC(12,2)`). Nunca `double`/`float`. |
| **Scores** | `BigDecimal` [0, 100], 2 casas (`NUMERIC(5,2)`). |
| **Mappers** | MapStruct. Um mapper por agregado/módulo. Evitar montar DTO à mão no service. |
| **Migrations** | Só via Flyway em `database/migrations/`. Nunca alterar schema “na mão” em prod. |
| **IDs** | `Long` (`BIGINT`). Produto público na URL usa `slug`. |
| **AuthSession** | `{ "token", "usuario" }` — `usuario` sem hash de senha. |

---

## 5. Segurança

- **Spring Security** com filter chains distintos:
  - `/api/**` — público + JWT para PF/PJ onde exigido
  - `/api/admin/**` — JWT com `tipo = ADMIN` ([RNF07](02-REQUISITOS.md))
- **JWT** (JJWT), stateless. Claims mínimos: `sub` (usuarioId), `tipo` (`PF`\|`PJ`\|`ADMIN`), `exp`.
- Login consumidor e admin em rotas distintas (`POST /api/auth/login` vs `POST /api/admin/auth/login`).
- **Rate limit** (Bucket4j in-memory no MVP) — chave e limites em [11 §1](11-API-ENDPOINTS.md):
  - auth sensível: 5 req/min por IP
  - `POST /api/eventos`: 60 req/min por `sessaoId` / cookie
  - demais autenticados: 120 req/min por `usuarioId`
  - excedido → `429` + `Retry-After`
- Header `X-Visitante-Cookie-Id` obrigatório em telemetria pública quando não autenticado.
- Consentimento comportamental: sem aceite → `POST /api/eventos` retorna `403`.

---

## 6. Mensageria — RabbitMQ

A fila é parte **central** da arquitetura ([05 §2](05-ARQUITETURA.md), [RNF02](02-REQUISITOS.md)):

1. Cliente chama `POST /api/eventos`.
2. API valida auth/consentimento, **publica** na fila e responde `202` `{ "aceito": true }` sem esperar persistência completa.
3. Worker consome → grava `evento` → dispara recálculo de score.

| Fila | Eventos (agrupados) | Produtor | Consumidor |
|---|---|---|---|
| `events.product.view` | `VISUALIZACAO_PRODUTO`, `SCROLL_DEPTH`, `TEMPO_PAGINA`, `FILTRO_APLICADO` | API | Worker scoring |
| `events.product.favorite` | `FAVORITAR`, `DESFAVORITAR` | API | Worker scoring |
| `events.product.contact` | `CONTATO_WHATSAPP` | API | Worker scoring |
| `events.search` | `PESQUISA` | API | Worker scoring |
| `events.session` | contexto de sessão | API | Worker scoring |
| `events.dlq` | dead letter | — | Monitor/log |

- **Retry:** 1 tentativa + 3 retentativas com backoff exponencial; falha definitiva → DLQ.
- Config em `config/RabbitConfig.java` (exchanges, queues, bindings, DLQ).
- O enum `tipo_evento` no payload permanece fino; a fila só agrupa consumidores ([05 §2](05-ARQUITETURA.md)).

---

## 7. Pipeline de Scoring (Worker)

Fonte de regras: [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md) §§4–6, 9.

```
Evento consumido da fila
        │
        ▼
Camada 1: Popularidade Global ──────────────────────────────┐
        │  (janelas 30/90 dias — cold start)                 │
Camada 2: Regras Ponderadas + Decay                         │ interpolação
        │  Σ(peso × valor × e^(−λ × dias)) → [0,100]        │
Camada 3: Grafo/PPR (se ≥ 5 interações do usuário)         │
        │  arestas co-ocorrência / co-compra                │
        ▼                                                    │
 Persiste score_produto + score_categoria ◀─────────────────┘
```

Regras operacionais:
- λ lido de `parametro_decay` (por `categoria_id` ou global `NULL`).
- Pesos lidos de `peso_metrica` (admin: [11 §3.8](11-API-ENDPOINTS.md)).
- Contato WhatsApp: pausa decay (~60 dias) — [04 §5.4](04-ESPECIFICACAO-TECNICA.md).
- Histórico de compras: `< 3` registros → peso da métrica = 0 — [04 §9.2](04-ESPECIFICACAO-TECNICA.md).
- Transição fallback → score pessoal: 0–2 / 3–9 / 10+ interações — [04 §6.2](04-ESPECIFICACAO-TECNICA.md).
- **MVP (ADR-B07):** consumer no mesmo processo Spring; extrair processo separado se throughput exigir.
- Batch Python (ML / Camada 4 futura): lê Postgres offline — **não** no caminho síncrono da request ([05](05-ARQUITETURA.md)).

---

## 8. Ambientes e build

Scaffold do projeto: diretório [`backend/`](../../backend/) (ver [`backend/README.md`](../../backend/README.md)).

| Perfil | Uso | Config |
|---|---|---|
| `dev` | local | `application-dev.yml` — DB/Rabbit locais, JWT secret de dev |
| `prod` | deploy | env vars (`SPRING_DATASOURCE_*`, `JWT_SECRET`, Rabbit…) — sem secrets no git |

Pré-requisitos locais:
1. `database/`: `docker compose up -d postgres rabbitmq` + `flyway migrate` ([database/README.md](../../database/README.md)).
2. `./gradlew bootRun` com perfil `dev` (na pasta `backend/`).

Flyway: **fonte única** de schema em `database/migrations/` — compartilhada com o ambiente de banco; a app Spring **não** duplica DDL.

---

## 9. Como criar um endpoint

Exemplo alinhado a [11](11-API-ENDPOINTS.md):

1. Confirmar contrato em **11-API-ENDPOINTS.md** (método, path, auth, body, RF).
2. DTO request/response em `{módulo}/dto/` (camelCase).
3. Entidade JPA em `{módulo}/entity/` — tabela nova → migration Flyway em `database/migrations/`.
4. `@Repository` em `{módulo}/repository/`.
5. Regras de negócio em `{módulo}/service/`.
6. MapStruct em `{módulo}/mapper/`.
7. `@RestController` em `{módulo}/controller/` — path `/api/...` ou `/api/admin/...`.
8. Security: liberar ou exigir role no filter chain.
9. Teste: `./gradlew test` (pelo menos o caminho feliz + 1 erro de auth/validação).

Fluxo de dependência:

```
controller → service → repository → entity (Postgres)
                ↓
             mapper → dto (JSON)
```

`eventos`: `controller` → `service` → **Rabbit publisher** (persistência no worker).

---

## 10. ADRs — decisões arquiteturais

### ADR-B01: Spring Boot 4.x + Java 25
- **Contexto:** API REST, Security, JPA, mensageria no mesmo ecossistema; Java 25 LTS com suporte first-class.
- **Decisão:** Spring Boot 4.x (Jakarta EE 11 / Spring Framework 7), Java 25 LTS.
- **Trade-off:** Boot 4 + Jackson 3 exige migração a partir do 3.x; vale pelo suporte oficial a Java 25 e stack atual.

### ADR-B02: Pacote por domínio
- **Contexto:** Risco de pastas `controller/`/`service/` globais inchadas.
- **Decisão:** módulos `auth`, `catalog`, `eventos`, `scoring`, `admin`, `lgpd`, `visitante`.
- **Benefício:** coesão; deletar feature remove o pacote.

### ADR-B03: MapStruct
- **Contexto:** Entity ↔ DTO sem boilerplate e sem `any`-like runtime.
- **Decisão:** MapStruct em compile-time.
- **Alternativa rejeitada:** ModelMapper (reflexão, menos type-safe).

### ADR-B04: Flyway em `database/migrations/`
- **Contexto:** Schema já versionado para o ambiente Docker.
- **Decisão:** migrations compartilhadas; app não é dona do DDL.
- **Benefício:** front/docs/DB/back leem a mesma fonte ([08](08-MODELO-DE-DADOS.md)).

### ADR-B05: RabbitMQ (não Kafka)
- **Contexto:** Volume de TCC / B2B pequeno; necessidade de DLQ e retries.
- **Decisão:** RabbitMQ.
- **Motivo:** Kafka é overkill operacionalmente para o escopo.

### ADR-B06: JWT stateless
- **Contexto:** API REST consumida pelo Next.js; admin e consumidor separados.
- **Decisão:** JWT com claim `tipo`; sem sessão server-side no MVP.
- **Benefício:** escala horizontal simples; logout = invalidação client-side (+ denylist opcional depois).

### ADR-B07: Worker no mesmo processo (fase 1)
- **Contexto:** Um JAR facilita demos e TCC.
- **Decisão:** `@RabbitListener` no mesmo Boot app.
- **Upgrade:** processo/serviço separado quando fila ou CPU de scoring competir com a API.
- <!-- ponytail: same-process worker OK for TCC; split if API latency or DLQ growth matters -->

---

## Glossário

- **`PageResponse<T>`:** envelope de lista paginada `{ items, page, limit, total }`.
- **AuthSession:** `{ token, usuario }` retornado em login/signup.
- **Producer / Consumer:** API publica evento; worker consome e grava/recalcula.
- **DLQ:** dead letter queue — mensagens que esgotaram retries.
- **Camada 1/2/3:** Popularidade Global / Regras+Decay / Grafo-PPR ([04 §4](04-ESPECIFICACAO-TECNICA.md)).
- **Wire:** formato JSON na rede (camelCase), distinto do snake_case do banco.
