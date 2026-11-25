-- Coluna nunca preenchida nem lida. Removida por minimização de dados (LGPD): o sistema não coleta IP.

ALTER TABLE sessao DROP COLUMN ip_hash;
