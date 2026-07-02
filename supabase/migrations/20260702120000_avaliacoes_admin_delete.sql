-- Admin pode excluir avaliações permanentemente (/admin/avaliacoes).
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.

DROP POLICY IF EXISTS "avaliacoes_delete_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_delete_admin"
  ON avaliacoes
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());
