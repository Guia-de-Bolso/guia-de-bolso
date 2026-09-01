-- Plano comercial em massa (fase de lançamento).
-- Script completo: cria a coluna (se faltar) + classifica Presença vs Lançamento.
-- Cole no SQL Editor do Supabase ou: npm run db:plano-lancamento

-- 0) Coluna de promo de perfil completo (pule se já rodou lugares_perfil_promo.sql)
ALTER TABLE lugares
  ADD COLUMN IF NOT EXISTS perfil_promo_ate date;

COMMENT ON COLUMN lugares.perfil_promo_ate IS
  'Data limite do perfil completo gratuito (lançamento). Após esta data, estabelecimentos comerciais voltam ao perfil básico (Presença) salvo eh_parceiro.';

CREATE INDEX IF NOT EXISTS lugares_perfil_promo_ate_idx
  ON lugares (perfil_promo_ate)
  WHERE perfil_promo_ate IS NOT NULL;

-- 1) Presença — utilitários (farmácia, mercado, mecânico, saúde)
UPDATE lugares
SET perfil_promo_ate = NULL
WHERE eh_parceiro IS NOT TRUE
  AND categoria NOT IN ('Natureza', 'Aventura')
  AND trim(coalesce(subcategoria, '')) IN (
    'Farmácias',
    'Mercados',
    'Mecânicos',
    'Saúde'
  );

-- 2) Lançamento — demais estabelecimentos comerciais até fev/2027
UPDATE lugares
SET perfil_promo_ate = DATE '2027-02-28'
WHERE eh_parceiro IS NOT TRUE
  AND categoria NOT IN ('Natureza', 'Aventura')
  AND trim(coalesce(subcategoria, '')) NOT IN (
    'Farmácias',
    'Mercados',
    'Mecânicos',
    'Saúde'
  );

-- Verificação (descomente para conferir)
-- SELECT
--   categoria,
--   subcategoria,
--   perfil_promo_ate,
--   eh_parceiro,
--   count(*) AS total
-- FROM lugares
-- WHERE status = 'ativo' AND categoria NOT IN ('Natureza', 'Aventura')
-- GROUP BY 1, 2, 3, 4
-- ORDER BY 1, 2;
