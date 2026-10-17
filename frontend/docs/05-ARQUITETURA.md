# Arquitetura

Visão arquitetural do sistema: camadas, modelo de dados e esboço da API.

## 1. Visão em camadas

```
┌─────────────────────────────────────────────────────────────┐
│  Navegador (usuário)                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js (React) + Ant Design                         │  │
│  │  • SSR / SSG para páginas públicas                    │  │
│  │  • Coleta de eventos no cliente (clique, scroll…)     │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS / REST
┌──────────────────▼──────────────────────────────────────────┐
│  API Spring Boot (Java)                                     │
│  • Autenticação (JWT ou sessão)                             │
│  • CRUD de produtos, usuários, favoritos                    │
│  • Producer de eventos → mensageria                         │
│  • Endpoints de leitura de score (admin)                    │
└────────┬──────────────────────────────┬─────────────────────┘
         │                              │
         │ publish                      │ CRUD / leitura
         ▼                              ▼
┌─────────────────────┐        ┌──────────────────────────────┐
│  RabbitMQ / Kafka   │        │  PostgreSQL                  │
│  Filas de eventos   │        │  • Usuários, produtos        │
└─────────┬───────────┘        │  • Favoritos, compras        │
          │ consume            │  • Eventos (JSONB metadados) │
          ▼                    │  • Scores calculados         │
┌─────────────────────┐        │  • Consentimentos LGPD       │
│  Worker (Spring)    │───────▶│                              │
│  • Persiste evento  │        └──────────────────────────────┘
│  • Dispara recálculo│                      ▲
│    de score         │                      │ leitura em batch
└─────────────────────┘                      │
                                   ┌─────────┴──────────┐
                                   │  Serviço ML Python │
                                   │  TensorFlow/Keras  │
                                   │  • Treina modelo   │
                                   │  • Gera predições  │
                                   └────────────────────┘
```

## 2. Mensageria assíncrona

A fila de eventos (RabbitMQ ou Kafka) é parte **central** da arquitetura:

- **Desacoplamento:** o frontend/API não aguardam a persistência completa do evento para responder. A API apenas publica na fila e retorna rapidamente, garantindo que o envio de eventos não bloqueie a navegação ([RNF02](02-REQUISITOS.md)).
- **Absorção de picos:** se houver um pico de tráfego, a fila armazena eventos até que os workers consigam processar.
- **Múltiplos consumidores:** o mesmo evento pode ser consumido por workers distintos — um grava no Postgres, outro poderia alimentar cache, outro poderia alimentar o pipeline ML.
- **Resiliência:** tópico de **dead letter queue** acumula mensagens que falharam após N retentativas, para análise sem bloquear o fluxo principal.

**Tópicos/filas previstos:**

| Fila | Tipo de evento | Produtor | Consumidor |
|---|---|---|---|
| `events.product.view` | Visualização de página de produto | API | Worker scoring |
| `events.product.favorite` | Favoritar / desfavoritar | API | Worker scoring |
| `events.product.contact` | Clique no WhatsApp (conversão) | API | Worker scoring |
| `events.search` | Pesquisa realizada | API | Worker scoring |
| `events.session` | Dados de contexto da sessão | API | Worker scoring |
| `events.dlq` | Dead letter queue | — | Monitor/log |

**Política de retentativa:** tentativa inicial + 3 retentativas com backoff exponencial; falhas definitivas vão para DLQ.

## 3. Modelo de dados

A modelagem relacional completa (tabelas, colunas, tipos, constraints, enums e índices) está documentada em **[08-MODELO-DE-DADOS.md](08-MODELO-DE-DADOS.md)**.

Resumo das entidades principais:

- **Núcleo:** `usuario` (tabela única PF/PJ/ADMIN), `visitante`, `consentimento_lgpd`.
- **Catálogo:** `categoria`, `produto`, `produto_imagem`, `favorito`.
- **Comportamento:** `sessao`, `evento` (com `metadados` JSONB), `compra`.
- **Scoring:** `score_produto`, `score_categoria`, `faixa_preco_usuario`, `produto_aresta` (grafo — Camada 3).
- **Configuração:** `peso_metrica`, `parametro_decay`.
- **LGPD:** `solicitacao_lgpd`.

## 4. Esboço de API REST

Endpoints de alto nível. Nomes finais podem variar.

### Público / consumidor

```
POST   /api/auth/signup                    Cria conta (PF ou PJ)
POST   /api/auth/login                     Autentica usuário
POST   /api/auth/password-reset            Solicita recuperação
POST   /api/auth/password-reset/confirm    Confirma nova senha

GET    /api/produtos                       Lista produtos (ordenado por score)
GET    /api/produtos/{slug}                Detalhe de produto
GET    /api/categorias                     Lista categorias

POST   /api/favoritos/{produtoId}          Favoritar
DELETE /api/favoritos/{produtoId}          Desfavoritar
GET    /api/favoritos                      Lista favoritos do usuário

POST   /api/eventos                        Publica evento comportamental
                                           (API faz publish na fila)

GET    /api/conta                          Dados do usuário logado
PATCH  /api/conta                          Atualiza dados
POST   /api/conta/consentimentos           Atualiza consentimentos LGPD
GET    /api/conta/exportar                 LGPD — portabilidade
DELETE /api/conta                          LGPD — exclusão
```

### Admin

```
POST   /api/admin/auth/login               Login do admin

GET    /api/admin/usuarios                 Lista de usuários com score
GET    /api/admin/usuarios/{id}            Detalhe + scores
POST   /api/admin/usuarios/{id}/compras    Registra compra manual

GET    /api/admin/produtos                 Lista admin
POST   /api/admin/produtos                 Cria produto
PATCH  /api/admin/produtos/{id}            Atualiza produto
DELETE /api/admin/produtos/{id}            Remove produto

GET    /api/admin/dashboard                KPIs + leads priorizados

GET    /api/admin/configuracao/pesos       Lê pesos de métricas
PATCH  /api/admin/configuracao/pesos       Atualiza pesos
```

## 5. Decisões arquiteturais relevantes

- **Monorepo com `frontend/` separado** para o Next.js; backend Java provavelmente ficará em diretório irmão (ex: `backend/`), a confirmar.
- **Sem carrinho/pagamento:** decisão de escopo (ver [01-VISAO-GERAL.md §3](01-VISAO-GERAL.md)).
- **PostgreSQL único**, com uso de JSONB para `Evento.metadados` para flexibilidade na coleta sem migrações frequentes.
- **ML em processo separado**, lendo do Postgres em batch — não acoplado ao fluxo síncrono de resposta ao usuário.
