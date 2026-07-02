-- Feedback de usuários (sugestões, dúvidas, erros reportados).
-- INSERT de visitantes: via POST /api/feedback (service role). Logados: RLS ou mesma API.

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (
    tipo IN ('sugestao', 'duvida', 'critica', 'elogio', 'erro', 'outro')
  ),
  status text NOT NULL DEFAULT 'novo' CHECK (
    status IN ('novo', 'em_analise', 'respondido', 'arquivado')
  ),
  assunto text,
  mensagem text NOT NULL,
  email_contato text,
  nome_contato text,
  pagina_origem text,
  contexto_tecnico jsonb,
  admin_notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback (status);
CREATE INDEX IF NOT EXISTS feedback_tipo_idx ON feedback (tipo);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback (user_id);

COMMENT ON TABLE feedback IS 'Sugestões, dúvidas e reportes enviados pelo app.';

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario insere proprio feedback" ON feedback;
CREATE POLICY "Usuario insere proprio feedback"
ON feedback
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuario le proprio feedback" ON feedback;
CREATE POLICY "Usuario le proprio feedback"
ON feedback
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin le feedback" ON feedback;
CREATE POLICY "Dev le feedback"
ON feedback
FOR SELECT
TO authenticated
USING (public.is_dev());

DROP POLICY IF EXISTS "Admin atualiza feedback" ON feedback;
CREATE POLICY "Dev atualiza feedback"
ON feedback
FOR UPDATE
TO authenticated
USING (public.is_dev())
WITH CHECK (public.is_dev());

DROP POLICY IF EXISTS "Admin exclui feedback" ON feedback;
DROP POLICY IF EXISTS "feedback_delete_admin" ON feedback;
CREATE POLICY "feedback_delete_dev"
ON feedback
FOR DELETE
TO authenticated
USING (public.is_dev());
