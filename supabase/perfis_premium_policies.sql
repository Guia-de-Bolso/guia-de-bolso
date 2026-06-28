-- Permite que o usuário autenticado atualize o próprio perfil (nome, foto, maps_preferido).
-- Contadores IA (buscas_ia, roteiros_ia, uso_ia_mes) são bloqueados pelo trigger em perfis_privileged_guard.sql.
-- Rode após premium_usuario.sql. Obrigatório também: perfis_ia_usage_write.sql, perfis_privileged_guard.sql.

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_update_own_usage" ON perfis;
CREATE POLICY "perfis_update_own_usage"
  ON perfis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "perfis_insert_own" ON perfis;
CREATE POLICY "perfis_insert_own"
  ON perfis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "perfis_select_own" ON perfis;
CREATE POLICY "perfis_select_own"
  ON perfis
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
