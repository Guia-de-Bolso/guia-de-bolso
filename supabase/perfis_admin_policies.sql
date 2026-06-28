-- Admin/dev pode atualizar qualquer perfil (ex.: role em /admin/usuarios).
-- Complementa perfis_update_own_usage (só linha própria).
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.
-- Trigger perfis_privileged_guard.sql: admin pode alterar role/premium; usuário comum não.

DROP POLICY IF EXISTS "perfis_update_admin" ON perfis;
CREATE POLICY "perfis_update_admin"
  ON perfis
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());
