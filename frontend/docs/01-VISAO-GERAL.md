# Visão Geral do Projeto

**Catálogo Online Inteligente — E-commerce B2B com Predição de Comportamento de Compra**
Trabalho de Conclusão de Curso em Engenharia de Software.

## 1. Resumo

Este TCC propõe o desenvolvimento de um sistema de e-commerce com um diferencial estratégico: seu objetivo principal não é apenas a exibição de produtos, mas sim a **coleta de dados comportamentais de alta qualidade para alimentar um modelo de Deep Learning**. Esse modelo, por sua vez, será capaz de **predizer a intenção de compra dos usuários e personalizar a experiência de navegação em tempo real**.

## 2. Objetivos

**Objetivo geral:** desenvolver uma plataforma de catálogo online B2B que colete dados comportamentais, calcule scores de intenção de compra por usuário e por produto, e apresente leads qualificados ao vendedor.

**Objetivos específicos:**
1. Modelar e implementar o sistema de scoring descrito em [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md).
2. Construir frontend em Next.js com interface minimalista baseada em Ant Design (ver [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md)).
3. Construir backend em Spring Boot com persistência em PostgreSQL e processamento assíncrono de eventos via mensageria.
4. Garantir conformidade com a LGPD em toda a coleta e tratamento de dados.
5. Entregar uma lista de leads priorizados por score ao usuário administrador, com visão detalhada por cliente.

## 3. Público-Alvo e Modelo de Negócio

O sistema é projetado para o ambiente **B2B (business-to-business)**, com suporte secundário a B2C. Optou-se por um modelo de negócio simplificado que **exclui módulos transacionais complexos** (pagamento, frete, carrinho fechado). A negociação e a finalização da compra ocorrem externamente, via **WhatsApp**, permitindo flexibilidade na negociação de preços e condições, comum no mercado B2B. O clique no botão do WhatsApp é tratado como um evento de altíssima intenção de compra.

## 4. Funcionalidades Principais

O sistema funciona como **vitrine inteligente e catálogo gerenciável**, onde:

1. **Coleta de dados:** a arquitetura maximiza o registro de interações de todos os visitantes, anônimos ou identificados — Hendriksen et al. (2020) indicam que mais da metade das sessões em e-commerces são anônimas.
2. **Scoring:** cada interação alimenta um motor de scoring em quatro camadas (ver [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md) §4), gerando scores por produto e por categoria para cada usuário.
3. **Personalização e ação:** com base no score de intenção, a vitrine se adapta:
   - **Para o comprador:** ordenação de produtos e recomendações personalizadas.
   - **Para o vendedor:** lista inteligente de leads priorizados, permitindo contato proativo via WhatsApp.

## 5. Stack Tecnológica

| Camada | Tecnologia | Papel |
|---|---|---|
| Frontend | React + Next.js | Renderização híbrida; coleta de eventos no cliente |
| UI / Design System | Ant Design (antd) | Componentes base; ver filosofia visual em [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md) |
| Backend | Java + Spring Boot | API REST; regras de negócio; produção de eventos |
| Banco de dados | PostgreSQL | Persistência (JSONB para metadados de eventos) |
| Mensageria | RabbitMQ ou Kafka | Fila de eventos entre API e workers; desacoplamento |
| Worker | Spring Boot (consumer) | Consome eventos, persiste e aciona recalculos de score |
| Machine Learning | Python + TensorFlow/Keras | Treinamento de modelo RNN para predição |
| Integração externa | WhatsApp Business/Cloud API | Registro de contatos e eventos de conversão |

## 6. Categorias de Dados Coletados

Os dados, inspirados nos artigos de referência (ver [07-REFERENCIAS.md](07-REFERENCIAS.md)), são organizados em categorias para alimentar o modelo preditivo:

- **Contexto da sessão:** hora, dia da semana, dispositivo, canal de origem.
- **Navegação e engajamento:** sequência de páginas visitadas, tempo em página, profundidade de scroll, hover.
- **Interação com a busca:** termos pesquisados, cliques nos resultados, filtros aplicados.
- **Interação com produtos:** visualizações, favoritações, cliques no botão do WhatsApp.
- **Histórico (usuários identificados):** compras anteriores, valor total, categorias preferidas, recência.

Detalhamento das métricas e pesos está em [04-ESPECIFICACAO-TECNICA.md](04-ESPECIFICACAO-TECNICA.md) §3.

## 7. Síntese

O projeto entrega uma plataforma de e-commerce B2B inteligente, que aprende com o comportamento dos usuários para personalizar a experiência de compra e, simultaneamente, empodera a equipe de vendas com uma lista de leads qualificados, criando um ciclo virtuoso de coleta de dados, predição e ação comercial.
