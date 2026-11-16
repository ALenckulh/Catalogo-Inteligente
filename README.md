# Catálogo Inteligente B2B

> **Predição de Intenção de Compra em Catálogos B2B com Sistema de Recomendação Baseado em Scoring**

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)](.)
[![CI](https://github.com/ALenckulh/Catalogo-Inteligente/actions/workflows/ci.yml/badge.svg)](https://github.com/ALenckulh/Catalogo-Inteligente/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Java](https://img.shields.io/badge/Java-25-ED8B00?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org/)
[![Licença](https://img.shields.io/badge/licença-MIT-green)](./LICENSE)

---

## Sobre o Projeto

O **Catálogo Inteligente** é um sistema de catálogo online B2B com motor de recomendação, desenvolvido como Trabalho de Conclusão de Curso (Portfólio / PAC — Católica SC) no Centro Universitário Católica de Santa Catarina.

Não é uma loja virtual genérica com carrinho e pagamento. É uma **vitrine B2B** que coleta comportamento, calcula **score de intenção de compra** e entrega **leads priorizados** ao dono do catálogo — a negociação fecha fora da plataforma (ex.: WhatsApp).

O score usa um **motor por regras ponderadas com decaimento temporal exponencial**, calibrado para ciclos de compra longos típicos do B2B.

### Linha de Portfólio

**Web Apps** — ver [docs/PORTFOLIO.md](./docs/PORTFOLIO.md). Diferenciais: mensageria (RabbitMQ), dashboard admin, JWT, LGPD.

### Problema de Pesquisa

Empresas B2B frequentemente enfrentam dificuldades para identificar leads qualificados em catálogos digitais, já que:

- Grande parte das negociações ocorre **fora da plataforma** (WhatsApp, telefone, e-mail)
- Catálogos em estágio inicial possuem **poucos dados históricos**, inviabilizando filtragem colaborativa
- Ciclos de decisão podem se **estender por meses**, distorcendo métricas de engajamento tradicionais

### Hipótese

> Um modelo de scoring baseado em regras ponderadas com decaimento temporal, calibrado para ciclos B2B longos (com pausa durante negociações ativas), é suficiente para gerar sinais de intenção de compra interpretáveis e úteis a partir de **uma única interação do usuário**.

---

## Arquitetura

Frontend e backend desacoplados:

```
Captura de evento → API → RabbitMQ → Worker → Score (Camadas 1 e 2) → PostgreSQL → API → Frontend
```

### Frontend (Next.js / React)

- Catálogo de produtos e categorias
- Captura de interações (cliques, scroll, tempo, favoritos, pesquisas, filtros)
- Ordenação / vitrine conforme score
- Banner de consentimento (LGPD)

### Backend (Spring Boot / Java 25)

- API REST, autenticação JWT, rate limit
- Publicação de eventos comportamentais no RabbitMQ
- Workers: persistência de eventos e recálculo de score
- Score de Produto / Categoria (regras + decay)
- Área admin (dashboard, leads, CRUD produtos, pesos/λ)
- Conta do titular: consentimentos, exportação e exclusão (LGPD)
- Migração de histórico visitante → usuário autenticado

Documentação técnica: [frontend/docs/](./frontend/docs/).

---

## Motor de Scoring

### Camada 1 — Popularidade Global (Cold Start)

Fallback para usuários novos e anônimos, com transição gradual para o score pessoal.

### Camada 2 — Regras Ponderadas + Decaimento Exponencial (Core)

```
Score = Σ (peso_i × evento_i × e^(−λ × dias_desde_interação))
```

- **peso_i** — peso configurável por tipo de interação
- **λ** — taxa de decaimento (menor em B2B de ciclo longo)
- **Pausa do decaimento** — contato com vendedor congela o decay enquanto a negociação está ativa

Score de Categoria: média ponderada logarítmica dos scores de produto, com boost pós-conversão.

### Faixa de Preço de Interesse

Distingue produtos com conversão (contato/compra) de apenas visualizados.

---

## Comparação de Modelos de Recomendação

| Característica | KNN | Grafo/PPR | **Regras + Decay** | Regras Seq. | Matrix Fac. |
|---|:---:|:---:|:---:|:---:|:---:|
| Interpretabilidade | Alta | Média | **Alta** | Alta | Baixa |
| Resistência à esparsidade | Média | Alta | **Alta** | Média | Baixa |
| Volume mínimo de dados | Baixo | Baixo | **Nenhum** | Baixo | Alto |
| Suporte a usuário anônimo | Sim | Sim | **Sim** | Sim | Não |
| Cold start | Sim | Sim | **Sim** | Sim | Não |
| Calibração para B2B longo | ✗ | ✗ | **✓ (núcleo)** | ✗ | ✗ |
| Status neste TCC | Futuro | Futuro | **Implementado** | Futuro | Futuro |

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Ant Design, Tailwind CSS 4 |
| Backend | Java 25, Spring Boot 4 |
| Banco de dados | PostgreSQL (Flyway em `database/`) |
| Mensageria | RabbitMQ |
| Auth | JWT |
| Conformidade | LGPD — consentimento, exportação, exclusão |

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- JDK 25+
- Docker Desktop (Postgres + RabbitMQ)

### Infra (banco + fila)

```bash
cd database
cp .env.example .env
docker compose up -d postgres rabbitmq
docker compose run --rm flyway migrate
```

Detalhes: [database/README.md](./database/README.md).

### Atualizar o banco

Rode isto depois de puxar uma migration nova de `database/migrations/` (ex.: `V014__imagem_arquivo.sql`). A aplicação não roda as migrations sozinha.

```bash
cd database
docker compose up -d postgres
docker compose run --rm flyway migrate
```

Para conferir o que já foi aplicado:

```bash
docker compose run --rm flyway info
```

### Backend

```bash
cd backend
./gradlew bootRun
```

API em [http://localhost:8080](http://localhost:8080). Ver [backend/README.md](./backend/README.md).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App em [http://localhost:3000](http://localhost:3000).

---

## Trabalhos Futuros

- **Camada 3** — Regras Sequenciais + Grafo/PPR
- **Camada 4** — Collaborative Filtering / Matrix Factorization
- PoC de ML (ex. RNN) em dados históricos — fora do escopo entregue
- Integração WhatsApp Business / CRM
- Hospedagem pública em cloud (AWS/GCP/Azure) — pendente para Demo Day

---

## Autora

**Ana Paula Lenckulh** — [lenckulh.ola@gmail.com](mailto:lenckulh.ola@gmail.com)  
Centro Universitário Católica de Santa Catarina, Jaraguá do Sul, SC, Brasil.
