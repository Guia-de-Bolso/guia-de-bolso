-- Relacionamento logs → perfis (necessário para .select('*, perfis(nome)'))
ALTER TABLE logs
  DROP CONSTRAINT IF EXISTS logs_user_id_fkey;

ALTER TABLE logs
  ADD CONSTRAINT logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES perfis(id) ON DELETE SET NULL;

-- RLS: permitir leitura dos logs no painel admin
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policies legadas / abertas (remover vazamento de PII)
DROP POLICY IF EXISTS "Enable read access for all users" ON logs;
DROP POLICY IF EXISTS "Public read logs" ON logs;

DROP POLICY IF EXISTS "Admin lê logs" ON logs;
DROP POLICY IF EXISTS "Authenticated insert logs" ON logs;

CREATE POLICY "Dev lê logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (public.is_dev());

CREATE POLICY "Authenticated insert logs"
  ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "logs_delete_admin" ON logs;
CREATE POLICY "logs_delete_dev"
  ON logs
  FOR DELETE
  TO authenticated
  USING (public.is_dev());
