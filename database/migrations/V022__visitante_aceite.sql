-- Aceite de cookies do visitante no banco: sem ele, o backend recusa os eventos. Quem já existe foi criado
-- no aceite (a sessão só abre depois dele).
ALTER TABLE visitante ADD COLUMN aceite_cookies_em TIMESTAMPTZ;
UPDATE visitante SET aceite_cookies_em = created_at;

-- Colunas nunca usadas: o sistema não coleta fingerprint nem IP.
ALTER TABLE visitante DROP COLUMN fingerprint;
ALTER TABLE consentimento_lgpd DROP COLUMN ip_origem;
