-- Subcategoria Aventura → Surf (escolas, aulas e aluguel — não confundir com tag Surfe em Praias).
-- Rode no SQL Editor do Supabase (idempotente).

INSERT INTO subcategorias (categoria, nome, icone)
SELECT v.categoria, v.nome, v.icone
FROM (VALUES
  ('Aventura', 'Surf', '🏄')
) AS v(categoria, nome, icone)
WHERE NOT EXISTS (
  SELECT 1 FROM subcategorias s
  WHERE s.categoria = v.categoria AND s.nome = v.nome
);

-- Lugares já cadastrados como escola/aula de surf sob nomes legados
UPDATE lugares
SET subcategoria = 'Surf'
WHERE categoria = 'Aventura'
  AND subcategoria IS NOT NULL
  AND subcategoria <> 'Surf'
  AND (
    subcategoria IN ('Surfe', 'Escola de surf', 'Aulas de surf', 'Aula de surf')
    OR subcategoria ILIKE 'escola de surf%'
    OR subcategoria ILIKE 'aulas de surf%'
  );

-- Tags existentes úteis para escolas / operadores de surf
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
  'Surfe',
  'Stand-up paddle',
  'Bodyboard',
  'Ideal para iniciantes',
  'Para experientes',
  'Equipamento incluso',
  'Reserva necessária',
  'Instrutor certificado',
  'Treinamento incluso',
  'Com guia',
  'Idade mínima'
)
AND NOT (
  COALESCE(subcategorias, '[]'::jsonb)
  @> '[{"categoria":"Aventura","nome":"Surf"}]'::jsonb
);
