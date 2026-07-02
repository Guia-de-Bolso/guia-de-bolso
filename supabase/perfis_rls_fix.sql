-- Corrige recursão infinita em RLS da tabela `perfis` (erro 500 / infinite recursion).
-- Rode no SQL Editor do Supabase. Depois: logout + login e acesse /admin.

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Função sem RLS na leitura interna (evita EXISTS em policy na mesma tabela)
CREATE OR REPLACE FUNCTION public.is_admin_or_dev()
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
      AND role IN ('admin', 'dev')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_dev() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_dev() TO authenticated;

-- Role dev — áreas sensíveis do painel (contratos, usuários, logs, etc.)
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

-- Leitura do próprio perfil (login, /admin, contadores IA)
DROP POLICY IF EXISTS "perfis_select_own" ON perfis;
CREATE POLICY "perfis_select_own"
  ON perfis
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admin/dev listam todos os perfis (/admin/usuarios) — somente dev após 20260702150000
DROP POLICY IF EXISTS "perfis_select_admin" ON perfis;
CREATE POLICY "perfis_select_admin"
  ON perfis
  FOR SELECT
  TO authenticated
  USING (public.is_dev());
