-- Pesos iniciais das métricas de scoring e taxa de decay global.
-- Valores derivados de frontend/docs/04-ESPECIFICACAO-TECNICA.md §3.1 e §5.1.
-- Pesos relativos: Baixo=0.2, Baixo-Médio=0.3, Médio=0.5, Médio-Alto=0.7, Alto=1.0.

INSERT INTO peso_metrica (tipo_evento, peso) VALUES
    ('VISUALIZACAO_PRODUTO', 0.2000),
    ('FAVORITAR',            0.5000),
    ('DESFAVORITAR',         0.1000),
    ('CONTATO_WHATSAPP',     1.0000),
    ('PESQUISA',             0.5000),
    ('FILTRO_APLICADO',      0.5000),
    ('SCROLL_DEPTH',         0.3000),
    ('TEMPO_PAGINA',         0.5000);

-- Decay global (λ=0.01 → meia-vida ~70 dias, perfil "uso geral — padrão").
-- categoria_id NULL representa o valor padrão aplicado quando a categoria não tem override.
INSERT INTO parametro_decay (categoria_id, lambda) VALUES
    (NULL, 0.01000);
