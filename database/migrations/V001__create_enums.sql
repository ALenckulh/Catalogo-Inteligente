-- Enums do sistema. Ver frontend/docs/08-MODELO-DE-DADOS.md §3.

CREATE TYPE tipo_usuario AS ENUM ('PF', 'PJ', 'ADMIN');

CREATE TYPE tipo_evento AS ENUM (
    'VISUALIZACAO_PRODUTO',
    'FAVORITAR',
    'DESFAVORITAR',
    'CONTATO_WHATSAPP',
    'PESQUISA',
    'FILTRO_APLICADO',
    'SCROLL_DEPTH',
    'TEMPO_PAGINA'
);

CREATE TYPE tipo_conversao AS ENUM (
    'LEVE',
    'FORTE',
    'CONFIRMADA'
);

CREATE TYPE tipo_aresta AS ENUM (
    'CO_OCORRENCIA',
    'CO_COMPRA',
    'PERTENCE_CATEGORIA'
);

CREATE TYPE tipo_consentimento AS ENUM (
    'TERMOS_USO',
    'POLITICA_PRIVACIDADE',
    'COOKIES_COMPORTAMENTAIS',
    'CONTATO_PROATIVO'
);

CREATE TYPE tipo_solicitacao_lgpd AS ENUM (
    'EXPORTACAO',
    'EXCLUSAO',
    'REVOGACAO_CONSENTIMENTO',
    'CORRECAO'
);

CREATE TYPE status_solicitacao_lgpd AS ENUM (
    'PENDENTE',
    'EM_PROCESSAMENTO',
    'ATENDIDA',
    'REJEITADA'
);
