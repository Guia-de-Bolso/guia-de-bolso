-- Plano comercial em massa — coluna + classificação (ver lugares_plano_lancamento_bulk.sql).

ALTER TABLE lugares
  ADD COLUMN IF NOT EXISTS perfil_promo_ate date;

COMMENT ON COLUMN lugares.perfil_promo_ate IS
  'Data limite do perfil completo gratuito (lançamento). Após esta data, estabelecimentos comerciais voltam ao perfil básico (Presença) salvo eh_parceiro.';

CREATE INDEX IF NOT EXISTS lugares_perfil_promo_ate_idx
  ON lugares (perfil_promo_ate)
  WHERE perfil_promo_ate IS NOT NULL;

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
