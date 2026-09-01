-- Perfil completo gratuito por tempo limitado (fase de lançamento).

ALTER TABLE lugares
  ADD COLUMN IF NOT EXISTS perfil_promo_ate date;

COMMENT ON COLUMN lugares.perfil_promo_ate IS
  'Data limite do perfil completo gratuito (lançamento). Após esta data, estabelecimentos comerciais voltam ao perfil básico (Presença) salvo eh_parceiro.';

CREATE INDEX IF NOT EXISTS lugares_perfil_promo_ate_idx
  ON lugares (perfil_promo_ate)
  WHERE perfil_promo_ate IS NOT NULL;
