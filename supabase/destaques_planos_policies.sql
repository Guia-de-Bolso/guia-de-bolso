-- RLS: planos e destaques (legado comercial — app usa lugares.eh_parceiro).
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.
-- planos: leitura pública (referência); escrita admin.
-- destaques: admin only (tabela mantida no banco, não usada no app V1).

ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE destaques ENABLE ROW LEVEL SECURITY;

-- ─── planos ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Enable read access for all users" ON planos;
DROP POLICY IF EXISTS "Public read planos" ON planos;
DROP POLICY IF EXISTS "Admin write planos" ON planos;
DROP POLICY IF EXISTS "planos_select_public" ON planos;
DROP POLICY IF EXISTS "planos_insert_admin" ON planos;
DROP POLICY IF EXISTS "planos_update_admin" ON planos;
DROP POLICY IF EXISTS "planos_delete_admin" ON planos;

CREATE POLICY "planos_select_public"
  ON planos
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "planos_insert_admin"
  ON planos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "planos_update_admin"
  ON planos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "planos_delete_admin"
  ON planos
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());

-- ─── destaques ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Enable read access for all users" ON destaques;
DROP POLICY IF EXISTS "Public read destaques" ON destaques;
DROP POLICY IF EXISTS "Admin write destaques" ON destaques;
DROP POLICY IF EXISTS "destaques_admin_all" ON destaques;
DROP POLICY IF EXISTS "destaques_select_admin" ON destaques;
DROP POLICY IF EXISTS "destaques_insert_admin" ON destaques;
DROP POLICY IF EXISTS "destaques_update_admin" ON destaques;
DROP POLICY IF EXISTS "destaques_delete_admin" ON destaques;

CREATE POLICY "destaques_select_admin"
  ON destaques
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_dev());

CREATE POLICY "destaques_insert_admin"
  ON destaques
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "destaques_update_admin"
  ON destaques
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "destaques_delete_admin"
  ON destaques
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());
