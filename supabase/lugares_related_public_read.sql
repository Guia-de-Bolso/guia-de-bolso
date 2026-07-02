-- Leitura pública das tabelas usadas no select da home (joins).
-- Admin/dev lê localizações e tags de lugares inativos (cadastro).
-- Escrita admin: lugares_related_admin_write.sql + taxonomia_admin_write.sql.
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.
-- Rode junto com lugares_public_read.sql se embed falhar para usuários logados.

ALTER TABLE localizacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read localizacoes" ON localizacoes;
CREATE POLICY "Public read localizacoes"
  ON localizacoes
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM lugares AS l
      WHERE l.id = localizacoes.lugar_id
        AND (
          l.status = 'ativo'
          OR public.is_admin_or_dev()
        )
    )
  );

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tags" ON tags;
CREATE POLICY "Public read tags"
  ON tags
  FOR SELECT
  TO public
  USING (true);

ALTER TABLE lugares_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read lugares_tags" ON lugares_tags;
CREATE POLICY "Public read lugares_tags"
  ON lugares_tags
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM lugares AS l
      WHERE l.id = lugares_tags.lugar_id
        AND (
          l.status = 'ativo'
          OR public.is_admin_or_dev()
        )
    )
  );
