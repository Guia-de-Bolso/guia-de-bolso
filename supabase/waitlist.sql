-- Lista de espera — captura de leads antes do lançamento nas lojas.
-- INSERT via POST /api/waitlist (service role). Leitura restrita a admin.

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  origem text NOT NULL DEFAULT 'landing',
  lgpd_aceito boolean NOT NULL DEFAULT false,
  confirmacao_enviada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique ON waitlist (lower(trim(email)));
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist (created_at DESC);
CREATE INDEX IF NOT EXISTS waitlist_origem_idx ON waitlist (origem);

COMMENT ON TABLE waitlist IS 'Leads da lista de espera (lançamento app / marketing).';

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin le waitlist" ON waitlist;
CREATE POLICY "Admin le waitlist"
ON waitlist
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfis
    WHERE perfis.id = auth.uid()
    AND perfis.role IN ('admin', 'dev')
  )
);
