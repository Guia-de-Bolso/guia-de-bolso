-- P0 RLS: favoritos, destaques/planos, perfis admin, avaliacoes admin.
-- Fonte canônica: favoritos_policies.sql, destaques_planos_policies.sql,
-- perfis_admin_policies.sql, avaliacoes_admin_policies.sql
-- Requer is_admin_or_dev() de perfis_rls_fix.sql.

-- favoritos_policies.sql
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

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
  ON favoritos FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_or_dev());

CREATE POLICY "favoritos_insert_own"
  ON favoritos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favoritos_delete_own"
  ON favoritos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- destaques_planos_policies.sql
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE destaques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON planos;
DROP POLICY IF EXISTS "Public read planos" ON planos;
DROP POLICY IF EXISTS "Admin write planos" ON planos;
DROP POLICY IF EXISTS "planos_select_public" ON planos;
DROP POLICY IF EXISTS "planos_insert_admin" ON planos;
DROP POLICY IF EXISTS "planos_update_admin" ON planos;
DROP POLICY IF EXISTS "planos_delete_admin" ON planos;

CREATE POLICY "planos_select_public"
  ON planos FOR SELECT TO public USING (true);

CREATE POLICY "planos_insert_admin"
  ON planos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "planos_update_admin"
  ON planos FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "planos_delete_admin"
  ON planos FOR DELETE TO authenticated
  USING (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Enable read access for all users" ON destaques;
DROP POLICY IF EXISTS "Public read destaques" ON destaques;
DROP POLICY IF EXISTS "Admin write destaques" ON destaques;
DROP POLICY IF EXISTS "destaques_admin_all" ON destaques;
DROP POLICY IF EXISTS "destaques_select_admin" ON destaques;
DROP POLICY IF EXISTS "destaques_insert_admin" ON destaques;
DROP POLICY IF EXISTS "destaques_update_admin" ON destaques;
DROP POLICY IF EXISTS "destaques_delete_admin" ON destaques;

CREATE POLICY "destaques_select_admin"
  ON destaques FOR SELECT TO authenticated
  USING (public.is_admin_or_dev());

CREATE POLICY "destaques_insert_admin"
  ON destaques FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "destaques_update_admin"
  ON destaques FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "destaques_delete_admin"
  ON destaques FOR DELETE TO authenticated
  USING (public.is_admin_or_dev());

-- perfis_admin_policies.sql
DROP POLICY IF EXISTS "perfis_update_admin" ON perfis;
CREATE POLICY "perfis_update_admin"
  ON perfis FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());

-- avaliacoes_admin_policies.sql
DROP POLICY IF EXISTS "avaliacoes_select_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_select_admin"
  ON avaliacoes FOR SELECT TO authenticated
  USING (public.is_admin_or_dev());

DROP POLICY IF EXISTS "avaliacoes_update_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_update_admin"
  ON avaliacoes FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());
