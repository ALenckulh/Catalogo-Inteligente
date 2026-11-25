-- Nova calibração padrão (docs/13-MUDANCAS-DE-ESCOPO.md, M21): com os pesos anteriores, só navegar já levava a
-- Quente (ler o mesmo produto 3 vezes dava 89). λ 0,0077 = meia-vida de 90 dias.
-- Os valores foram calibrados em conjunto: só muda quem ainda usa o padrão anterior inteiro. Não mexe nas notas;
-- elas mudam no próximo recálculo.

DO $$
BEGIN
  IF (SELECT count(*)
        FROM peso_metrica p
        JOIN (VALUES ('VISUALIZACAO_PRODUTO', 0.2), ('FAVORITAR', 0.5), ('DESFAVORITAR', 0.1),
                     ('CONTATO_WHATSAPP', 1.0), ('PESQUISA', 0.5), ('FILTRO_APLICADO', 0.5),
                     ('SCROLL_DEPTH', 0.3), ('TEMPO_PAGINA', 0.5), ('COMPRA', 1.0), ('RETORNO_PAGINA', 0.0)
             ) AS antigo(tipo, peso)
          ON antigo.tipo = p.tipo_evento::text AND antigo.peso = p.peso) = 10
     AND EXISTS (SELECT 1 FROM parametro_decay WHERE categoria_id IS NULL AND lambda = 0.01)
  THEN
    UPDATE peso_metrica p
       SET peso = novo.peso, atualizado_em = now()
      FROM (VALUES ('VISUALIZACAO_PRODUTO', 0.1), ('FAVORITAR', 1.2), ('CONTATO_WHATSAPP', 1.5),
                   ('PESQUISA', 0.4), ('TEMPO_PAGINA', 0.2)) AS novo(tipo, peso)
     WHERE novo.tipo = p.tipo_evento::text;

    UPDATE parametro_decay SET lambda = 0.0077, atualizado_em = now() WHERE categoria_id IS NULL;
  END IF;
END $$;
