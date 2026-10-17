# Metodologia e Cronograma

Metodologia de desenvolvimento, cronograma de execução e critérios de sucesso para o TCC.

## 1. Metodologia

**Abordagem:** desenvolvimento iterativo e incremental em sprints quinzenais, inspirado em práticas ágeis (Kanban pessoal).

**Ferramentas:**
- Versionamento: Git + GitHub/GitLab.
- Quadro de tarefas: a definir (Trello, GitHub Projects, Notion…).
- Documentação técnica: Markdown no próprio repositório (`frontend/docs/`).
- Comunicação com orientador: a definir.

**Práticas:**
- Cada sprint entrega incremento visível e demonstrável.
- Commits pequenos e descritivos.
- Revisão de código feita pela própria aluna (self-review) antes de merge.
- Deploy local durante o desenvolvimento; publicação futura a avaliar.

## 2. Fases do projeto

| Fase | Objetivo |
|---|---|
| 1. Especificação | Documentação, requisitos, modelagem (concluída/em andamento) |
| 2. Setup | Scaffolding do frontend Next.js, backend Spring Boot, Postgres, broker de mensageria |
| 3. MVP consumidor | Páginas públicas: home, catálogo, produto, login, cadastro, favoritos |
| 4. Coleta e scoring | Captura de eventos, pipeline de mensageria, Camadas 1 e 2 do scoring |
| 5. MVP admin | Dashboard, lista de usuários, detalhe com score, CRUD de produtos |
| 6. LGPD | Banner de cookies, exportação, exclusão, revogação de consentimentos |
| 7. ML (prova de conceito) | Treinamento de modelo RNN em dados simulados; integração opcional |
| 8. Testes e polimento | Testes dos fluxos críticos, ajustes de UX, revisão de documentação |
| 9. Redação e defesa | Monografia, apresentação, defesa |

## 3. Cronograma (esqueleto — a preencher)

A tabela abaixo é um esqueleto. A aluna deve preencher as datas conforme o calendário acadêmico definido pela coordenação do curso e seu orientador.

| Sprint | Período | Entregáveis |
|---|---|---|
| 1 | _a definir_ | Documentação completa; setup dos repositórios; stack local funcionando |
| 2 | _a definir_ | Scaffolding Next.js + antd; páginas estáticas: login, cadastro |
| 3 | _a definir_ | API de auth; cadastro PF/PJ funcional; LGPD cadastro |
| 4 | _a definir_ | Catálogo (listagem) e página de produto |
| 5 | _a definir_ | Favoritos; produção/consumo de eventos (RabbitMQ ou Kafka) |
| 6 | _a definir_ | Camadas 1 e 2 do scoring; cálculo em workers |
| 7 | _a definir_ | Área admin: login, dashboard, lista e detalhe de usuário |
| 8 | _a definir_ | Área admin: CRUD de produtos; registro manual de compras |
| 9 | _a definir_ | Banner de cookies, exportação, exclusão (LGPD) |
| 10 | _a definir_ | PoC ML (modelo RNN com dados simulados) |
| 11 | _a definir_ | Testes dos fluxos críticos; ajustes de UX |
| 12 | _a definir_ | Redação final da monografia; preparação da defesa |

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
