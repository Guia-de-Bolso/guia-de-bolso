-- CRUD de lugares restrito a admin/dev (complementa lugares_public_read.sql).
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.

ALTER TABLE lugares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin insert lugares" ON lugares;
CREATE POLICY "Admin insert lugares"
  ON lugares
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin update lugares" ON lugares;
CREATE POLICY "Admin update lugares"
  ON lugares
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin delete lugares" ON lugares;
CREATE POLICY "Admin delete lugares"
  ON lugares
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());
