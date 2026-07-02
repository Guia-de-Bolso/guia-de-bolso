-- Promove contas de desenvolvedor com Premium ilimitado pelos e-mails de login.
-- Rode no SQL Editor. Requer migration 20260702150000_dev_role_access.sql (is_dev + trigger).

ALTER TABLE perfis DISABLE TRIGGER perfis_guard_privileged_columns;

INSERT INTO perfis (id, nome, email, role, premium_ativo, premium_ate)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  u.email,
  'dev',
  true,
  NULL
FROM auth.users u
WHERE lower(u.email) IN (
  'brunodislilerdev@gmail.com',
  'rdecaldascampos@gmail.com'
)
ON CONFLICT (id) DO UPDATE
SET
  role = 'dev',
  premium_ativo = true,
  premium_ate = NULL,
  email = EXCLUDED.email,
  nome = COALESCE(perfis.nome, EXCLUDED.nome);

ALTER TABLE perfis ENABLE TRIGGER perfis_guard_privileged_columns;
