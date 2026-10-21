-- Trigger que mantém `updated_at` consistente em cada UPDATE.
-- Aplicado nas tabelas que possuem a coluna.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuario_set_updated_at
    BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER visitante_set_updated_at
    BEFORE UPDATE ON visitante
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER categoria_set_updated_at
    BEFORE UPDATE ON categoria
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER produto_set_updated_at
    BEFORE UPDATE ON produto
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
