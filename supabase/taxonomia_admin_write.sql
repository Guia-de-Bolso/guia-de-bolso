-- Taxonomia: leitura pública + escrita restrita a admin/dev.
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.
-- tags: complementa "Public read tags" em lugares_related_public_read.sql.

-- ─── tags ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin insert tags" ON tags;
CREATE POLICY "Admin insert tags"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin update tags" ON tags;
CREATE POLICY "Admin update tags"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin delete tags" ON tags;
CREATE POLICY "Admin delete tags"
  ON tags
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());

-- ─── subcategorias ──────────────────────────────────────────────────────────

ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON subcategorias;
DROP POLICY IF EXISTS "Public read subcategorias" ON subcategorias;
CREATE POLICY "Public read subcategorias"
  ON subcategorias
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin write subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin insert subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin update subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin delete subcategorias" ON subcategorias;

CREATE POLICY "Admin insert subcategorias"
  ON subcategorias
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "Admin update subcategorias"
  ON subcategorias
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "Admin delete subcategorias"
  ON subcategorias
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());
