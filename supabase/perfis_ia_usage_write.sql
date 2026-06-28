-- Helper para RPCs SECURITY DEFINER alterarem contadores IA em `perfis`.
-- Usado por increment_uso_ia.sql e align_perfil_usage_to_day.sql.
-- Rode antes de increment_uso_ia.sql em ambientes novos.

CREATE OR REPLACE FUNCTION public.perfis_ia_usage_write_bypass()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.perfis_ia_usage_write', '1', true);
END;
$$;
