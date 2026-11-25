# Requisitos

Requisitos funcionais e não-funcionais do sistema. A rastreabilidade entre páginas, requisitos e permissões por tipo de usuário está em [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md) e [04-ESPECIFICACAO-TECNICA.md §12](04-ESPECIFICACAO-TECNICA.md).

Os casos de uso estão em [14-CASOS-DE-USO.md](14-CASOS-DE-USO.md). A coluna **Situação** compara o requisito original com o que está implementado:

- **Implementado:** atende ao texto do requisito.
- **Parcial:** atende em parte; a observação diz o que falta.

## 1. Requisitos Funcionais (RF)

### 1.1 Autenticação e cadastro

| ID | Requisito | Situação |
|---|---|---|
| RF01 | O sistema deve permitir cadastro de usuário Pessoa Física (CPF com validação de dígito, nome completo, e-mail, idade opcional, telefone opcional, e-mail alternativo opcional). | Implementado |
| RF02 | O sistema deve permitir cadastro de usuário Pessoa Jurídica (CNPJ com validação de dígito, razão social, e-mail corporativo, telefone opcional, e-mail alternativo opcional). | Implementado |
| RF03 | O cadastro deve obrigar aceite dos Termos de Uso e Política de Privacidade (LGPD). | Implementado |
| RF04 | O consentimento para rastreamento comportamental deve ser separado do aceite do cadastro e opcional, oferecido no banner de cookies e revogável em Conta. | Implementado |
| RF05 | O sistema deve permitir login de usuários cadastrados (PF, PJ, Admin). | Implementado |
| RF06 | O sistema deve oferecer fluxo de recuperação de senha por e-mail. | Implementado: código por e-mail, válido por 2 horas (SMTP configurável; Mailpit no ambiente local) |
| RF07 | O cadastro de administradores é feito exclusivamente pela equipe de TI (sem auto-signup). | Implementado |

### 1.2 Catálogo e navegação (consumidor)

| ID | Requisito | Situação |
|---|---|---|
| RF08 | O sistema deve exibir a lista de produtos ordenada por score de intenção quando o usuário está autenticado. | Implementado |
| RF09 | Para visitantes sem interação suficiente, a ordenação deve usar Popularidade Global ([04-ESPECIFICACAO-TECNICA.md §6](04-ESPECIFICACAO-TECNICA.md)). | Implementado |
| RF10 | O sistema deve permitir busca por termo com registro do termo pesquisado. | Implementado |
| RF11 | O sistema deve permitir filtros por categoria, faixa de preço e outros atributos relevantes. | Implementado: categoria (com subcategorias), faixa de preço e termo |
| RF12 | O sistema deve exibir a página de produto individual com ficha técnica, galeria e CTA de contato via WhatsApp. | Implementado |
| RF13 | O sistema deve permitir favoritar/desfavoritar produtos e manter uma lista de desejos por usuário. | Implementado |
| RF14 | O clique no botão "Entrar em contato" (CTA de WhatsApp, visível apenas para usuários autenticados PF/PJ) deve registrar um evento de conversão (ver [04-ESPECIFICACAO-TECNICA.md §8.1](04-ESPECIFICACAO-TECNICA.md)). | Implementado |

### 1.3 Coleta comportamental

| ID | Requisito | Situação |
|---|---|---|
| RF15 | O sistema deve coletar eventos de visualização de página de produto. | Implementado |
| RF16 | O sistema deve coletar tempo ativo em página, scroll depth e sequência de navegação. | Parcial: tempo ativo e scroll são coletados, e o retorno ao produto pode pontuar; a sequência de navegação não é calculada |
| RF17 | O sistema deve registrar favoritação, pesquisas e filtros aplicados. | Implementado |
| RF18 | Para visitantes anônimos, a coleta deve usar um identificador guardado no navegador por 30 dias ([04 §7.2](04-ESPECIFICACAO-TECNICA.md)), sem fingerprint ([13 — M20](13-MUDANCAS-DE-ESCOPO.md)). | Implementado |
| RF19 | Ao criar conta/login, o sistema deve oferecer migração do histórico de visitante ([04-ESPECIFICACAO-TECNICA.md §7](04-ESPECIFICACAO-TECNICA.md)). | Implementado: aceitar recalcula as notas da conta com o histórico inteiro; recusar descarta o histórico anônimo |

### 1.4 Área administrativa

Papel acessado pela conta `usuario.tipo = ADMIN` — referido no texto como **"dono do catálogo"**.

| ID | Requisito | Situação |
|---|---|---|
| RF20 | O sistema deve oferecer um dashboard com KPIs gerais e lista de leads priorizados por score. | Implementado: KPIs, os 5 clientes com maior nota e gráficos |
| RF21 | O dono do catálogo deve visualizar lista de usuários com score, categorias de interesse e próxima compra provável. | Implementado: a próxima compra provável é o produto ativo de maior nota que o cliente não comprou nos últimos 30 dias |
| RF22 | O dono do catálogo deve acessar visão detalhada de um usuário com scores por produto/categoria, faixas de preço com e sem conversão, e histórico de compras. | Implementado |
| RF23 | O dono do catálogo deve gerenciar o catálogo (CRUD de produtos). | Implementado |
| RF24 | O dono do catálogo deve registrar manualmente histórico de compras por cliente ([04-ESPECIFICACAO-TECNICA.md §9](04-ESPECIFICACAO-TECNICA.md)). | Implementado |
| RF25 | O dono do catálogo deve configurar pesos de métricas, taxa de decaimento (λ) e boost pós-conversão por categoria. | Implementado |
| RF26 | O dono do catálogo deve editar seus próprios dados (e-mail, senha, telefone). | Implementado |

### 1.5 LGPD e direitos do titular

| ID | Requisito | Situação |
|---|---|---|
| RF27 | O sistema deve exibir banner de consentimento de cookies na primeira visita. | Implementado |
| RF28 | O usuário deve poder revogar consentimentos a qualquer momento. | Implementado |
| RF29 | O usuário deve poder solicitar exportação dos seus dados (JSON ou CSV). | Implementado |
| RF30 | O usuário deve poder solicitar exclusão completa de seus dados e histórico. | Implementado |

## 2. Requisitos Não-Funcionais (RNF)

### 2.1 Performance

| ID | Requisito | Situação |
|---|---|---|
| RNF01 | A página inicial deve carregar em menos de 2 segundos em conexão 4G típica. | Não medido em 4G |
| RNF02 | O envio de eventos comportamentais não deve bloquear a navegação do usuário (via fila de mensageria). | Implementado |
| RNF03 | A API deve responder em menos de 500ms para endpoints de leitura em condições normais. | Medido localmente no catálogo: cerca de 0,1 s com 2.085 produtos |

### 2.2 Segurança

| ID | Requisito | Situação |
|---|---|---|
| RNF04 | Senhas devem ser armazenadas com hash seguro (bcrypt ou argon2). | Implementado: BCrypt |
| RNF05 | Toda comunicação deve ser via HTTPS. | Não se aplica à execução local, que usa HTTP |
| RNF06 | Login, cadastro e recuperação de senha devem ter rate limit para prevenir força-bruta (limites concretos em [11 §1 Rate limit](11-API-ENDPOINTS.md)). | Implementado |
| RNF07 | A área administrativa deve ser acessível apenas via rota separada e autenticação distinta. | Implementado |

### 2.3 Conformidade legal

| ID | Requisito | Situação |
|---|---|---|
| RNF08 | O sistema deve estar em conformidade com a LGPD (Lei 13.709/2018). | Implementado |
| RNF09 | Consentimentos devem ser registrados com data e versão dos termos aceitos. | Implementado |

### 2.4 Usabilidade e acessibilidade

| ID | Requisito | Situação |
|---|---|---|
| RNF10 | A interface deve ser responsiva, com prioridade de desenho para desktop (perfil B2B). | Implementado |
| RNF11 | A interface deve atender ao padrão WCAG 2.1 nível AA no mínimo para contraste e navegação por teclado. | Parcial: diretriz seguida nas telas ([09](09-NORMAS-DE-USABILIDADE.md)); sem auditoria formal |
| RNF12 | A identidade visual deve ser minimalista (ver [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md) §1). | Implementado |

### 2.5 Manutenibilidade

| ID | Requisito | Situação |
|---|---|---|
| RNF13 | Pesos de métricas e parâmetros do algoritmo de scoring devem ser configuráveis sem redeploy. | Implementado: valem para todos após "Recalcular" ([13 — M6](13-MUDANCAS-DE-ESCOPO.md)) |
| RNF14 | O código do frontend deve seguir a convenção definida em `frontend/AGENTS.md`. | Implementado |
