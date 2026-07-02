-- Moderação admin de avaliações (/admin, /admin/avaliacoes).
-- Complementa avaliacoes_moderacao.sql (insert/select own + select aprovadas).
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.

DROP POLICY IF EXISTS "avaliacoes_select_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_select_admin"
  ON avaliacoes
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_dev());

DROP POLICY IF EXISTS "avaliacoes_update_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_update_admin"
  ON avaliacoes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "avaliacoes_delete_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_delete_admin"
  ON avaliacoes
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());
