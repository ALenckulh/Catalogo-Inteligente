# Requisitos

Requisitos funcionais e não-funcionais do sistema. A rastreabilidade entre páginas, requisitos e permissões por tipo de usuário está em [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md) e [04-ESPECIFICACAO-TECNICA.md §12](04-ESPECIFICACAO-TECNICA.md).

## 1. Requisitos Funcionais (RF)

### 1.1 Autenticação e cadastro

| ID | Requisito |
|---|---|
| RF01 | O sistema deve permitir cadastro de usuário Pessoa Física (CPF, nome, e-mail, telefone opcional). |
| RF02 | O sistema deve permitir cadastro de usuário Pessoa Jurídica (CNPJ, razão social, e-mail corporativo, telefone opcional). |
| RF03 | O cadastro deve obrigar aceite dos Termos de Uso e Política de Privacidade (LGPD). |
| RF04 | O cadastro deve oferecer consentimento separado e opcional para rastreamento comportamental. |
| RF05 | O sistema deve permitir login de usuários cadastrados (PF, PJ, Admin). |
| RF06 | O sistema deve oferecer fluxo de recuperação de senha por e-mail. |
| RF07 | O cadastro de administradores é feito exclusivamente pela equipe de TI (sem auto-signup). |

### 1.2 Catálogo e navegação (consumidor)

| ID | Requisito |
|---|---|
| RF08 | O sistema deve exibir a lista de produtos ordenada por score de intenção quando o usuário está autenticado. |
| RF09 | Para visitantes sem interação suficiente, a ordenação deve usar Popularidade Global ([04-ESPECIFICACAO-TECNICA.md §6](04-ESPECIFICACAO-TECNICA.md)). |
| RF10 | O sistema deve permitir busca por termo com registro do termo pesquisado. |
| RF11 | O sistema deve permitir filtros por categoria, faixa de preço e outros atributos relevantes. |
| RF12 | O sistema deve exibir a página de produto individual com ficha técnica, galeria e CTA de contato via WhatsApp. |
| RF13 | O sistema deve permitir favoritar/desfavoritar produtos e manter uma lista de desejos por usuário. |
| RF14 | O clique no botão "Falar com o vendedor" deve registrar um evento de conversão (ver [04-ESPECIFICACAO-TECNICA.md §8.1](04-ESPECIFICACAO-TECNICA.md)). |

### 1.3 Coleta comportamental

| ID | Requisito |
|---|---|
| RF15 | O sistema deve coletar eventos de visualização de página de produto. |
| RF16 | O sistema deve coletar tempo ativo em página, scroll depth e sequência de navegação. |
| RF17 | O sistema deve registrar favoritação, pesquisas e filtros aplicados. |
| RF18 | Para visitantes anônimos, a coleta deve usar cookie de sessão identificador. |
| RF19 | Ao criar conta/login, o sistema deve oferecer migração do histórico de visitante ([04-ESPECIFICACAO-TECNICA.md §7](04-ESPECIFICACAO-TECNICA.md)). |

### 1.4 Área administrativa

| ID | Requisito |
|---|---|
| RF20 | O sistema deve oferecer um dashboard com KPIs gerais e lista de leads priorizados por score. |
| RF21 | O admin deve visualizar lista de usuários com score, categorias de interesse e próxima compra provável. |
| RF22 | O admin deve acessar visão detalhada de um usuário com scores por produto/categoria, faixas de preço com e sem conversão, e histórico de compras. |
| RF23 | O admin deve gerenciar o catálogo (CRUD de produtos). |
| RF24 | O admin deve registrar manualmente histórico de compras por cliente ([04-ESPECIFICACAO-TECNICA.md §9](04-ESPECIFICACAO-TECNICA.md)). |
| RF25 | O admin deve configurar pesos de métricas e taxa de decaimento (λ) por categoria. |
| RF26 | O admin deve editar seus próprios dados (e-mail, senha, telefone). |

### 1.5 LGPD e direitos do titular

| ID | Requisito |
|---|---|
| RF27 | O sistema deve exibir banner de consentimento de cookies na primeira visita. |
| RF28 | O usuário deve poder revogar consentimentos a qualquer momento. |
| RF29 | O usuário deve poder solicitar exportação dos seus dados (JSON ou CSV). |
| RF30 | O usuário deve poder solicitar exclusão completa de seus dados e histórico. |

## 2. Requisitos Não-Funcionais (RNF)

### 2.1 Performance

| ID | Requisito |
|---|---|
| RNF01 | A página inicial deve carregar em menos de 2 segundos em conexão 4G típica. |
| RNF02 | O envio de eventos comportamentais não deve bloquear a navegação do usuário (via fila de mensageria). |
| RNF03 | A API deve responder em menos de 500ms para endpoints de leitura em condições normais. |

### 2.2 Segurança

| ID | Requisito |
|---|---|
| RNF04 | Senhas devem ser armazenadas com hash seguro (bcrypt ou argon2). |
| RNF05 | Toda comunicação deve ser via HTTPS. |
| RNF06 | Login e cadastro devem ter rate limit para prevenir força-bruta. |
| RNF07 | A área administrativa deve ser acessível apenas via rota separada e autenticação distinta. |

### 2.3 Conformidade legal

| ID | Requisito |
|---|---|
| RNF08 | O sistema deve estar em conformidade com a LGPD (Lei 13.709/2018). |
| RNF09 | Consentimentos devem ser registrados com data e versão dos termos aceitos. |

### 2.4 Usabilidade e acessibilidade

| ID | Requisito |
|---|---|
| RNF10 | A interface deve ser responsiva, com prioridade de desenho para desktop (perfil B2B). |
| RNF11 | A interface deve atender ao padrão WCAG 2.1 nível AA no mínimo para contraste e navegação por teclado. |
| RNF12 | A identidade visual deve ser minimalista (ver [03-PAGINAS-E-UX.md](03-PAGINAS-E-UX.md) §1). |

### 2.5 Manutenibilidade

| ID | Requisito |
|---|---|
| RNF13 | Pesos de métricas e parâmetros do algoritmo de scoring devem ser configuráveis sem redeploy. |
| RNF14 | O código do frontend deve seguir a convenção definida em `frontend/AGENTS.md`. |
