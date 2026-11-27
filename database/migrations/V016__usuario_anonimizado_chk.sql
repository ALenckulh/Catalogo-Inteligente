-- Exclusão de conta (LGPD) anonimiza o usuário: zera CPF/nome (PF) e CNPJ/razão social (PJ).
-- As constraints de V002 exigiam esses campos sempre e faziam o DELETE /api/conta falhar.
-- Agora a exigência vale só para contas ativas (deleted_at IS NULL).

ALTER TABLE usuario DROP CONSTRAINT usuario_pf_campos_chk;
ALTER TABLE usuario DROP CONSTRAINT usuario_pj_campos_chk;

ALTER TABLE usuario ADD CONSTRAINT usuario_pf_campos_chk
    CHECK (deleted_at IS NOT NULL OR tipo <> 'PF' OR (cpf IS NOT NULL AND nome_completo IS NOT NULL));
ALTER TABLE usuario ADD CONSTRAINT usuario_pj_campos_chk
    CHECK (deleted_at IS NOT NULL OR tipo <> 'PJ' OR (cnpj IS NOT NULL AND razao_social IS NOT NULL));
