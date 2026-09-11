-- Taxonomia de lugares: subcategorias amplas + detalhes em tags.
-- Subcategoria = tipo do lugar (ex.: Praias, Restaurantes).
-- Tags = atributos (ex.: Surfe, Pôr do sol imperdível).
-- Rode no SQL Editor do Supabase (idempotente).

-- ─── 1. Subcategorias canônicas (uma por “tipo”, sem duplicar Praia/Surf/etc.) ───

INSERT INTO subcategorias (categoria, nome, icone)
SELECT v.categoria, v.nome, v.icone
FROM (VALUES
  ('Natureza', 'Praias', '🏖️'),
  ('Natureza', 'Trilhas', '🥾'),
  ('Natureza', 'Cachoeiras', '💧'),
  ('Natureza', 'Mirantes', '🌄'),
  ('Natureza', 'Lagoas', '🏞️'),
  ('Natureza', 'Parques', '🌳'),
  ('Natureza', 'Piscinas naturais', '💧'),
  ('Natureza', 'Dunas', '🏜️'),
  ('Natureza', 'Ilhas', '🏝️'),
  ('Gastronomia', 'Restaurantes', '🍽️'),
  ('Gastronomia', 'Cafés', '☕'),
  ('Gastronomia', 'Bares', '🍺'),
  ('Gastronomia', 'Padarias', '🥐'),
  ('Gastronomia', 'Sorveterias', '🍦'),
  ('Gastronomia', 'Empório Gourmet', '🫒'),
  ('Noite', 'Bares', '🍺'),
  ('Noite', 'Baladas', '🎶'),
  ('Noite', 'Pubs', '🍻'),
  ('Serviços', 'Farmácias', '💊'),
  ('Serviços', 'Mercados', '🛒'),
  ('Serviços', 'Mecânicos', '🔧'),
  ('Serviços', 'Salões', '💇'),
  ('Serviços', 'Saúde', '🏥'),
  ('Hospedagem', 'Pousadas', '🏡'),
  ('Hospedagem', 'Hostels', '🛏️'),
  ('Hospedagem', 'Hotéis', '🏨'),
  ('Cultura', 'Museus', '🏛️'),
  ('Cultura', 'Monumentos', '🗿'),
  ('Cultura', 'Igrejas e templos', '⛪'),
  ('Cultura', 'Eventos', '🎭'),
  ('Aventura', 'Esportes radicais', '🪂'),
  ('Aventura', 'Surf', '🏄'),
  ('Aventura', 'Passeios de barco', '⛵'),
  ('Aventura', 'Escalada', '🧗'),
  ('Aventura', 'Ciclismo', '🚴'),
  ('Bem-estar', 'Spa', '💆'),
  ('Bem-estar', 'Yoga', '🧘'),
  ('Bem-estar', 'Terapias', '✨'),
  ('Compras', 'Lojas', '🛍️'),
  ('Compras', 'Feiras', '🧺'),
  ('Compras', 'Artesanato', '🎨')
) AS v(categoria, nome, icone)
WHERE NOT EXISTS (
  SELECT 1 FROM subcategorias s
  WHERE s.categoria = v.categoria AND s.nome = v.nome
);

-- ─── 2. Migrar lugares: subcategorias específicas → canônicas ───

-- Natureza → Praias (surfe, pôr do sol, mergulho, costão, “praia” no singular, etc.)
UPDATE lugares
SET subcategoria = 'Praias'
WHERE categoria = 'Natureza'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Praias'
  AND (
    subcategoria ILIKE '%surf%'
    OR subcategoria ILIKE '%surfe%'
    OR subcategoria ILIKE 'praia%'
    OR subcategoria ILIKE '%pôr do sol%'
    OR subcategoria ILIKE '%por do sol%'
    OR subcategoria ILIKE '%nascer do sol%'
    OR subcategoria ILIKE '%mergulh%'
    OR subcategoria ILIKE '%cost%o%'
    OR subcategoria IN (
      'Praia', 'Surf', 'Surfe', 'Pontos de surf', 'Ponto de surf',
      'Praia de surf', 'Mergulho', 'Costão', 'Costao'
    )
  );

UPDATE lugares SET subcategoria = 'Trilhas'
WHERE categoria = 'Natureza'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Trilhas'
  AND subcategoria ILIKE 'trilha%'
  AND subcategoria NOT ILIKE '%piscina%';

UPDATE lugares SET subcategoria = 'Cachoeiras'
WHERE categoria = 'Natureza'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Cachoeiras'
  AND subcategoria ILIKE 'cachoeira%';

UPDATE lugares SET subcategoria = 'Mirantes'
WHERE categoria = 'Natureza'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Mirantes'
  AND subcategoria ILIKE 'mirante%';

UPDATE lugares SET subcategoria = 'Lagoas'
WHERE categoria = 'Natureza'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Lagoas'
  AND subcategoria ILIKE 'lagoa%';

UPDATE lugares SET subcategoria = 'Parques'
WHERE categoria = 'Natureza'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Parques'
  AND subcategoria ILIKE 'parque%';

UPDATE lugares SET subcategoria = 'Dunas'
WHERE categoria = 'Natureza'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Dunas'
  AND subcategoria ILIKE 'duna%';

UPDATE lugares SET subcategoria = 'Ilhas'
WHERE categoria = 'Natureza'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Ilhas'
  AND subcategoria ILIKE 'ilha%';

UPDATE lugares SET subcategoria = 'Piscinas naturais'
WHERE categoria = 'Natureza'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Piscinas naturais'
  AND subcategoria ILIKE 'piscina%natural%';

-- Gastronomia (plural / sinônimos)
UPDATE lugares SET subcategoria = 'Restaurantes'
WHERE categoria = 'Gastronomia'
  AND subcategoria IN ('Restaurante', 'Comida', 'Alimentação');

UPDATE lugares SET subcategoria = 'Cafés'
WHERE categoria = 'Gastronomia'
  AND subcategoria IN ('Café', 'Cafe', 'Coffee');

UPDATE lugares SET subcategoria = 'Bares'
WHERE categoria = 'Gastronomia'
  AND subcategoria IN ('Bar', 'Choperia', 'Cervejaria');

-- Noite
UPDATE lugares SET subcategoria = 'Bares'
WHERE categoria = 'Noite' AND subcategoria IN ('Bar', 'Choperia', 'Cervejaria');

UPDATE lugares SET subcategoria = 'Baladas'
WHERE categoria = 'Noite' AND subcategoria IN ('Balada', 'Boate', 'Clube');

UPDATE lugares SET subcategoria = 'Pubs'
WHERE categoria = 'Noite' AND subcategoria IN ('Pub');

-- Hospedagem
UPDATE lugares SET subcategoria = 'Pousadas'
WHERE categoria = 'Hospedagem' AND subcategoria IN ('Pousada');

UPDATE lugares SET subcategoria = 'Hostels'
WHERE categoria = 'Hospedagem' AND subcategoria IN ('Hostel', 'Albergue');

UPDATE lugares SET subcategoria = 'Hotéis'
WHERE categoria = 'Hospedagem' AND subcategoria IN ('Hotel', 'Resort');

-- Cultura
UPDATE lugares SET subcategoria = 'Museus'
WHERE categoria = 'Cultura' AND subcategoria IN ('Museu');

UPDATE lugares SET subcategoria = 'Monumentos'
WHERE categoria = 'Cultura' AND subcategoria IN ('Monumento', 'Memorial');

UPDATE lugares SET subcategoria = 'Igrejas e templos'
WHERE categoria = 'Cultura'
  AND subcategoria IN ('Igreja', 'Templo', 'Capela', 'Santuário', 'Santuario');

-- Aventura
UPDATE lugares SET subcategoria = 'Surf'
WHERE categoria = 'Aventura'
  AND subcategoria IN ('Surfe', 'Escola de surf', 'Aulas de surf', 'Aula de surf');

UPDATE lugares SET subcategoria = 'Esportes radicais'
WHERE categoria = 'Aventura'
  AND subcategoria IN ('Rafting', 'Parapente', 'Asa delta');

UPDATE lugares SET subcategoria = 'Passeios de barco'
WHERE categoria = 'Aventura'
  AND subcategoria IN ('Passeio de barco', 'Escuna', 'Barco');

-- Compras
UPDATE lugares SET subcategoria = 'Lojas'
WHERE categoria = 'Compras' AND subcategoria IN ('Loja', 'Shopping');

UPDATE lugares SET subcategoria = 'Feiras'
WHERE categoria = 'Compras' AND subcategoria IN ('Feira', 'Feira livre');

-- ─── 3. Remover subcategorias fora do catálogo canônico ───

DELETE FROM subcategorias s
WHERE NOT EXISTS (
  SELECT 1
  FROM (VALUES
    ('Natureza', 'Praias'),
    ('Natureza', 'Trilhas'),
    ('Natureza', 'Cachoeiras'),
    ('Natureza', 'Mirantes'),
    ('Natureza', 'Lagoas'),
    ('Natureza', 'Parques'),
    ('Natureza', 'Piscinas naturais'),
    ('Natureza', 'Dunas'),
    ('Natureza', 'Ilhas'),
    ('Gastronomia', 'Restaurantes'),
    ('Gastronomia', 'Cafés'),
    ('Gastronomia', 'Bares'),
    ('Gastronomia', 'Padarias'),
    ('Gastronomia', 'Sorveterias'),
    ('Gastronomia', 'Empório Gourmet'),
    ('Noite', 'Bares'),
    ('Noite', 'Baladas'),
    ('Noite', 'Pubs'),
    ('Serviços', 'Farmácias'),
    ('Serviços', 'Mercados'),
    ('Serviços', 'Mecânicos'),
    ('Serviços', 'Salões'),
    ('Serviços', 'Saúde'),
    ('Hospedagem', 'Pousadas'),
    ('Hospedagem', 'Hostels'),
    ('Hospedagem', 'Hotéis'),
    ('Cultura', 'Museus'),
    ('Cultura', 'Monumentos'),
    ('Cultura', 'Igrejas e templos'),
    ('Cultura', 'Eventos'),
    ('Aventura', 'Esportes radicais'),
    ('Aventura', 'Surf'),
    ('Aventura', 'Passeios de barco'),
    ('Aventura', 'Escalada'),
    ('Aventura', 'Ciclismo'),
    ('Bem-estar', 'Spa'),
    ('Bem-estar', 'Yoga'),
    ('Bem-estar', 'Terapias'),
    ('Compras', 'Lojas'),
    ('Compras', 'Feiras'),
    ('Compras', 'Artesanato')
  ) AS canon(categoria, nome)
  WHERE canon.categoria = s.categoria AND canon.nome = s.nome
);

-- Lugares com subcategoria órfã (removida do catálogo) → limpar para reclassificar no admin
UPDATE lugares l
SET subcategoria = NULL
WHERE l.subcategoria IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subcategorias s
    WHERE s.categoria = l.categoria AND s.nome = l.subcategoria
  );

-- ─── 4. Tags para detalhes (não duplicar subcategoria) ───

ALTER TABLE tags ADD COLUMN IF NOT EXISTS categorias jsonb DEFAULT '[]';
ALTER TABLE tags ADD COLUMN IF NOT EXISTS icone text;

INSERT INTO tags (nome, icone, categorias)
SELECT v.nome, v.icone, v.categorias::jsonb
FROM (VALUES
  ('Surfe', '🏄', '["Natureza","Aventura"]'),
  ('Stand-up paddle', '🏄‍♂️', '["Natureza","Aventura"]'),
  ('Bodyboard', '🏄', '["Natureza"]'),
  ('Praia paradisíaca', '🏝️', '["Natureza"]'),
  ('Costão', '🪨', '["Natureza"]'),
  ('Piscina natural', '💧', '["Natureza"]'),
  ('Trilha leve', '🚶', '["Natureza","Aventura"]'),
  ('Observação de aves', '🦜', '["Natureza"]'),
  ('Piquenique', '🧺', '["Natureza"]'),
  ('Menu executivo', '🍱', '["Gastronomia"]'),
  ('Frutos do mar', '🦐', '["Gastronomia"]'),
  ('Comida local', '🥘', '["Gastronomia"]'),
  ('Happy hour', '🍻', '["Gastronomia","Noite"]'),
  ('Drinks autorais', '🍸', '["Noite","Gastronomia"]'),
  ('Música eletrônica', '🎧', '["Noite"]'),
  ('Ambiente intimista', '🕯️', '["Noite","Gastronomia"]'),
  ('Delivery', '🛵', '["Gastronomia","Serviços"]'),
  ('Atendimento 24h', '🕐', '["Serviços"]'),
  ('Orla', '🌊', '["Hospedagem","Natureza"]'),
  ('Café da manhã incluso', '☕', '["Hospedagem"]'),
  ('Arte local', '🎨', '["Cultura","Compras"]'),
  ('Patrimônio histórico', '📜', '["Cultura"]'),
  ('Trilha de bike', '🚴', '["Aventura"]'),
  ('Rapel', '🧗', '["Aventura"]'),
  ('Massagem', '💆', '["Bem-estar"]'),
  ('Produtos locais', '🧺', '["Compras"]')
) AS v(nome, icone, categorias)
WHERE NOT EXISTS (SELECT 1 FROM tags t WHERE t.nome = v.nome);

-- Tags de mar/onda também úteis em Aventura (se ainda sem categorias)
UPDATE tags SET categorias = '["Natureza","Aventura"]'::jsonb
WHERE nome IN ('Mar agitado', 'Mar calmo', 'Ótimo para mergulho')
  AND (categorias IS NULL OR categorias = '[]'::jsonb);
