# Arquitetura — Backend

Guia de estrutura de pacotes, padrões de código e decisões do backend do Catálogo Inteligente. Para o modelo de dados ver [08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md); para o contrato REST ver [11-API-ENDPOINTS.md](11-API-ENDPOINTS.md); visão em camadas do sistema em [05-ARQUITETURA.md](05-ARQUITETURA.md); scoring em [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md).

Links irmãos:
- [05-ARQUITETURA.md](05-ARQUITETURA.md) — camadas, mensageria, esboço da API
- [08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md) — tabelas, enums, constraints
- [11-API-ENDPOINTS.md](11-API-ENDPOINTS.md) — fonte de verdade dos endpoints
- [`database/README.md`](../database/README.md) — PostgreSQL + Flyway local

---

## 1. Stack

| Camada | Tecnologia | Versão / nota |
|---|---|---|
| Linguagem | **Java** | 25 (LTS) |
| Framework | **Spring Boot** | 4.x |
| Build | **Gradle** (Kotlin DSL) | Wrapper no repo |
| Segurança | Spring Security + **JWT** (JJWT) | Stateless |
| Persistência | Spring Data JPA (Hibernate) | PostgreSQL |
| Mapeamento DTO | `record` Java com método estático `from(entity)` | Sem biblioteca de mapeamento |
| JSON | Jackson | camelCase no wire |
| Migrations | **Flyway** | Scripts em `database/migrations/` |
| Mensageria | **RabbitMQ** | Filas de eventos + DLQ |
| Rate limit | Bucket4j (in-memory no MVP) | Limites em [11 §1](11-API-ENDPOINTS.md) |
| Scoring | Worker Spring (`@RabbitListener`) | Camadas 1 e 2 de [04](04-ESPECIFICACAO-TECNICA.md) |
| Imagens | Apache Tika (`tika-core`) | Detecta o tipo real do arquivo enviado |
| Dev local | Docker Compose | `database/` (+ RabbitMQ) |

Scripts (raiz `backend/`):
- `./gradlew bootRun` — sobe a API (perfil `dev`).
- `./gradlew test` — testes automatizados.
- `./gradlew build` — compile + test + cobertura + jar.

Gates antes de PR (os mesmos do CI): `test` → `jacocoTestCoverageVerification` (mínimo de 75% das linhas).

---

## 2. Estrutura de pastas

```
backend/
├── src/main/java/com/catalogo/
│   ├── CatalogoApplication.java
│   ├── config/       # SecurityConfig, CorsConfig, RabbitConfig, RateLimitFilter, JacksonConfig, JpaAuditingConfig
│   ├── auth/         # cadastro, login, logout, recuperação de senha, JWT (security/)
│   ├── visitante/    # sessão de visitante e migração de histórico
│   ├── catalog/      # produto, categoria, imagem, favorito, compra (entidade)
│   ├── eventos/      # POST /api/eventos → publica na fila (EventoRouting, EventoPublisher)
│   ├── scoring/
│   │   ├── worker/   # EventoPersistWorker (consome as filas)
│   │   ├── engine/   # ScoreEngine, ScoreCalculator, DecayCalculator, ScoringParams, RankingService, PopularidadeGlobalService
│   │   ├── entity/
│   │   └── repository/
│   ├── admin/        # dashboard, usuários, produtos, conta, configuração, solicitações LGPD
│   ├── lgpd/         # conta do titular, consentimentos, exportação, anonimização
│   └── shared/       # PageResponse, ErrorResponse, ApiException, GlobalExceptionHandler, Documentos, DadosConta, BuscaTexto, Fuso, HealthController
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-prod.yml      # valores por variável de ambiente
└── src/test/
```

### 2.1 Convenções de pacote

- **Pacote por domínio/módulo**, não por camada técnica global (`controllers/`, `services/` na raiz). Dentro de cada módulo: `controller` / `service` / `repository` / `dto` / `entity` (e `domain` para enums), conforme a necessidade.
- `shared/` só para tipos **transversais** (`PageResponse<T>`, `ErrorResponse`, `@ControllerAdvice`).
- Um módulo não importa `controller` de outro; reutiliza `service`/`repository`/`entity` quando necessário.

---

## 3. Nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Pacote | lowercase | `com.catalogo.catalog` |
| Classe | PascalCase | `CatalogService`, `AuthController` |
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
| **Soft delete** | Filtro `deleted_at IS NULL` nas consultas dos repositórios (`…DeletedAtIsNull`, `findAtivos…`). |
| **Timestamps** | `TIMESTAMPTZ` ↔ `OffsetDateTime`. JPA Auditing para `createdAt` / `updatedAt`. O **dia** (decaimento, gráfico, compra) é o de Brasília, por `Fuso`, qualquer que seja o fuso do servidor. |
| **Dinheiro** | `BigDecimal` (`NUMERIC(12,2)`). Nunca `double`/`float`. |
| **Scores** | `BigDecimal` [0, 100], 2 casas (`NUMERIC(5,2)`). |
| **DTOs** | `record` com `from(entity)`. A conversão fica no DTO, não no service. |
| **Migrations** | Só via Flyway em `database/migrations/`. Nunca alterar schema “na mão” em prod. |
| **IDs** | `Long` (`BIGINT`). Produto público na URL usa `slug`. |
| **AuthSession** | `{ "token", "usuario" }` — `usuario` sem hash de senha. |

---

## 5. Segurança

- **Spring Security**, uma cadeia de filtros com regras por rota (`SecurityConfig`):
  - públicas: catálogo (GET), cadastro, login, recuperação de senha, sessão de visitante, eventos e saúde
  - `/api/admin/**`: `hasRole("ADMIN")` ([RNF07](02-REQUISITOS.md))
  - demais: autenticado
- **JWT** (JJWT), stateless. Claims: `jti`, `sub` (usuarioId), `tipo` (`PF`\|`PJ`\|`ADMIN`), `email`, `iat`, `exp` (24 h). O filtro relê o usuário a cada requisição e recusa conta excluída, token encerrado no logout (`token_revogado`) e token anterior à última troca de senha (`sessoes_validas_desde`). Só erro do **token** segue como anônimo (401 se a rota exigir login); banco fora responde 503.
- Login consumidor e admin em rotas distintas (`POST /api/auth/login` vs `POST /api/admin/auth/login`).
- **Rate limit** (Bucket4j in-memory no MVP) — chave e limites em [11 §1](11-API-ENDPOINTS.md):
  - auth sensível, incluindo `password-reset/confirm`: 5 req/min por IP
  - `POST /api/eventos`: 60 req/min por cookie do visitante (ou IP)
  - `POST /api/visitantes/sessao`: 30 req/min por IP
  - demais rotas com login: 120 req/min por usuário (`UsuarioRateLimitFilter`, depois do JWT)
  - excedido → `429` + `Retry-After`
- Header `X-Visitante-Cookie-Id` obrigatório em telemetria pública quando não autenticado.
- Consentimento comportamental (`ConsentimentoService`): logado sem aceite, ou visitante sem `aceite_cookies_em` → `POST /api/eventos` e `POST /api/visitantes/sessao` retornam `403`.
- E-mail (`EmailService`, assíncrono): a resposta não espera o SMTP nem revela se a conta existe; o código não vai para o log.
- CORS: só origens `localhost` e `127.0.0.1` (`CorsConfig`).

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
| `events.dlq` | dead letter | — | Monitor/log |

- **Falhas** (`config/FalhaPassageira.java`): passageira (banco fora, deadlock) volta para a fila; dado inválido ou mensagem malformada vai para a DLQ. A API já recusa com 400 o evento que o worker não conseguiria gravar.
- **Transação:** gravar o evento e recalcular a nota é uma transação só; se o cálculo falha, o evento não fica gravado.
- **Conta excluída:** o worker trava a linha do usuário ao gravar e descarta o evento de conta já excluída; a exclusão trava a mesma linha antes de apagar os eventos.
- Config em `config/RabbitConfig.java` (exchanges, queues, bindings, DLQ).
- O enum `tipo_evento` no payload permanece fino; a fila só agrupa consumidores ([05 §2](05-ARQUITETURA.md)).

---

## 7. Pipeline de Scoring (Worker)

Fonte de regras: [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md) §§4–6, 9.

```
Evento consumido da fila
        │
        ▼
Grava `evento`  ──►  ScoreEngine.recalc(usuário ou visitante)
                          │
                          ▼
        Camada 2: ScoreCalculator (função pura)
        Σ(peso × valor × decaimento) ÷ máximo × 100 → [0, 100]
                          │
                          ▼
        score_produto · score_categoria · faixa_preco_usuario

Na leitura do catálogo (RankingService):
        nota final = w × nota pessoal + (1 − w) × popularidade global (Camada 1)
```

A Camada 3 (grafo/PPR) e modelos de ML são trabalho futuro ([04 §13](04-ESPECIFICACAO-TECNICA.md)).

Regras operacionais:
- λ lido de `parametro_decay` (por `categoria_id` ou global `NULL`).
- Favoritar e desfavoritar: por produto, só o último conta.
- Nota sem sinal (compra excluída, evento removido) é apagada no recálculo.
- Pesos lidos de `peso_metrica` (admin: [11 §3.8](11-API-ENDPOINTS.md)).
- Contato WhatsApp ou compra: pausa decay por `parametro_decay.pausa_dias` (padrão 60) — [04 §5.4](04-ESPECIFICACAO-TECNICA.md).
- Retorno ao produto: cada sessão com visualização depois da primeira soma o peso `RETORNO_PAGINA` (começa em 0).
- Recorrência: com 3 ou mais compras, categoria comprada em 2 ou mais datas recebe `boost_recorrencia`.
- Compra vale como conversão desde a primeira (boost, faixa, decaimento). Pontos: `< 3` registros → nenhum; a partir de 3, cada compra soma o peso `COMPRA` (metade após 2 anos) — [04 §9.2](04-ESPECIFICACAO-TECNICA.md).
- Transição fallback → score pessoal: 0–2 / 3–9 / 10+ interações; logado com notas, mínimo de 80% — [04 §6.2](04-ESPECIFICACAO-TECNICA.md).
- **MVP (ADR-B07):** consumer no mesmo processo Spring; extrair processo separado se throughput exigir.

---

## 8. Ambientes e build

Código em [`backend/`](../backend/) (ver [`backend/README.md`](../backend/README.md)).

| Perfil | Uso | Config |
|---|---|---|
| `dev` | local | `application-dev.yml` — DB/Rabbit locais, JWT secret de dev |
| `prod` | fora do ambiente local | variáveis `SPRING_DATASOURCE_*`, `SPRING_RABBITMQ_*`, `JWT_SECRET`, `MAIL_*` — sem segredos no git |

Pré-requisitos locais:
1. `database/`: `docker compose up -d postgres rabbitmq` + `flyway migrate` ([database/README.md](../database/README.md)).
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
6. `from(entity)` no `record` de resposta.
7. `@RestController` em `{módulo}/controller/` — path `/api/...` ou `/api/admin/...`.
8. Security: liberar ou exigir role no filter chain.
9. Teste: `./gradlew test` (pelo menos o caminho feliz + 1 erro de auth/validação).

Fluxo de dependência:

```
controller → service → repository → entity (Postgres)
                ↓
             dto.from(entity) → JSON
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

### ADR-B03: DTOs `record` com `from()` (revista)
- **Contexto:** converter entidade em DTO sem reflexão e com tipo verificado pelo compilador.
- **Decisão original:** MapStruct. **Revisão:** os DTOs são `record` com um método estático `from(entity)`, porque as conversões são simples e cada uma fica ao lado do próprio contrato. A dependência do MapStruct foi removida.
- **Alternativa rejeitada:** ModelMapper (reflexão, menos type-safe).

### ADR-B04: Flyway em `database/migrations/`
- **Contexto:** Schema já versionado para o ambiente Docker.
- **Decisão:** migrations compartilhadas; app não é dona do DDL.
- **Benefício:** front/docs/DB/back leem a mesma fonte ([08](08-MODELO-DE-DADOS.md)).

### ADR-B05: RabbitMQ (não Kafka)
- **Contexto:** Volume de TCC / B2B pequeno; necessidade de DLQ.
- **Decisão:** RabbitMQ.
- **Motivo:** Kafka é overkill operacionalmente para o escopo.

### ADR-B06: JWT stateless
- **Contexto:** API REST consumida pelo Next.js; admin e consumidor separados.
- **Decisão:** JWT com claim `tipo`; sem sessão server-side no MVP.
- **Benefício:** escala horizontal simples.
- **Revisão:** o logout grava o `jti` em `token_revogado`, e trocar a senha invalida os tokens anteriores. Custa uma leitura por chave primária a cada requisição.

### ADR-B07: Worker no mesmo processo (fase 1)
- **Contexto:** Um JAR facilita demos e TCC.
- **Decisão:** `@RabbitListener` no mesmo Boot app.
- **Upgrade:** processo/serviço separado quando fila ou CPU de scoring competir com a API.

---

## Glossário

- **`PageResponse<T>`:** envelope de lista paginada `{ items, page, limit, total }`.
- **AuthSession:** `{ token, usuario }` retornado em login/signup.
- **Producer / Consumer:** API publica evento; worker consome e grava/recalcula.
- **DLQ:** dead letter queue — mensagens rejeitadas sem requeue.
- **Camada 1/2/3:** Popularidade Global / Regras+Decay / Grafo-PPR, futura ([04 §4](04-ESPECIFICACAO-TECNICA.md)).
- **Wire:** formato JSON na rede (camelCase), distinto do snake_case do banco.
