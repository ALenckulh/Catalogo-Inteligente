-- Seed de demonstração: 1 admin + categorias + produtos de exemplo.
-- A senha do admin é gerada com crypt()/pgcrypto no formato bcrypt ($2a$),
-- compatível com Spring Security BCryptPasswordEncoder.
--
-- Credenciais de desenvolvimento (NÃO usar em produção):
--   e-mail: admin@catalogo.local
--   senha:  admin123

INSERT INTO usuario (tipo, email, senha_hash, nome_completo)
VALUES (
    'ADMIN',
    'admin@catalogo.local',
    crypt('admin123', gen_salt('bf', 10)),
    'Administrador do Catálogo'
);

-- Categorias de nível raiz.
INSERT INTO categoria (nome, slug, descricao) VALUES
    ('Equipamentos', 'equipamentos', 'Máquinas e equipamentos industriais de ciclo de compra longo'),
    ('Insumos',      'insumos',      'Insumos de reposição frequente'),
    ('Peças',        'pecas',        'Peças avulsas e componentes'),
    ('Ferramentas',  'ferramentas',  'Ferramentas manuais e elétricas');

-- Produtos de exemplo.
INSERT INTO produto (nome, slug, descricao, preco, categoria_id, ficha_tecnica) VALUES
    ('Compressor Industrial 20HP',
     'compressor-industrial-20hp',
     'Compressor de ar industrial de alta vazão para operação contínua.',
     18500.00,
     (SELECT id FROM categoria WHERE slug = 'equipamentos'),
     '{"potencia_hp": 20, "pressao_bar": 10, "vazao_m3h": 180}'::jsonb),

    ('Motor Elétrico Trifásico 5CV',
     'motor-eletrico-trifasico-5cv',
     'Motor trifásico 220/380V, rotação 1750 rpm.',
     2800.00,
     (SELECT id FROM categoria WHERE slug = 'equipamentos'),
     '{"tensao": "220/380V", "potencia_cv": 5, "rpm": 1750}'::jsonb),

    ('Óleo Lubrificante ISO 68 — 20L',
     'oleo-lubrificante-iso-68-20l',
     'Óleo lubrificante industrial, galão de 20 litros.',
     320.00,
     (SELECT id FROM categoria WHERE slug = 'insumos'),
     '{"viscosidade": "ISO VG 68", "volume_litros": 20}'::jsonb),

    ('Rolamento 6205 ZZ',
     'rolamento-6205-zz',
     'Rolamento rígido de esferas, blindado dos dois lados.',
     42.00,
     (SELECT id FROM categoria WHERE slug = 'pecas'),
     '{"diametro_interno_mm": 25, "diametro_externo_mm": 52, "largura_mm": 15}'::jsonb),

    ('Correia Industrial A-60',
     'correia-industrial-a-60',
     'Correia em V perfil A, comprimento 60 polegadas.',
     85.00,
     (SELECT id FROM categoria WHERE slug = 'pecas'),
     '{"perfil": "A", "comprimento_pol": 60}'::jsonb),

    ('Chave de Impacto Pneumática 1/2"',
     'chave-impacto-pneumatica-1-2',
     'Chave de impacto pneumática, torque máximo 1200 Nm.',
     1450.00,
     (SELECT id FROM categoria WHERE slug = 'ferramentas'),
     '{"encaixe_pol": "1/2", "torque_max_nm": 1200}'::jsonb);

-- Imagens placeholder (usar URLs externas; substituir depois pelo armazenamento real).
INSERT INTO produto_imagem (produto_id, url, ordem, alt_text)
SELECT id, 'https://placehold.co/800x600?text=' || replace(nome, ' ', '+'), 0, nome
FROM produto;
