-- Escrita admin em localizacoes e lugares_tags (complementa lugares_related_public_read.sql).
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.
-- Rode após lugares_related_public_read.sql e lugares_admin_write.sql.

-- ─── localizacoes ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin insert localizacoes" ON localizacoes;
CREATE POLICY "Admin insert localizacoes"
  ON localizacoes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin update localizacoes" ON localizacoes;
CREATE POLICY "Admin update localizacoes"
  ON localizacoes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin delete localizacoes" ON localizacoes;
CREATE POLICY "Admin delete localizacoes"
  ON localizacoes
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());

-- ─── lugares_tags ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin insert lugares_tags" ON lugares_tags;
CREATE POLICY "Admin insert lugares_tags"
  ON lugares_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin update lugares_tags" ON lugares_tags;
CREATE POLICY "Admin update lugares_tags"
  ON lugares_tags
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin delete lugares_tags" ON lugares_tags;
CREATE POLICY "Admin delete lugares_tags"
  ON lugares_tags
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());
