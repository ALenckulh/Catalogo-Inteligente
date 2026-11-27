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
| M18 | Compra e retorno fora do divisor; retorno começa em 0 | Regra | [04 §3 e §9](04-ESPECIFICACAO-TECNICA.md), RF16 |
| M19 | Associar o histórico recalcula as notas | Regra | [04 §7.3](04-ESPECIFICACAO-TECNICA.md), RF19 |
| M20 | Sem fingerprint e sem IP | Remoção | [04 §7.2](04-ESPECIFICACAO-TECNICA.md), RF18 |
| M21 | Nova calibração padrão dos pesos e da meia-vida | Regra | [04 §3.1 e §5](04-ESPECIFICACAO-TECNICA.md), RF25 |
| M22 | Opções de privacidade ligadas por legítimo interesse, ocultação no admin e cópia por e-mail | Regra | [04 §10](04-ESPECIFICACAO-TECNICA.md), RF04, RF21, RF22, RF29 |
| M23 | Banner de cookies só com "Aceitar"; Política no formato do modal, também na conta | Interface | [03 §4.0 e S4](03-PAGINAS-E-UX.md), RF27, RF28 |

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

### M18 — Compra e retorno fora do divisor

- **Especificação:** o dono do catálogo define o peso do histórico de compras, e voltar ao produto pontua.
- **Situação anterior:** a compra usava o peso do WhatsApp, e o retorno não pontuava.
- **Decisão:** os dois têm peso próprio, **fora do divisor** da nota. A compra começa com o peso do WhatsApp e o retorno em 0.
- **Justificativa:** dentro do divisor, mudar um desses pesos baixaria as notas de todos os produtos. Os valores iniciais não mudam nenhuma nota; quem quiser liga o retorno na Configuração. A sequência de navegação segue como trabalho futuro.
- **Rastreabilidade:** RF16, RF25; [08 §4.15](08-MODELO-DE-DADOS.md).

### M19 — Associar o histórico recalcula as notas

- **Especificação:** em conflito, média ponderada entre a nota da conta e a do visitante.
- **Situação anterior:** ficava a maior das duas, até o próximo evento recalcular.
- **Decisão:** os eventos passam para a conta e as notas são recalculadas na hora, com o histórico inteiro.
- **Justificativa:** uma média de duas notas prontas valeria só até o próximo evento. O recálculo já dá a nota definitiva, e o decaimento dá mais peso ao que é recente.
- **Rastreabilidade:** RF19; [08 §5.3](08-MODELO-DE-DADOS.md).

### M20 — Sem fingerprint e sem IP

- **Especificação:** fingerprint como reserva do cookie e IP no registro de consentimento.
- **Situação anterior:** as colunas `visitante.fingerprint` e `consentimento_lgpd.ip_origem` existiam sem uso.
- **Decisão:** as duas foram removidas (V022).
- **Justificativa:** coletar menos dados pessoais. O identificador do navegador e o login bastam, e o consentimento tem data, versão e conta.
- **Rastreabilidade:** RF18, RNF09; [08 §4.2 e §4.3](08-MODELO-DE-DADOS.md).

### M21 — Nova calibração padrão

- **Especificação:** pesos por faixa (Baixo 0,2 a Alto 1,0) e λ = 0,01.
- **Situação anterior:** os clientes da demonstração caíam no nível pretendido, mas só navegar já levava a Quente. Ler o mesmo produto 3 vezes dava 89, e 8 dos 14 clientes Mornos e Frios virariam Quentes com uma leitura a mais.
- **Decisão:** novos valores iniciais (V023). WhatsApp 1,5; favoritar 1,2; pesquisar 0,4; tempo 0,2; ver 0,1; meia-vida de 90 dias (λ = 0,0077). Os demais não mudam. Quem já tinha ajustado algum valor mantém os seus.
- **Resultado:** os níveis da demonstração são os mesmos (6 Quentes, 8 Mornos, 6 Frios). Só 1 dos 14 viraria Quente com uma leitura a mais; ler 3 vezes dá 45 e olhar 5 vezes, 38; ler, favoritar e chamar no WhatsApp dá 86. A menor folga até os limites (40 e 70) passou de 2,2 para 3,7 pontos, e os níveis se mantêm por 7 dias depois da carga.
- **Justificativa:** navegar mostra curiosidade; favoritar e chamar mostram intenção. A compra não subiu porque não esfria: com peso alto, um cliente antigo ficaria Quente para sempre.
- **Limites:** a amostra é pequena (5 conversões no teste de precisão; a calibração nova encontra 4 antes de acontecerem, a anterior 5, as duas sem falso positivo), e o nível pretendido de cada cliente foi definido com os pesos anteriores. Os bônus ficam em 0% por falta de dado. Ler o mesmo produto 5 vezes na semana ainda dá Quente (75).
- **Rastreabilidade:** RF25; `CalibracaoPadraoTest`.

### M22 — Privacidade: legítimo interesse, ocultação e cópia por e-mail

- **Especificação:** consentimentos opcionais fora do aceite; contato proativo inicia desligado; exportação em JSON ou CSV na tela Conta.
- **Situação anterior:** o admin via contato e nota de quem desligava as opções, e o catálogo continuava personalizado. Visitante não tinha como desfazer o "Aceitar todos".
- **Decisão:** conta nova começa com as duas opções ligadas, por legítimo interesse e com aviso antes do aceite; cada opção desligada oculta o seu dado do admin, na consulta; a cópia dos dados é pedida por e-mail e gerada pela API do admin; visitante muda a escolha de cookies na Política. Contas existentes não mudam.
- **Justificativa:** a loja precisa do sinal de interesse para atender, e quem cria conta espera o contato; a saída é simples e tem efeito real.
- **Limites:** para cookies, legítimo interesse é mais frágil que consentimento ([04 §10.1](04-ESPECIFICACAO-TECNICA.md)). Faltam na Política o CNPJ e, se houver, o nome do encarregado. Rever com advogado antes de uso comercial.
- **Rastreabilidade:** RF04, RF21, RF22, RF28, RF29, RNF08; `AdminUsuarioServiceCompraTest`, `AdminAnalyticsRepositoryTest`, `CatalogServiceTest`.

### M23 — Banner de cookies só com "Aceitar"

- **Especificação:** banner com Aceitar todos, Apenas essenciais e Personalizar (modal).
- **Situação anterior:** três botões e um modal repetiam o switch que já existe na Política e na conta.
- **Decisão:** o banner tem só **Aceitar cookies e continuar** e o link Privacidade. Recusar ou mudar a escolha é no switch da seção 4 da Política (visitante) ou na aba Privacidade da conta. A Política passa a usar o formato do modal do cadastro e aparece também no fim dessa aba.
- **Justificativa:** um único lugar para a escolha, e o banner fica mais leve.
- **Limites:** a ANPD orienta que recusar seja tão fácil quanto aceitar; sem um botão de recusa no banner, a recusa fica a um clique a mais. Rever com advogado antes de uso comercial.
- **Rastreabilidade:** RF27, RF28; `CookieBanner.test.tsx`, `app/(public)/privacidade/page.test.tsx`.

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
- **Decisão:** o ajuste é pela **meia-vida em dias** (λ = ln 2 ÷ dias). O λ continua visível, em segundo plano: na dica do valor.
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
