# Documentação — Catálogo Online Inteligente

Documentação do TCC em Engenharia de Software: plataforma de catálogo B2B com sistema de scoring de intenção de compra e geração de leads qualificados para o dono do catálogo.

## Índice

| # | Documento | Conteúdo |
|---|---|---|
| 01 | [Visão Geral](01-VISAO-GERAL.md) | Resumo do projeto, objetivos acadêmicos, stack, público-alvo |
| 02 | [Requisitos](02-REQUISITOS.md) | Requisitos funcionais (RF) e não-funcionais (RNF) enumerados |
| 03 | [Páginas e UX](03-PAGINAS-E-UX.md) | Filosofia, sitemap, spec detalhada por tela, fluxos, matriz RF × tela |
| 04 | [Especificação Técnica](04-ESPECIFICACAO-TECNICA.md) | Scoring, decay, LGPD, edge cases, trabalhos futuros |
| 05 | [Arquitetura](05-ARQUITETURA.md) | Diagramas C4 (contexto, contêineres e componentes), sequência do evento e mensageria |
| 06 | [Metodologia e Cronograma](06-METODOLOGIA-E-CRONOGRAMA.md) | Metodologia de desenvolvimento, sequência de entregas, critérios de sucesso |
| 07 | [Referências](07-REFERENCIAS.md) | Bibliografia |
| 08 | [Modelo de Dados](08-MODELO-DE-DADOS.md) | Tabelas, colunas, tipos, relações e enums do PostgreSQL |
| 09 | [Normas de Usabilidade](09-NORMAS-DE-USABILIDADE.md) | Regras de UI/UX + checklist de code review |
| 10 | [Arquitetura — Frontend](10-ARQUITETURA-FRONTEND.md) | Estrutura de pastas, convenções, ADRs do frontend |
| 11 | [API — Endpoints](11-API-ENDPOINTS.md) | Catálogo REST: método, path, auth, telas, RF, entidades |
| 12 | [Arquitetura — Backend](12-ARQUITETURA-BACKEND.md) | Estrutura de pacotes, convenções, segurança, mensageria, scoring, ADRs |
| 13 | [Mudanças de escopo](13-MUDANCAS-DE-ESCOPO.md) | Mudanças feitas após a spec original, com justificativa e rastreabilidade |
| 14 | [Casos de uso](14-CASOS-DE-USO.md) | Atores, fluxos de negócio e casos de uso, com rastreabilidade |
| — | [Portfólio](PORTFOLIO.md) | Linha de projeto, posicionamento e CI |
| — | Padrões do frontend | [Hooks](padroes/HOOKS.md) · [Contexts](padroes/CONTEXTS.md) · [Services](padroes/SERVICES.md) · [Páginas](padroes/PAGES.md) · [Formatters](padroes/FORMATTERS.md) |

## Ordem de leitura sugerida

1. **Visão geral** — para entender o problema e o diferencial do projeto.
2. **Requisitos**, **Casos de uso** e **Páginas e UX** — para entender o escopo entregável.
3. **Especificação Técnica** — para entender como o scoring funciona.
4. **Arquitetura** — para entender como as peças se conectam.
5. **Metodologia e Cronograma** — para entender o plano de execução acadêmica.

Estes documentos também são publicados na [Wiki do GitHub](https://github.com/ALenckulh/Catalogo-Inteligente/wiki). A fonte é este diretório: edite aqui e rode `python scripts/publicar_wiki.py`.
