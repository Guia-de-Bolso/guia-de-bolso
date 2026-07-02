-- RLS para rotas curadas e tabelas relacionadas.
-- Rode no SQL Editor do Supabase se inserts no admin falharem com erro de RLS.

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM perfis
    WHERE id = auth.uid()
      AND role IN ('admin', 'dev')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ─── rotas ───────────────────────────────────────────────────────────────────

ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read rotas" ON rotas;
CREATE POLICY "Public read rotas"
ON rotas FOR SELECT
TO public
USING (COALESCE(ativa, true) = true OR public.is_admin_user());

DROP POLICY IF EXISTS "Admin insert rotas" ON rotas;
CREATE POLICY "Admin insert rotas"
ON rotas FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admin update rotas" ON rotas;
CREATE POLICY "Admin update rotas"
ON rotas FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admin delete rotas" ON rotas;
CREATE POLICY "Admin delete rotas"
ON rotas FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- ─── rota_pontos ───────────────────────────────────────────────────────────

ALTER TABLE rota_pontos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read rota_pontos" ON rota_pontos;
CREATE POLICY "Public read rota_pontos"
ON rota_pontos FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM rotas r
    WHERE r.id = rota_pontos.rota_id
      AND (COALESCE(r.ativa, true) = true OR public.is_admin_user())
  )
);

DROP POLICY IF EXISTS "Admin write rota_pontos" ON rota_pontos;
CREATE POLICY "Admin write rota_pontos"
ON rota_pontos FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── rota_dicas ─────────────────────────────────────────────────────────────

ALTER TABLE rota_dicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read rota_dicas" ON rota_dicas;
CREATE POLICY "Public read rota_dicas"
ON rota_dicas FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM rotas r
    WHERE r.id = rota_dicas.rota_id
      AND (COALESCE(r.ativa, true) = true OR public.is_admin_user())
  )
);

DROP POLICY IF EXISTS "Authenticated write rota_dicas" ON rota_dicas;
DROP POLICY IF EXISTS "Admin write rota_dicas" ON rota_dicas;
CREATE POLICY "Admin write rota_dicas"
ON rota_dicas FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ─── rotas_tags (restringe escrita a admin; leitura pública) ───────────────

ALTER TABLE rotas_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read rotas_tags" ON rotas_tags;
CREATE POLICY "Public read rotas_tags"
ON rotas_tags FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Authenticated write rotas_tags" ON rotas_tags;
DROP POLICY IF EXISTS "Admin write rotas_tags" ON rotas_tags;
CREATE POLICY "Admin write rotas_tags"
ON rotas_tags FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
