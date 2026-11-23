-- Personas de demonstração da Renova Retífica: clientes, navegação, favoritos, contatos e compras.
-- Reexecutável: apaga e recria tudo com datas relativas a now(). Rode na véspera da apresentação
-- com database/seed/recarregar-demo.sh, que também recalcula as notas (eventos inseridos aqui
-- não passam pela fila de scoring).
--
-- Senha de todas as personas: demo123
-- Depende do catálogo do V015 (slugs). Remove também os usuários e visitantes de teste.

BEGIN;

-- ---------------------------------------------------------------------------
-- Personas
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE persona (
    chave          text PRIMARY KEY,
    email          text NOT NULL,
    tipo           tipo_usuario NOT NULL,
    nome           text,
    razao          text,
    cpf            char(11),
    cnpj           char(14),
    telefone       text,
    idade          smallint,
    cadastro_dias  int NOT NULL,
    cookies        boolean NOT NULL,
    proativo       boolean NOT NULL,
    excluido_dias  int
) ON COMMIT DROP;

INSERT INTO persona VALUES
-- PJ
('schmitt',      'compras@mecanicaschmitt.com.br',        'PJ', NULL, 'Auto Mecânica Schmitt Ltda',        NULL, '23456789000110', '47991234501', NULL, 170, TRUE,  TRUE,  NULL),
('vale',         'frota@transvaleitapocu.com.br',         'PJ', NULL, 'Transportes Vale do Itapocu Ltda',  NULL, '34567890000121', '47992234502', NULL, 150, TRUE,  TRUE,  NULL),
('pomerode',     'oficina@dieselpomerode.com.br',         'PJ', NULL, 'Oficina Diesel Pomerode Ltda',      NULL, '45678901000132', '47993234503', NULL, 120, TRUE,  TRUE,  NULL),
('kohler',       'compras@agrokohler.com.br',             'PJ', NULL, 'Agropecuária Kohler Ltda',          NULL, '56789012000143', '47994234504', NULL,  95, TRUE,  FALSE, NULL),
('canarinho',    'manutencao@onibuscanarinho.com.br',     'PJ', NULL, 'Ônibus Canarinho Transportes Ltda', NULL, '67890123000154', '47995234505', NULL,  80, TRUE,  TRUE,  NULL),
('locadora',     'frota@locadoraguarani.com.br',          'PJ', NULL, 'Locadora Guarani Veículos Ltda',    NULL, '78901234000165', '47996234506', NULL, 140, TRUE,  TRUE,  NULL),
('ribeirao',     'compras@autopecasribeirao.com.br',      'PJ', NULL, 'Auto Peças Ribeirão Ltda',          NULL, '89012345000176', '47997234507', NULL,  60, TRUE,  FALSE, NULL),
('marina',       'contato@marinabarravelha.com.br',       'PJ', NULL, 'Marina Barra Velha Náutica Ltda',   NULL, '90123456000187', '47998234508', NULL,  50, TRUE,  TRUE,  NULL),
('cerealista',   'administrativo@cerealistacorupa.com.br','PJ', NULL, 'Cerealista Corupá Ltda',            NULL, '01234567000198', '47999234509', NULL, 110, TRUE,  FALSE, NULL),
('terraplenagem','compras@terraplenagemriocerro.com.br',  'PJ', NULL, 'Terraplenagem Rio Cerro Ltda',      NULL, '12345678000109', '47991334510', NULL, 175, TRUE,  FALSE, NULL),
('tomelin',      'contato@mecanicatomelin.com.br',        'PJ', NULL, 'Mecânica Irmãos Tomelin Ltda',      NULL, '11345678000190', '47992334511', NULL,   4, TRUE,  TRUE,  NULL),
-- PF
('carlos',       'carlos.kreutzfeld@gmail.com',           'PF', 'Carlos Eduardo Kreutzfeld', NULL, '31245678901', NULL, '47988123401', 41, 160, TRUE,  TRUE,  NULL),
('juliana',      'juliana.rpereira@gmail.com',            'PF', 'Juliana Rosa Pereira',      NULL, '42356789012', NULL, '47988123402', 33,   9, TRUE,  TRUE,  NULL),
('marcos',       'marcos.lopes.caminhoneiro@hotmail.com', 'PF', 'Marcos Vinícius Lopes',     NULL, '53467890123', NULL, '47988123403', 47,  35, TRUE,  TRUE,  NULL),
('rafael',       'rafa.hoffmann@gmail.com',               'PF', 'Rafael Hoffmann',           NULL, '64578901234', NULL, '47988123404', 26,  70, TRUE,  FALSE, NULL),
('joao',         'joaobkuhn@hotmail.com',                 'PF', 'João Batista Kuhn',         NULL, '75689012345', NULL, '47988123405', 66,  45, TRUE,  TRUE,  NULL),
('ana',          'anabmoretti@gmail.com',                 'PF', 'Ana Beatriz Moretti',       NULL, '86790123456', NULL, '47988123406', 29,  30, TRUE,  FALSE, NULL),
('sergio',       'sergio.bauer@hotmail.com',              'PF', 'Sérgio Luiz Bauer',         NULL, '97801234567', NULL, '47988123407', 58, 100, TRUE,  TRUE,  NULL),
('pedro',        'pedrozanella@gmail.com',                'PF', 'Pedro Henrique Zanella',    NULL, '18912345678', NULL, NULL,          20,  15, TRUE,  FALSE, NULL),
('fernanda',     'fernandaclima@gmail.com',               'PF', 'Fernanda Costa Lima',       NULL, '29023456789', NULL, '47988123409', 38,  25, TRUE,  FALSE, NULL),
('gustavo',      'gustavo.riedel@hotmail.com',            'PF', 'Gustavo Riedel',            NULL, '30134567890', NULL, '47988123410', 52,  40, TRUE,  FALSE, NULL),
('thiago',       'thiago.msouza@gmail.com',               'PF', 'Thiago Martins Souza',      NULL, '41245678902', NULL, '47988123411', 31,  12, TRUE,  FALSE, NULL),
('luciana',      'luciana.wolf@gmail.com',                'PF', 'Luciana Wolf',              NULL, '52356789013', NULL, '47988123412', 44,  20, FALSE, FALSE, NULL),
('roberto',      'roberto.siewert@hotmail.com',           'PF', 'Roberto Siewert',           NULL, '63467890124', NULL, '47988123413', 61, 130, TRUE,  FALSE, 10);

-- ---------------------------------------------------------------------------
-- Limpeza: personas de execução anterior, usuários de teste e visitantes anônimos
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE apagar ON COMMIT DROP AS
SELECT id FROM usuario
 WHERE tipo <> 'ADMIN'
   AND (email IN (SELECT email FROM persona)
        OR email LIKE '%@test.local'
        OR email IN ('maria@exemplo.com', 'teste@teste.com.br'));

DELETE FROM compra           WHERE usuario_id IN (SELECT id FROM apagar);
DELETE FROM solicitacao_lgpd WHERE usuario_id IN (SELECT id FROM apagar);
DELETE FROM usuario          WHERE id IN (SELECT id FROM apagar);  -- sessões, eventos, favoritos, scores: cascade
-- Anônimos são todos de teste/demo; o front recria a sessão quando o cookie some.
DELETE FROM visitante WHERE usuario_id IS NULL;

-- ---------------------------------------------------------------------------
-- Usuários, consentimentos e a solicitação de exclusão do Roberto
-- ---------------------------------------------------------------------------
INSERT INTO usuario (tipo, email, senha_hash, telefone, cpf, nome_completo, idade, cnpj, razao_social,
                     created_at, updated_at, deleted_at)
SELECT p.tipo, p.email, s.hash, p.telefone, p.cpf, p.nome, p.idade, p.cnpj, p.razao,
       now() - make_interval(days => p.cadastro_dias),
       now() - make_interval(days => coalesce(p.excluido_dias, p.cadastro_dias)),
       CASE WHEN p.excluido_dias IS NOT NULL THEN now() - make_interval(days => p.excluido_dias) END
FROM persona p
CROSS JOIN (SELECT crypt('demo123', gen_salt('bf', 10)) AS hash) s;

INSERT INTO consentimento_lgpd (usuario_id, tipo, aceito, versao_termos, aceito_em)
SELECT u.id, t.tipo,
       CASE t.tipo WHEN 'COOKIES_COMPORTAMENTAIS' THEN p.cookies
                   WHEN 'CONTATO_PROATIVO'        THEN p.proativo
                   ELSE TRUE END,
       '1.0', u.created_at
FROM persona p
JOIN usuario u ON u.email = p.email
CROSS JOIN (VALUES ('TERMOS_USO'::tipo_consentimento), ('POLITICA_PRIVACIDADE'),
                   ('COOKIES_COMPORTAMENTAIS'), ('CONTATO_PROATIVO')) AS t(tipo);

INSERT INTO solicitacao_lgpd (usuario_id, tipo, status, solicitado_em, atendido_em, observacoes)
SELECT u.id, 'EXCLUSAO', 'ATENDIDA', u.deleted_at - interval '2 days', u.deleted_at,
       'Cliente pediu a exclusão da conta pelo site.'
FROM usuario u WHERE u.email = 'roberto.siewert@hotmail.com';

-- ---------------------------------------------------------------------------
-- Jornadas: uma linha por ação; (chave, dias) = uma sessão. Ações:
--   olhou        visualização + rolagem 25/50% + 25 s ativos
--   leu          visualização + rolagem 25..100% + 100 s ativos
--   favoritou / desfavoritou
--   contatou     WhatsApp na ficha (conversão LEVE)
--   contatou_fav WhatsApp na lista de favoritos (conversão FORTE)
--   buscou       pesquisa; com produto, também o clique no resultado (soma no produto)
--   filtrou      filtro por categoria (e preço máximo, se informado)
-- As notas-alvo estão no plano: Quente ≥ 70, Morno 40–69, Frio < 40.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE jornada (
    id         serial,
    chave      text NOT NULL,
    dias       int NOT NULL,
    acao       text NOT NULL,
    produto    text,
    categoria  text,
    termo      text,
    preco_max  int
) ON COMMIT DROP;

INSERT INTO jornada (chave, dias, acao, produto, categoria, termo, preco_max) VALUES
-- Auto Mecânica Schmitt: dono de mecânica, cliente fiel de peças AP/Fire (Quente)
('schmitt', 60, 'buscou',       'bronzina-mancal-vw-ap-std', NULL, 'bronzina ap', NULL),
('schmitt', 60, 'leu',          'bronzina-mancal-vw-ap-std', NULL, NULL, NULL),
('schmitt', 60, 'favoritou',    'bronzina-mancal-vw-ap-std', NULL, NULL, NULL),
('schmitt', 60, 'olhou',        'bronzina-biela-vw-ap-025', NULL, NULL, NULL),
('schmitt', 33, 'buscou',       'junta-cabecote-vw-ap-1-8-2-0', NULL, 'junta cabeçote ap', NULL),
('schmitt', 33, 'leu',          'junta-cabecote-vw-ap-1-8-2-0', NULL, NULL, NULL),
('schmitt', 33, 'leu',          'jogo-juntas-fiat-fire-1-0', NULL, NULL, NULL),
('schmitt', 33, 'favoritou',    'jogo-juntas-fiat-fire-1-0', NULL, NULL, NULL),
('schmitt', 33, 'olhou',        'retentor-dianteiro-virabrequim-vw-ap', NULL, NULL, NULL),
('schmitt', 12, 'filtrou',      NULL, 'pistoes-e-aneis', NULL, NULL),
('schmitt', 12, 'leu',          'jogo-pistoes-aneis-vw-ap-1-6-std', NULL, NULL, NULL),
('schmitt', 12, 'favoritou',    'jogo-pistoes-aneis-vw-ap-1-6-std', NULL, NULL, NULL),
('schmitt', 12, 'olhou',        'jogo-pistoes-fiat-fire-1-0-std', NULL, NULL, NULL),
('schmitt',  5, 'contatou_fav', 'jogo-juntas-fiat-fire-1-0', NULL, NULL, NULL),
('schmitt',  5, 'contatou_fav', 'bronzina-mancal-vw-ap-std', NULL, NULL, NULL),
('schmitt',  1, 'olhou',        'retentor-valvula-vw-ap-jogo-8', NULL, NULL, NULL),
('schmitt',  1, 'leu',          'pasta-montagem-motor-100g', NULL, NULL, NULL),
('schmitt',  1, 'contatou_fav', 'jogo-pistoes-aneis-vw-ap-1-6-std', NULL, NULL, NULL),
-- Transportes Vale do Itapocu: frota MB OM 366, quer motor retificado (Quente)
('vale', 28, 'filtrou',  NULL, 'motores-retificados', NULL, NULL),
('vale', 28, 'olhou',    'motor-mwm-4-10-tca-retificado', NULL, NULL, NULL),
('vale', 28, 'leu',      'camisa-cilindro-mb-om-366', NULL, NULL, NULL),
('vale', 15, 'buscou',   NULL, NULL, 'om 366', NULL),
('vale', 15, 'leu',      'motor-mb-om-366-la-retificado', NULL, NULL, NULL),
('vale', 15, 'favoritou','motor-mb-om-366-la-retificado', NULL, NULL, NULL),
('vale', 15, 'leu',      'servico-retifica-virabrequim-diesel-6-cilindros', NULL, NULL, NULL),
('vale',  9, 'olhou',    'servico-retifica-virabrequim-diesel-6-cilindros', NULL, NULL, NULL),
('vale',  9, 'contatou', 'servico-retifica-virabrequim-diesel-6-cilindros', NULL, NULL, NULL),
('vale',  2, 'olhou',    'bronzina-mancal-mb-om-366-std', NULL, NULL, NULL),
('vale',  2, 'olhou',    'motor-mb-om-366-la-retificado', NULL, NULL, NULL),
('vale',  2, 'contatou', 'motor-mb-om-366-la-retificado', NULL, NULL, NULL),
-- Oficina Diesel Pomerode: mecânica diesel, kits e juntas MWM (Quente)
('pomerode', 45, 'buscou',       'kit-motor-mwm-4-10-tca-std', NULL, 'kit motor mwm', NULL),
('pomerode', 45, 'leu',          'jogo-juntas-mwm-4-10', NULL, NULL, NULL),
('pomerode', 20, 'olhou',        'kit-motor-mwm-4-10-tca-std', NULL, NULL, NULL),
('pomerode', 20, 'favoritou',    'kit-motor-mwm-4-10-tca-std', NULL, NULL, NULL),
('pomerode', 20, 'olhou',        'jogo-juntas-mwm-4-10', NULL, NULL, NULL),
('pomerode', 20, 'favoritou',    'jogo-juntas-mwm-4-10', NULL, NULL, NULL),
('pomerode', 20, 'olhou',        'bomba-agua-mwm-4-10', NULL, NULL, NULL),
('pomerode', 11, 'contatou_fav', 'jogo-juntas-mwm-4-10', NULL, NULL, NULL),
('pomerode',  6, 'contatou_fav', 'kit-motor-mwm-4-10-tca-std', NULL, NULL, NULL),
('pomerode',  4, 'leu',          'bomba-agua-mwm-4-10', NULL, NULL, NULL),
('pomerode',  4, 'contatou',     'bomba-agua-mwm-4-10', NULL, NULL, NULL),
-- Carlos: mecânico autônomo, monta motores AP (Quente)
('carlos', 50, 'filtrou',      NULL, 'pistoes-e-aneis', NULL, NULL),
('carlos', 50, 'leu',          'jogo-pistoes-aneis-vw-ap-1-8-050', NULL, NULL, NULL),
('carlos', 50, 'olhou',        'jogo-aneis-vw-ea111-1-6-std', NULL, NULL, NULL),
('carlos', 22, 'buscou',       'bronzina-biela-vw-ap-025', NULL, 'bronzina biela ap', NULL),
('carlos', 22, 'leu',          'bronzina-biela-vw-ap-025', NULL, NULL, NULL),
('carlos', 22, 'favoritou',    'bronzina-biela-vw-ap-025', NULL, NULL, NULL),
('carlos', 22, 'leu',          'pasta-montagem-motor-100g', NULL, NULL, NULL),
('carlos', 13, 'contatou_fav', 'bronzina-biela-vw-ap-025', NULL, NULL, NULL),
('carlos',  8, 'leu',          'jogo-pistoes-aneis-vw-ap-1-8-050', NULL, NULL, NULL),
('carlos',  8, 'contatou',     'jogo-pistoes-aneis-vw-ap-1-8-050', NULL, NULL, NULL),
('carlos',  3, 'olhou',        'arruela-encosto-virabrequim-vw-ap-std', NULL, NULL, NULL),
('carlos',  3, 'favoritou',    'arruela-encosto-virabrequim-vw-ap-std', NULL, NULL, NULL),
-- Juliana: o motor AP 1.6 do Gol fundiu; compara motor, meio motor e retífica (Quente)
('juliana', 8, 'buscou',       'motor-vw-ap-1-6-retificado', NULL, 'motor ap 1.6', NULL),
('juliana', 8, 'leu',          'motor-vw-ap-1-6-retificado', NULL, NULL, NULL),
('juliana', 8, 'leu',          'meio-motor-vw-ap-1-8', NULL, NULL, NULL),
('juliana', 8, 'olhou',        'servico-retifica-completa-4-cilindros-flex', NULL, NULL, NULL),
('juliana', 5, 'leu',          'servico-retifica-completa-4-cilindros-flex', NULL, NULL, NULL),
('juliana', 5, 'olhou',        'motor-vw-ap-1-6-retificado', NULL, NULL, NULL),
('juliana', 5, 'favoritou',    'motor-vw-ap-1-6-retificado', NULL, NULL, NULL),
('juliana', 5, 'olhou',        'meio-motor-vw-ap-1-8', NULL, NULL, NULL),
('juliana', 5, 'favoritou',    'meio-motor-vw-ap-1-8', NULL, NULL, NULL),
('juliana', 3, 'contatou_fav', 'meio-motor-vw-ap-1-8', NULL, NULL, NULL),
('juliana', 0, 'olhou',        'motor-vw-ap-1-6-retificado', NULL, NULL, NULL),
-- Marcos: caminhoneiro (VW 8-150); namora o motor de R$ 32,5 mil, contata no kit de R$ 5,4 mil (Quente, gap de preço)
('marcos', 30, 'buscou',    'motor-mwm-4-10-tca-retificado', NULL, 'motor mwm 4.10', NULL),
('marcos', 30, 'leu',       'motor-mwm-4-10-tca-retificado', NULL, NULL, NULL),
('marcos', 30, 'olhou',     'meio-motor-mwm-4-10-tca', NULL, NULL, NULL),
('marcos', 18, 'leu',       'motor-mwm-4-10-tca-retificado', NULL, NULL, NULL),
('marcos', 18, 'favoritou', 'motor-mwm-4-10-tca-retificado', NULL, NULL, NULL),
('marcos', 18, 'leu',       'meio-motor-mwm-4-10-tca', NULL, NULL, NULL),
('marcos',  9, 'leu',       'motor-mwm-4-10-tca-retificado', NULL, NULL, NULL),
('marcos',  9, 'leu',       'kit-motor-mwm-4-10-tca-std', NULL, NULL, NULL),
('marcos',  9, 'olhou',     'servico-retifica-completa-diesel-4-cilindros', NULL, NULL, NULL),
('marcos',  1, 'leu',       'kit-motor-mwm-4-10-tca-std', NULL, NULL, NULL),
('marcos',  1, 'contatou',  'kit-motor-mwm-4-10-tca-std', NULL, NULL, NULL),
-- Agropecuária Kohler: tratores MF 275 (Morno)
('kohler', 40, 'filtrou',   NULL, 'motores-retificados', NULL, NULL),
('kohler', 40, 'leu',       'motor-mwm-d229-4-retificado', NULL, NULL, NULL),
('kohler', 40, 'olhou',     'motor-usado-revisado-perkins-4-236', NULL, NULL, NULL),
('kohler', 14, 'leu',       'motor-mwm-d229-4-retificado', NULL, NULL, NULL),
('kohler', 14, 'favoritou', 'motor-mwm-d229-4-retificado', NULL, NULL, NULL),
('kohler', 14, 'olhou',     'servico-retifica-cabecote-diesel', NULL, NULL, NULL),
-- Ônibus Canarinho: ônibus com OM 366 (Morno)
('canarinho', 35, 'buscou',    NULL, NULL, 'virabrequim om 366', NULL),
('canarinho', 35, 'leu',       'servico-retifica-virabrequim-diesel-6-cilindros', NULL, NULL, NULL),
('canarinho', 35, 'olhou',     'bronzina-mancal-mb-om-366-std', NULL, NULL, NULL),
('canarinho', 10, 'leu',       'servico-retifica-virabrequim-diesel-6-cilindros', NULL, NULL, NULL),
('canarinho', 10, 'favoritou', 'servico-retifica-virabrequim-diesel-6-cilindros', NULL, NULL, NULL),
('canarinho', 10, 'leu',       'bronzina-mancal-mb-om-366-std', NULL, NULL, NULL),
-- Locadora Guarani: frota de Uno/Palio; contato há 45 dias, 2 compras (Morno, aviso < 3 compras)
('locadora', 50, 'leu',      'meio-motor-fiat-fire-1-0', NULL, NULL, NULL),
('locadora', 50, 'olhou',    'motor-fiat-fire-1-0-retificado', NULL, NULL, NULL),
('locadora', 45, 'olhou',    'motor-fiat-fire-1-0-retificado', NULL, NULL, NULL),
('locadora', 45, 'contatou', 'motor-fiat-fire-1-0-retificado', NULL, NULL, NULL),
('locadora', 20, 'olhou',    'kit-correia-dentada-tensor-fiat-fire', NULL, NULL, NULL),
-- Auto Peças Ribeirão: revendedor pesquisando preço de óleos e filtros (Morno)
('ribeirao', 40, 'filtrou',   NULL, 'oleos-e-lubrificantes', NULL, NULL),
('ribeirao', 40, 'olhou',     'oleo-motor-5w30-sintetico-api-sp-1l', NULL, NULL, NULL),
('ribeirao', 40, 'olhou',     'oleo-motor-10w40-semissintetico-1l', NULL, NULL, NULL),
('ribeirao', 40, 'olhou',     'oleo-motor-20w50-mineral-1l', NULL, NULL, NULL),
('ribeirao', 25, 'filtrou',   NULL, 'filtros', NULL, 50),
('ribeirao', 25, 'olhou',     'filtro-oleo-vw-ap-ea111', NULL, NULL, NULL),
('ribeirao', 25, 'olhou',     'filtro-oleo-fiat-fire', NULL, NULL, NULL),
('ribeirao', 25, 'olhou',     'filtro-ar-fiat-fire', NULL, NULL, NULL),
('ribeirao', 11, 'buscou',    NULL, NULL, 'oleo 5w30', NULL),
('ribeirao', 11, 'olhou',     'oleo-motor-5w30-sintetico-api-sp-1l', NULL, NULL, NULL),
('ribeirao', 11, 'olhou',     'oleo-motor-0w20-sintetico-1l', NULL, NULL, NULL),
('ribeirao',  4, 'olhou',     'oleo-motor-5w30-sintetico-api-sp-1l', NULL, NULL, NULL),
('ribeirao',  4, 'favoritou', 'oleo-motor-5w30-sintetico-api-sp-1l', NULL, NULL, NULL),
('ribeirao',  4, 'olhou',     'oleo-diesel-15w40-ci4-20l', NULL, NULL, NULL),
-- Marina Barra Velha: motores de popa e estacionário (Morno)
('marina', 30, 'buscou',    NULL, NULL, 'oleo 2 tempos', NULL),
('marina', 30, 'leu',       'oleo-motor-popa-2t-tcw3-1l', NULL, NULL, NULL),
('marina', 30, 'olhou',     'motor-estacionario-yanmar-ns-18', NULL, NULL, NULL),
('marina',  6, 'leu',       'oleo-motor-popa-2t-tcw3-1l', NULL, NULL, NULL),
('marina',  6, 'favoritou', 'oleo-motor-popa-2t-tcw3-1l', NULL, NULL, NULL),
-- Rafael: entusiasta montando um Gol GTI AP 1.8; tira o comando dos favoritos (Morno)
('rafael', 55, 'filtrou',      NULL, 'pistoes-e-aneis', NULL, NULL),
('rafael', 55, 'leu',          'jogo-pistoes-aneis-vw-ap-1-8-050', NULL, NULL, NULL),
('rafael', 55, 'favoritou',    'jogo-pistoes-aneis-vw-ap-1-8-050', NULL, NULL, NULL),
('rafael', 55, 'leu',          'comando-valvulas-vw-ap-1-6', NULL, NULL, NULL),
('rafael', 30, 'leu',          'jogo-tuchos-hidraulicos-vw-ap', NULL, NULL, NULL),
('rafael', 30, 'favoritou',    'jogo-tuchos-hidraulicos-vw-ap', NULL, NULL, NULL),
('rafael', 30, 'olhou',        'comando-valvulas-vw-ap-1-6', NULL, NULL, NULL),
('rafael', 30, 'favoritou',    'comando-valvulas-vw-ap-1-6', NULL, NULL, NULL),
('rafael', 13, 'desfavoritou', 'comando-valvulas-vw-ap-1-6', NULL, NULL, NULL),
('rafael', 13, 'leu',          'jogo-pistoes-aneis-vw-ap-1-8-050', NULL, NULL, NULL),
('rafael', 13, 'olhou',        'cabecote-vw-ap-8v-retificado', NULL, NULL, NULL),
-- João Batista: mecânico aposentado; pediu orçamento de cabeçote há 20 dias (Morno)
('joao', 22, 'olhou',    'servico-plaina-cabecote', NULL, NULL, NULL),
('joao', 22, 'olhou',    'servico-teste-estanqueidade-cabecote', NULL, NULL, NULL),
('joao', 22, 'olhou',    'servico-retifica-cabecote-8v', NULL, NULL, NULL),
('joao', 20, 'olhou',    'servico-retifica-cabecote-8v', NULL, NULL, NULL),
('joao', 20, 'contatou', 'servico-retifica-cabecote-8v', NULL, NULL, NULL),
-- Ana Beatriz: dona de Palio Fire, manutenção (Morno)
('ana', 26, 'buscou',    NULL, NULL, 'oleo palio fire', NULL),
('ana', 26, 'olhou',     'oleo-motor-5w30-sintetico-api-sp-1l', NULL, NULL, NULL),
('ana', 26, 'olhou',     'filtro-oleo-fiat-fire', NULL, NULL, NULL),
('ana',  8, 'leu',       'kit-correia-dentada-tensor-fiat-fire', NULL, NULL, NULL),
('ana',  8, 'favoritou', 'kit-correia-dentada-tensor-fiat-fire', NULL, NULL, NULL),
('ana',  8, 'olhou',     'bomba-agua-fiat-fire', NULL, NULL, NULL),
-- Cerealista Corupá: motor estacionário (Frio)
('cerealista', 38, 'olhou', 'motor-estacionario-yanmar-ns-18', NULL, NULL, NULL),
('cerealista', 38, 'olhou', 'filtro-combustivel-diesel-mwm-4-10', NULL, NULL, NULL),
('cerealista', 16, 'leu',   'motor-estacionario-yanmar-ns-18', NULL, NULL, NULL),
-- Terraplenagem Rio Cerro: interesse em Cummins há 100–130 dias, esfriou (Frio)
('terraplenagem', 130, 'buscou',    'junta-cabecote-cummins-isb-4-5', NULL, 'cummins isb', NULL),
('terraplenagem', 130, 'leu',       'junta-cabecote-cummins-isb-4-5', NULL, NULL, NULL),
('terraplenagem', 130, 'leu',       'servico-retifica-completa-diesel-4-cilindros', NULL, NULL, NULL),
('terraplenagem', 100, 'leu',       'servico-retifica-completa-diesel-4-cilindros', NULL, NULL, NULL),
('terraplenagem', 100, 'favoritou', 'servico-retifica-completa-diesel-4-cilindros', NULL, NULL, NULL),
-- Sérgio: produtor rural, MF 265, olhou há ~70 dias (Frio)
('sergio', 72, 'filtrou',   NULL, 'motores-retificados', NULL, NULL),
('sergio', 72, 'leu',       'motor-mwm-d229-4-retificado', NULL, NULL, NULL),
('sergio', 72, 'leu',       'motor-usado-revisado-perkins-4-236', NULL, NULL, NULL),
('sergio', 68, 'leu',       'motor-mwm-d229-4-retificado', NULL, NULL, NULL),
('sergio', 68, 'favoritou', 'motor-mwm-d229-4-retificado', NULL, NULL, NULL),
-- Pedro: estudante curioso (Frio)
('pedro', 14, 'buscou', NULL, NULL, 'motor turbo', NULL),
('pedro', 14, 'olhou',  'motor-fiat-etorq-1-8-retificado', NULL, NULL, NULL),
('pedro', 14, 'olhou',  'motor-cummins-isf-2-8-retificado', NULL, NULL, NULL),
-- Fernanda: Onix, só óleo (Frio)
('fernanda', 21, 'leu', 'oleo-motor-0w20-sintetico-1l', NULL, NULL, NULL),
-- Gustavo: pescador, motor de popa (Frio)
('gustavo', 33, 'leu',   'oleo-motor-popa-2t-tcw3-1l', NULL, NULL, NULL),
('gustavo', 33, 'olhou', 'aditivo-radiador-concentrado-1l', NULL, NULL, NULL),
-- Thiago: só filtrou uma categoria (nota de categoria, sem nota de produto)
('thiago', 10, 'filtrou', NULL, 'servicos-de-retifica', NULL, NULL);

-- Compras registradas pelo admin no balcão / WhatsApp (preço unitário = preço do catálogo).
CREATE TEMP TABLE compra_demo (chave text, produto text, quantidade int, dias int, observacoes text) ON COMMIT DROP;
INSERT INTO compra_demo VALUES
('schmitt',  'bronzina-mancal-vw-ap-std',            4, 210, NULL),
('schmitt',  'junta-cabecote-vw-ap-1-8-2-0',          6, 150, NULL),
('schmitt',  'jogo-juntas-fiat-fire-1-0',             2,  95, NULL),
('schmitt',  'bronzina-mancal-vw-ap-std',            3,  70, 'Retirou no balcão'),
('schmitt',  'retentor-dianteiro-virabrequim-vw-ap', 10,  45, NULL),
('schmitt',  'jogo-pistoes-aneis-vw-ap-1-6-std',      1,  20, 'Pedido pelo WhatsApp'),
('vale',     'oleo-diesel-15w40-ci4-20l',             2, 160, 'Troca de óleo da frota'),
('vale',     'oleo-diesel-15w40-ci4-20l',             2, 100, 'Troca de óleo da frota'),
('vale',     'oleo-diesel-15w40-ci4-20l',             3,  50, 'Troca de óleo da frota'),
('vale',     'oleo-diesel-15w40-ci4-20l',             2,  10, 'Troca de óleo da frota'),
('pomerode', 'filtro-combustivel-diesel-mwm-4-10',    6, 110, NULL),
('pomerode', 'filtro-oleo-cummins-isf-2-8',           4,  80, NULL),
('pomerode', 'oleo-diesel-15w40-ci4-5l',              5,  40, NULL),
('carlos',   'jogo-aneis-vw-ea111-1-6-std',           1, 140, NULL),
('carlos',   'bronzina-mancal-vw-ap-std',             2,  90, NULL),
('carlos',   'pasta-montagem-motor-100g',             3,  60, NULL),
('carlos',   'jogo-pistoes-aneis-vw-ap-1-6-std',      1,  30, 'Motor de cliente da oficina'),
('locadora', 'kit-correia-dentada-tensor-fiat-fire',  5, 120, 'Revisão da frota'),
('locadora', 'filtro-oleo-fiat-fire',                20,  60, 'Revisão da frota');

-- ---------------------------------------------------------------------------
-- Valida slugs e chaves antes de inserir (erro em vez de evento sem produto)
-- ---------------------------------------------------------------------------
DO $$
DECLARE faltando text;
BEGIN
    SELECT string_agg(DISTINCT x, ', ') INTO faltando FROM (
        SELECT 'produto ' || produto AS x FROM jornada WHERE produto IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM produto p WHERE p.slug = jornada.produto)
        UNION ALL
        SELECT 'produto ' || produto FROM compra_demo
         WHERE NOT EXISTS (SELECT 1 FROM produto p WHERE p.slug = compra_demo.produto)
        UNION ALL
        SELECT 'categoria ' || categoria FROM jornada WHERE categoria IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM categoria c WHERE c.slug = jornada.categoria)
        UNION ALL
        SELECT 'persona ' || chave FROM jornada WHERE chave NOT IN (SELECT chave FROM persona)
    ) f;
    IF faltando IS NOT NULL THEN
        RAISE EXCEPTION 'Não encontrado no banco: %', faltando;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Visitantes anônimos: navegação dos últimos 30 dias (Popularidade Global da vitrine)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE vis ON COMMIT DROP AS
SELECT v, nextval(pg_get_serial_sequence('visitante', 'id')) AS visitante_id
FROM generate_series(1, 15) v;

INSERT INTO visitante (id, fingerprint, created_at, updated_at)
SELECT visitante_id, 'demo', now() - interval '30 days', now() - interval '30 days' FROM vis;

-- ---------------------------------------------------------------------------
-- Sessões (persona: uma por chave + dia; visitante: 1 a 3) e ações a expandir
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE sessao_demo (
    sessao_id     bigint,
    usuario_id    bigint,
    visitante_id  bigint,
    base          timestamptz,
    dispositivo   text
) ON COMMIT DROP;

CREATE TEMP TABLE acao_demo (
    sessao_id  bigint,
    passo      int,
    acao       text,
    produto    text,
    categoria  text,
    termo      text,
    preco_max  int
) ON COMMIT DROP;

-- Horário do dia (8h–20h) estável por chave + dia; sessão de hoje nunca no futuro.
CREATE TEMP TABLE sessao_persona ON COMMIT DROP AS
SELECT d.chave, d.dias,
       nextval(pg_get_serial_sequence('sessao', 'id')) AS sessao_id,
       u.id AS usuario_id,
       least(date_trunc('day', now()) - make_interval(days => d.dias)
                 + make_interval(hours => 8 + mod(hashtext(d.chave || d.dias)::bigint + 2147483648, 12)::int,
                                 mins  => mod(hashtext(d.dias || d.chave)::bigint + 2147483648, 60)::int),
             now() - interval '3 hours') AS base,
       CASE WHEN p.tipo = 'PJ' OR mod(hashtext(d.chave)::bigint + 2147483648, 3) = 0
            THEN 'desktop' ELSE 'mobile' END AS dispositivo
FROM (SELECT DISTINCT chave, dias FROM jornada) d
JOIN persona p USING (chave)
JOIN usuario u ON u.email = p.email;

INSERT INTO sessao_demo SELECT sessao_id, usuario_id, NULL, base, dispositivo FROM sessao_persona;

INSERT INTO acao_demo
SELECT s.sessao_id, row_number() OVER (PARTITION BY j.chave, j.dias ORDER BY j.id),
       j.acao, j.produto, j.categoria, j.termo, j.preco_max
FROM jornada j JOIN sessao_persona s USING (chave, dias);

INSERT INTO sessao_demo
SELECT nextval(pg_get_serial_sequence('sessao', 'id')), NULL, vis.visitante_id,
       least(date_trunc('day', now()) - make_interval(days => mod(vis.v * 7 + s * 11, 30))
                 + make_interval(hours => 8 + mod(vis.v * 5 + s, 13), mins => mod(vis.v * 17 + s * 7, 60)),
             now() - interval '3 hours'),
       CASE WHEN mod(vis.v + s, 3) = 0 THEN 'desktop' ELSE 'mobile' END
FROM vis CROSS JOIN LATERAL generate_series(1, 1 + mod(vis.v, 3)) s;

INSERT INTO acao_demo
SELECT s.sessao_id, k,
       CASE WHEN mod(s.sessao_id + k, 3) = 0 THEN 'leu' ELSE 'olhou' END,
       (ARRAY['motor-vw-ap-1-6-retificado', 'oleo-motor-5w30-sintetico-api-sp-1l', 'servico-retifica-cabecote-8v',
              'kit-correia-dentada-tensor-vw-ap', 'motor-fiat-fire-1-0-retificado', 'jogo-pistoes-aneis-vw-ap-1-6-std',
              'servico-retifica-completa-4-cilindros-flex', 'oleo-diesel-15w40-ci4-20l', 'meio-motor-vw-ap-1-8',
              'filtro-oleo-vw-ap-ea111', 'motor-mwm-4-10-tca-retificado', 'servico-retifica-virabrequim-4-cilindros']
       )[1 + mod(s.sessao_id * 3 + k * 7, 12)::int],
       NULL, NULL, NULL
FROM sessao_demo s
CROSS JOIN LATERAL generate_series(1, 2 + mod(s.sessao_id, 3)::int) k
WHERE s.visitante_id IS NOT NULL;

INSERT INTO sessao (id, usuario_id, visitante_id, dispositivo, user_agent, canal_origem, iniciada_em, encerrada_em)
SELECT s.sessao_id, s.usuario_id, s.visitante_id, s.dispositivo,
       CASE s.dispositivo
           WHEN 'mobile' THEN 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'
           ELSE 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
       END,
       'web', s.base,
       s.base + make_interval(mins => 3 * (SELECT count(*) FROM acao_demo a WHERE a.sessao_id = s.sessao_id)::int + 2)
FROM sessao_demo s;

-- ---------------------------------------------------------------------------
-- Eventos: cada ação vira 1..6 eventos, 3 min entre ações e 20 s entre eventos da ação
-- ---------------------------------------------------------------------------
INSERT INTO evento (tipo, sessao_id, usuario_id, visitante_id, produto_id, categoria_id, conversao, metadados, ocorrido_em)
SELECT t.tipo::tipo_evento, s.sessao_id, s.usuario_id, s.visitante_id,
       CASE WHEN t.com_produto THEN p.id END,
       CASE WHEN t.com_categoria THEN c.id END,
       t.conversao::tipo_conversao, t.meta,
       s.base + make_interval(mins => 3 * (a.passo - 1), secs => 20 * t.k)
FROM acao_demo a
JOIN sessao_demo s ON s.sessao_id = a.sessao_id
LEFT JOIN produto p ON p.slug = a.produto
LEFT JOIN categoria c ON c.slug = a.categoria
JOIN LATERAL (VALUES
    ('olhou',        0, 'VISUALIZACAO_PRODUTO', NULL::text, TRUE,  FALSE, '{}'::jsonb),
    ('olhou',        1, 'SCROLL_DEPTH',         NULL,       TRUE,  FALSE, '{"pct": 25}'),
    ('olhou',        2, 'SCROLL_DEPTH',         NULL,       TRUE,  FALSE, '{"pct": 50}'),
    ('olhou',        3, 'TEMPO_PAGINA',         NULL,       TRUE,  FALSE, '{"segundos_ativos": 25}'),
    ('leu',          0, 'VISUALIZACAO_PRODUTO', NULL,       TRUE,  FALSE, '{}'),
    ('leu',          1, 'SCROLL_DEPTH',         NULL,       TRUE,  FALSE, '{"pct": 25}'),
    ('leu',          2, 'SCROLL_DEPTH',         NULL,       TRUE,  FALSE, '{"pct": 50}'),
    ('leu',          3, 'SCROLL_DEPTH',         NULL,       TRUE,  FALSE, '{"pct": 75}'),
    ('leu',          4, 'SCROLL_DEPTH',         NULL,       TRUE,  FALSE, '{"pct": 100}'),
    ('leu',          5, 'TEMPO_PAGINA',         NULL,       TRUE,  FALSE, '{"segundos_ativos": 100}'),
    ('favoritou',    0, 'FAVORITAR',            NULL,       TRUE,  FALSE, '{}'),
    ('desfavoritou', 0, 'DESFAVORITAR',         NULL,       TRUE,  FALSE, '{}'),
    ('contatou',     0, 'CONTATO_WHATSAPP',     'LEVE',     TRUE,  FALSE, '{}'),
    ('contatou_fav', 0, 'CONTATO_WHATSAPP',     'FORTE',    TRUE,  FALSE, '{}'),
    ('buscou',       0, 'PESQUISA',             NULL,       FALSE, FALSE, jsonb_build_object('termo', a.termo)),
    ('buscou',       1, 'PESQUISA',             NULL,       TRUE,  FALSE,
        jsonb_build_object('termo', a.termo, 'origem', 'resultado_pesquisa')),
    ('filtrou',      0, 'FILTRO_APLICADO',      NULL,       FALSE, TRUE,
        jsonb_build_object('filtros', jsonb_build_object('q', NULL::text, 'precoMin', NULL::int,
                                                         'precoMax', a.preco_max, 'categoria_id', c.id)))
) AS t(acao, k, tipo, conversao, com_produto, com_categoria, meta)
  ON t.acao = a.acao AND NOT (t.acao = 'buscou' AND t.k = 1 AND a.produto IS NULL);

-- Favoritos atuais = último FAVORITAR/DESFAVORITAR de cada par é FAVORITAR.
INSERT INTO favorito (usuario_id, produto_id, created_at)
SELECT usuario_id, produto_id, ocorrido_em
FROM (
    SELECT DISTINCT ON (e.usuario_id, e.produto_id) e.usuario_id, e.produto_id, e.tipo, e.ocorrido_em
    FROM evento e
    JOIN sessao_persona s ON s.sessao_id = e.sessao_id
    WHERE e.tipo IN ('FAVORITAR', 'DESFAVORITAR')
    ORDER BY e.usuario_id, e.produto_id, e.ocorrido_em DESC
) ultimo
WHERE tipo = 'FAVORITAR';

INSERT INTO compra (usuario_id, produto_id, preco_unitario, quantidade, valor_total, data_compra,
                    registrado_por, observacoes, created_at, updated_at)
SELECT u.id, p.id, p.preco, cd.quantidade, p.preco * cd.quantidade, current_date - cd.dias,
       adm.id, cd.observacoes, now() - make_interval(days => cd.dias), now() - make_interval(days => cd.dias)
FROM compra_demo cd
JOIN persona pe USING (chave)
JOIN usuario u ON u.email = pe.email
JOIN produto p ON p.slug = cd.produto
CROSS JOIN (SELECT id FROM usuario WHERE tipo = 'ADMIN' AND deleted_at IS NULL ORDER BY id LIMIT 1) adm;

COMMIT;

-- Resumo (as notas só aparecem depois do recálculo).
SELECT (SELECT count(*) FROM usuario WHERE tipo <> 'ADMIN') AS clientes,
       (SELECT count(*) FROM visitante WHERE fingerprint = 'demo') AS visitantes,
       (SELECT count(*) FROM sessao) AS sessoes,
       (SELECT count(*) FROM evento) AS eventos,
       (SELECT count(*) FROM favorito) AS favoritos,
       (SELECT count(*) FROM compra) AS compras;
