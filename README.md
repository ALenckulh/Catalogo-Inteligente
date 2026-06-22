# Catálogo Inteligente B2B

> **Predição de Intenção de Compra em Catálogos B2B com Sistema de Recomendação Baseado em Scoring**

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)](.)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org/)
[![Licença](https://img.shields.io/badge/licença-MIT-green)](./LICENSE)

---

## Sobre o Projeto

O **Catálogo Inteligente** é um sistema de catálogo online B2B com motor de recomendação inteligente, desenvolvido como Trabalho de Conclusão de Curso (PAC VIII — 2026/1) no Centro Universitário Católica de Santa Catarina.

O sistema atribui um **score de intenção de compra** a produtos e categorias com base em dados comportamentais — cliques, pesquisas, favoritos, tempo de navegação e contatos iniciados — utilizando um **motor de scoring por regras ponderadas com decaimento temporal exponencial** calibrado especificamente para os ciclos de compra longos típicos do ambiente B2B.

### Problema de Pesquisa

Empresas B2B frequentemente enfrentam dificuldades para identificar leads qualificados em catálogos digitais, já que:

- Grande parte das negociações ocorre **fora da plataforma** (WhatsApp, telefone, e-mail)
- Catálogos em estágio inicial possuem **poucos dados históricos**, inviabilizando filtragem colaborativa
- Ciclos de decisão podem se **estender por meses**, distorcendo métricas de engajamento tradicionais

### Hipótese

> Um modelo de scoring baseado em regras ponderadas com decaimento temporal, calibrado para ciclos B2B longos (com pausa durante negociações ativas), é suficiente para gerar sinais de intenção de compra interpretáveis e úteis a partir de **uma única interação do usuário**.

---

## Arquitetura

O sistema é estruturado em **frontend e backend desacoplados**, seguindo o pipeline:

```
Captura de evento → Registro com timestamp → Cálculo de score (Camadas 1 e 2) → API → Frontend
```

### Frontend (React / Next.js)
- Exibição do catálogo de produtos e categorias
- Captura de interações comportamentais (cliques, scroll, tempo em página, favoritos, pesquisas e filtros)
- Página inicial personalizada conforme o score do usuário
- Banner de consentimento de cookies (conformidade LGPD)

### Backend (Python)
- Coleta e processamento das métricas comportamentais
- Cálculo do **Score de Produto** e **Score de Categoria**
- Aplicação do decaimento temporal exponencial por perfil de produto
- Geração de dataset sintético de interações para testes e calibração

---

## Motor de Scoring

### Camada 1 — Popularidade Global (Cold Start)
Mecanismo de fallback para usuários novos e anônimos, com **transição gradual** para o score pessoal à medida que interações são acumuladas.

### Camada 2 — Regras Ponderadas + Decaimento Exponencial (Core)

O Score de Produto é calculado como:

```
Score = Σ (peso_i × evento_i × e^(−λ × dias_desde_interação))
```

Onde:
- **peso_i** — peso configurável por tipo de interação (clique, favorito, contato, pesquisa, tempo, retorno)
- **λ** — taxa de decaimento calibrada por perfil de produto (λ menor para B2B de ciclo longo; λ maior para reposição frequente)
- **Pausa do decaimento** — qualquer evento de contato com o vendedor congela o decaimento enquanto a negociação permanecer ativa

O **Score de Categoria** é obtido por média ponderada logarítmica dos scores de produto, com boost fixo aplicável a conversões recentes.

### Faixa de Preço de Interesse
O sistema distingue produtos que geraram **conversão** (contato ou compra) de produtos apenas visualizados, sinalizando possível sensibilidade a preço ao vendedor.

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
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Python 3.x |
| Banco de dados | A definir |
| Conformidade | LGPD — consentimento explícito de cookies |

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Frontend

```bash
# Entrar na pasta do frontend
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## Cronograma

| Semanas | Entregas |
|---|---|
| 1–4 | Modelagem de dados; implementação da Camada 1 (Popularidade Global); estrutura base de coleta de métricas; geração do dataset sintético |
| 5–8 | Implementação completa da Camada 2: Score de Produto, decaimento exponencial por λ, pausa por evento de contato, transição gradual fallback → score pessoal |
| 9–12 | Score de Categoria (média log-ponderada + boost), Faixa de Preço, histórico de compras com threshold mínimo, consentimento de cookies |
| 13–16 | Testes de calibração de λ com dados sintéticos, validação de edge cases, redação final do TCC e preparação de defesa |

---

## Trabalhos Futuros

- **Camada 3** — Regras Sequenciais + Grafo/PPR (condicionado a base real de usuários)
- **Camada 4** — Collaborative Filtering / Matrix Factorization
- Painel administrativo para ajuste fino de pesos e histórico de compras
- Migração de histórico de visitante para conta autenticada
- Implementação completa dos direitos do titular (LGPD)
- Integração com WhatsApp e sistemas de CRM

---

## Autora

**Ana Paula Lenckulh** — [lenckulh.ola@gmail.com](mailto:lenckulh.ola@gmail.com)  
Centro Universitário Católica de Santa Catarina, Jaraguá do Sul, SC, Brasil.

---

## Referências

1. LINDEN, G.; SMITH, B.; YORK, J. Amazon.com Recommendations: Item-to-Item Collaborative Filtering. *IEEE Internet Computing*, v. 7, n. 1, 2003.
2. YING, R. et al. Graph Convolutional Neural Networks for Web-Scale Recommender Systems. *ACM SIGKDD*, 2018.
3. GOMEZ-URIBE, C. A.; HUNT, N. The Netflix Recommender System. *ACM TMIS*, v. 6, n. 4, 2015.
4. KOREN, Y.; BELL, R.; VOLINSKY, C. Matrix Factorization Techniques for Recommender Systems. *IEEE Computer*, v. 42, n. 8, 2009.

---

*Apresentação do PAC VIII — 2026/1 | SBC Computing Reviews*