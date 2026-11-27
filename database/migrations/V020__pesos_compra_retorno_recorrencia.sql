-- Valores iniciais que não mudam nenhuma nota: a compra começa com o peso do WhatsApp (que ela já usava),
-- o retorno em 0, a recorrência em 1,00 (sem bônus) e a pausa nos 60 dias de sempre.

INSERT INTO peso_metrica (tipo_evento, peso)
SELECT 'COMPRA', peso FROM peso_metrica WHERE tipo_evento = 'CONTATO_WHATSAPP'
ON CONFLICT DO NOTHING;

INSERT INTO peso_metrica (tipo_evento, peso) VALUES ('RETORNO_PAGINA', 0)
ON CONFLICT DO NOTHING;

ALTER TABLE parametro_decay
    ADD COLUMN boost_recorrencia NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    -- Só a linha global (categoria_id NULL) vale.
    ADD COLUMN pausa_dias SMALLINT NOT NULL DEFAULT 60;
