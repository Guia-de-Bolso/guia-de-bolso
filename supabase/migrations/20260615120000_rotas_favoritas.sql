-- Favoritos de rotas curadas (tabela `rotas`), separado de `favoritos` (lugares) e `roteiros` (IA).

CREATE TABLE IF NOT EXISTS rotas_favoritas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rota_id uuid NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, rota_id)
);

CREATE INDEX IF NOT EXISTS rotas_favoritas_user_id_idx ON rotas_favoritas (user_id);
CREATE INDEX IF NOT EXISTS rotas_favoritas_rota_id_idx ON rotas_favoritas (rota_id);

ALTER TABLE rotas_favoritas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own rotas_favoritas" ON rotas_favoritas;
CREATE POLICY "Users select own rotas_favoritas"
ON rotas_favoritas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own rotas_favoritas" ON rotas_favoritas;
CREATE POLICY "Users insert own rotas_favoritas"
ON rotas_favoritas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own rotas_favoritas" ON rotas_favoritas;
CREATE POLICY "Users delete own rotas_favoritas"
ON rotas_favoritas FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
