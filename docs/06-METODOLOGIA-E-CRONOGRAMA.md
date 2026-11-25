# Metodologia e Cronograma

Metodologia de desenvolvimento, cronograma de execução e critérios de sucesso para o TCC.

## 1. Metodologia

**Abordagem:** desenvolvimento iterativo e incremental em sprints quinzenais, inspirado em práticas ágeis (Kanban pessoal).

**Ferramentas:**
- Versionamento: Git + GitHub, com branches por funcionalidade e pull requests.
- CI: GitHub Actions (`backend`, `frontend` e `sonar`) em push e pull request para a `main`.
- Qualidade: SonarCloud e cobertura mínima de 75% no backend e 25% no frontend.
- Documentação técnica: Markdown no próprio repositório (`docs/`), publicada na Wiki do GitHub.

**Práticas:**
- Cada sprint entrega incremento visível e demonstrável.
- Commits pequenos e descritivos.
- Revisão de código feita pela própria aluna (self-review) antes de merge.
- Execução local durante o desenvolvimento (Docker Compose, backend e frontend).

## 2. Fases do projeto

| Fase | Objetivo |
|---|---|
| 1. Especificação | Documentação, requisitos, modelagem |
| 2. Setup | Scaffolding do frontend Next.js, backend Spring Boot, Postgres, broker de mensageria |
| 3. MVP consumidor | Páginas públicas: home, catálogo, produto, login, cadastro, favoritos |
| 4. Coleta e scoring | Captura de eventos, pipeline de mensageria, Camadas 1 e 2 do scoring |
| 5. MVP admin | Dashboard, lista de usuários, detalhe com score, CRUD de produtos |
| 6. LGPD | Banner de cookies, exportação, exclusão, revogação de consentimentos |
| 7. Testes e polimento | Testes dos fluxos críticos, ajustes de UX, revisão de documentação |
| 8. Redação e defesa | Monografia, apresentação, defesa |

## 3. Sequência de entregas

| Sprint | Entregáveis |
|---|---|
| 1 | Documentação completa; setup dos repositórios; stack local funcionando |
| 2 | Scaffolding Next.js + antd; páginas estáticas: login, cadastro |
| 3 | API de auth; cadastro PF/PJ funcional; LGPD cadastro |
| 4 | Catálogo (listagem) e página de produto |
| 5 | Favoritos; produção/consumo de eventos (RabbitMQ) |
| 6 | Camadas 1 e 2 do scoring; cálculo em workers |
| 7 | Área admin: login, dashboard, lista e detalhe de usuário |
| 8 | Área admin: CRUD de produtos; registro manual de compras |
| 9 | Banner de cookies, exportação, exclusão (LGPD) |
| 10 | Testes dos fluxos críticos; ajustes de UX |
| 11 | Redação final da monografia; preparação da defesa |

## 4. Critérios de sucesso

### 4.1 Técnicos (produto)

- Fluxo completo do consumidor funcionando end-to-end (cadastro → navegação → favoritar → contato WhatsApp).
- Fluxo completo do admin funcionando (login → dashboard → ver lead → detalhe → contato).
- Coleta de eventos via mensageria assíncrona em funcionamento.
- Camadas 1 (Popularidade Global) e 2 (Regras Ponderadas com Decay) do scoring implementadas e funcionais.
- Conformidade mínima com LGPD (banner, consentimentos registrados, exportação, exclusão).
- Interface respeitando a filosofia visual descrita em [03-PAGINAS-E-UX.md §1](03-PAGINAS-E-UX.md).

### 4.2 Acadêmicos (TCC)

- Monografia escrita cobrindo: motivação, fundamentação teórica, metodologia, implementação, resultados, discussão.
- Apresentação preparada e ensaiada.
- Defesa aprovada pela banca.
- Documentação técnica (este diretório) referenciada e consistente com a implementação final.

### 4.3 Fora de escopo do TCC (trabalhos futuros)

Ver [04-ESPECIFICACAO-TECNICA.md §13](04-ESPECIFICACAO-TECNICA.md). Resumo: Camadas 3 (Grafo/PPR) e 4 (Collaborative Filtering), heatmap, A/B testing de pesos, integração com CRM externo, modelo ML em produção substituindo regras.

> A prévia de precisão da tela de configuração (backtest offline sobre o histórico, somente leitura) **não** é o A/B testing de pesos: não divide usuários reais entre configurações. Ver [13 — M5](13-MUDANCAS-DE-ESCOPO.md). Ela usa um único corte temporal; validação com vários cortes (walk-forward) ou com um período reservado à avaliação final é trabalho futuro.
