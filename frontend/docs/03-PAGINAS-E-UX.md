# Páginas e Experiência do Usuário

Especificação das páginas do sistema, filosofia visual e mapeamento inicial de componentes.

## 1. Filosofia Visual

### 1.1 Posicionamento

A interface do Catálogo Inteligente é deliberadamente **minimalista e sóbria**, em oposição direta aos marketplaces de massa como **AliExpress e Shopee**. Estes últimos saturam a tela de banners animados, badges piscantes, selos de urgência, cores em alto contraste e gamificação para estimular compras por impulso. Esse padrão visual serve um público consumidor de varejo B2C médio, com decisões rápidas e tickets baixos.

**O nosso público é diferente.** O usuário deste sistema é majoritariamente **B2B** — um comprador profissional buscando itens específicos, geralmente com ticket relevante, que **precisa conversar com o vendedor** antes de decidir. Esse perfil valoriza clareza, ficha técnica legível, previsibilidade e profissionalismo — não gamificação de carrinho.

### 1.2 Diretrizes concretas

- **Paleta neutra:** branco, tons de cinza e uma única cor de acento. Sem gradientes agressivos.
- **Tipografia hierárquica clara**, boa legibilidade em desktop (público B2B navega mais em desktop; mobile é suporte).
- **Sem urgência fake**: zero contadores do tipo "3 pessoas vendo agora", "últimas unidades", "oferta termina em…".
- **Sem badges piscantes** ou selos competindo por atenção na listagem de produtos.
- **Fotos de produto limpas**, com espaço generoso para ficha técnica rica e descrições detalhadas.
- **CTA primário consistente** em todas as páginas de produto: **"Falar com o vendedor"** (WhatsApp), com estilo discreto porém inconfundível.
- **Densidade informacional controlada**: cada tela tem um foco claro; informação secundária em painéis colapsáveis ou abas.

### 1.3 Design System: Ant Design

A base de componentes é o **Ant Design (antd)**. Justificativas:

- Biblioteca madura, com componentes profissionais prontos (tabelas, formulários, modais, breadcrumb) adequados ao perfil **enterprise/B2B**.
- Design tokens permitem configurar a paleta neutra sem reescrever componentes.
- Boa cobertura de acessibilidade (foco visível, ARIA, navegação por teclado), ajudando a atender [RNF11](02-REQUISITOS.md).
- Set de ícones próprio consistente.
- Reduz o tempo de desenvolvimento visual, permitindo foco no diferencial do projeto (scoring e ML).

Antd deve ser **customizado via tokens**, não sobrescrito via CSS. Qualquer componente que não exista no antd pode ser composto a partir dos existentes antes de adicionar nova dependência.

## 2. Sitemap

### 2.1 Área pública (consumidor PF e PJ)

PF e PJ compartilham todos os fluxos; o tipo de cadastro é escolhido na página de cadastro e condiciona apenas os campos solicitados e os identificadores (CPF vs CNPJ).

| # | Página | Rota sugerida | Descrição |
|---|---|---|---|
| 1 | Home / Vitrine | `/` | Visitante vê popularidade global; autenticado vê score personalizado |
| 2 | Login | `/entrar` | Suporta PF (CPF/e-mail) e PJ (CNPJ/e-mail) |
| 3 | Cadastro | `/cadastro` | Escolha PF vs PJ; checkboxes LGPD |
| 4 | Esqueceu a senha | `/recuperar-senha` | Fluxo em duas etapas (solicitar + redefinir) |
| 5 | Catálogo | `/produtos` | Listagem com busca, filtros, ordenação por score |
| 6 | Produto individual | `/produtos/[slug]` | Ficha técnica, galeria, favoritar, CTA WhatsApp |
| 7 | Lista de desejos | `/favoritos` | Produtos favoritados com acesso ao contato |
| 8 | Configurações e ajuda | `/conta` | Dados cadastrais, consentimentos LGPD, FAQ, suporte |

### 2.2 Área administrativa (uso interno)

Cadastro de admins feito pela TI; sem auto-signup. Rota separada da área pública.

| # | Página | Rota sugerida | Descrição |
|---|---|---|---|
| A1 | Login admin | `/admin/entrar` | Rota separada; sem link na área pública |
| A2 | Dashboard | `/admin` | KPIs gerais e lista de leads priorizados por score |
| A3 | Lista de usuários | `/admin/usuarios` | Filtros, score, próxima compra provável, categorias |
| A4 | Detalhe de usuário | `/admin/usuarios/[id]` | Scores por produto/categoria, faixas de preço, histórico |
| A5 | Catálogo admin | `/admin/produtos` | Lista com busca e ações de CRUD |
| A6 | Cadastro de produto | `/admin/produtos/novo` | Formulário de criação |
| A7 | Edição de produto | `/admin/produtos/[id]/editar` | Reutiliza formulário de criação |
| A8 | Minha conta | `/admin/conta` | Alterar e-mail, senha, telefone |

### 2.3 Páginas de apoio

| # | Página | Rota | Motivo |
|---|---|---|---|
| S1 | Política de Privacidade | `/privacidade` | Exigência LGPD |
| S2 | Termos de Uso | `/termos` | Exigência LGPD |
| S3 | Erro 404 | — | Boa prática de UX |
| S4 | Banner de cookies (componente global) | — | LGPD; aparece na primeira visita |

## 3. Componentes Ant Design (mapeamento inicial)

Componentes previstos para compor as páginas acima. A lista é referencial; novos componentes podem ser introduzidos conforme a implementação.

| Categoria | Componentes antd |
|---|---|
| Layout | `Layout`, `Menu`, `Breadcrumb`, `Divider` |
| Formulários | `Form`, `Input`, `Input.Password`, `Select`, `DatePicker`, `Checkbox`, `Radio` |
| Dados | `Table`, `List`, `Card`, `Descriptions`, `Statistic`, `Tag` |
| Navegação | `Tabs`, `Pagination`, `Steps` |
| Feedback | `Modal`, `Drawer`, `message`, `notification`, `Popconfirm`, `Spin` |
| Dashboard admin | `Statistic`, `Progress`, `Timeline` + biblioteca de gráficos (Ant Design Charts ou Recharts) para distribuição de scores |

## 4. Fluxos críticos (user flows)

Fluxos a serem detalhados em wireframes ou diagramas separados durante a execução:

1. **Visitante → cadastra conta → oferecer migração de histórico**
   Visitante navega anonimamente, acumula eventos vinculados ao cookie. Ao criar conta, o sistema detecta histórico anônimo e **pergunta** se deseja associá-lo ao novo perfil (transparência LGPD — ver [04-ESPECIFICACAO-TECNICA.md §7](04-ESPECIFICACAO-TECNICA.md)).

2. **Usuário autenticado → clica WhatsApp → evento de conversão**
   Clique dispara um evento classificado como **Conversão Leve** (ou **Forte** se originado da lista de desejos). O evento pausa o decay do produto por 60 dias ([04-ESPECIFICACAO-TECNICA.md §5.4](04-ESPECIFICACAO-TECNICA.md)) e aparece priorizado no dashboard do admin.

3. **Admin → detalhe de usuário → iniciar WhatsApp**
   Admin vê um lead qualificado com score alto, abre a visão detalhada, visualiza faixa de preço com e sem conversão, copia o contato e inicia a conversa via WhatsApp.

4. **Admin → cadastra histórico manual de compras**
   Admin registra compras externas que o sistema não captou. Essas compras são a métrica de maior valor preditivo ([04-ESPECIFICACAO-TECNICA.md §9](04-ESPECIFICACAO-TECNICA.md)); se houver menos de 3 registros para o cliente, o peso é automaticamente zerado para evitar distorção.
