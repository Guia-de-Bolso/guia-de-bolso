-- Admin pode excluir logs e feedback permanentemente.
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.

DROP POLICY IF EXISTS "logs_delete_admin" ON logs;
CREATE POLICY "logs_delete_admin"
  ON logs
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());

DROP POLICY IF EXISTS "feedback_delete_admin" ON feedback;
CREATE POLICY "feedback_delete_admin"
  ON feedback
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_dev());
