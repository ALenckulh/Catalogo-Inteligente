# 13 — Mudanças de escopo e justificativas

Registro do que mudou em relação à especificação original (docs 01 a 12). Entra aqui só o que **altera algo especificado** ou **acrescenta uma funcionalidade**. Refatoração, correção de bug e detalhe de tela ficam no código e nos docs de cada assunto.

A numeração tem lacunas (M4, M10 a M12, M14 e M15 saíram por esse critério) para manter válidas as citações no código e nos outros docs.

## Resumo

| # | Mudança | Tipo | Especificação afetada |
|---|---|---|---|
| M1 | Pesquisa conta na nota do produto quando o cliente abre um resultado | Regra | [04 §3](04-ESPECIFICACAO-TECNICA.md) |
| M2 | Filtro por categoria conta na nota da categoria | Regra | [04 §3 e §4](04-ESPECIFICACAO-TECNICA.md) |
| M3 | O divisor da nota de produto deixa de incluir o filtro | Regra | [04 §4](04-ESPECIFICACAO-TECNICA.md) |
| M5 | Prévia com dados reais e medição de precisão | Adição | RF25, RNF13 |
| M6 | Recálculo de todas as notas ao salvar | Adição | RNF13 |
| M7 | Salvar único na configuração | Interface | [03 §A9](03-PAGINAS-E-UX.md) |
| M8 | Restaurar padrão cobre pesos, meia-vida e bônus | Interface | [03 §A9](03-PAGINAS-E-UX.md) |
| M9 | Meia-vida em dias como controle principal | Interface | RF25 |
| M13 | Criar e remover ajuste por categoria | Lacuna | RF25 |
| M16 | Upload de imagens guardadas no Postgres | Adição | RF23, [11](11-API-ENDPOINTS.md) |
| M17 | Serviços de retífica no catálogo | Adição | [01](01-VISAO-GERAL.md), RF23 |

---

## Regras do score

### M1 — Pesquisa conta no produto quando o cliente abre um resultado

- **Especificação:** pesquisa com peso **Médio**, indicando interesse por categoria ou produto.
- **Situação anterior:** o evento `PESQUISA` levava só o termo. Como a nota soma apenas eventos com produto, o peso configurável não tinha efeito.
- **Decisão:** ao abrir um produto do resultado, o frontend envia `PESQUISA` com `produtoId`, que soma na nota. A pesquisa sem clique continua registrada e não soma.
- **Justificativa:** pesquisar e abrir um item é um sinal forte e específico. A API e o banco já aceitavam `produtoId` em qualquer evento.
- **Limitação:** vale só para pesquisas feitas depois da mudança.
- **Rastreabilidade:** RF17, RF25.

### M2 — Filtro por categoria conta na nota da categoria

- **Especificação:** filtros com peso **Médio**, indicando preferência.
- **Situação anterior:** a categoria ia só nos metadados e o motor não a usava.
- **Decisão:** o evento `FILTRO_APLICADO` leva `categoriaId` e soma `peso × decaimento ÷ Score_máximo × 100` na nota da categoria. Uma categoria só filtrada também recebe nota.
- **Justificativa:** filtrar indica interesse na categoria, não em um produto específico.
- **Limitação:** vale só para filtros feitos depois da mudança.
- **Rastreabilidade:** RF17, RF25.

### M3 — Divisor da nota de produto sem o filtro

- **Especificação:** `Score_máximo` é o valor que **um produto** pode somar.
- **Situação anterior:** o divisor somava os pesos de todas as métricas, inclusive as que nunca somam em produto. Com os pesos padrão, um cliente que fez uma vez cada ação de produto ficava com 69 (Morno).
- **Decisão:** o divisor soma só os pesos positivos das métricas de produto. O filtro fica fora; a pesquisa, que passou a ser de produto (M1), fica dentro.
- **Justificativa:** segue a definição da especificação. Antes, aumentar o peso do filtro reduzia todas as notas de produto.
- **Rastreabilidade:** RF25.

## Configuração do score (A9)

A tela original era uma tabela de números (`λ 0.01`, `boost 1.00`) que só quem conhecia o motor entendia. O público do RF25 é o dono do catálogo.

### M5 — Prévia com dados reais e precisão

- **Situação anterior:** não havia como saber o efeito de um ajuste antes de salvar.
- **Decisão:** `POST /api/admin/configuracao/simular`, somente leitura, devolve o **impacto** (clientes que mudam de nível ou de categoria favorita) e a **precisão** por backtest: notas com o histórico até um corte, comparadas com quem entrou em contato ou comprou depois.
- **Justificativa:** torna o RF25 utilizável por quem não desenvolve. **Não é o A/B testing** listado como trabalho futuro ([06 §4.3](06-METODOLOGIA-E-CRONOGRAMA.md)): não divide usuários reais entre configurações.
- **Limitação:** usa um único corte temporal e avalia só quem tinha histórico antes dele. O mesmo histórico serve para ajustar e para medir, então ganhos pequenos podem não se repetir.
- **Rastreabilidade:** RF25, RNF13.

### M6 — Recálculo ao salvar

- **Situação anterior:** a nota de cada cliente só mudava na próxima ação dele, então o RNF13 ("configuráveis sem redeploy") era atendido pela metade.
- **Decisão:** o modal de confirmação oferece "Recalcular agora as notas de todos", que chama `POST /api/admin/configuracao/recalcular`.
- **Limitação:** síncrono, adequado ao volume do TCC.
- **Rastreabilidade:** RNF13.

### M7 — Salvar único

- **Especificação:** duas abas (Pesos; Decaimento), com "Salvar independente por aba".
- **Decisão:** um botão Salvar grava tudo. As abas passam a ser Ações do cliente, Duração do interesse e Categorias.
- **Justificativa:** a prévia (M5) mostra o efeito combinado. Salvar só parte gravaria algo diferente do que foi visto.
- **Rastreabilidade:** RF25.

### M8 — Restaurar padrão cobre tudo

- **Especificação:** "Reset defaults" só dos pesos.
- **Decisão:** volta pesos, meia-vida e bônus globais aos valores da seed. Os ajustes por categoria são preservados e nada é gravado antes de Salvar.
- **Justificativa:** um ponto de partida único e conhecido.
- **Rastreabilidade:** RF25.

### M9 — Meia-vida como controle principal

- **Especificação:** edição direta de λ.
- **Decisão:** o ajuste é pela **meia-vida em dias** (λ = ln 2 ÷ dias). O λ continua visível, em segundo plano.
- **Justificativa:** é a mesma informação em linguagem de negócio.
- **Rastreabilidade:** RF25.

### M13 — Criar e remover ajuste por categoria

- **Especificação:** λ e boost configuráveis **por categoria**.
- **Situação anterior:** a tela só editava ajustes existentes, e a seed cria apenas o global. Na prática, não havia como criar um ajuste por categoria.
- **Decisão:** a tela adiciona e remove ajustes. A criação usa o `PATCH /decay` existente; a remoção, o novo `DELETE /api/admin/configuracao/decay/{categoriaId}`.
- **Justificativa:** completa o RF25 sem tabela nem coluna nova.
- **Rastreabilidade:** RF25, RNF13; [08 §4.16](08-MODELO-DE-DADOS.md).

## Catálogo

### M16 — Upload de imagens guardadas no Postgres

- **Especificação:** "URLs externas apenas no MVP".
- **Situação anterior:** o dono do catálogo precisava hospedar as fotos em outro lugar.
- **Decisão:** o admin envia o arquivo, guardado como `BYTEA` em `imagem_arquivo`. URLs externas continuam aceitas.
- **Justificativa:** dispensa infraestrutura nova (bucket, credenciais), e arquivo e produto ficam no mesmo backup. O volume do TCC é pequeno para o Postgres, e o cache do navegador reduz a leitura.
- **Quando migrar para object storage:** quando as imagens passarem de alguns GB, pesarem no pool de conexões ou for preciso uma CDN.
- **Rastreabilidade:** RF23; [08 §4.6 e §4.19](08-MODELO-DE-DADOS.md); [11](11-API-ENDPOINTS.md).

### M17 — Serviços de retífica no catálogo

- **Especificação:** catálogo de produtos.
- **Situação anterior:** a seed trazia itens genéricos de indústria. A empresa da demonstração, a Renova Retífica, vende peças, mas o negócio principal é o serviço.
- **Decisão:** o catálogo ganha a categoria raiz **Serviços de retífica**, com preço "a partir de" e o mesmo fluxo de contato pelo WhatsApp.
- **Justificativa:** quem procura um serviço é um lead tão relevante quanto quem procura uma peça. Não há tabela, campo nem endpoint novo.
- **Rastreabilidade:** RF08–RF12, RF23; [03 §5–6](03-PAGINAS-E-UX.md).
