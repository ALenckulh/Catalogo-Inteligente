# Visão Geral do Projeto

**Catálogo Online Inteligente — Catálogo B2B com Score de Intenção de Compra**
Trabalho de Conclusão de Curso em Engenharia de Software (linha Portfólio **Web Apps**).

## 1. Resumo

Este TCC desenvolve um **catálogo B2B** cujo diferencial não é checkout/pagamento, e sim a **coleta de dados comportamentais** alimentando um **motor de scoring por regras ponderadas com decaimento temporal**. O sistema gera **scores de intenção de compra** por produto/categoria e apresenta **leads priorizados** ao dono do catálogo, personalizando a vitrine do comprador.

Deep Learning / modelos treinados (ex. RNN) **não** são entregáveis deste TCC — ficam como trabalho futuro. O núcleo entregue são as **Camadas 1 e 2** do scoring (popularidade global + regras com decay).

## 2. Objetivos

**Objetivo geral:** desenvolver uma plataforma de catálogo online B2B que colete dados comportamentais, calcule scores de intenção de compra por usuário e por produto, e apresente leads qualificados ao dono do catálogo.

**Objetivos específicos:**
1. Modelar e implementar o sistema de scoring descrito em [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md).
2. Construir frontend em Next.js com interface minimalista baseada em Ant Design (ver [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md)).
3. Construir backend em Spring Boot com persistência em PostgreSQL e processamento assíncrono de eventos via mensageria.
4. Garantir conformidade com a LGPD em toda a coleta e tratamento de dados.
5. Entregar uma lista de leads priorizados por score ao dono do catálogo, com visão detalhada por cliente.

## 3. Público-Alvo e Modelo de Negócio

O sistema é projetado para o ambiente **B2B (business-to-business)**, com suporte secundário a B2C. Optou-se por um modelo de negócio simplificado que **exclui módulos transacionais complexos** (pagamento, frete, carrinho fechado). A negociação e a finalização da compra ocorrem externamente, via **WhatsApp**, permitindo flexibilidade na negociação de preços e condições, comum no mercado B2B. O clique no botão do WhatsApp é tratado como um evento de altíssima intenção de compra.

Posicionamento: não é “mais uma loja virtual”, e sim **vitrine + inteligência de intenção** para qualificar leads quando a venda fecha fora do sistema.

## 4. Funcionalidades Principais

O sistema funciona como **vitrine inteligente e catálogo gerenciável**, onde:

1. **Coleta de dados:** a arquitetura maximiza o registro de interações de todos os visitantes, anônimos ou identificados — Hendriksen et al. (2020) indicam que mais da metade das sessões em e-commerces são anônimas.
2. **Scoring (core entregue):** cada interação alimenta o motor de scoring — **Camada 1** (Popularidade Global) e **Camada 2** (regras ponderadas + decay). Camadas 3–4 e ML ficam fora do escopo entregue (ver [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md) §4 e §13).
3. **Personalização e ação:** com base no score de intenção, a vitrine se adapta:
   - **Para o comprador:** ordenação de produtos e recomendações personalizadas.
   - **Para o dono do catálogo:** lista inteligente de leads priorizados, permitindo contato proativo via WhatsApp.

## 5. Stack Tecnológica

| Camada | Tecnologia | Papel |
|---|---|---|
| Frontend | React + Next.js | Renderização híbrida; coleta de eventos no cliente |
| UI / Design System | Ant Design (antd) | Componentes base; ver filosofia visual em [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md) |
| Backend | Java 25 + Spring Boot 4 | API REST; regras de negócio; produção de eventos |
| Banco de dados | PostgreSQL | Persistência (JSONB para metadados de eventos) |
| Mensageria | RabbitMQ | Fila de eventos entre API e workers; desacoplamento |
| Worker | Spring Boot (consumer) | Consome eventos, persiste e aciona recalculos de score |
| Integração externa | WhatsApp (CTA / link) | Conversão de contato; API Business/Cloud = futuro |

**Trabalho futuro (não na stack entregue):** pipeline ML (ex. Python + TensorFlow/Keras) para eventual substituição gradual das regras.

## 6. Categorias de Dados Coletados

Os dados, inspirados nos artigos de referência (ver [07-REFERENCIAS.md](07-REFERENCIAS.md)), alimentam o **cálculo de score de intenção** (regras + decay):

- **Contexto da sessão:** hora, dia da semana, dispositivo, canal de origem.
- **Navegação e engajamento:** sequência de páginas visitadas, tempo em página, profundidade de scroll, hover.
- **Interação com a busca:** termos pesquisados, cliques nos resultados, filtros aplicados.
- **Interação com produtos:** visualizações, favoritações, cliques no botão do WhatsApp.
- **Histórico (usuários identificados):** compras anteriores, valor total, categorias preferidas, recência.

Detalhamento das métricas e pesos está em [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md) §3.

## 7. Síntese

O projeto entrega uma plataforma de catálogo B2B com scoring interpretável de intenção de compra: coleta comportamento, atualiza scores de forma assíncrona e empodera vendas com leads priorizados — sem depender de deep learning em produção neste TCC.
