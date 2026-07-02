-- P0 Security — remediação consolidada (idempotente).
-- Aplique no SQL Editor do Supabase em produção após os pré-requisitos abaixo.
--
-- Pré-requisitos (já devem estar aplicados):
--   rotas_policies.sql, perfis_rls_fix.sql, perfis_premium_policies.sql,
--   perfis_ia_usage_write.sql, increment_uso_ia.sql, lugares_public_read.sql,
--   avaliacoes_moderacao.sql, fotos_migration.sql (buckets lugares-fotos / rotas-fotos).
--
-- Fontes canônicas (manter em sync): perfis_privileged_guard.sql, logs_policies.sql,
-- favoritos_policies.sql, destaques_planos_policies.sql, perfis_admin_policies.sql,
-- avaliacoes_admin_policies.sql, lugares_admin_write.sql, lugares_related_public_read.sql,
-- lugares_related_admin_write.sql, taxonomia_admin_write.sql, storage_admin_fotos.sql.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. perfis — trigger anti-escalação (role, premium, contadores IA)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.perfis_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ia_bypass boolean;
BEGIN
  v_ia_bypass := current_setting('app.perfis_ia_usage_write', true) = '1';

  IF TG_OP = 'INSERT' THEN
    IF auth.role() = 'service_role' OR public.is_admin_or_dev() THEN
      RETURN NEW;
    END IF;

    NEW.role := 'usuario';
    NEW.premium_ativo := COALESCE(NEW.premium_ativo, false);
    IF NEW.premium_ativo IS TRUE THEN
      NEW.premium_ativo := false;
    END IF;
    NEW.premium_ate := NULL;

    IF NOT v_ia_bypass THEN
      NEW.uso_ia_mes := NULL;
      NEW.buscas_ia := 0;
      NEW.roteiros_ia := 0;
    END IF;

    RETURN NEW;
  END IF;

  IF auth.role() = 'service_role' OR public.is_admin_or_dev() THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.premium_ativo := OLD.premium_ativo;
  NEW.premium_ate := OLD.premium_ate;

  IF NOT v_ia_bypass THEN
    NEW.uso_ia_mes := OLD.uso_ia_mes;
    NEW.buscas_ia := OLD.buscas_ia;
    NEW.roteiros_ia := OLD.roteiros_ia;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS perfis_guard_privileged_columns ON perfis;
CREATE TRIGGER perfis_guard_privileged_columns
  BEFORE INSERT OR UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.perfis_guard_privileged_columns();

DROP POLICY IF EXISTS "perfis_update_admin" ON perfis;
CREATE POLICY "perfis_update_admin"
  ON perfis FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev())
  WITH CHECK (public.is_admin_or_dev());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. logs — SELECT só admin/dev (remove USING (true))
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON logs;
DROP POLICY IF EXISTS "Public read logs" ON logs;
DROP POLICY IF EXISTS "Admin lê logs" ON logs;
DROP POLICY IF EXISTS "Authenticated insert logs" ON logs;

CREATE POLICY "Admin lê logs"
  ON logs FOR SELECT TO authenticated
  USING (public.is_admin_or_dev());

CREATE POLICY "Authenticated insert logs"
  ON logs FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "logs_delete_admin" ON logs;
CREATE POLICY "logs_delete_admin"
  ON logs FOR DELETE TO authenticated
  USING (public.is_admin_or_dev());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. favoritos — CRUD próprio + admin SELECT
-- ═══════════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. planos / destaques — escrita admin
-- ═══════════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. avaliacoes — moderação admin
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "avaliacoes_select_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_select_admin"
  ON avaliacoes FOR SELECT TO authenticated
  USING (public.is_admin_or_dev());

DROP POLICY IF EXISTS "avaliacoes_update_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_update_admin"
  ON avaliacoes FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "avaliacoes_delete_admin" ON avaliacoes;
CREATE POLICY "avaliacoes_delete_admin"
  ON avaliacoes FOR DELETE TO authenticated
  USING (public.is_admin_or_dev());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. lugares + relacionados — escrita admin
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE lugares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin insert lugares" ON lugares;
CREATE POLICY "Admin insert lugares"
  ON lugares FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin update lugares" ON lugares;
CREATE POLICY "Admin update lugares"
  ON lugares FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin delete lugares" ON lugares;
CREATE POLICY "Admin delete lugares"
  ON lugares FOR DELETE TO authenticated
  USING (public.is_admin_or_dev());

ALTER TABLE localizacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read localizacoes" ON localizacoes;
CREATE POLICY "Public read localizacoes"
  ON localizacoes FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM lugares AS l
      WHERE l.id = localizacoes.lugar_id
        AND (l.status = 'ativo' OR public.is_admin_or_dev())
    )
  );

DROP POLICY IF EXISTS "Admin insert localizacoes" ON localizacoes;
CREATE POLICY "Admin insert localizacoes"
  ON localizacoes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin update localizacoes" ON localizacoes;
CREATE POLICY "Admin update localizacoes"
  ON localizacoes FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin delete localizacoes" ON localizacoes;
CREATE POLICY "Admin delete localizacoes"
  ON localizacoes FOR DELETE TO authenticated
  USING (public.is_admin_or_dev());

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tags" ON tags;
CREATE POLICY "Public read tags"
  ON tags FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin insert tags" ON tags;
CREATE POLICY "Admin insert tags"
  ON tags FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin update tags" ON tags;
CREATE POLICY "Admin update tags"
  ON tags FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin delete tags" ON tags;
CREATE POLICY "Admin delete tags"
  ON tags FOR DELETE TO authenticated
  USING (public.is_admin_or_dev());

ALTER TABLE lugares_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read lugares_tags" ON lugares_tags;
CREATE POLICY "Public read lugares_tags"
  ON lugares_tags FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM lugares AS l
      WHERE l.id = lugares_tags.lugar_id
        AND (l.status = 'ativo' OR public.is_admin_or_dev())
    )
  );

DROP POLICY IF EXISTS "Admin insert lugares_tags" ON lugares_tags;
CREATE POLICY "Admin insert lugares_tags"
  ON lugares_tags FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin update lugares_tags" ON lugares_tags;
CREATE POLICY "Admin update lugares_tags"
  ON lugares_tags FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());

DROP POLICY IF EXISTS "Admin delete lugares_tags" ON lugares_tags;
CREATE POLICY "Admin delete lugares_tags"
  ON lugares_tags FOR DELETE TO authenticated
  USING (public.is_admin_or_dev());

ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON subcategorias;
DROP POLICY IF EXISTS "Public read subcategorias" ON subcategorias;
CREATE POLICY "Public read subcategorias"
  ON subcategorias FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated write subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin write subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin insert subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin update subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin delete subcategorias" ON subcategorias;

CREATE POLICY "Admin insert subcategorias"
  ON subcategorias FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "Admin update subcategorias"
  ON subcategorias FOR UPDATE TO authenticated
  USING (public.is_admin_or_dev()) WITH CHECK (public.is_admin_or_dev());

CREATE POLICY "Admin delete subcategorias"
  ON subcategorias FOR DELETE TO authenticated
  USING (public.is_admin_or_dev());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. storage — upload fotos lugares/rotas só admin
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Auth upload lugares fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth update lugares fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete lugares fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload rotas fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth update rotas fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete rotas fotos" ON storage.objects;

DROP POLICY IF EXISTS "Admin upload lugares fotos" ON storage.objects;
CREATE POLICY "Admin upload lugares fotos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lugares-fotos' AND public.is_admin_user());

DROP POLICY IF EXISTS "Admin update lugares fotos" ON storage.objects;
CREATE POLICY "Admin update lugares fotos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lugares-fotos' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'lugares-fotos' AND public.is_admin_user());

DROP POLICY IF EXISTS "Admin delete lugares fotos" ON storage.objects;
CREATE POLICY "Admin delete lugares fotos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lugares-fotos' AND public.is_admin_user());

DROP POLICY IF EXISTS "Admin upload rotas fotos" ON storage.objects;
CREATE POLICY "Admin upload rotas fotos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rotas-fotos' AND public.is_admin_user());

DROP POLICY IF EXISTS "Admin update rotas fotos" ON storage.objects;
CREATE POLICY "Admin update rotas fotos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'rotas-fotos' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'rotas-fotos' AND public.is_admin_user());

DROP POLICY IF EXISTS "Admin delete rotas fotos" ON storage.objects;
CREATE POLICY "Admin delete rotas fotos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'rotas-fotos' AND public.is_admin_user());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. is_admin_user — revogar anon (superfície desnecessária)
-- ═══════════════════════════════════════════════════════════════════════════════

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Verificação (opcional — conferir policies ativas)
-- ═══════════════════════════════════════════════════════════════════════════════
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'logs', 'perfis', 'favoritos', 'destaques', 'planos',
--     'lugares', 'localizacoes', 'tags', 'lugares_tags', 'subcategorias'
--   )
-- ORDER BY tablename, policyname;
