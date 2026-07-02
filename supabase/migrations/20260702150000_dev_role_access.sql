-- Role `dev`: acesso total ao painel. Role `admin`: operacional (sem áreas sensíveis).
-- Promove brunodislilerdev@gmail.com e rdecaldascampos@gmail.com a dev + Premium ilimitado.
-- Rode no SQL Editor do Supabase (ou via migrations).

-- ─── is_dev() ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_dev()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis
    WHERE id = auth.uid()
      AND role = 'dev'
  );
$$;

REVOKE ALL ON FUNCTION public.is_dev() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_dev() TO authenticated;

-- Contratos: antes is_admin_only() checava admin; agora somente dev.
CREATE OR REPLACE FUNCTION public.is_admin_only()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_dev();
$$;

-- ─── perfis — trigger anti-escalação (somente dev altera role/premium) ───────

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
    IF auth.role() = 'service_role' OR public.is_dev() THEN
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

  IF auth.role() = 'service_role' OR public.is_dev() THEN
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

-- ─── perfis — listagem/edição de outros usuários (somente dev) ───────────────

DROP POLICY IF EXISTS "perfis_select_admin" ON perfis;
CREATE POLICY "perfis_select_admin"
  ON perfis
  FOR SELECT
  TO authenticated
  USING (public.is_dev());

DROP POLICY IF EXISTS "perfis_update_admin" ON perfis;
CREATE POLICY "perfis_update_admin"
  ON perfis
  FOR UPDATE
  TO authenticated
  USING (public.is_dev())
  WITH CHECK (public.is_dev());

-- ─── feedback (somente dev) ──────────────────────────────────────────────────

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

-- ─── logs (somente dev) ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin lê logs" ON logs;
CREATE POLICY "Dev lê logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (public.is_dev());

DROP POLICY IF EXISTS "logs_delete_admin" ON logs;
CREATE POLICY "logs_delete_dev"
  ON logs
  FOR DELETE
  TO authenticated
  USING (public.is_dev());

-- ─── despesas (somente dev) ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin despesas_config all" ON despesas_config;
CREATE POLICY "Dev despesas_config all"
  ON despesas_config
  FOR ALL
  TO authenticated
  USING (public.is_dev())
  WITH CHECK (public.is_dev());

DROP POLICY IF EXISTS "Admin despesas_operacionais all" ON despesas_operacionais;
CREATE POLICY "Dev despesas_operacionais all"
  ON despesas_operacionais
  FOR ALL
  TO authenticated
  USING (public.is_dev())
  WITH CHECK (public.is_dev());

DROP POLICY IF EXISTS "Admin despesas_lancamentos all" ON despesas_lancamentos;
CREATE POLICY "Dev despesas_lancamentos all"
  ON despesas_lancamentos
  FOR ALL
  TO authenticated
  USING (public.is_dev())
  WITH CHECK (public.is_dev());

-- ─── taxonomia (somente dev) ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin insert tags" ON tags;
DROP POLICY IF EXISTS "Admin update tags" ON tags;
DROP POLICY IF EXISTS "Admin delete tags" ON tags;
CREATE POLICY "Dev insert tags"
  ON tags FOR INSERT TO authenticated WITH CHECK (public.is_dev());
CREATE POLICY "Dev update tags"
  ON tags FOR UPDATE TO authenticated USING (public.is_dev()) WITH CHECK (public.is_dev());
CREATE POLICY "Dev delete tags"
  ON tags FOR DELETE TO authenticated USING (public.is_dev());

DROP POLICY IF EXISTS "Admin insert subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin update subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin delete subcategorias" ON subcategorias;
CREATE POLICY "Dev insert subcategorias"
  ON subcategorias FOR INSERT TO authenticated WITH CHECK (public.is_dev());
CREATE POLICY "Dev update subcategorias"
  ON subcategorias FOR UPDATE TO authenticated USING (public.is_dev()) WITH CHECK (public.is_dev());
CREATE POLICY "Dev delete subcategorias"
  ON subcategorias FOR DELETE TO authenticated USING (public.is_dev());

-- ─── logs_ia (somente dev) ───────────────────────────────────────────────────

DO $$
BEGIN
  IF to_regclass('public.logs_ia') IS NOT NULL THEN
    ALTER TABLE logs_ia ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admin le logs_ia" ON logs_ia;
    DROP POLICY IF EXISTS "Dev le logs_ia" ON logs_ia;
    CREATE POLICY "Dev le logs_ia"
      ON logs_ia
      FOR SELECT
      TO authenticated
      USING (public.is_dev());
  END IF;
END $$;

-- ─── Promover contas dev ─────────────────────────────────────────────────────

ALTER TABLE perfis DISABLE TRIGGER perfis_guard_privileged_columns;

INSERT INTO perfis (id, nome, email, role, premium_ativo, premium_ate)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  u.email,
  'dev',
  true,
  NULL
FROM auth.users u
WHERE lower(u.email) IN (
  'brunodislilerdev@gmail.com',
  'rdecaldascampos@gmail.com'
)
ON CONFLICT (id) DO UPDATE
SET
  role = 'dev',
  premium_ativo = true,
  premium_ate = NULL,
  email = EXCLUDED.email,
  nome = COALESCE(perfis.nome, EXCLUDED.nome);

ALTER TABLE perfis ENABLE TRIGGER perfis_guard_privileged_columns;
