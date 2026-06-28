-- RLS: favoritos de lugares (bookmarks por usuário).
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.
-- Admin precisa SELECT global para relatórios (/admin/relatorios).

ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

-- Policies legadas (Dashboard / nomes antigos)
DROP POLICY IF EXISTS "Enable read access for all users" ON favoritos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON favoritos;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON favoritos;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favoritos;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favoritos;
DROP POLICY IF EXISTS favoritos_select_own ON favoritos;
DROP POLICY IF EXISTS favoritos_insert_own ON favoritos;
DROP POLICY IF EXISTS favoritos_delete_own ON favoritos;
DROP POLICY IF EXISTS "favoritos_select_own_or_admin" ON favoritos;
DROP POLICY IF EXISTS "favoritos_insert_own" ON favoritos;
DROP POLICY IF EXISTS "favoritos_delete_own" ON favoritos;

CREATE POLICY "favoritos_select_own_or_admin"
  ON favoritos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_or_dev());

CREATE POLICY "favoritos_insert_own"
  ON favoritos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favoritos_delete_own"
  ON favoritos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sem policy de UPDATE: favoritos são insert/delete apenas.
