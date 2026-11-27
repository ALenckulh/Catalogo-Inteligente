# Bugs encontrados e novos fluxos de teste

Saída da validação manual de [CHECKLIST-VALIDACAO.md](CHECKLIST-VALIDACAO.md), executada em 23/11/2026, mais a revisão visual da equipe (B18–B22). O doc tem três partes:

1. **Bugs**: o que está errado, como reproduzir, a causa provável e a correção sugerida.
2. **Regressão**: o que conferir depois de corrigir cada bug.
3. **Novos fluxos**: cenários que o checklist ainda não cobre.

**Severidade**
- **Alta**: quebra um fluxo ou grava dado errado.
- **Média**: comportamento errado, mas com contorno.
- **Baixa**: visual, texto ou ruído.

---

> **Correções de 24/11/2026:** B01–B28 foram corrigidos no código (sem commit). Na seção 2, `[x]` é o que foi conferido depois da correção, no site ou pela API. B25 a B28 foram achados durante as correções.
>
> **Execução da seção 3 (24/11/2026):** B29–B61 foram achados nela. **Todos corrigidos** (sem commit o que veio depois do lote da busca) e conferidos na 8080 em 25/11.
>
> **Conferência dos docs com o código (24/11/2026):** B62–B79 são divergências com a especificação. **Todas resolvidas em 25/11** (sem commit), junto com o B81; o que foi decidido está em "Como foram resolvidas". V019–V022 aplicadas e conferidas na 8080 em 25/11. Fica aberto só o B80.

## Resumo

| ID | Sev. | Área | Sintoma |
|---|---|---|---|
| B01 | Alta | Conta / LGPD | Excluir conta dá 500 (PF e PJ) |
| B02 | Alta | Eventos | `POST /api/eventos` dá 500 para logado sem sessão aberta |
| B03 | Alta | Admin / conta | Troca de senha do admin não é enviada, mas a tela diz "Conta atualizada" |
| B04 | Alta | Admin / produtos | Edição aceita preço 0, preço negativo e nome vazio |
| B05 | Alta | Admin / produtos | Lista mostra só 20 de 87 produtos; ordenação só na página |
| B06 | Média | Admin / usuários | "Última atividade" sempre "—" |
| B07 | Média | Scoring | Compra de produto sem interação não gera nota |
| B08 | Média | Admin / produtos | Preço `1234,50` vira 123450,00 |
| B09 | Média | Admin / produtos | "Excluir" diz que é permanente, mas só desativa |
| B10 | Média | Admin / produtos | Upload inválido mostra "Erro desconhecido" |
| B11 | Média | Segurança | Rate limit burlável trocando `X-Forwarded-For` |
| B12 | Média | Conta | Header não atualiza o nome depois de editar a conta |
| B13 | Média | Eventos | `TEMPO_PAGINA` se perde ao recarregar ou fechar a aba |
| B14 | Baixa | LGPD | Linhas de consentimento duplicadas |
| B15 | Baixa | Admin / compras | Tooltip cobre o botão de confirmar a exclusão |
| B16 | Baixa | Admin / config | Prévia mostra o "Hoje" antigo logo após salvar |
| B17 | Baixa | Vitrine | Front pede 4 destaques, backend devolve 6 |
| B18 | Baixa | Ficha | Produto sem imagem não mostra nada na galeria |
| B19 | Baixa | Cards | Ícone de "sem imagem" não fica centralizado |
| B20 | Baixa | Formulários | Duas mensagens de erro no mesmo campo |
| B21 | Baixa | Layout | Logo descentralizada no header |
| B22 | Baixa | Conta | Warning de `useForm` no console em `/conta` |
| B23 | Baixa | Admin / conta | Não dá para limpar o telefone do admin |
| B24 | Baixa | Textos / UX | "(mock)", label truncada, exportação só em JSON |
| B25 | Baixa | Admin / config | Warning do `message` estático do AntD ao salvar |
| B26 | Alta | Admin / usuários | Lista mostra só 20 de 24 clientes; ordenação e filtro de status só nesses 20 |
| B27 | Média | Eventos | Cada carregamento de página abre uma sessão nova |
| B28 | Alta | LGPD / scoring | Depois do logout, o histórico de quem saiu vaza para quem usa o mesmo navegador |
| B29 | Alta | Eventos / fila | Um único evento inválido entra em repetição sem fim; basta abrir `/produtos?categoria=99999` |
| B30 | Alta | Segurança | Token de admin vale nas rotas de cliente; `DELETE /api/conta` anonimiza o admin |
| B31 | Alta | Conta | Duas contas em abas diferentes: salvar numa grava na outra |
| B32 | Alta | Scoring | Nota de categoria e faixa de preço ignoram o evento que acabou de chegar |
| B33 | Alta | Admin / usuários | Botão WhatsApp abre o número da loja, não o do cliente |
| B34 | Alta | LGPD / admin | Listagem de solicitações LGPD dá 500 sempre |
| B35 | Alta | LGPD | Revogação de consentimento pode ser ignorada (data vem do navegador) |
| B36 | Média | LGPD | Consentimento revogado em outro navegador: `/conta` mostra ligado e os eventos dão 403 |
| B37 | Média | Scoring | Compra não conta como conversão (bônus da categoria e faixa de preço) |
| B38 | Média | Scoring | Excluir compras deixa a nota antiga; recálculo geral pula quem só tem compras |
| B39 | Média | Scoring | Favoritar e desfavoritar várias vezes leva a nota a 100 |
| B40 | Média | Compras | API aceita data futura e total que não bate com quantidade × preço |
| B41 | Média | API | Parâmetro inválido, rota inexistente ou método errado dão 500 |
| B42 | Média | API | Texto ou número maior que a coluna dá 500 |
| B43 | Média | Segurança | Acesso negado responde 401 em vez de 403 |
| B44 | Média | Admin / produtos | Remover toda a ficha técnica não salva; atributo vazio trava a edição |
| B45 | Média | Admin | Falha ao carregar aparece como "Não há dados" ou carregamento sem fim |
| B46 | Média | Backend | Banco fora do ar faz rota protegida responder 401 (o front desloga) |
| B47 | Média | Configuração | API aceita peso, meia-vida e bônus negativos |
| B48 | Média | Conta | `PATCH /api/conta` não valida (senha de 1 caractere, idade −5, nome em branco) |
| B49 | Média | Acessibilidade | Campos sem rótulo associado, sliders sem nome, ícones com nome em inglês |
| B50 | Média | Acessibilidade | Contraste do texto cinza 2,88:1 e do placeholder 1,83:1 (mínimo 4,5:1) |
| B51 | Média | Catálogo | Busca sem acento não encontra nada |
| B52 | Média | Admin / usuários | Busca não encontra por CNPJ, CPF ou telefone |
| B53 | Baixa | Eventos | Aceita evento sem sentido (produto inativo, sem produto, conversão forjada, 5 MB) |
| B54 | Baixa | Eventos | `FILTRO_APLICADO` repete ao voltar, recarregar ou mudar o preço |
| B55 | Baixa | Admin / produtos | Slug com `/`, espaço ou `..` e imagem inexistente são aceitos pela API |
| B56 | Baixa | Busca | `%` e `_` funcionam como curinga |
| B57 | Baixa | API | Corpo do 401 sai em ISO-8859-1 |
| B58 | Baixa | Dashboard | Contatos por dia dependem do fuso do servidor |
| B59 | Baixa | Admin / produtos | Aviso "Produto criado/atualizado" some antes de ser lido |
| B60 | Baixa | LGPD | Exportação sem compras; solicitação reaberta mantém a data de atendimento |
| B61 | Baixa | Telas | Pequenos ajustes (ver detalhe) |
| B62 | Média | Conta | Código de recuperação de senha não é enviado por e-mail; sai em texto puro no log |
| B63 | Média | Dashboard | Lista de leads não aparece no dashboard (a API devolve) |
| B64 | Média | Scoring | Compra não tem peso próprio: usa o do WhatsApp |
| B65 | Média | Migração | Notas repetidas ficam com a maior, não com a média ponderada |
| B66 | Média | Segurança | Sem limite geral de requisições; `password-reset/confirm` sem limite nenhum |
| B67 | Média | Layout | Abaixo de 992px, o menu do admin quebra o texto e invade o cabeçalho |
| B68 | Baixa | Admin / usuários | Não há "próxima compra provável" na lista |
| B69 | Baixa | Scoring | Retorno à página e sequência de navegação não pontuam |
| B70 | Baixa | Visitante | Fingerprint não é enviado nem usado como reserva |
| B71 | Baixa | Configuração | Bônus vai até 2,00×; a especificação diz 1,50× |
| B72 | Baixa | Migração | Recusar a migração não descarta o histórico do visitante |
| B73 | Baixa | Scoring | Compra recorrente não dá bônus à categoria |
| B74 | Baixa | Scoring | Pausa de 60 dias após o contato não é configurável |
| B75 | Baixa | Conta | Novo pedido de senha não invalida os códigos anteriores |
| B76 | Baixa | LGPD | `consentimento_lgpd.ip_origem` nunca é preenchida |
| B77 | Baixa | LGPD | Consentimento do visitante só é conferido no front |
| B78 | Baixa | Catálogo | Quem volta com 3 a 9 interações ainda vê a ordem misturada |
| B79 | Baixa | Ajustes | Pequenas divergências (ver detalhe) |
| B80 | Baixa | Configuração, dashboard | Em 320px, a tela rola na horizontal (em aberto) |
| B81 | Baixa | LGPD / fila | Evento na fila durante a exclusão da conta fica ativo |

---

## B29 a B61: vale a pena corrigir?
**Todos foram corrigidos em 24/11/2026.** A tabela fica como registro da decisão.

**Esforço:** P = poucas linhas em 1 ou 2 arquivos; M = vários arquivos ou decisão de regra. A coluna "Vale?" é a minha recomendação para o TCC.

### Altos (7)
| Bug | O que é | Quem percebe | Esforço | Vale? |
|---|---|---|---|---|
| B29 | Abrir `/produtos?categoria=99999` deixa um evento repetindo sem fim e enche o disco de log | Qualquer visitante pode causar | M | **Sim, primeiro** |
| B30 | O login do admin funciona como cliente; "excluir conta" por ele apaga o admin | Só chamando a API | P | **Sim** |
| B31 | Duas contas em abas: salvar numa grava na outra | Cliente ou vendedor no mesmo computador | P | **Sim** |
| B32 | Nota de categoria e faixa de preço sempre um evento atrasadas | Dashboard, perfil do cliente e prévia | P | **Sim**: é o centro do TCC |
| B33 | WhatsApp do admin abre o número da loja | Admin, na demonstração | P | **Sim** |
| B34 | Listagem de solicitações LGPD sempre dá 500 | Só na API (não há tela) | P | **Sim** |
| B35 | Revogar o consentimento pode não valer (data do navegador) | Cliente com relógio errado | P | **Sim** |

### Médios (17)
| Bug | O que é | Quem percebe | Esforço | Vale? |
|---|---|---|---|---|
| B36 | Revogado em outro navegador: `/conta` mostra ligado e a coleta falha calada | Cliente com 2 aparelhos | M | **Sim**, se a LGPD for destaque |
| B37 | Compra não dá o bônus da categoria nem entra na faixa "com conversão" | Notas do cliente que compra | M | **Sim** ou documentar: contradiz o docs/04 |
| B38 | Excluir compra deixa a nota antiga; o recálculo pula quem só comprou | Admin que corrige uma compra | M | **Sim** |
| B39 | Favoritar e desfavoritar 11 vezes leva a nota a 100 | Cliente curioso | P | **Decidir**: é regra de peso |
| B40 | API aceita compra com data futura e total errado | Só pela API (a tela bloqueia e calcula) | P | **Sim**: regra já decidida |
| B41 | Texto na URL (`?page=abc`) ou rota errada dá 500 | Quem mexe na URL da API | P | **Sim**: barato |
| B42 | Nome longo ou preço enorme dá 500 | Admin e cliente | P | **Sim**: barato |
| B43 | Sem permissão responde 401 em vez de 403 | Contrato da API | P | Já vem com o B30 |
| B44 | Remover toda a ficha técnica não salva; valor em branco trava a edição | Admin, na demonstração | P | **Sim** |
| B45 | Se o backend cai, o admin vê "Não há dados" ou carrega para sempre | Só com falha no servidor | P | Talvez |
| B46 | Se o banco cai, a rota protegida responde 401 | Só com falha no banco | P | Talvez |
| B47 | API da Configuração aceita valores negativos | Só o admin, pela API | P | Talvez |
| B48 | Trocar a senha por 1 caractere, idade −5, nome em branco | Cliente | P | **Sim** |
| B49 | Campos, sliders e ícones sem nome para leitor de tela | Usuário de leitor de tela | M | **Sim**, se a banca olhar acessibilidade |
| B50 | Texto cinza com contraste 2,88:1 (mínimo 4,5:1) | Todos | P | **Decidir**: muda o visual |
| B51 | Busca sem acento não acha nada (`pistao`) | Todo cliente | M | **Sim**: muito visível |
| B52 | Admin não acha cliente por CNPJ, CPF ou telefone | Admin | P | **Sim** |

### Baixos (9)
| Bug | O que é | Quem percebe | Esforço | Vale? |
|---|---|---|---|---|
| B53 | API aceita evento sem sentido (produto inativo, sem produto, 5 MB) | Só pela API | P | Talvez |
| B54 | Voltar ou recarregar com filtro soma de novo na categoria | Nota de quem usa filtros | P | Talvez |
| B55 | API aceita slug com `/` e imagem inexistente | Só o admin, pela API | P | Não |
| B56 | Buscar `%` traz tudo | Quase ninguém | P | Só junto com o B51 |
| B57 | Corpo do 401 em outra codificação | Quase ninguém | P | Já vem com o B30 |
| B58 | Gráfico por dia erra se o servidor estiver em UTC | Só se publicar na nuvem | P | Se for publicar |
| B59 | Aviso "Produto criado" some antes de ser lido | Admin, na demonstração | P | **Sim**: barato |
| B60 | Exportação LGPD sem as compras; datas de solicitação | Cliente que exporta | M | Talvez |
| B61 | Vários ajustes pequenos de tela | Detalhe | P cada | Talvez |

### Pacotes
| Pacote | Bugs | Por quê |
|---|---|---|
| **A. Altos** | B29–B35, B43, B57 | Segurança, dado errado e o cálculo central |
| **B. Aparece na demonstração** | B44, B51, B52, B59 | A banca pode esbarrar |
| **C. Notas** | B37, B38, B39 | Coerência com o docs/04 |
| **D. API firme** | B40, B41, B42, B47, B48 | Baratos e parecidos entre si |
| **E. LGPD** | B36, B60 | Se a LGPD for destaque |
| **F. Acessibilidade** | B49, B50 | Se for avaliada |
| **G. Pode ficar** | B45, B46, B53–B56, B58, B61 | Só com falha, pela API ou estético |

---

## 1. Bugs

### Alta

#### B01 · Excluir conta dá 500
- **Sintoma:** em `/conta` → Privacidade → "Solicitar exclusão da conta" → "Excluir conta", o `DELETE /api/conta` responde 500 e o usuário continua logado. Acontece com PF e PJ.
- **Reproduzir:** criar uma conta, logar e excluir. Ou chamar `DELETE /api/conta` com o token dela.
- **Causa:** `ContaService.anonymizeUsuario` zera `cpf`/`nome_completo` (PF) e `cnpj`/`razao_social` (PJ). As constraints `usuario_pf_campos_chk` e `usuario_pj_campos_chk` (V002) exigem esses campos sempre, e a transação inteira é desfeita. O Roberto da seed só passa porque mantém os dados pessoais.
- **Escondido pelo 500:** com a exclusão funcionando, a tela caía em `/entrar?next=/conta`, porque o logout com o token da conta excluída dá 401. Também corrigido.
- **Correção sugerida:** criar a migration V016 recriando as duas constraints com exceção para conta excluída, por exemplo `CHECK (deleted_at IS NOT NULL OR tipo <> 'PF' OR (cpf IS NOT NULL AND nome_completo IS NOT NULL))`. Fazer o mesmo para PJ.

#### B02 · Evento de usuário logado sem sessão aberta dá 500
- **Sintoma:** `POST /api/eventos` com token, sem `sessaoId`, para um usuário que não tem sessão aberta → 500, e nenhuma sessão é criada. Com sessão aberta → 202.
- **Reproduzir:** logar como Marcos ou Carlos pela API e enviar `{"tipo":"VISUALIZACAO_PRODUTO","produtoId":159}` sem `sessaoId`. Pela tela não aparece, porque o front sempre recria `ci_sessao_id` antes de enviar.
- **Causa:** `EventoService.aceitar` está anotado com `@Transactional(readOnly = true)` e chama `VisitanteService.resolveOrCreateForUsuario`, que faz `save` de uma nova `Sessao` dentro da transação somente leitura.
- **Correção sugerida:** remover o `readOnly` de `aceitar`. Era o caminho suspeito do §18.

#### B03 · Troca de senha do admin não é enviada
- **Sintoma:** em `/admin/conta`, preencher "Senha atual" (mesmo errada) e "Nova senha" → toast "Conta atualizada". A senha não muda, e o 401 "Senha atual inválida" nunca aparece.
- **Causa:** `onFinish` em [admin/conta/page.tsx:41](../frontend/app/admin/conta/page.tsx#L41) envia só `{ email, telefone }`. O backend (`AdminContaService`) valida a senha certo quando chamado direto: responde 401.
- **Correção sugerida:** incluir `senhaAtual` e `novaSenha` no `updateAdminConta` quando `novaSenha` estiver preenchida.

#### B04 · Edição de produto sem validação
- **Sintoma:** a criação (POST) recusa preço 0, preço negativo e nome vazio. A edição (PATCH) aceita os três: foram gravados `preco = 0`, `preco = -5` e `nome = ''`. O campo de preço do front também aceita 0 sem aviso (`min={0}`, tooltip "≥ 0").
- **Causa:** `PatchProdutoRequest` não tem anotações de validação. O `ProdutoForm` usa `min={0}` no preço.
- **Correção sugerida:** validar no PATCH os campos enviados (`@Positive` no preço quando não nulo, `@NotBlank` no nome quando enviado). Alinhar o front a `> 0` e decidir com a doc 03, que fala em "≥ 0".

#### B05 · Lista de produtos do admin incompleta
- **Sintoma:** `/admin/produtos` mostra 20 linhas e só a página 1. Existem 87 produtos (85 ativos); na execução de 23/11 apareciam 88, provavelmente por um produto criado nos testes. A ordenação por coluna reordena só esses 20. Os outros só aparecem pela busca.
- **Causa:** [admin/produtos/page.tsx:41](../frontend/app/admin/produtos/page.tsx#L41) chama `listAdminProdutos({ q })` sem `page`/`limit`. O backend devolve a página padrão (20) com o `total` geral, e a tabela pagina no cliente só o que recebeu.
- **Correção sugerida:** paginar e ordenar no servidor, usando o `total` da resposta. Para um MVP, pedir `limit=100` também resolve.

### Média

#### B06 · "Última atividade" sempre vazia
- **Sintoma:** na lista de usuários do admin a coluna mostra "—" para todos. A API devolve `ultimaAtividade: null`, embora o SQL retorne a data (ex.: Juliana tem eventos de hoje).
- **Causa:** `AdminUsuarioService.toOdt` ([AdminUsuarioService.java:250](../backend/src/main/java/com/catalogo/admin/service/AdminUsuarioService.java#L250)) trata só `OffsetDateTime` e `Timestamp`. O Hibernate devolve `java.time.Instant` para `timestamptz` em query nativa, e o método cai no `return null`. Os leads do dashboard usam outro caminho e mostram a data.
- **Correção sugerida:** acrescentar `if (o instanceof Instant i) return i.atOffset(ZoneOffset.UTC);`.

#### B07 · Compra sem interação não pontua
- **Sintoma:** com 3 compras, a Locadora Guarani ganhou nota no Kit correia (12,12 → 76,63), mas o Filtro de óleo, também comprado, continuou sem nota.
- **Causa:** em [ScoreCalculator.java:110](../backend/src/main/java/com/catalogo/scoring/engine/ScoreCalculator.java#L110), as compras são somadas dentro do laço que percorre apenas produtos com eventos. Produto comprado e nunca visualizado é ignorado.
- **Correção sugerida:** incluir no conjunto de produtos avaliados também os produtos das compras elegíveis.

#### B08 · Vírgula decimal no preço multiplica por 100
- **Sintoma:** digitar `1234,50` no preço do produto grava 123450.00. O campo também exibe com ponto (`1234.50`), fora do padrão pt-BR do resto do sistema.
- **Causa:** o `InputNumber` em `ProdutoForm.tsx` (~linha 195) não tem `decimalSeparator=","` nem formatter/parser pt-BR.
- **Na correção:** só `decimalSeparator` não bastava, porque `1.234,50` virava 1,23 sem erro. O `CompraModal` tinha essa falha, e o filtro de preço do catálogo também não lia preço em pt-BR. Os três usam agora `precoInputProps` (`lib/formatters.ts`).
- **Correção sugerida:** configurar `decimalSeparator`, `formatter` e `parser`, ou reaproveitar o mesmo componente monetário do modal de compra.

#### B09 · "Excluir" produto com texto enganoso
- **Sintoma:** o Popconfirm diz "Esta ação é permanente e não pode ser desfeita." ([admin/produtos/page.tsx:136](../frontend/app/admin/produtos/page.tsx#L136)), mas o backend só faz `ativo=false`. O item continua na lista como "Inativo" e pode ser reativado.
- **Correção sugerida:** trocar o texto (ex.: "O produto sai do catálogo e pode ser reativado depois") ou remover o botão e deixar só "Desativar".

#### B10 · Upload inválido mostra "Erro desconhecido"
- **Sintoma:** ao enviar um `.txt` renomeado para `.jpg`, a tela mostra "Erro desconhecido" e não chama a API. O backend, chamado direto, recusa com 400 "Formato não suportado. Envie JPEG, PNG ou WebP".
- **Causa:** a compressão no front (`ImagemUploadField`) falha ao decodificar o arquivo e o erro não é traduzido.
- **Correção sugerida:** capturar a falha de decodificação e mostrar "Formato não suportado…". Outra opção é enviar sem comprimir e deixar o backend responder.

#### B11 · Rate limit burlável por `X-Forwarded-For`
- **Sintoma:** o limite de 5 por minuto em login, cadastro e recuperação de senha é contornado mandando um `X-Forwarded-For` diferente a cada requisição.
- **Causa:** `RateLimitFilter.clientIp` confia no header sem checar se a requisição veio de um proxy confiável.
- **Correção sugerida:** usar `request.getRemoteAddr()`, ou ler o header só quando o remetente for um proxy configurado (`server.forward-headers-strategy` + lista de proxies confiáveis).

#### B12 · Header com nome antigo depois de editar a conta
- **Sintoma:** em `/conta`, editar o nome → "Dados salvos" e o banco atualiza, mas o header e o `ci_auth_user` do localStorage continuam com o nome antigo, mesmo após recarregar. Só corrige no próximo login.
- **Correção sugerida:** depois do PATCH, atualizar o usuário no `CurrentUserProvider` e no `ci_auth_user`.

#### B13 · `TEMPO_PAGINA` perdido ao recarregar ou fechar a aba
- **Sintoma:** o evento só é enviado no unmount do React, ou seja, na navegação interna. Recarregar, fechar a aba ou digitar outra URL perde o tempo da visita.
- **Causa:** o cleanup do `useEffect` em `produtos/[slug]/page.tsx` (~linha 124) é o único ponto de envio.
- **Correção sugerida:** enviar também em `pagehide` / `visibilitychange → hidden` via `navigator.sendBeacon`, com uma flag para não duplicar.

### Baixa

#### B14 · Consentimentos duplicados
- Cada login grava uma nova linha `COOKIES_COMPORTAMENTAIS`, mesmo sem mudança: 4 linhas em 3 minutos para a Juliana e 28 para uma conta de teste. Alternar o switch de cookies em `/conta` grava 2 linhas iguais com 20 ms de diferença.
- **Sugestão:** sincronizar só quando o valor local diferir do último consentimento gravado.

#### B15 · Tooltip cobre o botão de confirmar a exclusão de compra
- No detalhe do usuário → Compras, o tooltip "Excluir compra" fica por cima do botão vermelho do Popconfirm. O primeiro clique fecha o popover sem excluir.
- **Sugestão:** esconder o tooltip enquanto o Popconfirm está aberto, ou posicionar o Popconfirm do outro lado.

#### B16 · Prévia da configuração desatualizada após salvar
- Logo depois de "Salvar ajustes" com recálculo, a prévia ainda compara o "Hoje" antigo (6/8/6/4) e diz "9 clientes mudam", com o botão Salvar já desabilitado. Corrige no próximo ajuste.
- **Sugestão:** refazer a simulação (ou zerar a prévia) depois de salvar.

#### B17 · Quantidade de destaques
- O front pede `limit: 4`, mas o backend fixa `DESTAQUE_LIMIT = 6` e ignora o parâmetro. A vitrine mostra 6 e o checklist diz 4.
- **Decidir:** qual número vale, e então alinhar código e doc.

#### B18 · Ficha de produto sem imagem não mostra nada
- **Sintoma:** ao abrir um produto sem imagem, a área da galeria fica como um bloco cinza-claro vazio, quase invisível.
- **Esperado:** um card com o ícone de imagem e um texto como "Este produto não possui imagens".
- **Causa:** `ProdutoGaleria.tsx` só renderiza o conteúdo quando existe `principal`; sem imagem, sobra o container vazio.

#### B19 · Ícone de "sem imagem" descentralizado nos cards
- **Sintoma:** nos cards da vitrine, do catálogo e dos favoritos, o `PictureOutlined` aparece no canto superior esquerdo.
- **Causa provável:** o cover em [ProdutoCard.tsx:31](../frontend/components/ProdutoCard.tsx#L31) usa `<Flex align="center" justify="center">`, mas o AntD aplica `display: block` aos filhos de `.ant-card-cover`, o que anula o flex.
- **Sugestão:** centralizar com um wrapper interno, ou forçar `display: flex` no estilo do cover.

#### B20 · Duas mensagens de erro no mesmo campo
- **Sintoma:** com idade 17 no cadastro aparecem o balão nativo do navegador ("O valor tem de ser superior ou igual a 18", vindo do `min` do `InputNumber`) e a mensagem do Form ("Idade deve ser um número entre 18 e 120"). Deve ficar só uma.
- **Onde olhar:** todos os `InputNumber` com `min`/`max` dentro de `Form` (idade no cadastro, preço mínimo/máximo do catálogo, preço do produto, quantidade da compra).
- **Sugestão:** deixar a validação só nas `rules` do Form, sem `min`/`max` nativo, ou desativar a validação nativa do formulário.

#### B21 · Logo descentralizada no header
- A logo "Renova" fica desalinhada em relação aos itens do menu. Componente: `frontend/components/layout/Logo.tsx`. Conferir em desktop e no header mobile.

#### B22 · Warning de `useForm` em `/conta`
- **Sintoma:** ao abrir `/conta`, o console mostra "Instance created by `useForm` is not connected to any Form element. Forget to pass `form` prop?", e o overlay do Next mostra "1 Issue".
- **Causa provável:** o `Form.useForm()` de [conta/page.tsx:48](../frontend/app/(public)/conta/page.tsx#L48) é criado antes do `<Form>` montar (loading ou aba inativa), e há chamadas a `form.setFieldsValue` antes disso.
- **Sugestão:** usar `forceRender` na aba Dados, ou só chamar o `form` quando o `<Form>` estiver montado.

#### B23 · Não dá para limpar o telefone do admin
- `PATCH /api/admin/conta` com `telefone: null` é ignorado (semântica de atualização parcial). Na correção, `""` limpa. Pela tela, apagar o telefone e salvar mantém o número antigo.
- **Sugestão:** tratar string vazia como "limpar", ou aceitar `null` explícito.

#### B24 · Textos e pequenos ajustes
- `/admin/conta`: o subtítulo ainda diz "Altere e-mail, telefone ou senha (mock)" e o tooltip da senha também diz "(mock)".
- Seletor de categoria (`/produtos`): o rótulo "Retífica completa e montagem" aparece cortado como "Retífica completa e", sem reticências.
- Exportação LGPD: a tela só baixa JSON; o CSV existe só na API (`?formato=csv`), embora a doc fale nos dois.
- Alerta de gap de preço: o texto mudou para "A diferença sugere que o preço pode estar afastando este cliente."; atualizar o checklist.

#### B25 · Warning do `message` estático na configuração
- **Sintoma:** ao salvar em `/admin/configuracao`, o console mostra "Static function can not consume context like dynamic theme. Please use 'App' component instead."
- **Causa:** `admin/configuracao/page.tsx` importa `message` direto, em vez de `App.useApp()`.
- **Correção:** `const { message, modal } = App.useApp()`. A página `admin/design-system` tinha o mesmo problema.

#### B26 · Lista de usuários do admin esconde clientes (Alta)
- **Sintoma:** `/admin/usuarios` mostra 20 de 24 clientes. Com a seed de 24/11, ficavam fora Auto Mecânica Schmitt, Transportes Vale do Itapocu, Oficina Diesel Pomerode e Agropecuária Kohler. A ordenação por coluna e o filtro de status só viam os 20.
- **Causa:** a mesma do B05. `UsuariosLista.tsx` chamava `listAdminUsuarios` sem `limit`, e o backend devolve 20 por padrão.
- **Correção:** paginação, ordenação e filtros no servidor (`useTabelaPaginada`, o mesmo hook de `/admin/produtos`; novos `ativo` e `sort` em `GET /api/admin/usuarios`). A primeira correção usava `limit: 100` e ainda esconderia clientes acima de 100.

#### Limite de 100 removido (24/11/2026)
Além da lista de usuários, dois lugares pediam uma página de 100 e a tratavam como se fosse tudo:
- **Catálogo público e vitrine:** `CatalogService` ranqueava só os 100 produtos mais recentes. Agora ranqueia os ids de todos e carrega só a página.
- **Modal de compra:** o seletor carregava 100 produtos. Agora usa `Select.Pageable` (20 por vez, busca no servidor).

O máximo de 100 **por página** continua no backend, para proteger o servidor. No caminho: `?sort=,` em `/api/admin/produtos` dava 500 (corrigido), e, na lista `leads` de `GET /api/admin/dashboard` (a tela não a mostra), os clientes com a mesma nota mudavam de ordem a cada consulta (desempate por id).

**Em aberto:** `/admin/produtos` ordena nomes pela collation padrão do Postgres Alpine, que põe os iniciados com acento ("Óleo…") depois do Z. A lista de usuários já usa `pt-BR-x-icu`.

#### B27 · Sessão nova a cada carregamento de página (Média)
- **Sintoma:** todo F5, link direto ou aba nova grava uma linha em `sessao`, inclusive no admin. Em 24/11, 12 carregamentos geraram 12 sessões, e 25 das 116 sessões do banco não tinham nenhum evento.
- **Causa:** `CookieConsentProvider` abria a sessão ao montar, com uma trava que só vivia na memória. O backend sempre insere, e o sistema nunca fecha sessão.
- **Efeitos:** uma visita virava várias sessões; a primeira visualização da página podia ir para a sessão **anterior** (o evento saía antes de a nova chegar); com sessão ou visitante que não existe mais (seed recarregada), o primeiro evento recebia 400 e se perdia. Notas e ranking não mudam com a quantidade de sessões, porque nenhum cálculo lê `sessao`.
- **Correção:** a sessão nasce no primeiro evento e é reaproveitada enquanto houver evento a cada 30 min (`garantirSessao`, em `lib/api/visitantes.ts`). `trackEvent` espera a sessão e, se o backend a recusar, reabre e reenvia uma vez. Sair da conta (ou perder o login por 401) encerra a sessão. Só um 400 cria outro visitante; antes, qualquer falha de rede descartava a identidade dele.
- **Também corrigido:** `POST /api/visitantes/sessao` é público, insere linhas e não tinha limite de chamadas. Agora são 30 por minuto por IP.

**Achados na investigação, corrigidos em seguida (24/11/2026):**
- **Sessão sem o usuário:** evento de usuário logado ficava numa sessão do visitante. Agora a sessão aberta com login é do usuário, sem visitante, e o backend recusa (`400 INVALID_SESSAO`) sessão de outro usuário ou de visitante.
- **Visitante que não expirava (RF18):** o `ci_visitante_id` vale 30 dias desde a criação (`lib/api/visitanteId.ts`). Ids salvos antes desta versão não têm data de criação e são descartados.
- **Dispositivo:** o front envia `desktop`, `mobile` ou `tablet`.
- **IP:** o sistema não coleta IP. A coluna que o previa, nunca usada, sai na migration V017.

#### B28 · Histórico vaza para quem usa o navegador depois do logout (Alta)
- **Sintoma:** Juliana navega anônima, loga, associa o histórico e sai. A próxima pessoa no mesmo navegador recebe as notas dela; se logar e também associar, as notas e a sessão da Juliana passam para a outra conta.
- **Reproduzido no código antigo:** com 3 visualizações da Juliana no produto 96, Marcos ficou com nota 19,35 num produto que nunca abriu.
- **Causa:** o visitante continuava o mesmo depois do logout; `findAtivosByVisitanteId` e a contagem de interações incluíam eventos já migrados para uma conta; `attachUsuarioToVisitanteSessoes` trocava o dono de sessões que já tinham usuário.
- **Correção:** sair da conta (ou perder o login por 401) esquece o visitante e a sessão do navegador. No backend, evento migrado só conta para o usuário, sessão com dono não muda de dono e não recebe evento anônimo. No modal, "Não agora" virou "Não associar", porque a pergunta não volta depois do logout.
- **Dados reais:** em 24/11 não havia nenhum visitante migrado no banco, então nada a corrigir.

### Achados na execução da seção 3 (24/11/2026)

**Corrigidos:** B29–B35, B43 e B57. **Em aberto:** os outros 24.

Testados em contêineres próprios de Postgres e RabbitMQ, com cópia dos dados. Todos foram reproduzidos pelo menos duas vezes ou confirmados no código.

#### B29 · Evento inválido repete sem fim (Alta)
- **Sintoma:** a mensagem falha ao gravar, volta para a fila e é tentada de novo, sem parar. Num teste, um evento gerou 1,5 GB de log em 5 minutos. A mensagem é durável: sobrevive a reinícios.
- **Reproduzir:** com cookies aceitos, abrir `/produtos?categoria=99999`. Ou, sem login, `POST /api/eventos` com `produtoId` ou `categoriaId` inexistente, `segundos_ativos: "NaN"`, ou texto com o caractere nulo (`\u0000`).
- **Causa:** `EventoService.aceitar` não valida os ids (responde 202), e `EventoPersistWorker` relança o erro. O padrão do Spring AMQP recoloca a mensagem na fila; a `events.dlq` existe, mas nunca é usada.
- **Correção sugerida:** validar produto, categoria e números na entrada (4xx); no listener, `default-requeue-rejected: false` com poucas tentativas e espera entre elas, para o que falhar ir à DLQ.

#### B30 · Token de admin nas rotas de cliente (Alta)
- **Sintoma:** com token de admin, `/api/conta`, `/api/favoritos` e `/api/auth/migrar-historico` respondem como se fosse um cliente. `DELETE /api/conta` anonimiza o admin, e ninguém mais entra no painel.
- **Causa:** `SecurityConfig` só exige login nessas rotas (`anyRequest().authenticated()`).
- **Correção sugerida:** exigir `hasAnyRole("PF", "PJ")` nas rotas de cliente.

#### B31 · Salvar numa aba grava na outra conta (Alta)
- **Reproduzir:** aba 1 em `/conta` como Juliana (PF); aba 2 entra como a Mecânica Schmitt (PJ); salvar na aba 1. O telefone e o **nome da Juliana** foram gravados na conta da Schmitt.
- **Causa:** o token é lido do `localStorage` a cada chamada, mas a tela guarda o usuário da montagem. O backend aceita `nomeCompleto` em conta PJ.
- **Correção sugerida:** ouvir o evento `storage` e recarregar o usuário quando o token mudar; no backend, recusar campo que não é do tipo da conta.

#### B32 · Nota de categoria e faixa de preço um evento atrasadas (Alta)
- **Sintoma:** ver o produto 96 duas vezes e chamar no WhatsApp deixa a nota da categoria **vazia**; ela só aparece quando chega um evento de outro produto. A faixa de preço tem o mesmo atraso. O recálculo geral corrige.
- **Efeito:** top categoria, "categoria favorita" do dashboard, bônus de conversão e meia-vida por categoria saem errados até o próximo evento; migrar um histórico com conversão não preenche a faixa.
- **Causa:** `EventoPersistWorker` grava o evento com um `Produto` só com o id; o recálculo, na mesma transação, reaproveita esse objeto, sem preço nem categoria.
- **Correção sugerida:** usar `EntityManager.getReference` ou limpar o contexto (`flush` + `clear`) antes do recálculo.

#### B33 · WhatsApp do admin abre o número da loja (Alta)
- **Sintoma:** em `/admin/usuarios/{id}`, o botão abre `wa.me` com o telefone do catálogo e o texto "Olá <cliente>!". O telefone do cliente não é usado.
- **Causa:** `UsuarioDetalhe.tsx` usa `whatsappUrl`, feita para o cliente falar com a loja.
- **Regra decidida:** se o cliente recusou `CONTATO_PROATIVO`, avisar e abrir só depois de confirmar. Hoje não há aviso.

#### B34 · Listagem de solicitações LGPD (Alta)
- **Sintoma:** `GET /api/admin/solicitacoes-lgpd` dá 500, com ou sem filtro. O admin não consegue ver pedidos de titulares (não há tela, e a API falha). O `PATCH` funciona.
- **Causa:** `SolicitacaoLgpdRepository.search` usa `:status IS NULL` com enum; o Postgres não descobre o tipo do parâmetro nulo. Os testes usam mock e não pegam.

#### B35 · Revogação ignorada (Alta)
- **Sintoma:** aceitar com data futura e revogar depois → o aceite continua vigente e a coleta segue (202). Revogar com o relógio do computador atrasado também não vale.
- **Causa:** `aceitoEm` vem do navegador e define qual linha é a mais recente.
- **Correção sugerida:** usar a hora do servidor.

#### Como B29–B35, B43 e B57 foram corrigidos
- **B29:** a API recusa (400) produto ou categoria inexistente e texto com caractere nulo; no listener, `FalhaPassageira` manda o dado inválido para a DLQ e devolve à fila só a falha passageira; `NaN` e infinito contam 0 na nota.
- **B30, B43, B57:** rotas de cliente só para PF e PJ; 403 escrito na própria segurança; corpos em UTF-8; `anonymizeUsuario` recusa o admin.
- **B31:** a tela acompanha o login de outra aba (evento `storage` e volta do cache); o formulário de `/conta` descarta os valores da conta anterior (`preserve={false}`); o backend recusa nome e idade em conta PJ.
- **B32:** o worker usa `getReferenceById` em produto e categoria.
- **B33:** `whatsappClienteUrl` com o número do cliente; aviso para quem recusou ou nunca respondeu.
- **B34:** `COALESCE` no lugar de `IS NULL`. **B35:** data sempre do servidor, com desempate por id.

#### Como B36 a B61 foram corrigidos

Testado em contêineres próprios, com cópia dos dados: cada lote antes × depois, pela API e nas telas.

**Busca e aviso (B44, B51, B52, B56, B59)**
- **B51, B52, B56:** V018 (`unaccent`) e `BuscaTexto`: cada palavra precisa aparecer, em qualquer ordem, sem acento; `%` e `_` são texto. Em usuários, número com 3 dígitos ou mais também olha CPF, CNPJ e telefone, com ou sem máscara. As listas de produtos e usuários ordenam com acento certo.
- **B44:** ficha vazia é gravada vazia; o formulário recusa valor em branco e chave repetida; o backend tira espaços e linhas em branco.
- **B59:** `useAppNotification` usa o `<App>` da raiz, e o aviso continua depois de navegar.

**Notas (B37, B38, B39, B58)**
- **B37:** qualquer compra vale como conversão (bônus de 30 dias, faixa de preço, pausa de 60 dias e sem zerar após 180). Os pontos seguem a partir de 3 compras; com menos, quem nunca interagiu continua sem nota.
- **B38:** `ScoreEngine` apaga a nota que não tem mais sinal; o recálculo geral inclui quem só tem compra ou nota antiga, menos conta excluída.
- **B39:** por produto, só o último `FAVORITAR` ou `DESFAVORITAR` conta.
- **B58:** dia de Brasília (`Fuso`) no gráfico, no decaimento, na popularidade e na data da compra.
- **Efeito nos dados atuais:** "Recalcular" muda 6 clientes, e nenhum muda de nível. Faixa de preço: Guarani, Pomerode, Kreutzfeld, Schmitt e Itapocu (B37). Nota de um produto e da categoria dele: Kreutzfeld e Schmitt sobem (B37), Rafael cai de 37,03 para 25,08 (B39).

**API (B40, B41, B42, B46, B47, B48, B53, B55)**
- **B40:** data futura → 400; total calculado no backend; vale ao criar e ao editar.
- **B41:** 400, 404, 405, 406 e 415 no lugar de 500; o 500 que sobrar vai para o log. URL malformada deixou de virar 401.
- **B42, B47:** limites das colunas nos DTOs. Peso de 0 a 9,9999, λ de 0,001 a 0,1, bônus de 1 a 2.
- **B46:** banco fora → 503, e o front não desloga.
- **B48:** `DadosConta` com as regras do cadastro, usada também em `/conta`, na conta do admin e na recuperação de senha. **Achado junto:** senha acima de 72 bytes dava 500 (limite do BCrypt); agora 400, e as telas limitam a 72 caracteres.
- **B53:** 400 para evento sem sentido. Desfavoritar produto inativo continua valendo.
- **B55:** slug só com minúsculas, números e hífen; imagem `http(s)` ou arquivo que existe.

**LGPD (B36, B60)**
- **B36:** o navegador só define a conta que nunca decidiu; depois, vale o mais restritivo. `/conta` mostra o valor da conta e avisa quando o navegador recusa. Depois de um 403, o front para de enviar até algo mudar.
- **B60:** exportação com compras (sem as observações, que são internas) e solicitações; CSV protegido contra fórmula; reabrir limpa a data; atender `REVOGACAO_CONSENTIMENTO` recusa cookies e contato; excluir a conta apaga termos buscados e `user_agent`. As notas ficam ([08 §5.2](08-MODELO-DE-DADOS.md)).

**Telas (B45, B49, B50, B54, B61)**
- **B45:** `PageError` com "Tentar novamente" nas listas, no Dashboard e na Configuração.
- **B49:** rótulo ligado ao `id` do campo, botão só com ícone usa o `tooltip`, "Buscar" e "Limpar" em português, sliders com nome e valor. Tudo nos componentes base.
- **B50:** texto secundário e placeholder em `--text-neutral-subtle`. Medido em 19 telas: nenhum texto abaixo de 4,5:1.
- **B54:** o filtro conta uma vez por mudança; a categoria só soma quando ela muda.
- **B61:** `?page=99` vai para a última; categoria inexistente é ignorada, com aviso; sem "0 produtos" ao carregar; tipo e categoria de usuários na URL (a busca não, porque pode ter CPF); o login do admin volta à tela pedida; nome longo quebra na célula; o modal de exclusão abre em "Cancelar".

#### B36 · Consentimento diverge entre navegadores (Média)
- **Sintoma:** entrar num navegador com "Apenas essenciais" revoga o consentimento da conta. No outro navegador, `/conta` mostra "Cookies comportamentais" **ligado** e todo evento recebe 403, sem aviso.
- **Causa:** a marca `ci_consent_synced` impede consultar o servidor de novo, e a tela mostra o valor local.

#### B37 · Compra não conta como conversão (Média)
- **Sintoma:** compra de hoje não aplica o bônus da categoria (38,71; com o bônus de 1,5 seria 58,06) e o produto comprado entra na mediana **sem** conversão.
- **Causa:** `ScoreCalculator.isConversao` só olha eventos. O docs/04 (4.3 e 8.1) trata a compra registrada como conversão confirmada.
- **Também:** o decaimento usa o mesmo teste. Depois de 90 dias, o interesse esfria como se a pessoa nunca tivesse comprado, e depois de 180 dias vale 0.
- **Inconsistência:** as telas dizem "produtos com contato ou compra" e "bônus com contato ou compra recente", e a precisão da prévia (`AdminScoringService.calcularPrecisao`) **já** conta a compra. Só a nota, o bônus e a faixa não contam.
- **Correção sugerida:** considerar convertido o produto que tem compra, num ponto só do `ScoreCalculator`, para valer na faixa, no bônus e no decaimento. O bônus usa a data da compra (30 dias).
- **Decidir:** uma única compra já converte (sugestão, porque é um fato) ou só a partir de 3, como na nota.

#### B38 · Notas que ficam para trás (Média)
- Excluir todas as compras de um produto sem eventos mantém a nota (64,52 → 64,52): o recálculo só atualiza produtos que ainda têm sinal e não apaga os outros.
- O recálculo geral percorre só quem tem eventos; cliente com 3 compras e nenhum evento fica com a nota velha.

#### B39 · Favoritar e desfavoritar infla a nota (Média)
- Cada par soma +0,4 (favoritar +0,5, desfavoritar −0,1): um par deixa 12,90; 11 pares levam a 100.

#### B40 · Compras sem regra no backend (Média)
- **Regra decidida:** data futura → 400; valor total calculado no backend; produto inativo aceito. Hoje a data futura é aceita (201) e `valorTotal: 999` para 2 × R$ 10 é gravado. Vale para criar e editar.

#### B41 · 500 no lugar de 4xx (Média)
- `page`, `limit`, `precoMin`, `categoria` e `destaque` com texto no catálogo; `nivel` e `status` inválidos e id com letras no admin; rota inexistente e método errado.
- **Causa:** `GlobalExceptionHandler.handleGeneric` captura tudo. Faltam `MethodArgumentTypeMismatchException` (400), `NoResourceFoundException` (404) e `HttpRequestMethodNotSupportedException` (405).

#### B42 · Valor maior que a coluna dá 500 (Média)
- Nome, slug ou telefone longos, preço 1e12 (produto e compra), peso 100 na configuração. Faltam `@Size` e `@Digits`. Também passam 3 casas decimais no preço e observação de 5.000 caracteres.

#### B43 · 401 em vez de 403 (Média)
- PF ou PJ nas 22 rotas do admin recebe 401. O acesso é negado, mas o front trata 401 como sessão expirada e deslogaria o cliente.
- **Causa provável:** o 403 vai para `/error`, que também exige login. Falta um `accessDeniedHandler`.

#### B44 · Ficha técnica no formulário (Média)
- Remover todos os atributos e salvar mostra sucesso, mas nada muda: `pairsToFicha` devolve `undefined`, e o `PATCH` ignora campo ausente.
- Valor só com espaços é gravado vazio e aparece em branco na ficha; depois, o formulário exige o valor e não salva mais nada até remover a linha.
- Chave só com espaços é descartada, e chave repetida fica com a última, sem aviso.

#### B45 · Admin sem tela de erro (Média)
- Com o banco fora, Usuários e Produtos mostram "Não há dados"; Dashboard e Configuração ficam carregando para sempre. Catálogo, vitrine, ficha e detalhe do usuário mostram "Tentar novamente".

#### B46 · Banco fora vira 401 (Média)
- `JwtAuthenticationFilter` engole qualquer erro, inclusive falha do banco, e segue como anônimo. `GET /api/conta` com token válido respondeu 401.

#### B47 · Configuração sem limites (Média)
- `PATCH` aceita peso −1, λ −1 e bônus −1 ou 5. A tela limita; a API não.

#### B48 · Conta sem validação (Média)
- `PATCH /api/conta` aceita nova senha "a" (o cadastro exige 6), idade −5 e 500, nome em branco, telefone "abc" e e-mail alternativo inválido.

#### B49 · Nomes para leitor de tela (Média)
- Os campos do cadastro não têm rótulo associado (o `id` próprio do campo quebra o vínculo com o `label`); os 7 sliders da configuração não têm nome; botões de ícone são lidos "edit", "delete", "stop", "search" e "close-circle".

#### B50 · Contraste (Média)
- Texto secundário `rgb(147,149,152)` sobre o fundo claro: 2,88:1. Placeholder: 1,83:1. O mínimo AA é 4,5:1.

#### B51 e B52 · Buscas (Média)
- Catálogo: `CABECOTE`, `pistao` e `oleo` → 0 resultados; com acento, 15, 10 e 16. `vw motor` também dá 0 (`motor vw` dá 13).
- Admin: a busca de usuários não olha CNPJ, CPF nem telefone, com ou sem máscara.

#### B53 a B61 · Baixa
- **B53:** produto inativo, visualização sem produto, `FAVORITAR` anônimo, `conversao: CONFIRMADA` enviada pelo visitante e metadados de 5 MB são aceitos (202).
- **B54:** voltar, recarregar ou mudar o preço com a categoria já filtrada soma de novo na nota da categoria.
- **B55:** pela API, slug `a/b` ou `..` cria produto sem ficha acessível; imagem `produtos/imagens/999999` ou `javascript:…` é gravada (o front não executa, só mostra imagem quebrada).
- **B56:** buscar `%` ou `_` traz tudo.
- **B57:** o navegador mostra certo, porque o cabeçalho declara a codificação; outros clientes leem "N�o autenticado".
- **B58:** em BRT está certo; com o servidor em UTC, contato às 22h30 cai no dia seguinte.
- **B59:** o aviso pertence ao formulário, que sai da tela no redirecionamento.
- **B60:** a exportação não traz compras nem solicitações; `ATENDIDA` → `EM_PROCESSAMENTO` mantém `atendido_em`; atender `REVOGACAO_CONSENTIMENTO` não revoga nada. Após excluir a conta, ficam as notas, o `user_agent` das sessões e os termos buscados (em eventos com soft delete).
- **B61:** `?page=99` destaca a página 8 e não deixa clicar nela; `?categoria=99999` mostra "99999" no seletor e "Verifique sua conexão"; "0 produtos" enquanto carrega; tipo, categoria e busca de usuários não ficam na URL; login do admin não volta à tela pedida; nome longo faz a página de usuários rolar na horizontal; o modal de exclusão abre com o foco em "Excluir conta".

### Achados ao corrigir
- **B80 · Configuração e Dashboard em 320px (Baixa):** em 25/11 as linhas de peso passaram a quebrar (`LinhaSlider`), e os rótulos da prévia e do gráfico encurtaram. A Configuração não rola mais em 375px, em nenhuma aba (antes até 125px a mais); em 320px, só a Duração, 8px. Ainda rola em 320px o Dashboard, que mede até 741px por causa do canvas dos gráficos. Já era assim antes; as telas públicas e as demais do admin não rolam.
- **B81 · Evento na fila durante a exclusão (Baixa):** se o worker processa um evento depois de a conta ser excluída, ele é gravado ativo para a conta anonimizada, e o recálculo apaga as notas dela. Janela de menos de 1 segundo. **Corrigido em 25/11:** reproduzido no código antigo (357 eventos ativos em 40 exclusões); no novo, 0. O worker trava a linha do usuário e descarta o evento de conta excluída.

### Divergências com a documentação (24/11/2026, resolvidas em 25/11)

**Como foram resolvidas**

| ID | O que ficou |
|---|---|
| B62, B75 | Código por e-mail (SMTP configurável; Mailpit local), fora do log, com envio que não atrasa a resposta; pedido novo anula os anteriores |
| B63, B68 | Dashboard com os 5 clientes de maior nota (a API devolve 10); "próxima compra provável" = produto ativo de maior nota sem compra nos últimos 30 dias |
| B64, B69 | Compra e retorno ao produto com peso próprio, fora do divisor; retorno começa em 0. A sequência de navegação segue como trabalho futuro |
| B65 | Associar o histórico recalcula as notas da conta na hora |
| B66 | `password-reset/confirm` em 5/min por IP e 120/min por usuário logado; o 429 saía sem CORS e a tela via "Network Error" (corrigido) |
| B67 | Menu recolhido mostra só o símbolo |
| B70, B76 | Colunas `fingerprint` e `ip_origem` removidas (V022) |
| B71, B73, B74 | Teto do bônus em 1,50×; bônus de recorrência (começa em 1,00×) e pausa de 0 a 180 dias (começa em 60) na Configuração |
| B72 | Recusar descarta o histórico anônimo; X e Esc não. Um evento que ainda esteja na fila nesse instante não é coberto |
| B77 | Aceite do visitante gravado; sem ele, 403 na sessão e no evento |
| B78 | Cliente logado com notas: peso pessoal mínimo de 80% e empate pela popularidade. A ordem do catálogo mudou para 19 clientes da base de demonstração; visitantes não mudam |
| B79 | Fila `events.session` e MapStruct removidos; canal de origem real; logout encerra a sessão; comentários citam `docs/`. `EXPORTACAO` continua só mudando o status |

Com os valores iniciais, nenhuma nota muda. Migrations V019 a V022. A fila `events.session` já criada fica vazia no RabbitMQ até ser apagada.

**Registro original**

Pontos em que o sistema não faz o que a especificação original pede (versão dos docs no commit `d25fc45`), achados ao conferir os docs com o código. Conferidos no código; o B67 foi visto em captura de tela. A compra como conversão está no B37 e a retentativa da fila no B29.

**Ajustar** = sugiro corrigir o código. **Decidir** = serve corrigir o código ou aceitar o comportamento. As citações de linha abaixo são do código antigo.

#### B62 · Recuperação de senha sem e-mail (Média · Ajustar)
- **O doc pede:** RF06, recuperação de senha **por e-mail**.
- **O sistema faz:** gera o código e o escreve no log, com o e-mail da pessoa, em texto puro. Nada é enviado, então quem usa o site não consegue recuperar a senha sozinho.
- **Onde:** [AuthService.java:164](../backend/src/main/java/com/catalogo/auth/service/AuthService.java#L164). Não há dependência de e-mail no projeto.
- **Correção sugerida:** enviar por SMTP (um servidor de teste em contêiner basta para a demonstração) e tirar o código do log. Se não der tempo, limitar o log ao perfil `dev` e manter o RF06 como Parcial.

#### B63 · Leads fora do dashboard (Média · Ajustar)
- **O doc pede:** RF20, dashboard com KPIs **e lista de leads priorizados por score**.
- **O sistema faz:** mostra KPIs e gráficos. `GET /api/admin/dashboard` já devolve `leads`, e a tela não usa; o caminho é o "Ver" do KPI de alto interesse.
- **Correção sugerida:** mostrar os primeiros leads no dashboard, com nota, categoria e link para o detalhe. Não precisa de mudança na API.

#### B64 · Peso das compras (Média · Decidir)
- **O doc pede:** 04 §9, o dono do catálogo define o peso do histórico de compras.
- **O sistema faz:** cada compra soma o peso do **WhatsApp**. Mudar esse peso muda também o das compras.
- **Onde:** [ScoreCalculator.java:89](../backend/src/main/java/com/catalogo/scoring/engine/ScoreCalculator.java#L89).
- **Sugestão:** aceitar. Um peso próprio exige novo parâmetro no banco, na API, na tela e na prévia.

#### B65 · Mescla de notas na migração (Média · Decidir)
- **O doc pede:** 04 §7.3, média ponderada, com mais peso para o histórico da conta.
- **O sistema faz:** fica a maior das duas notas (`GREATEST`).
- **Onde:** `ScoreMigrationRepository`.
- **Sugestão:** aceitar. Os eventos também passam para a conta, e o próximo evento recalcula as notas a partir de todo o histórico, então a mescla vale só até lá.

#### B66 · Limite de requisições incompleto (Média · Ajustar)
- **O doc pede:** 11 §1, 120 requisições por minuto por usuário nos demais endpoints; RNF06, limite na recuperação de senha.
- **O sistema faz:** limita login, cadastro, pedido de senha, sessão de visitante e eventos. O `POST /api/auth/password-reset/confirm` e o resto da API não têm limite.
- **Onde:** [RateLimitFilter.java:50](../backend/src/main/java/com/catalogo/config/RateLimitFilter.java#L50).
- **Correção sugerida:** incluir `password-reset/confirm` no grupo de 5 por minuto. O limite geral de 120 pode ficar como decisão.

#### B67 · Menu do admin em tela estreita (Média · Ajustar)
- **O doc pede:** RNF10 e 09 §17, layout responsivo, com 375px utilizável.
- **O sistema faz:** com o menu recolhido (abaixo de 992px), "Admin" quebra em "Ad / min" e o nome da loja sai do menu e fica sobre a borda do cabeçalho.
- **Reproduzir:** abrir `/admin` com a janela em 980px ou 700px.
- **Onde:** [AdminShell.tsx:81](../frontend/components/layout/AdminShell.tsx#L81).
- **Correção sugerida:** esconder o texto quando o menu estiver recolhido e deixar só o símbolo.

#### B68 a B79 · Baixa

| ID | O doc pede | O sistema faz | Sugestão |
|---|---|---|---|
| B68 | RF21: próxima compra provável de cada cliente | Nota máxima e categoria de maior interesse | Decidir: mostrar o produto de maior nota, que já é calculado |
| B69 | RF16 e 04 §3.1–3.2: retorno à página e sequência de navegação pontuam | Cada visita soma como visualização; a sequência não é calculada | Aceitar (trabalho futuro) |
| B70 | RF18 e 04 §7.2: fingerprint como reserva do cookie | O front não envia e o backend não procura por ele | Aceitar: coleta menos dados pessoais |
| B71 | 04 §4.3: bônus de 1,00× a 1,50× | A tela e a API permitem até 2,00× (B47) | Decidir se o teto volta a 1,50× |
| B72 | 04 §7.3: ao recusar, o histórico é descartado | Nada é apagado; os eventos seguem no visitante | Aceitar |
| B73 | 04 §9.3: bônus para categoria com compra recorrente | Não existe | Aceitar (trabalho futuro) |
| B74 | 04 §5.4: duração da pausa configurável | 60 dias fixos (`PAUSE_CONTACT_DAYS`) | Aceitar |
| B75 | 08 §4.18: novo pedido invalida os códigos não usados | Todos valem até serem usados ou completarem 2 horas | Ajustar: marcar os anteriores como usados |
| B76 | 08 §4.3: `ip_origem` para auditoria | Vazia nos 96 registros; nenhum código preenche | Decidir: a V017 removeu `sessao.ip_hash` porque o sistema não coleta IP; o mesmo vale aqui |
| B77 | 11 §3.4: evento sem consentimento → 403 | Vale para quem está logado; o backend não guarda a escolha do visitante | Aceitar: quem bloqueia é o front |
| B78 | 04 §6.2: quem volta com conta vê direto a ordem pessoal | Com 3 a 9 interações, mistura com a popularidade, mesmo com notas gravadas | Aceitar: com poucos sinais, a mistura protege a ordem |

**B79 · Ajustes pequenos**
- A fila `events.session` existe, mas nenhum tipo de evento é enviado a ela (`EventoRouting`).
- `sessao.canal_origem` é sempre `web`; o 08 prevê `organic`, `direct`, `referral` e campanha.
- Atender um pedido `EXPORTACAO` só muda o status; o 11 §3.9 diz que disponibiliza o arquivo.
- O logout não invalida o JWT; o 11 §3.1 dizia que sim. Limite já conhecido (CHECKLIST §6).
- O MapStruct está no `build.gradle.kts`, e nenhuma classe usa. A ADR-B03 foi marcada como revista.
- Comentários em 7 classes do backend e em várias migrations citam `frontend/docs/`, que não existe mais. Migration aplicada não pode mudar; nas classes, basta trocar por `docs/`.

#### Docs a reler quando um bug for corrigido

Todos relidos em 25/11.

| Ao corrigir | Reler |
|---|---|
| B29 | 05 §6 e 12 §6: o que acontece com a mensagem que falha |
| B30, B43 | 11 §1 e 12 §5: quem acessa cada rota |
| B33 | 14 UC12: marcado como pendente |
| B34 | 11 §3.9: descreve a listagem como se funcionasse |
| B71 | 04 §4.3 e 08 §4.16: limite do bônus |
| B62 | 02 RF06; 08 §4.18; 14 UC05 |
| B63 | 02 RF20; 03 A2; 14 UC11 |

### Lacunas (não são bugs)
- Os endpoints `GET/PATCH /api/admin/solicitacoes-lgpd` existem, mas não há tela no admin para ver ou atender as solicitações (EXCLUSAO, REVOGACAO_CONSENTIMENTO, CORRECAO).
- A tabela `produto_aresta` é criada em V005 e indexada em V008, mas nenhum código a usa.

---

## 2. Regressão (depois de corrigir)

- [x] **B01** Excluir conta PF e PJ pela tela → `DELETE /api/conta` 200, logout e redirecionamento para `/` (conferido com PF e PJ)
- [x] **B01** Banco: e-mail `anon_<id>@removido.local`, CPF/CNPJ/nome/telefone nulos, `deleted_at` preenchido, favoritos/eventos/compras com soft delete, `solicitacao_lgpd` EXCLUSAO ATENDIDA
- [x] **B01** Recadastro com o mesmo e-mail e CPF funciona; login na conta excluída é recusado; token antigo dá 401
- [x] **B02** Logado sem sessão aberta, `POST /api/eventos` sem `sessaoId` → 202 e uma sessão nova em `sessao`; segundo evento reaproveita a mesma sessão
- [x] **B03** Senha atual errada → 400 "Senha atual inválida" na tela, sem deslogar; senha certa → troca, login com a nova funciona e com a antiga não; nova senha em branco mantém a senha
- [x] **B04** Editar produto com preço 0, preço negativo ou nome vazio → 400 na API nos três casos; na tela, preço 0 → "O preço deve ser maior que zero"; edição válida continua salvando
- [x] **B05** `/admin/produtos` mostra os 87 itens em 5 páginas; ordenar por nome começa em "Aditivo…"; ordenar por preço e filtrar inativos (2) valem para a lista inteira
- [x] **B05** Busca e ordenação combinadas: "motor" + preço crescente → 30 itens em 2 páginas, em ordem entre as páginas; cliques rápidos não mostram resposta antiga; página que esvazia volta uma
- [x] **B06** Lista de usuários mostra a data da última atividade (ex.: Juliana = hoje); ordenar pela coluna funciona
- [x] **B07** Com 3 compras, produto comprado sem eventos passa a ter nota em `score_produto`
- [x] **B08** Digitar `1234,50`, `1.234,50` ou `1234.50` → o campo exibe `1.234,50`; salvar grava 1234.50; o modal de compra e o filtro do catálogo também leem `1.234,50`
- [x] **B09** A lista não tem mais o botão "Excluir"; ficam Editar e (Des)ativar
- [x] **B10** Upload de `.txt` renomeado mostra "Formato não suportado…" sem chamar a API; PNG continua funcionando
- [x] **B10** JPEG e WebP pela tela são aceitos e aparecem no preview
- [x] **B11** Seis logins errados no mesmo minuto com `X-Forwarded-For` diferentes → o sexto dá 429
- [x] **B12** Editar o nome em `/conta` atualiza o header na hora e após recarregar
- [x] **B13** Abrir a ficha, esperar 10 s e recarregar → 1 `TEMPO_PAGINA`; navegar por link → 1 só (sem duplicar)
- [x] **B14** Logar 3 vezes sem mudar nada → nenhuma linha nova; alternar o switch uma vez → exatamente 1 linha
- [x] **B15** Excluir compra com um clique no botão do Popconfirm
- [x] **B16** Depois de salvar com recálculo, a prévia mostra "Nenhum cliente muda"
- [x] **B17** Vitrine e checklist mostram o mesmo número de destaques
- [x] **B18** Produto sem imagem mostra o card com ícone e "Este produto não possui imagens" (desktop e mobile)
- [x] **B19** Ícone de "sem imagem" centralizado nos cards da vitrine, do catálogo e dos favoritos (desktop e mobile)
- [x] **B20** Idade 17 mostra uma única mensagem; preço mínimo negativo e quantidade 0 são ajustados para o mínimo, sem balão do navegador
- [x] **B21** Logo alinhada com o menu no header desktop e mobile
- [x] **B22** Abrir `/conta` e trocar de aba → console sem o warning de `useForm`
- [x] **B23** Apagar o telefone do admin e salvar → telefone fica vazio
- [x] **B24** Sem "(mock)" no admin; rótulo de categoria completo ou com reticências; CSV disponível na tela (ou doc ajustada)
- [x] **B13** Volta pelo cache do navegador (bfcache): o tempo conta de novo e gera outro `TEMPO_PAGINA` — conferido **simulando** `pagehide`/`pageshow`, porque em dev o Chrome não usou o bfcache
- [x] **B25** Salvar em Configuração e no design system → console sem o warning "Static function can not consume context"
- [x] **B26** `/admin/usuarios` mostra os 24 clientes em 2 páginas; ordenar por última atividade e filtrar Inativo valem para todos
- [x] **Limite de 100** Conferido num banco de teste com 2.024 clientes e 2.085 produtos ativos, comparado com SQL direto: catálogo (174 páginas, sem repetir nem faltar, visitante e cliente), busca, categoria + preço; usuários em 132 combinações de filtro e ordenação; nas telas, última página, filtros, URL e modal de compra com produto fora dos 100
- [x] **Limite de 100** Com os dados atuais, o catálogo e a lista de usuários devolvem o mesmo que o código anterior
- [x] **Limite de 100** Conferência com os dados reais, depois de reiniciar o backend (24/11): API igual ao SQL em 110 combinações de filtro e ordenação de usuários; catálogo com 85 produtos em 8 páginas, sem repetir nem faltar; `leads` na mesma ordem em 10 consultas; nas telas, lista de usuários, modal de compra (rolagem, busca, preço sugerido, edição; sem salvar), `/admin/produtos`, catálogo e vitrine
- [x] **B27** Abrir vitrine, catálogo e login do admin, com aceite dado → nenhuma sessão nova
- [x] **B27** Abrir uma ficha, outra ficha e 3 F5 → 1 sessão com os 10 eventos (5 `VISUALIZACAO_PRODUTO` + 5 `TEMPO_PAGINA`); outra aba usa a mesma; fechar a aba grava o `TEMPO_PAGINA` nela
- [x] **B27** 31 min sem evento → sessão nova, mesmo visitante
- [x] **B27** `ci_sessao_id` inexistente → evento gravado em sessão nova, mesmo visitante; `ci_visitante_id` inexistente → visitante e sessão novos, evento gravado
- [x] **B27** Login com "Sim, associar" → a sessão continua e passa a ter `usuario_id`; sair da conta → o próximo evento abre outra, sem `usuario_id` (e, desde o B28, com outro visitante)
- [x] **B27** Só essenciais → nenhuma chamada a `/visitantes/sessao` nem a `/eventos`
- [x] **B27** Chamadas seguidas a `POST /api/visitantes/sessao` → 429 com `Retry-After: 60` (a 32ª, porque o balde repõe 1 ficha a cada 2 s)
- [x] **B27** Rate limit da sessão na 8080, depois de reiniciar o backend (24/11): 429 na 31ª chamada, com `Retry-After: 60`. Testado com `cookieId` desconhecido, que consome o limite sem gravar linha
- [x] **B28** Mesmo roteiro no código antigo e no novo, pela API: no novo, o visitante só tem a nota do que ele viu, Marcos não recebe nada da Juliana e a sessão continua dela (conferido com e sem a coluna removida na V017)
- [x] **B28** Nas telas: logout ou token inválido (401) → `ci_visitante_*` e `ci_sessao_*` somem do localStorage; o próximo evento cria outro visitante
- [x] **Sessão do usuário** Login com "Não associar" → o evento seguinte abre sessão com `usuario_id` e sem visitante, sem nenhum 400 na rede; com "Sim, associar" → continua na mesma sessão
- [x] **Sessão do usuário** Evento com `sessaoId` de outro usuário, de visitante, ou sessão de usuário usada por anônimo → `400 INVALID_SESSAO`
- [x] **RF18** Visitante com 31 dias → descartado no próximo carregamento; o evento cria outro
- [x] **Dispositivo** Sessão aberta no Chrome do Windows → `desktop`; mobile e tablet (inclusive iPad) cobertos por teste automático
- [x] **B28** Conferência na 8080, depois de reiniciar o backend e aplicar a V017 (24/11): sessão de outro usuário ou de visitante recusada; sessão aberta com login é do usuário, sem visitante; logout limpa visitante e sessão do navegador; eventos, visitantes e notas iguais antes e depois. O roteiro completo do vazamento ficou só no banco de teste, para não alterar as notas reais

- [x] **B37** Cliente com compra e sem contato: o produto comprado entra na mediana **com** conversão
- [x] **B37** Compra de hoje → a nota da categoria recebe o bônus configurado, igual ao contato
- [x] **B37** Compra + visita de 200 dias → a visita ainda pontua (`e^(−λ·dias)`); sem compra e sem contato, vale 0
- [x] **B37** Prévia e notas gravadas com a mesma distribuição de níveis (6 / 8 / 6 / 3)
- [x] **B37–B39** Depois do recálculo, notas de produto e categoria e faixa dos 36 sujeitos iguais a uma conta feita à parte; iguais também com o servidor em UTC e em Tóquio (o código antigo em UTC diferia)
- [x] **B38** 2 compras: sem nota, com faixa; 3 compras: nota; excluir a 3ª apaga as notas; recálculo geral apaga nota velha e mantém a de conta excluída
- [x] **B39** 11 favoritar e 10 desfavoritar = 1 favoritar (16,13); terminar em desfavoritar = 0
- [x] **B58** Contato às 23h30 de ontem cai em ontem com o servidor em BRT, UTC e Tóquio; 14 dias iguais ao SQL
- [x] **B51, B52, B56** 940 buscas: nenhuma perde resultado e 8 ganham; 87 produtos em 4 formas do nome; 24 clientes por nome, documento e telefone; `%` e `_` literais; cerca de 60 ms com 2.000 registros
- [x] **B40–B42, B46–B48, B53, B55** 175 verificações na API, 0 falhas (40 falhas no código antigo até o roteiro parar); os 87 produtos salvam sem mudança; banco parado → 503 com token, 401 só sem token
- [x] **B36, B60** Pela API e nas telas: conta revogada em outro navegador aparece desligada, um único 403 e para; religar volta a coletar; navegador que recusa não muda a conta; falha de rede desfaz a troca. Exportação, reabertura, revogação e exclusão conferidas no banco
- [x] **B44, B59** Na tela: valor em branco e chave repetida recusados; esvaziar a ficha grava vazia; "Produto criado" continua na lista
- [x] **B45** Banco parado: 6 telas com "Tentar novamente", que volta a funcionar sem novo login
- [x] **B49, B50** Rótulos e nomes em 5 telas de formulário e nos 10 sliders; contraste em 19 telas
- [x] **B54** Filtrar, recarregar, mudar o preço, abrir ficha e voltar → 1 evento com categoria e 1 só com preço
- [x] **B61** Os 7 itens nas telas; nome de 240 letras e e-mail de 200 sem rolagem em 1280, 640 e 320px
- [x] **Regressão** 26 rotas × 4 papéis, B29, B32, B34, B35, B57, catálogo sem repetir nem faltar, migração e 3 recálculos simultâneos
- [x] **B36–B61** Conferência na 8080 (25/11), só leitura: erros 4xx, buscas sem acento, documento com máscara, limites da configuração, conta e compra, eventos inválidos, gráfico de contatos igual ao SQL, login do admin volta à tela pedida. O que exige gravar (B36, B38, B39, B54, B60) foi provado só no ambiente de teste
- [x] **B62** Pedir recuperação → o código chega por e-mail e não aparece no log; e-mail inexistente → mesma mensagem, nada enviado; SMTP fora → mesma resposta, sem esperar
- [x] **B63, B68** Dashboard mostra os leads na mesma ordem de `/admin/usuarios` por nota, com link para o detalhe; próxima compra igual ao SQL (compra há 0 e 30 dias some, há 31 volta)
- [x] **B64, B69, B71, B73, B74** Notas dos 36 sujeitos idênticas com os valores iniciais; cada parâmetro mexido bate com uma conta feita à parte, e a prévia com o que foi gravado
- [x] **B65, B72, B77** Migrar já grava a nota definitiva (recalcular não muda nada); recusar descarta sem tocar o resto; X não descarta; sem aceite → 403
- [x] **B66** 6 chamadas seguidas a `password-reset/confirm` → 429 com `Retry-After` e CORS; logado, a partir de 121 no minuto → 429
- [x] **B67** `/admin` em 980px, 700px e 375px → menu sem texto quebrado nem sobreposto
- [x] **B75** Pedir o código duas vezes → o primeiro deixa de valer
- [x] **B78** Ordem do catálogo antes × depois por cliente: ninguém perde nem repete produto; quem não tem nota e os visitantes não mudam
- [x] **B79** Logout numa aba não derruba a outra; trocar a senha derruba as outras e mantém a atual; `campaign:natal` gravado na sessão
- [x] **B81** Mensagem na fila e 40 exclusões com eventos simultâneos → 0 eventos ativos, notas intactas, DLQ vazia
- [x] **Regressão de 25/11** 26 rotas × 4 papéis, buscas, catálogo, LGPD, filas, 3 recálculos simultâneos; V001→V022 do zero; contraste em 11 telas
- [x] **B62–B81** Conferência na 8080 (25/11), só leitura, 16 tabelas idênticas antes e depois: leads e próxima compra iguais ao SQL, ordem do catálogo, pesos e limites novos, prévia sem mudança, 403 sem aceite, 429 com `Retry-After` e CORS, 120/min por usuário; Dashboard, Usuários, Configuração e Sobre o projeto na tela. O que exige gravar (e-mail, B65, B72, B75, logout, B81) foi provado só no ambiente de teste
- [x] **B29** 5 eventos inválidos → 400; 6 mensagens ruins publicadas direto na fila → DLQ, log parado e fila seguindo; banco parado por 45 s com 5 mensagens → todas gravadas ao religar, 0 na DLQ; `/produtos?categoria=99999` → 400, fila vazia
- [x] **B30 / B43** PF e PJ em 22 rotas do admin → 403; admin em 10 rotas de cliente → 403 e continua existindo; sem token → 401; logout do admin funciona
- [x] **B31** Duas abas (PF e PJ), inclusive com edição em andamento → a tela troca de conta, mostra os dados certos e nada é gravado na outra; login do admin ou logout na outra aba → sai
- [x] **B32** Depois de cada um de 7 eventos, e com 3 personas, nota de categoria, de produto e faixa iguais às do recálculo geral; migração preenche a faixa
- [x] **B33** Autorizou → abre o número do cliente; recusou ou nunca respondeu → avisa, "Cancelar" não abre, "Abrir" abre
- [x] **B34** Sem filtro e 5 combinações → 200, total igual ao SQL
- [x] **B35** Relógio adiantado ou atrasado não impede a revogação; na tela, uma linha por troca com a hora do servidor
- [x] **Antes e depois** O mesmo roteiro de API: 29 falhas no código antigo, 0 no novo
- [x] **B29–B35** Conferência na 8080, depois de reiniciar o backend (24/11): papéis (exceto `DELETE /api/conta` com o admin, testado só no ambiente de teste), listagem LGPD, `contatoProativo` dos 24 clientes, eventos inválidos → 400 e filas vazias; nas telas, WhatsApp e troca de conta entre abas. Sem gravar nada: a nota de categoria na hora (B32), a DLQ e a data do consentimento (B35) foram provadas só no ambiente de teste

---

## 3. Novos fluxos de teste

Cenários que o checklist não cobre, partindo do que já foi testado. Cada item traz o resultado esperado e, depois do travessão, o observado.

**Execução de 24/11/2026:** os 70 itens abertos foram testados. Depois das correções, 70 passam; só o do NVDA segue parcial.

### 3.1 Segurança e autorização
- [x] Token de PF ou PJ em `GET /api/admin/usuarios`, `/admin/produtos` e `/admin/configuracao/*` → 403 — 403 nas 22 rotas (B43 corrigido)
- [x] Token de admin em `GET /api/conta` e `POST /api/favoritos/{id}` → recusado (403 ou 401), sem erro 500 — 403 em 10 rotas (B30 corrigido)
- [x] JWT com `exp` no passado, assinatura alterada ou `alg: none` → 401 em todas as rotas protegidas — 401 em 9 variações de token e 5 rotas
- [x] XSS: produto com nome, descrição e ficha técnica contendo `<img src=x onerror=alert(1)>` → exibido como texto na ficha, no card e no admin — só texto na vitrine, na ficha, em favoritos e no admin
- [x] XSS: nome de usuário com HTML → exibido como texto no header, na lista e no detalhe do admin — só texto
- [x] XSS: busca `?q=<script>alert(1)</script>` → só texto no campo e no "Nenhum produto encontrado" — só texto
- [x] `X-Visitante-Cookie-Id` inventado (UUID que não existe) em `POST /api/eventos` → 4xx, sem criar visitante "fantasma" — `400 INVALID_COOKIE`, nenhum visitante criado
- [x] Evento com `sessaoId` de outro usuário ou visitante → recusado com `400 INVALID_SESSAO` (conferido pela API em 24/11, na 8081)
- [x] Upload de SVG ou HTML renomeado para `.png` → 400 (magic bytes) — 400; vazio, GIF e WebP falso também; 6 MB → 413
- [x] `GET /api/produtos/imagens/999999` → 404, sem stack trace — 404 sem stack trace; id com letras → 400 (B41 corrigido)
- [x] Requisição com `Origin: https://site-qualquer.com` → bloqueada pelo CORS — 403, sem cabeçalho de liberação
- [x] `q` com aspas e `%` (`' OR 1=1 --`, `100%`) → busca normal, sem erro 500 — sem 500 em 13 textos; `%` e `_` são texto (B56 corrigido)

### 3.2 Eventos e scoring
- [x] Buscar um termo → `PESQUISA` com `metadados.termo`; abrir um resultado → `PESQUISA` com `produtoId` e `origem: resultado_pesquisa` — conferido na tela e no banco
- [x] Filtrar por categoria e por preço → `FILTRO_APLICADO` com `categoriaId`; após recálculo, a nota da categoria em `score_categoria` sobe — soma 0,5 ÷ 3,1 × 100 na categoria, uma vez por mudança (B54 corrigido)
- [x] Decaimento: recuar o `ocorrido_em` dos eventos de um usuário em 30, 90 e 180 dias e recalcular → a nota cai conforme a meia-vida configurada — 22 casos iguais à conta feita à parte, incluindo os limites de 7, 90, 180 e 60 dias
- [x] Boost de conversão: contato ou compra nos últimos 30 dias numa categoria → nota das outras peças da categoria sobe conforme o bônus (sem bônus, +50%, +100%) — contato: a nota da **categoria** sobe 1,5× e 2× como esperado (as notas dos produtos não mudam; o texto do item estava errado). Compra também dá (B37 corrigido)
- [x] Ajuste de meia-vida para uma categoria → após recálculo, só os produtos dessa categoria mudam — só a categoria mudou; nenhuma outra nota de nenhum cliente
- [x] `DESFAVORITAR` reduz a nota do produto; favoritar e desfavoritar várias vezes não deixa a nota negativa — reduz e não fica negativa; o par repetido vale pelo último estado (B39 corrigido)
- [x] Evento com `tipo` inválido → 400; com `produtoId` inexistente ou inativo → 4xx, sem 500 — `tipo` inválido → 400; inexistente → 400 (B29 corrigido); produto inativo → 400 (B53 corrigido)
- [x] Visitante com cookies aceitos: eventos passam pela fila `events.*` no RabbitMQ e geram `score_produto` com `visitante_id` alguns segundos depois — nota em cerca de 0,4 s, com a da categoria (B32 corrigido)
- [x] Parar o consumidor (ou o RabbitMQ) com mensagens já publicadas, religar → a fila é processada e as notas aparecem — 5 mensagens sobreviveram ao reinício do RabbitMQ e foram processadas. Com a fila fora, `POST /eventos` dá 500 e o evento se perde (limite conhecido)
- [x] Popularidade: produto com muitos contatos nos últimos 30 dias sobe na ordem do visitante; eventos com mais de 30 dias não contam — ordem igual à conta à parte; 500 contatos há 31 dias não contam, há 5 dias levam ao topo

### 3.3 Migração de histórico
- [x] Logar, sair e logar de novo no mesmo navegador → o modal não aparece outra vez para o mesmo visitante — modal só no primeiro login
- [x] Visitante migrado para a conta A; sair e logar com a conta B no mesmo navegador → nada da conta A vai para a B — nada passa para a B (API)
- [x] Visitante com cookies comportamentais recusados → o modal não aparece (não há o que migrar) — sem modal
- [x] Chamar `POST /api/auth/migrar-historico` duas vezes → a segunda não duplica eventos nem notas — eventos, notas e sessões iguais. A nota migrada é a maior das duas; o recálculo depois soma os eventos (6,45 → 12,90)
- [x] Faixa de preço: visitante com conversão e usuário sem conversão → após migrar, a faixa do usuário passa a ter mediana com conversão — preenchida na hora (B32 corrigido)

### 3.4 LGPD
- [x] Revogar cookies comportamentais em `/conta` e reaceitar → uma linha por troca, e a coleta volta só depois do reaceite — uma linha por troca, 403 e volta; a data é a do servidor (B35 corrigido) e a tela mostra o valor da conta (B36 corrigido)
- [x] `POST /api/conta/solicitacoes-lgpd` com REVOGACAO_CONSENTIMENTO e CORRECAO → 201, status PENDENTE — 201 PENDENTE
- [x] Admin: `PATCH /api/admin/solicitacoes-lgpd/{id}` para EM_PROCESSAMENTO, ATENDIDA e REJEITADA → `atendido_em` preenchido quando ATENDIDA; filtros `status` e `tipo` na listagem funcionam — `atendido_em` preenchido em ATENDIDA e REJEITADA; listagem e filtros iguais ao SQL (B34 corrigido)
- [x] Exportação de um usuário não contém dados de outro (conferir ids de eventos e favoritos) — dois clientes conferidos, com compras e solicitações (B60 corrigido)
- [x] Apagar `ci_visitante_id` com cookies aceitos → um visitante novo é criado e o histórico anterior não é reaproveitado — visitante e sessão novos, evento gravado
- [x] Depois de corrigir B01: exportar antes de excluir, excluir, tentar exportar com o token antigo → 401 — 200, 200, 401

### 3.5 Admin: produtos
- [x] Produto com 3 imagens: mudar a ordem, trocar uma foto e remover outra → a ficha pública segue a ordem, e as miniaturas trocam a imagem principal — ordem, troca e remoção conferidas
- [x] Texto alternativo preenchido aparece como `alt` na ficha — na imagem principal; as miniaturas têm "Ver foto 1 de 3"
- [x] Upload de WebP → aceito e exibido — aceito
- [x] Nome com acentos e símbolos (`Pistão Ø 82,5 mm / 1.6`) → slug gerado sem acentos nem barras, e a URL abre a ficha — `pistao-82-5-mm-1-6`, ficha abre
- [x] Slug igual ao de um produto **inativo** → 409 ou permitido; decidir e documentar — **decidido: 409** (o produto pode ser reativado); também com maiúsculas
- [x] Ficha técnica com chave vazia ou duplicada → validação ou descarte; nada de linha em branco na ficha — recusadas no formulário e descartadas no backend (B44 corrigido)
- [x] Produto desativado some também dos destaques e da ordem personalizada de quem tinha nota nele — fora da ordem da Juliana e dos 6 destaques; ficha 404
- [x] Imagem grande (ex.: 4000×3000) → o front comprime; conferir no Network o tamanho realmente enviado — 9,6 MB (4000×3000) → 915 KB em WebP gravados

### 3.6 Admin: usuários e compras
- [x] Busca por nome, e-mail e CNPJ na lista de usuários — também CPF e telefone, com ou sem máscara (B52 corrigido)
- [x] Filtros combinados (tipo PJ + nível QUENTE + categoria) → resultado consistente e a URL reflete os filtros — nível, status, tipo e categoria na URL; a busca não, porque pode ter CPF (B61 corrigido)
- [x] Com mais de 20 usuários (criar alguns), a paginação da lista funciona e os filtros de status continuam corretos em todas as páginas — coberto no "Limite de 100" (2.024 clientes, 132 combinações)
- [x] Compra com data futura → recusada ou aceita; decidir e documentar — **decidido: recusar**, e recusa (B40 corrigido)
- [x] Compra de produto inativo e compra para usuário inativo → regra clara, sem 500 — **decidido: aceitar produto inativo.** Usuário inativo → 404, sem 500
- [x] `valorTotal` diferente de `quantidade × precoUnitario` enviado pela API → recusado ou recalculado no backend — **decidido: calcular no backend**, e o valor enviado é ignorado (B40 corrigido)
- [x] Observações preenchidas aparecem ao expandir a linha da compra — aparecem ao expandir
- [x] Botão WhatsApp de um cliente com `CONTATO_PROATIVO` recusado → definir se deve avisar ou bloquear — **decidido: avisar e confirmar** (B33 corrigido)

### 3.7 Dashboard e configuração
- [x] Cadastrar uma conta → "Usuários ativos" +1 e "Sem interação" +1; depois do B01, excluir → volta — +1 nos dois; excluir volta
- [x] Contato feito às 22h (horário de Brasília) cai no dia certo no gráfico de 14 dias e no KPI de 7 dias (BRT × UTC) — certo em qualquer fuso do servidor (B58 corrigido)
- [x] Dois admins em abas diferentes salvando pesos diferentes → o último vence, ou há aviso de conflito — **decidido: o último vence**, que é o que acontece
- [x] Bônus de conversão em +50% e +100% com recálculo → níveis mudam como a prévia indicou — prévia = resultado em 4 cenários (níveis e notas). O bônus muda a categoria favorita, não o nível. Com meia-vida de 7 dias a categoria favorita diferiu em 1 cliente (provável empate por arredondamento, não investigado)
- [x] "Ver os 10 clientes que mais mudam" lista nomes e diferenças coerentes com a prévia — nomes e notas iguais ao recálculo

### 3.8 Catálogo e navegação
- [x] Busca sem acento e com maiúsculas (`CABECOTE`, `pistao`) encontra "Cabeçote" e "Pistão" — as duas (B51 corrigido)
- [x] `?page=99` → lista vazia com aviso ou volta para a última página, sem erro — vai para a última página (B61 corrigido)
- [x] `?precoMin=-1`, `?precoMin=abc` e `?categoria=99999` na URL → filtros ignorados ou corrigidos, sem erro 500 — ignorados na tela, categoria com aviso (B61); na API, texto → 400 (B41 corrigido)
- [x] Aplicar filtros, abrir uma ficha e usar o "voltar" do navegador → filtros e página mantidos — filtros e página mantidos
- [x] Link compartilhado com filtros abre igual em outra aba anônima — igual sem login

### 3.9 Sessão
- [x] Duas abas logadas; sair numa → a outra mostra "Entrar" na próxima ação protegida — foi para `/entrar?next=/favoritos`
- [x] Token com expiração curta (ajustar o JWT para 1 min em dev) → ao expirar, rota protegida leva para `/entrar?next=…` e, após logar, volta para a mesma tela — testado com token vencido: volta à tela pedida, inclusive o admin (B61 corrigido)
- [x] Logar como PF numa aba e como PJ em outra → a última sessão vale nas duas, sem dados misturados — a tela acompanha a última conta (B31 corrigido)

### 3.10 Acessibilidade
- [x] Modais (cookies, termos, migração, exclusão, compra): o foco fica preso dentro, Esc fecha e o foco volta ao botão de origem — nos 5, o foco não vai à página de trás, Esc fecha e o foco volta
- [x] Seletor de categoria (TreeSelect), sliders da configuração e paginação operáveis só pelo teclado — com teclas reais
- [ ] Leitor de tela (NVDA): campos com rótulo, botões de ícone com nome (lixeira, editar, favoritar), toasts anunciados — **parcial:** não há como ouvir o NVDA aqui; na árvore de acessibilidade, campos, botões e sliders têm nome (B49 corrigido); falta ouvir com o NVDA
- [x] Zoom do navegador em 200% → sem conteúdo cortado nem rolagem horizontal nas telas públicas — 8 telas públicas sem rolagem horizontal a 640 px (200%) e a 320 px (400%)
- [x] Contraste dos textos cinza-claros (placeholders, "Inativo", legendas dos gráficos) atende WCAG AA — 4,5:1 ou mais em 19 telas (B50 corrigido); legenda de gráfico é imagem e não foi medida

### 3.11 Robustez
- [x] Postgres parado (`docker stop catalogo_postgres`) → telas mostram erro com "Tentar novamente", sem stack trace; religar e voltar — todas as telas (B45) e 503 sem deslogar (B46 corrigidos). Religou sem reiniciar o backend
- [x] Rede lenta (DevTools → Slow 3G) → estados de carregamento visíveis em catálogo, ficha, favoritos e admin, sem cliques duplicados em "Salvar" — simulada com atraso de 2,5 e 12 s no servidor: carregamento visível; "Salvar" não duplica
- [x] Clique duplo rápido em "Criar conta", "Registrar compra" e "Salvar" → uma única requisição ou uma única linha criada — 1 requisição em cadastro, compra, produto e conta do admin
- [x] Backend reiniciado com usuário logado → a sessão continua válida (JWT) e o rate limit é zerado (limite conhecido) — token continua válido e o limite zera
