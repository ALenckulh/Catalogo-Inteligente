# Arquitetura

Visão arquitetural do sistema no modelo **C4** (contexto, contêineres e componentes), seguida do caminho de um evento e da mensageria. Detalhes por camada: [10 — Frontend](10-ARQUITETURA-FRONTEND.md), [12 — Backend](12-ARQUITETURA-BACKEND.md), [08 — Modelo de dados](08-MODELO-DE-DADOS.md) e [11 — API](11-API-ENDPOINTS.md).

| Nível | Pergunta que responde |
|---|---|
| [C4-1: Contexto](#1-c4-1-contexto) | Quem usa o sistema e com o que ele se conecta? |
| [C4-2: Contêineres](#2-c4-2-contêineres) | Quais aplicações e bancos formam o sistema? |
| [C4-3: Componentes do backend](#3-c4-3-componentes-do-backend) | Como a API está dividida por dentro? |
| [C4-3: Componentes do frontend](#4-c4-3-componentes-do-frontend) | Como a aplicação web está dividida por dentro? |

Legenda dos diagramas: pessoa em amarelo, parte do sistema em azul, banco e fila em verde, sistema externo em cinza.

---

## 1. C4-1: Contexto

O Catálogo Inteligente fica entre quem compra e quem vende. A negociação termina fora dele, no WhatsApp.

```mermaid
flowchart TB
    visitante(["Visitante<br/>[Pessoa]<br/>Navega sem conta"]):::pessoa
    comprador(["Comprador PF ou PJ<br/>[Pessoa]<br/>Navega, favorita e pede contato"]):::pessoa
    dono(["Dono do catálogo<br/>[Pessoa]<br/>Acompanha leads e gerencia produtos"]):::pessoa

    sistema["Catálogo Inteligente<br/>[Sistema]<br/>Catálogo B2B que calcula a intenção<br/>de compra e prioriza leads"]:::sistema

    whatsapp["WhatsApp<br/>[Sistema externo]<br/>Negociação e fechamento"]:::externo

    visitante -->|"consulta o catálogo"| sistema
    comprador -->|"consulta, favorita e gerencia seus dados"| sistema
    dono -->|"vê leads, ajusta o score e cadastra produtos"| sistema
    sistema -->|"abre a conversa por link (wa.me)"| whatsapp
    comprador -.->|"negocia"| whatsapp
    dono -.->|"negocia"| whatsapp

    classDef pessoa fill:#fff3cd,stroke:#b38600,color:#222
    classDef sistema fill:#d6e6f5,stroke:#345f7f,color:#222
    classDef externo fill:#eeeeee,stroke:#777777,color:#222
```

A integração com o WhatsApp é um link `wa.me` com a mensagem pronta. Não há uso da API do WhatsApp.

---

## 2. C4-2: Contêineres

```mermaid
flowchart TB
    pessoas(["Visitante, comprador<br/>e dono do catálogo<br/>[Pessoas]"]):::pessoa

    subgraph catalogo["Catálogo Inteligente"]
        web["Aplicação web<br/>[Contêiner: Next.js 16, React 19, Ant Design]<br/>Vitrine, conta e painel admin"]:::sistema
        api["API<br/>[Contêiner: Java 25, Spring Boot 4]<br/>REST, autenticação JWT e<br/>worker de score no mesmo processo"]:::sistema
        fila[("Fila de eventos<br/>[Contêiner: RabbitMQ 3]<br/>5 filas de eventos e 1 fila de erros")]:::dados
        banco[("Banco de dados<br/>[Contêiner: PostgreSQL 16]<br/>Usuários, produtos, eventos,<br/>notas, consentimentos e imagens")]:::dados
        flyway["Migrations<br/>[Contêiner: Flyway 10]<br/>Cria e evolui o schema"]:::sistema
    end

    whatsapp["WhatsApp<br/>[Sistema externo]"]:::externo

    pessoas -->|"usa pelo navegador"| web
    web -->|"JSON/HTTP, Bearer JWT"| api
    api -->|"publica evento (AMQP)"| fila
    fila -->|"entrega ao worker (AMQP)"| api
    api -->|"lê e grava (JDBC)"| banco
    flyway -->|"aplica V001 a V017"| banco
    web -->|"link wa.me"| whatsapp

    classDef pessoa fill:#fff3cd,stroke:#b38600,color:#222
    classDef sistema fill:#d6e6f5,stroke:#345f7f,color:#222
    classDef dados fill:#dcefe9,stroke:#286b64,color:#222
    classDef externo fill:#eeeeee,stroke:#777777,color:#222
```

| Contêiner | Responsabilidade | Onde |
|---|---|---|
| Aplicação web | Telas, coleta de eventos no navegador e consentimento | [`frontend/`](../frontend/) |
| API | Regras de negócio, segurança, publicação e consumo de eventos, cálculo da nota | [`backend/`](../backend/) |
| Fila de eventos | Separa a resposta da API do cálculo da nota | [`database/docker-compose.yml`](../database/docker-compose.yml) |
| Banco de dados | Persistência, com `metadados` em JSONB | [`database/`](../database/) |
| Migrations | Única fonte do schema; a API não altera tabelas | [`database/migrations/`](../database/migrations/) |

---

## 3. C4-3: Componentes do backend

Um pacote por domínio (ADR-B02). O worker roda no mesmo processo da API (ADR-B07).

```mermaid
flowchart LR
    web["Aplicação web"]:::sistema

    subgraph backend["API [Contêiner: Spring Boot 4]"]
        direction LR
        seg["Segurança<br/>RateLimitFilter<br/>JwtAuthenticationFilter<br/>SecurityConfig"]:::comp
        auth["auth<br/>cadastro, login, senha"]:::comp
        visit["visitante<br/>sessão e migração"]:::comp
        lgpd["lgpd<br/>consentimento, exportação,<br/>anonimização"]:::comp
        catalog["catalog<br/>produtos, categorias,<br/>favoritos, imagens"]:::comp
        admin["admin<br/>dashboard, usuários,<br/>produtos, configuração"]:::comp
        eventos["eventos<br/>EventoService<br/>EventoPublisher"]:::comp
        engine["scoring.engine<br/>ScoreEngine<br/>ScoreCalculator<br/>RankingService"]:::comp
        worker["scoring.worker<br/>EventoPersistWorker"]:::comp
    end

    fila[("RabbitMQ")]:::dados
    banco[("PostgreSQL")]:::dados

    web --> seg
    seg --> auth & visit & lgpd & catalog & admin & eventos
    catalog -->|"ordena pela nota"| engine
    admin -->|"simula e recalcula"| engine
    eventos -->|publica| fila
    fila -->|consome| worker
    worker -->|"recalcula"| engine
    backend -->|"JPA e SQL nativo"| banco

    classDef sistema fill:#d6e6f5,stroke:#345f7f,color:#222
    classDef comp fill:#eaf2fa,stroke:#345f7f,color:#222
    classDef dados fill:#dcefe9,stroke:#286b64,color:#222
```

O `ScoreCalculator` é uma função sem acesso a banco. Por isso, o worker e a simulação do admin usam a mesma conta.

---

## 4. C4-3: Componentes do frontend

```mermaid
flowchart TB
    subgraph frontend["Aplicação web [Contêiner: Next.js 16]"]
        publico["app/(public)<br/>vitrine, catálogo, ficha,<br/>favoritos, conta"]:::comp
        adm["app/admin<br/>dashboard, usuários, produtos,<br/>configuração"]:::comp
        ui["components/ui<br/>camada sobre o Ant Design"]:::comp
        ctx["lib/contexts<br/>CurrentUser e CookieConsent"]:::comp
        hooks["lib/hooks<br/>useTrackEvent, useRequireAdmin,<br/>useTabelaPaginada"]:::comp
        apiCli["lib/api<br/>axios, JWT e header do visitante"]:::comp
    end
    api["API [Contêiner: Spring Boot 4]"]:::sistema

    publico & adm --> ui
    publico & adm --> ctx
    publico & adm --> hooks
    hooks -->|"só com consentimento"| apiCli
    publico & adm --> apiCli
    ctx --> apiCli
    apiCli -->|"JSON/HTTP"| api

    classDef sistema fill:#d6e6f5,stroke:#345f7f,color:#222
    classDef comp fill:#eaf2fa,stroke:#345f7f,color:#222
```

---

## 5. Caminho de um evento até a nota

```mermaid
sequenceDiagram
    autonumber
    actor U as Comprador
    participant W as Aplicação web
    participant A as API
    participant Q as RabbitMQ
    participant K as Worker
    participant D as PostgreSQL

    U->>W: abre a ficha de um produto
    W->>W: há consentimento comportamental?
    W->>A: POST /api/eventos
    A->>D: confere consentimento (logado) e sessão
    A->>Q: publica em events.product.view
    A-->>W: 202 { aceito: true }
    Note over U,W: a navegação não espera o cálculo
    Q->>K: entrega a mensagem
    K->>D: grava em evento
    K->>K: ScoreCalculator: peso × valor × decaimento
    K->>D: grava score_produto, score_categoria e faixa de preço
    U->>W: volta ao catálogo
    W->>A: GET /api/produtos
    A->>D: lê notas e popularidade
    A-->>W: produtos ordenados pela intenção
```

---

## 6. Mensageria assíncrona

- **Desacoplamento:** a API publica e responde; não espera o cálculo da nota ([RNF02](02-REQUISITOS.md)).
- **Absorção de picos:** a fila guarda os eventos até o worker processar.
- **Filas por natureza do evento:** permite separar consumidores no futuro. Hoje um único listener consome todas.

| Fila | Tipos de evento | Consumidor |
|---|---|---|
| `events.product.view` | `VISUALIZACAO_PRODUTO`, `SCROLL_DEPTH`, `TEMPO_PAGINA`, `FILTRO_APLICADO` | Worker de score |
| `events.product.favorite` | `FAVORITAR`, `DESFAVORITAR` | Worker de score |
| `events.product.contact` | `CONTATO_WHATSAPP` | Worker de score |
| `events.search` | `PESQUISA` | Worker de score |
| `events.session` | nenhum hoje (reservada) | Worker de score |
| `events.dlq` | mensagens rejeitadas sem requeue | — |

**Falhas:** gravar o evento e recalcular a nota formam uma transação só. Se o cálculo falha, nada é gravado e a mensagem volta para a fila, que é o padrão do Spring AMQP. Retentativa com backoff não está configurada. Se o RabbitMQ estiver fora do ar, a API responde erro, o evento se perde e a navegação segue.

## 7. Decisões arquiteturais relevantes

- **Monorepo** com `frontend/`, `backend/` e `database/`.
- **RabbitMQ, não Kafka** (ADR-B05) e **worker no mesmo processo** (ADR-B07): [12 §10](12-ARQUITETURA-BACKEND.md).
- **Flyway como única fonte do schema** (ADR-B04).
- **JWT stateless** (ADR-B06), com releitura do usuário a cada requisição para barrar conta excluída.
- **Sem carrinho nem pagamento:** decisão de escopo ([01 §3](01-VISAO-GERAL.md)).
- **PostgreSQL único:** JSONB para `evento.metadados` e BYTEA para as imagens ([13 — M16](13-MUDANCAS-DE-ESCOPO.md)).
- **Score por regras, sem ML:** interpretável e útil com poucos dados ([04](04-ESPECIFICACAO-TECNICA.md)).
- Decisões do frontend: [10 §10](10-ARQUITETURA-FRONTEND.md).
