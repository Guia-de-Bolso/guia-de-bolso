-- Tags de especialidade para Aventura → Surf (escolas, aulas, aluguel).
-- Idempotente — rode no SQL Editor do Supabase (após subcategoria_aventura_surf.sql).

ALTER TABLE tags ADD COLUMN IF NOT EXISTS icone text;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS categorias jsonb DEFAULT '[]';
ALTER TABLE tags ADD COLUMN IF NOT EXISTS subcategorias jsonb DEFAULT '[]';

INSERT INTO tags (nome, icone, categorias, subcategorias)
SELECT v.nome, v.icone, v.categorias::jsonb, v.subcategorias::jsonb
FROM (VALUES
  ('Aulas de surf', '🏄', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]'),
  ('Aluguel de prancha', '🛹', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]'),
  ('Aula particular', '👤', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]'),
  ('Aula em grupo', '👥', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]'),
  ('Aula infantil', '🧒', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]'),
  ('Longboard', '🏄‍♂️', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]'),
  ('Prancha soft', '🛟', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]'),
  ('Roupa de neoprene', '🧥', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]'),
  ('Pico próximo', '🌊', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]'),
  ('Escola de surf', '🏫', '["Aventura"]', '[{"categoria":"Aventura","nome":"Surf"}]')
) AS v(nome, icone, categorias, subcategorias)
WHERE NOT EXISTS (SELECT 1 FROM tags t WHERE t.nome = v.nome);

-- Garante vínculo Surf se a tag já existir com outro escopo
UPDATE tags
SET subcategorias = COALESCE(subcategorias, '[]'::jsonb) ||
  '[{"categoria":"Aventura","nome":"Surf"}]'::jsonb,
    categorias = (
      SELECT jsonb_agg(DISTINCT elem ORDER BY elem)
      FROM (
        SELECT jsonb_array_elements_text(COALESCE(categorias, '[]'::jsonb)) AS elem
        UNION
        SELECT 'Aventura'
      ) x
    )
WHERE nome IN (
  'Aulas de surf',
  'Aluguel de prancha',
  'Aula particular',
  'Aula em grupo',
  'Aula infantil',
  'Longboard',
  'Prancha soft',
  'Roupa de neoprene',
  'Pico próximo',
  'Escola de surf'
)
AND NOT (
  COALESCE(subcategorias, '[]'::jsonb)
  @> '[{"categoria":"Aventura","nome":"Surf"}]'::jsonb
);
