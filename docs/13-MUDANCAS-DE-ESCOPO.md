# 13 — Mudanças de escopo e justificativas

Registro das mudanças de escopo feitas depois da especificação original. Como este é um projeto de TCC e o escopo já foi enxugado, **nenhuma mudança entra sem justificativa** e nenhuma feature é removida sem motivo registrado aqui.

Cada item traz:
- **Contexto:** o que existia;
- **Decisão:** o que mudou;
- **Justificativa:** por que mudou;
- **Rastreabilidade:** requisitos e seções afetados;
- **Código:** onde está implementado.

---

## A9 — Configuração de scoring (novembro de 2026)

**Motivação geral:** a tela original ([03 §A9](03-PAGINAS-E-UX.md)) era uma tabela de números crus (`VISUALIZACAO_PRODUTO 0.2`, `λ 0.01`, `boost 1.00`). Só quem conhecia o motor entendia o efeito de uma mudança. O objetivo foi que o **dono do catálogo**, público do RF25, conseguisse ajustar os parâmetros com segurança, vendo o efeito antes de salvar. Isso atende ao RF25 e ao RNF13 sem ampliar o problema que o TCC resolve.

### Resumo

| # | Mudança | Tipo |
|---|---|---|
| M1 | Pesquisa conta na nota do produto quando o cliente abre um resultado | Correção de regra (a métrica não tinha efeito) |
| M2 | Filtro por categoria conta na nota da categoria | Correção de regra (a métrica não tinha efeito) |
| M3 | O divisor da nota de produto deixa de incluir o filtro, que é métrica de categoria | Correção de regra |
| M4 | Cálculo extraído para uma função pura compartilhada (`ScoreCalculator`) | Refatoração |
| M5 | Prévia com dados reais e medição de precisão (`POST /simular`) | Adição |
| M6 | Recálculo de todas as notas ao salvar (`POST /recalcular`) | Adição |
| M7 | Salvar único na tela (antes, um por aba) | Mudança de interface |
| M8 | Restaurar padrão cobre pesos, meia-vida e bônus (antes, só pesos) | Mudança de interface |
| M9 | Meia-vida em dias como controle principal, λ exibido discretamente | Mudança de interface |
| M10 | Lista de pesos em ordem fixa (antes, tabela ordenável) | Mudança de interface |
| M11 | Valores padrão do frontend iguais aos da seed | Correção |
| M12 | λ com 5 casas decimais | Correção |
| M13 | Criar e remover ajuste por categoria na tela (`DELETE …/decay/{categoriaId}`) | Correção de lacuna (RF25) |
| M14 | Backtest avalia só quem tinha histórico no corte; aviso de sobreajuste | Correção de método |
| M15 | Tela em abas, prévia que acompanha a aba e categoria favorita na prévia | Mudança de interface + adição |

---

### M1 — Pesquisa conta no produto quando o cliente abre um resultado

- **Contexto:** a spec ([04 §3](04-ESPECIFICACAO-TECNICA.md)) lista "Pesquisas do usuário — termos buscados indicam interesse por categoria/produto" com peso **Médio**, e o peso é configurável. Mas o evento `PESQUISA` era enviado só com o termo, sem produto, e a nota de produto só soma eventos que têm produto. **O peso existia, mas nunca tinha efeito.**
- **Decisão:** quando há termo de busca e o cliente **clica num produto do resultado**, o frontend envia um `PESQUISA` com `produtoId` e `metadados.origem = "resultado_pesquisa"`. Esse evento soma na nota do produto com o peso de "Pesquisar e abrir". A pesquisa sem clique continua sendo registrada, como antes, e não soma.
- **Justificativa:** "pesquisou e abriu um item" é um sinal forte e específico de interesse naquele produto, como a spec descreve. A API e o banco já aceitavam `produtoId` em qualquer evento ([11 `POST /api/eventos`](11-API-ENDPOINTS.md)), então não foi preciso migration nem um tipo de evento novo.
- **Alternativa rejeitada:** um tipo novo `CLIQUE_RESULTADO_PESQUISA`. Exigiria migration do enum `tipo_evento`, uma linha a mais em `peso_metrica` e mais um controle na tela, sem ganho para o TCC.
- **Limitação:** eventos antigos não têm esse vínculo, então só as pesquisas feitas a partir da mudança contam.
- **Rastreabilidade:** RF14–RF18 (coleta), RF25 (peso configurável), 04 §3.
- **Código:** `frontend/app/(public)/produtos/ProdutosCatalogo.tsx` (`onClickCapture` do resultado); o motor já soma qualquer evento com produto (`ScoreCalculator`).

### M2 — Filtro por categoria conta na nota da categoria

- **Contexto:** a spec lista "Filtros aplicados — refinamento de busca indica preferência específica" com peso **Médio**. O `FILTRO_APLICADO` levava a categoria só dentro de `metadados.filtros.categoria_id`, e o motor não o usava. **O peso não tinha efeito.**
- **Decisão:** o frontend passa a enviar `categoriaId` no evento quando o filtro é por categoria. O motor soma, na **nota da categoria**, `peso(Filtro) × decaimento ÷ Score_máximo × 100` pontos por filtro, na mesma escala da nota de produto e com o λ da categoria. Uma categoria só filtrada, sem produto visto, também passa a ter nota.
- **Justificativa:** filtrar por uma categoria indica interesse nela. Somar na categoria, e não em produtos, respeita o que o cliente de fato demonstrou. O efeito aparece em "Categoria favorita dos clientes", na coluna "Top categoria" e na ordem das categorias. O nível de interesse do cliente não muda, porque vem da nota de produto.
- **Alternativa rejeitada (por ora):** casar o termo pesquisado com o nome da categoria. Fica como trabalho futuro, porque depende de normalização de texto e sinônimos.
- **Limitação:** só os filtros feitos a partir da mudança contam.
- **Rastreabilidade:** RF25, 04 §3 e §4.
- **Código:** `ScoreCalculator.pontosDeFiltro` e `calcularCategorias`; `frontend/lib/api/eventos.ts` (`categoriaId`); `ProdutosCatalogo.tsx`.

### M3 — Divisor da nota de produto sem o filtro

- **Contexto:** a nota é `Σ(peso × valor × decaimento) ÷ Score_máximo × 100`, e a spec ([04 §4](04-ESPECIFICACAO-TECNICA.md)) define o `Score_máximo` como "o valor teórico obtido se todas as métricas atingissem seu valor máximo", ou seja, o máximo que **um produto** pode somar. A implementação somava no divisor os pesos de **todas** as métricas, inclusive as que nunca somam em produto.
- **Decisão:** o divisor soma só os pesos positivos das **métricas de produto**. O filtro, que é métrica de categoria (M2), fica fora; a pesquisa, que passou a ser de produto (M1), fica dentro.
- **Justificativa:** com os pesos atuais da seed, antes de M1 e M2:

  | | Antes (pesquisa e filtro no divisor, sem efeito) | Depois |
  |---|---|---|
  | Divisor | 0,2 + 0,5 + 0,1 + 1,0 + **0,5 + 0,5** + 0,3 + 0,5 = 3,6 | sem o filtro: 3,1 |
  | Cliente que fez **uma vez cada ação de produto** (ver, favoritar, WhatsApp, rolar, 2 min) | 2,5 ÷ 3,6 = **69 → Morno**, mesmo tendo feito tudo | com a pesquisa também: 3,0 ÷ 3,1 = **97 → Quente** |
  | Admin sobe o peso do filtro de 0,5 para 3 | divisor sobe e **todas as notas de produto caem cerca de 40%**, sem nenhum filtro contar para ninguém | nenhuma nota de produto muda; só a nota da categoria filtrada sobe |

  Ou seja, uma métrica no divisor que não soma em produto só **reduzia todas as notas** e tornava o máximo inalcançável. A correção faz a implementação seguir a definição da spec.
- **Rastreabilidade:** 04 §4.
- **Código:** `ScoringParams.TIPOS_DE_CATEGORIA` e `ScoringParams.scoreMax()`; `frontend/lib/scoring.ts` (`scoreMax`).

### M4 — Cálculo extraído para `ScoreCalculator`

- **Contexto:** o cálculo vivia dentro de `ScoreEngine.recalc`, misturado com a gravação no banco.
- **Decisão:** o cálculo virou uma função pura, `ScoreCalculator.calcular(eventos, compras, parâmetros, agora)`. O `ScoreEngine` passa a carregar os dados, chamar o `ScoreCalculator` e gravar.
- **Justificativa:** a prévia (M5) precisa usar **exatamente a mesma conta** que o motor; uma cópia da lógica divergiria com o tempo. O comportamento não mudou: o `ScoreEngineTest` continua passando, e o `ScoreCalculatorTest` cobre a fórmula.
- **Código:** `backend/.../scoring/engine/ScoreCalculator.java`, `ScoringParams.java`.

### M5 — Prévia com dados reais e precisão (`POST /api/admin/configuracao/simular`)

- **Contexto:** não havia como saber o efeito de um ajuste antes de salvar.
- **Decisão:** um endpoint **somente leitura** que recalcula as notas com os parâmetros salvos e com os propostos. Devolve:
  - o **impacto:** distribuição por nível, nota média e os clientes que mais mudam;
  - a **precisão:** um backtest. As notas são calculadas com o histórico até um corte (percentil 70 dos horários dos eventos), e o acerto é medido por quem converteu depois. São quatro métricas: acerto dos Quentes, interessados encontrados, qualidade da ordenação (AUC) e acerto da recomendação (top 3). Vem com um indicador de confiança pela quantidade de conversões.
- **Justificativa:** foi pedida explicitamente para tornar o RF25 utilizável por quem não é desenvolvedor. **Não é o "A/B testing de pesos"** listado como trabalho futuro ([06 §4.3](06-METODOLOGIA-E-CRONOGRAMA.md)): não divide usuários reais entre configurações nem expõe ninguém a pesos diferentes. É uma avaliação offline sobre o histórico, que não altera nada.
- **Rastreabilidade:** RF25, RNF13.
- **Código:** `AdminScoringService.simular`; `frontend/app/admin/configuracao/_components/Previa*.tsx`.

### M6 — Recálculo ao salvar (`POST /api/admin/configuracao/recalcular`)

- **Contexto:** salvar os parâmetros não recalculava nada. A nota de cada cliente só mudava na próxima ação dele, então o dashboard parecia "não mudar".
- **Decisão:** o modal de confirmação traz a opção "Recalcular agora as notas de todos os clientes e visitantes", marcada por padrão, que chama o novo endpoint.
- **Justificativa:** sem isso o RNF13 ("configuráveis sem redeploy") era cumprido só pela metade, porque o efeito demorava indefinidamente. O processamento é síncrono, adequado ao volume do TCC.
- **Alternativa adiada:** recálculo por fila (RabbitMQ). O ponto de troca está comentado em `AdminScoringService.recalcularTodos`.
- **Rastreabilidade:** RNF13.

### M7 — Salvar único (antes, "Salvar independente por aba")

- **Decisão:** um botão Salvar grava os pesos e o decaimento. O PATCH de cada grupo só é enviado se ele mudou.
- **Justificativa:** a prévia mostra o efeito **combinado** dos ajustes, então salvar só parte deixaria o resultado gravado diferente do que foi visto. Mantido por decisão da autora.

### M8 — Restaurar padrão cobre pesos, meia-vida e bônus

- **Decisão:** "Restaurar padrão" volta pesos, meia-vida e bônus globais aos valores da seed. Os ajustes por categoria são preservados e nada é gravado antes de Salvar.
- **Justificativa:** dá um ponto de partida único e conhecido para toda a configuração. Mantido por decisão da autora.

### M9 — Meia-vida como controle principal, λ discreto

- **Decisão:** o decaimento é ajustado por **meia-vida em dias** ("uma ação perde metade do valor em 69 dias"), com λ = ln 2 ÷ dias, e um gráfico de quanto uma ação vale com o tempo. O λ continua visível em texto pequeno no canto.
- **Justificativa:** λ é abstrato para o dono do catálogo; a meia-vida é a mesma informação em linguagem de negócio. O termo da spec (RF25) segue visível, sem chamar atenção.

### M10 — Lista de pesos em ordem fixa

- **Decisão:** a tabela ordenável virou uma lista com controles deslizantes, do sinal mais forte (WhatsApp) para o mais fraco.
- **Justificativa:** com controles de ajuste, a ordem fixa por força do sinal é mais útil que reordenar colunas. Nenhum dado deixou de ser exibido.

### M11 — Valores padrão iguais aos da seed

- **Contexto:** o "Reset defaults" do frontend usava valores próprios, incluindo `DESFAVORITAR = −1`. O motor já trata esse evento como valor −1, então o peso negativo fazia **remover dos favoritos somar pontos**.
- **Decisão:** os padrões passam a ser os de `database/migrations/V010__seed_config.sql`, a fonte da verdade.

### M12 — λ com 5 casas decimais

- **Contexto:** com λ arredondado em 4 casas, 52 das meias-vidas entre 7 e 180 dias não voltavam ao mesmo número de dias (ex.: 150 dias → λ 0,0046 → 151 dias), e o controle deslizante "brigava" com o valor.
- **Decisão:** 5 casas, a precisão da coluna `parametro_decay.lambda` (`NUMERIC(6,5)`). Com isso, todas as meias-vidas de 7 a 180 dias fazem o caminho de ida e volta sem erro.

### M13 — Criar e remover ajuste por categoria

- **Contexto:** o RF25 pede λ e boost configuráveis **por categoria** ([02](02-REQUISITOS.md)). O [04 §4.3](04-ESPECIFICACAO-TECNICA.md) orienta reduzir o boost de categorias de bens duráveis, e a tabela `parametro_decay` ([08 §4.16](08-MODELO-DE-DADOS.md)) tem uma linha por categoria mais a global. O motor e o `PATCH /decay` já tratavam categorias, mas a seed cria só a linha global e a tela (a antiga e a nova) só editava ajustes que já existiam. **Na prática, não havia como criar um ajuste por categoria.**
- **Decisão:**
  - em "Ajustes por categoria (avançado)", um seletor "Adicionar ajuste para uma categoria" cria a linha com os valores gerais atuais;
  - cada linha tem um botão para remover o ajuste;
  - nada é gravado antes de Salvar, e a prévia já simula a mudança;
  - a criação usa o `PATCH /decay` existente (upsert). A remoção usa o novo `DELETE /api/admin/configuracao/decay/{categoriaId}`, que não tem rota para a linha global.
- **Justificativa:** sem isso, a parte "por categoria" do RF25 não podia ser exercida pelo dono do catálogo. O endpoint de remoção só completa o CRUD de uma tabela já modelada; não há coluna nem tabela nova.
- **Rastreabilidade:** RF25, RNF13; 04 §4.3; 08 §4.16; [11](11-API-ENDPOINTS.md).
- **Código:** `AdminConfigService.removerDecay`, `AdminConfigController.removerDecay`; `OverridesCategoria` em `frontend/app/admin/configuracao/_components/DecaimentoSecoes.tsx`.

### M14 — Rigor do backtest de precisão

- **Contexto:** a dúvida era se deveríamos "treinar com dados de teste e depois usar os dados reais" para evitar resultados enganosos.
- **Análise:**
  - **Não há treino.** O modelo é de regras: os pesos são escolhidos por uma pessoa, não ajustados a partir dos dados.
  - **Dados sintéticos não servem para medir acerto.** Eles refletem as suposições de quem os gerou, então só confirmariam os próprios pesos. A validação precisa ser feita no comportamento real.
  - **O backtest já separa treino e teste no tempo.** As notas usam só os eventos antes do corte (percentil 70 dos horários), e o rótulo é a conversão depois do corte. Nenhuma informação do período de teste entra nas notas.
  - **Risco real:** se o dono ajusta os parâmetros até as métricas melhorarem, os valores ficam sob medida para aquela janela (sobreajuste) e o acerto pode não se repetir.
- **Decisão:**
  - **Correção:** antes, quem só tinha eventos depois do corte entrava na avaliação com nota 0. Nenhum parâmetro consegue prever esse caso (cliente novo, sem histórico), e ele derrubava "interessados encontrados" e a AUC sem dizer nada sobre os parâmetros. Agora o backtest avalia só quem tinha pelo menos um evento antes do corte.
  - **Aviso na aba Precisão:** o teste usa o mesmo histórico que está sendo ajustado, e ajustes finos só para melhorar os números podem não se repetir com clientes novos.
- **Limitação e trabalho futuro:** com poucos dados, um único corte é sensível à janela escolhida. Validação com vários cortes (walk-forward) ou com um período reservado só para a avaliação final ficam como trabalho futuro, junto ao A/B testing ([06 §4.3](06-METODOLOGIA-E-CRONOGRAMA.md)).
- **Rastreabilidade:** RF25; 06 §4.3.
- **Código:** `AdminScoringService.calcularPrecisao`; `AdminScoringServiceTest.quemSoApareceDepoisDoCorteFicaForaDaAvaliacao`; `PreviaPrecisao.tsx`.

### M15 — Tela em abas e prévia que acompanha a aba

- **Contexto:** todos os controles ficavam empilhados numa coluna (pesos, meia-vida com gráfico, bônus, ajustes por categoria), ao lado da prévia. A tela ficou poluída. Além disso, três controles (peso do filtro, bônus global e bônus por categoria) não tinham nenhum retorno visual: eles só mudam a nota da categoria, e a prévia mostrava apenas nível e precisão, que dependem da nota de produto.
- **Decisão:**
  - **Abas:** Ações do cliente · Duração do interesse · Categorias. Cada aba traz seus controles e o visual que só ela altera: a barra de composição dos pesos e a curva da meia-vida. Um ponto no rótulo marca a aba com alteração não salva.
  - **Prévia fixa** à direita, porque é afetada por quase todos os campos. Fica visível só o que importa para a aba aberta: nível e precisão nas abas Ações e Duração, e categoria favorita na aba Categorias. Uma linha-resumo sempre visível lembra o efeito de ajustes feitos em outras abas. O resto fica em segundo plano: listas de clientes recolhidas e explicações nos tooltips.
  - **Categoria favorita na simulação:** o `POST /simular` passa a devolver, por cliente, a categoria de maior nota nos dois cenários, a contagem por categoria e quem muda.
  - **O campo numérico de peso sai:** ele duplicava o slider. O peso aparece no tooltip do slider, que aceita as setas do teclado (passo 0,05). O valor e a forma de ajustá-lo continuam; só sai o segundo controle.
- **Justificativa:** reduzir a carga visual para o dono do catálogo, público do RF25 (RNF13 e normas de usabilidade, [09](09-NORMAS-DE-USABILIDADE.md)), e dar retorno a todos os parâmetros configuráveis. A categoria favorita já é exibida no dashboard ("Categoria favorita dos clientes") e na coluna Top categoria; a prévia só mostra o efeito antes de salvar. Não há tabela, endpoint ou parâmetro novo.
- **Rastreabilidade:** RF25, RNF13; [03 §A9](03-PAGINAS-E-UX.md); [11](11-API-ENDPOINTS.md).
- **Código:** `frontend/app/admin/configuracao/page.tsx`, `_components/Previa.tsx`, `PreviaCategorias.tsx`; `AdminScoringService.calcularImpacto` (`favorita`, `topCategorias`); `AdminScoringServiceTest.bonusMudaCategoriaFavoritaSemMudarNivel`.
