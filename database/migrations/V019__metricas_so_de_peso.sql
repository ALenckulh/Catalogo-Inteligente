-- Métricas que só têm peso (nunca viram evento): a compra vem da tabela compra, e o retorno é calculado
-- das visualizações em sessões diferentes. Valor novo de enum não pode ser usado na mesma transação,
-- por isso os pesos entram na V020.

ALTER TYPE tipo_evento ADD VALUE IF NOT EXISTS 'COMPRA';
ALTER TYPE tipo_evento ADD VALUE IF NOT EXISTS 'RETORNO_PAGINA';
