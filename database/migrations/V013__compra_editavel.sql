-- Compra passa a ser editável e excluível (soft delete) pelo admin.
-- updated_at registra a última edição (trigger de V009); índice parcial
-- cobre as leituras, que sempre filtram compras ativas.

ALTER TABLE compra
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER compra_set_updated_at
    BEFORE UPDATE ON compra
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS compra_ativas_usuario_idx
    ON compra (usuario_id, data_compra DESC)
    WHERE deleted_at IS NULL;
