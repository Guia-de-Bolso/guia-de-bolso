-- Remove categorias Compras e Hospedagem do catálogo (produto).
-- Execute no Supabase SQL Editor após deploy do app sem essas categorias.
-- Idempotente.

-- 1) Desativa locais remanescentes nessas categorias (não apaga histórico de logs).
UPDATE lugares
SET status = 'desativado',
    desativado_em = COALESCE(desativado_em, now())
WHERE categoria IN ('Compras', 'Hospedagem')
  AND (status IS DISTINCT FROM 'desativado');

-- 2) Remove subcategorias canônicas dessas categorias.
DELETE FROM subcategorias
WHERE categoria IN ('Compras', 'Hospedagem');

-- 3) Limpa vínculos de tags (subcategorias jsonb + categorias jsonb).
UPDATE tags
SET subcategorias = COALESCE((
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements(COALESCE(subcategorias, '[]'::jsonb)) AS elem
  WHERE elem->>'categoria' NOT IN ('Compras', 'Hospedagem')
), '[]'::jsonb),
categorias = COALESCE((
  SELECT jsonb_agg(DISTINCT value)
  FROM jsonb_array_elements_text(COALESCE(categorias, '[]'::jsonb)) AS value
  WHERE value NOT IN ('Compras', 'Hospedagem')
), '[]'::jsonb)
WHERE categorias::text LIKE '%Compras%'
   OR categorias::text LIKE '%Hospedagem%'
   OR subcategorias::text LIKE '%Compras%'
   OR subcategorias::text LIKE '%Hospedagem%';
