
CATÁLOGO ONLINE INTELIGENTE
Sistema de Recomendação com Scoring de Usuário
Especificação Técnica do Projeto — TCC

SUMÁRIO
1.  Visão Geral do Projeto
2.  Tipos de Usuário
3.  Métricas de Coleta de Dados
4.  Sistema de Scoring
5.  Score Decay — Decaimento Temporal
6.  Fallback: Popularidade Global
7.  Migração de Histórico de Visitante
8.  Faixa de Preço — Interesse vs Conversão
9.  Histórico de Compras do Vendedor
10. LGPD, Cookies e Privacidade
11. Edge Cases e Decisões de Projeto
12. Funcionalidades por Tipo de Usuário
13. Trabalhos Futuros

1. Visão Geral do Projeto
Este projeto consiste em um catálogo online com sistema de recomendação inteligente voltado majoritariamente para transações B2B, com suporte a B2C. O objetivo central é atribuir scores a usuários de forma a identificar sua provável próxima compra e as categorias de produto de maior interesse, permitindo que o dono do catálogo entre em contato proativamente com leads qualificados.
O sistema não processa pagamentos nem frete — a conversão final ocorre fora da plataforma, o que é uma decisão de escopo intencional para viabilizar diferentes modelos de entrega e negociação direta entre comprador e vendedor.

2. Tipos de Usuário
2.1 Pessoa Física
Perfil destinado a consumidores individuais (B2C).
Dados de cadastro:
CPF
Nome completo
E-mail
Idade (opcional)
Número de telefone (opcional)
E-mail alternativo para contato (opcional)
Aceite dos Termos de Uso e Política de Privacidade (checkbox obrigatório — LGPD)
Consentimento para cookies de rastreamento comportamental (checkbox separado, opcional mas recomendado)

Funcionalidades disponíveis:
Score de Produto
Score de Categoria de Produto
Relação de produtos de interesse com faixa de preço (diferenciada por conversão vs. não-conversão)
Lista de possíveis produtos e categorias de interesse visível ao dono do catálogo
Página inicial personalizada com produtos e categorias de maior probabilidade de compra
Botão de contato com vendedor habilitado

2.2 Pessoa Jurídica
Perfil destinado a empresas (B2B).
Dados de cadastro:
CNPJ
Razão social / Nome da empresa
E-mail corporativo
Número de telefone (opcional)
E-mail alternativo para contato (opcional)
Aceite dos Termos de Uso e Política de Privacidade (checkbox obrigatório — LGPD)
Consentimento para cookies de rastreamento comportamental (checkbox separado, opcional mas recomendado)

Funcionalidades disponíveis:
Score de Produto
Score de Categoria
Relação de produtos de interesse com faixa de preço (diferenciada por conversão vs. não-conversão)
Lista de possíveis produtos e categorias de interesse visível ao dono do catálogo
Página inicial personalizada com produtos e categorias de maior probabilidade de compra
Botão de contato com vendedor habilitado

2.3 Visitante (Não Autenticado)
Usuário sem cadastro. Identificado via cookie de sessão/fingerprint, sujeito às restrições da LGPD.
Funcionalidades disponíveis:
Score de Produto (baseado em sessão)
Score de Categoria (baseado em sessão)
Página inicial com produtos e categorias de maior probabilidade de compra — usa Popularidade Global como base inicial, evoluindo para score comportamental conforme interações na sessão
Pesquisa e filtros ordenados por maior possibilidade de compra

Funcionalidades indisponíveis:
Relação de faixa de preço
Botão de contato com vendedor
Persistência de histórico entre sessões (a menos que faça login)

3. Métricas de Coleta de Dados
Todas as métricas comportamentais só são coletadas após consentimento explícito de cookies. Para visitantes, o consentimento é solicitado via banner padrão (LGPD). Para usuários autenticados, o consentimento é registrado no cadastro.
3.1 Métricas Comportamentais Diretas

Métrica
Descrição
Peso Base Sugerido
Clique na página do produto
Registro de visualização de página de produto
Baixo
Favoritar produto
Intenção explícita de interesse
Médio
Contato sobre produto visualizado
Alta intenção de compra — produto específico
Alto
Contato sobre carrinho
Alta intenção de compra — múltiplos produtos
Alto
Pesquisas do usuário
Termos buscados indicam interesse por categoria/produto
Médio
Filtros aplicados
Refinamento de busca indica preferência específica
Médio
Tempo ativo na página do produto
Engajamento prolongado indica interesse qualificado
Médio
Scroll depth
Até onde o usuário rolou a página — leitura completa indica interesse
Baixo-Médio
Retorno à mesma página (multi-sessão)
Visitas repetidas indicam intenção crescente
Médio-Alto
Sequência de navegação
Produtos visitados em sequência revelam relação entre itens
Médio


3.2 Métricas Contextuais
Sazonalidade — visualizações e buscas por categoria ao longo do tempo
Tempo entre visitas — retorno frequente eleva o score; ausência prolongada aplica decaimento

3.3 Histórico de Compras (Informado pelo Vendedor)
Veja seção 9 para detalhamento completo.

3.4 Heatmap (Em Avaliação)
O heatmap está em avaliação para implementação futura. O custo de implementação é elevado para o escopo de TCC. Recomenda-se deixar como Trabalho Futuro, dado que as demais métricas já cobrem o comportamento do usuário de forma satisfatória.

4. Sistema de Scoring
O sistema de scoring é implementado em quatro camadas complementares, ativadas progressivamente conforme o volume de dados cresce. Cada camada assume responsabilidades distintas e coexiste com as demais.
4.1 Arquitetura em Camadas (Pipeline de Scoring)
Camada 1 — Popularidade Global (0 dados, sempre ativa)
Fallback obrigatório para cold start, visitantes sem histórico e produtos sem interações individuais. Calculada conforme seção 6.

Camada 2 — Regras Ponderadas com Decay Temporal (1+ interações — núcleo do sistema)
Motor principal do sistema. Calcula o Score de Produto via soma ponderada das métricas comportamentais e do histórico de compras, com decaimento exponencial aplicado a cada interação (ver seção 5). Funciona com qualquer volume de dados a partir de uma única interação.

Camada 3 — Regras Sequenciais + Grafo/PPR (5+ interações — condicional ao volume de usuários)
Módulo de enriquecimento estrutural. As Regras Sequenciais identificam padrões de co-ocorrência de navegação e compra, convertendo esses padrões em arestas ponderadas do grafo de produtos. O Personalized PageRank (PPR) propaga relevância por essa estrutura, permitindo recomendar produtos relacionados que o usuário ainda não visualizou diretamente.
Nota: esta camada só agrega valor real quando o catálogo possui volume suficiente de usuários ativos com histórico. Para catálogos B2B pequenos, pode permanecer inativa por tempo prolongado — ver seção 13.

Camada 4 — Collaborative Filtering / Matrix Factorization (Trabalho Futuro — 50+ usuários)
Técnicas de filtragem colaborativa (KNN, SVD, ALS) tornam-se viáveis apenas quando há massa crítica de usuários com histórico. Com o volume esperado de um catálogo B2B pequeno, essas técnicas produzem resultados ruidosos e são reservadas para evolução futura (ver seção 13).

4.2 Score de Produto
Calculado pela Camada 2. Cada produto recebe um score individual por usuário, como soma ponderada das métricas coletadas, com decaimento temporal aplicado a cada interação. O score é normalizado para o intervalo [0, 100].

Fórmula geral:
Score(produto) = Σ [ peso(métrica_i) × valor(métrica_i) × fator_decay(métrica_i) ]  ÷  Score_máximo  × 100
O fator_decay é calculado conforme descrito na seção 5. O Score_máximo é o valor teórico obtido se todas as métricas atingissem seu valor máximo sem decaimento, utilizado apenas para normalização.

4.3 Score de Categoria
Calculado como média ponderada logarítmica dos scores dos produtos pertencentes à categoria. A ponderação logarítmica reduz a distorção causada por um único produto com número muito alto de interações, mantendo ainda assim a proporcionalidade:
Score(categoria) = Σ [ Score(produto_i) × log(1 + interações_i) ]  ÷  Σ [ log(1 + interações_i) ]
Adicionalmente, se o usuário realizou qualquer conversão nos últimos 30 dias em produtos desta categoria, aplica-se um boost multiplicativo de 1,2× a 1,5× (configurável) sobre o Score de Categoria, pois conversão recente é o sinal de intenção mais forte disponível.
Atenção: o boost pós-conversão é mais adequado para produtos de reposição frequente (insumos, consumíveis). Para equipamentos ou bens duráveis, uma conversão recente pode indicar necessidade já atendida. Recomenda-se configurar o boost por tipo de produto ou categoria.

4.4 Grafo de Produtos e Regras Sequenciais
O grafo é composto por:
Nós: produtos e categorias
Arestas de co-ocorrência: criadas pelas Regras Sequenciais quando dois produtos são visitados em sequência na mesma sessão ou em sessões próximas
Arestas de co-compra: criadas quando dois produtos aparecem no mesmo histórico de compras do vendedor
Arestas de pertencimento: produto → categoria

As Regras Sequenciais só criam arestas com peso confiável quando o padrão é observado em pelo menos 3 usuários distintos, evitando distorções por coincidência com poucos dados.
O PPR é executado por usuário a partir dos produtos com score mais alto (nós de origem), propagando relevância pelas arestas do grafo para identificar produtos relacionados com alta probabilidade de interesse, mesmo sem interação direta do usuário com eles.

4.5 Pesos Ajustáveis
Os pesos de cada métrica são configuráveis pelo administrador do catálogo, permitindo ajuste fino conforme o tipo de negócio. O peso do histórico de compras possui ajuste adicional baseado na completude dos dados (ver seção 9). Os parâmetros do PPR (fator de amortecimento, número de iterações) também são configuráveis.

4.6 Mapeamento de Outputs por Algoritmo

Output do Sistema
Algoritmo Principal
Algoritmo Auxiliar
Score de Produto
Regras Ponderadas + Decay Exponencial
Grafo/PPR (após 5+ interações do usuário)
Score de Categoria
Média Ponderada dos Scores dos Produtos
Nó de categoria no grafo — propagação via PPR
Faixa de Preço (conversão vs. não-conversão)
Regras Explícitas (mediana por tipo de evento)
—
Lista de interesse ao vendedor
Ranking por Score de Produto
—
Página inicial personalizada
Score de Produto e de Categoria
PPR para itens relacionados não visitados
Página inicial — visitante
Popularidade Global
Score de sessão progressivo (interpolação)
Pesquisa e filtros ordenados
Re-ranking por Score de Produto
PPR como critério de desempate


5. Score Decay — Decaimento Temporal
Interações antigas têm menor relevância do que interações recentes. Um usuário que pesquisou intensamente um produto há 6 meses sem comprar deve ter esse sinal enfraquecido progressivamente. O decaimento é aplicado individualmente a cada registro de interação no cálculo do Score de Produto (seção 4.2).
Contexto B2B importante: ciclos de compra longos são a regra em mercados B2B. Um comprador de equipamentos ou insumos industriais pode levar 8 a 18 meses entre visitas ativas e fechamento de negócio. O sistema de decay deve ser calibrado cuidadosamente para não deprioritizar leads que estão em seu ciclo natural de decisão. O mecanismo de pausa de decay via evento de contato (seção 5.4) é especialmente crítico nesse contexto.

5.1 Modelo de Decaimento
Adota-se um modelo de decaimento exponencial negativo:
fator_decay = e^( −λ × dias_desde_interação )
Onde λ (lambda) é a taxa de decaimento, configurável pelo administrador por tipo de produto ou categoria. Valores de referência:

Valor de λ
Meia-vida aprox.
Perfil de uso
0,005
~140 dias (~5 meses)
Produtos de ciclo de compra longo (máquinas, equipamentos) — recomendado para B2B
0,01
~70 dias (~2 meses)
Uso geral — padrão
0,02
~35 dias (~1 mês)
Produtos de reposição frequente (insumos, consumíveis)


5.2 Regras de Decaimento por Faixa Temporal

Faixa de tempo
Comportamento
Observação
< 7 dias
Sem decaimento
fator = 1,0
7 a 90 dias
Decaimento gradual conforme λ configurado
fator = e^(−λ × dias)
91 a 180 dias sem conversão
Decaimento acelerado
fator próximo a zero
> 180 dias sem conversão
Score zerado / anulado
fator = 0
Compras confirmadas
Sem decaimento
Padrão recorrente — peso mantido integral
Compras > 2 anos
Peso reduzido
Reflete possível mudança de perfil
Conversão recente (< 30 dias)
Ciclo reiniciado + boost de categoria
Boost: 1,2× a 1,5× no Score de Categoria


5.3 Interação do Decaimento com as Camadas de Algoritmo
O decaimento exponencial é aplicado exclusivamente na Camada 2 (Regras Ponderadas), pois opera sobre registros individuais de interação com timestamps. Os demais componentes interagem com o decay da seguinte forma:
Popularidade Global (Camada 1): não usa fator_decay por interação — utiliza janelas temporais fixas (últimos 30 ou 90 dias) como mecanismo equivalente de filtragem de relevância
Grafo/PPR (Camada 3): as arestas do grafo herdam o peso já decaído dos scores de produto da Camada 2, portanto o decay influencia indiretamente a propagação do PPR
Regras Sequenciais: padrões de co-ocorrência muito antigos (> 180 dias sem reforço) são desconsiderados na criação de novas arestas, mas arestas existentes não são removidas automaticamente — apenas seu peso de origem fica reduzido
Histórico de compras confirmadas: não sofre decaimento por interação. Compras acima de 2 anos recebem redução de peso configurável para refletir possível mudança de perfil do comprador

5.4 Reinicialização do Ciclo de Decaimento
Qualquer evento de contato com o vendedor — Conversão Leve, Forte ou Confirmada (ver seção 8.1) — pausa o decaimento para o produto em questão enquanto a negociação permanecer ativa. Isso é especialmente relevante no contexto B2B, onde negociações podem se estender por meses.
O ciclo de decaimento só é retomado se nenhum novo evento de contato ocorrer por um período configurável (padrão sugerido: 60 dias). Isso evita que um lead em negociação ativa seja erroneamente deprioritizado por ausência de novas interações passivas durante o processo de decisão.

6. Fallback: Popularidade Global
Usuários novos ou visitantes sem histórico suficiente para gerar um score personalizado utilizam a Popularidade Global do catálogo como base de recomendação. Isso resolve o problema de cold start.
6.1 Como a Popularidade Global é Calculada

Sinal
Peso
Número de visualizações do produto (últimos 30 dias)
Baixo
Número de favoritações (últimos 30 dias)
Médio
Número de contatos iniciados pelo produto (últimos 30 dias)
Alto
Quantidade de vendas registradas pelo vendedor (últimos 90 dias)
Alto


6.2 Transição do Fallback para Score Personalizado
A transição é gradual, não abrupta:
0–2 interações na sessão: 100% popularidade global
3–9 interações: interpolação linear (popularidade global × peso decrescente + score pessoal × peso crescente)
10+ interações: score pessoal com peso dominante (≥ 80%)

Para usuários autenticados que retornam, o score pessoal histórico é carregado imediatamente, eliminando o período de fallback.

7. Migração de Histórico de Visitante
7.1 O Problema
Se um visitante navegar extensivamente pelo catálogo e depois criar uma conta ou fazer login, perder todo o histórico comportamental daquela sessão representa uma oportunidade desperdiçada de qualificação de lead.
7.2 Mecanismo de Identificação
O visitante é rastreado via:
Cookie de sessão (primário) — persistido por até 30 dias
Browser fingerprint (secundário) — como fallback caso cookies sejam apagados

A coleta do fingerprint deve ser mencionada explicitamente na Política de Privacidade e só pode ser ativada mediante consentimento de cookies (LGPD). Considere usar apenas o cookie como identificador primário para simplificar a conformidade.
7.3 Lógica de Migração
Ao criar conta ou fazer login, o sistema verifica se existe histórico de visitante associado ao cookie/fingerprint atual
Se existir, exibe uma notificação ao usuário informando que o histórico de navegação será associado ao perfil (transparência LGPD)
Usuário confirma ou rejeita a migração
Se confirmado: histórico é migrado e associado ao perfil permanente
Se rejeitado: histórico é descartado

Situação especial — conflito de histórico:
Se o usuário já possui histórico autenticado E há histórico de visitante: mesclar por média ponderada, com peso maior para o histórico autenticado
Interações mais recentes do visitante têm peso maior na mesclagem

8. Faixa de Preço — Interesse com e sem Conversão
A faixa de preço ideal do usuário não deve ser calculada apenas com base nos produtos que ele visualizou — é necessário distinguir interesse que resultou em contato/compra (conversão) de interesse que não converteu, pois o segundo pode indicar que o preço está fora da faixa aceitável.
8.1 Definição de Conversão no Contexto do Sistema

Evento
Tipo
Clicou em 'Entrar em contato' sobre produto
Conversão Leve
Adicionou ao carrinho e clicou em 'Entrar em contato'
Conversão Forte
Compra registrada pelo vendedor
Conversão Confirmada
Visualizou, favoritou, mas nunca contatou
Interesse sem Conversão
Visualizou repetidamente mas nunca favoritou nem contatou
Interesse Fraco / Possível Barreira de Preço


8.2 Cálculo da Faixa de Preço
Faixa com conversão: mediana dos preços dos produtos que geraram conversão (leve, forte ou confirmada)
Faixa sem conversão: mediana dos preços dos produtos com interesse mas sem conversão
Se a faixa sem conversão for sistematicamente acima da faixa com conversão: sinalizar ao vendedor que o usuário pode ter sensibilidade a preço
Exibir ao dono do catálogo as duas faixas separadamente com indicador visual de gap

Esta distinção é especialmente valiosa para B2B, onde o produto certo na faixa de preço errada pode ser a única barreira para o fechamento de negócio.

9. Histórico de Compras Informado pelo Vendedor
O vendedor pode registrar manualmente o histórico de compras de cada cliente. Esta é uma das métricas de maior valor preditivo do sistema.
O peso desta métrica no score é definido inteiramente pelo administrador do catálogo, sem autoavaliação de completude. O administrador conhece a realidade do seu negócio e calibra o peso conforme a consistência com que mantém os registros. Se os dados forem esparsos, o peso deve ser reduzido manualmente; se os registros forem completos, pode-se atribuir peso máximo.
9.1 Dados Registrados
Produto(s) comprado(s)
Categoria do produto
Preço unitário
Quantidade comprada
Valor total da transação
Data da compra

9.2 Threshold Mínimo de Registros
Com menos de 3 registros de compra para um determinado cliente, a métrica de histórico é automaticamente zerada para aquele cliente, independentemente do peso configurado pelo administrador. Isso evita distorções causadas por amostras muito pequenas com peso elevado.

9.3 Decaimento no Histórico de Compras
Compras confirmadas NÃO sofrem decaimento de score, pois representam padrão real de comportamento
Compras muito antigas (> 2 anos) recebem peso reduzido para refletir possível mudança de perfil do comprador
Categorias com compras recorrentes recebem bônus de recorrência no score

10. LGPD, Cookies e Privacidade
Por se tratar de sistema que coleta dados comportamentais de usuários brasileiros, a conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018) é obrigatória.
10.1 No Cadastro de Usuário Autenticado
Checkbox obrigatório: aceite dos Termos de Uso e Política de Privacidade — sem aceite, o cadastro não é concluído
Checkbox separado e opcional: consentimento para coleta de dados comportamentais (cliques, tempo em página, navegação) para fins de personalização
Checkbox separado e opcional: consentimento para receber contato proativo do vendedor com base no perfil de interesse
Data e versão dos termos aceitos devem ser registradas no banco de dados
Usuário pode revogar consentimentos a qualquer momento nas configurações do perfil

10.2 Para Visitantes — Banner de Cookies
Exibir banner de consentimento de cookies na primeira visita
Opções: Aceitar todos, Aceitar apenas essenciais, Personalizar
Cookies essenciais (sessão, preferências básicas): não requerem consentimento
Cookies comportamentais (rastreamento para score): requerem consentimento explícito
Se visitante rejeitar cookies comportamentais: score não é calculado; recomendação usa apenas popularidade global
Preferência de cookies é armazenada por 12 meses

10.3 Direitos do Titular
O sistema deve prever mecanismos para atender os direitos previstos na LGPD:
Acesso: usuário pode visualizar quais dados foram coletados sobre ele
Correção: usuário pode editar seus dados cadastrais
Exclusão: usuário pode solicitar exclusão completa de seus dados e histórico
Portabilidade: exportação dos dados em formato acessível (ex: JSON ou CSV)
Oposição: usuário pode desabilitar a coleta comportamental mantendo o cadastro ativo

11. Edge Cases e Decisões de Projeto

Situação
Decisão / Tratamento
Usuário novo sem histórico
Usar Popularidade Global como fallback. Transição gradual para score pessoal conforme interações acumulam.
Visitante que cria conta após navegar
Oferecer migração do histórico de sessão. Usuário confirma ou rejeita. Ver seção 7.
Histórico de compras com menos de 3 registros
Métrica anulada automaticamente (peso = 0%). Não distorce score.
Produto visualizado repetidamente mas nunca convertido
Sinalizar possível barreira de preço. Exibir na faixa 'interesse sem conversão'.
Score de produto muito antigo (> 6 meses sem ação)
Score decaído para próximo de zero via função exponencial.
Usuário que favorita muitos produtos sem nunca contatar
Favoritação sozinha tem peso médio. Score não dispara sem outros sinais de conversão.
Vendedor com zero registros de histórico de compras
Métrica de histórico completamente anulada. Score baseado 100% em comportamento.
Dois usuários com o mesmo dispositivo/rede
Fingerprint não é suficiente para identificação segura. Priorizar cookie de sessão e login.
Usuário revoga consentimento de cookies após acumular histórico
Parar coleta imediatamente. Histórico existente pode ser mantido ou apagado conforme opção do usuário.
Lead B2B em negociação ativa sem novas interações passivas
Decay pausado enquanto houver evento de contato recente (< 60 dias). Ver seção 5.4.
Boost pós-conversão em produto durável/equipamento
Administrador deve desabilitar ou reduzir o boost para categorias de bens duráveis, onde conversão recente indica necessidade já atendida.
Camada 3 (PPR) inativa por falta de usuários
Esperado em catálogos B2B pequenos. Camadas 1 e 2 são suficientes para operação normal.


12. Funcionalidades por Tipo de Usuário

Funcionalidade
Visitante
Pessoa Física
Pessoa Jurídica
Score de Produto
Sim (sessão)
Sim
Sim
Score de Categoria
Sim (sessão)
Sim
Sim
Página inicial personalizada
Sim (popularidade global + sessão)
Sim
Sim
Pesquisa e filtros ordenados por score
Sim
Sim
Sim
Faixa de preço ideal
Não
Sim
Sim
Distinção conversão vs. não-conversão
Não
Sim
Sim
Botão de contato com vendedor
Não
Sim
Sim
Lista de interesse visível ao vendedor
Não
Sim
Sim
Histórico de compras do vendedor
Não
Sim
Sim
Migração de histórico de sessão
—
Sim (ao criar conta)
Sim (ao criar conta)
Persistência entre sessões
Não
Sim
Sim
LGPD — aceite de termos
Banner de cookies
Checkbox no cadastro
Checkbox no cadastro


13. Trabalhos Futuros
Os seguintes itens foram identificados como fora do escopo do TCC mas representam evoluções naturais do sistema:

Heatmap de atenção nas páginas de produto — custo de implementação elevado, ganho marginal dado as métricas já existentes
Collaborative Filtering (KNN / Matrix Factorization) — recomendação baseada em similaridade entre usuários com perfis parecidos. Pressupõe matriz usuário×produto minimamente densa; viável a partir de ~50 usuários com histórico consistente. Identificada como a evolução natural da Camada 3 do sistema de scoring
Integração com CRM externo — exportar leads qualificados diretamente para sistemas como Pipedrive ou HubSpot
Score de sazonalidade automático — detecção automática de padrões sazonais por categoria
Notificações proativas ao vendedor — alertas quando usuário atinge threshold de score para um produto
A/B testing de pesos de métricas — experimentação para otimizar os pesos do modelo de scoring
Modelo de machine learning — substituição gradual das regras manuais por modelo preditivo treinado com dados históricos
Ajuste automático de λ por categoria — aprendizado da taxa de decaimento ideal com base no histórico de conversões por tipo de produto
Camada 3 (Grafo/PPR) como funcionalidade condicional ao volume — ativação automática quando o catálogo atingir densidade mínima de usuários e interações para resultados confiáveis

Documento gerado como especificação técnica para o TCC.
