-- Realinha contadores IA ao dia corrente (SP) via RPC — evita UPDATE direto no cliente.
-- Rode após perfis_ia_usage_write.sql, increment_uso_ia.sql e perfis_privileged_guard.sql.

CREATE OR REPLACE FUNCTION public.align_perfil_usage_to_day(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN;
  END IF;

  v_day := to_char(timezone('America/Sao_Paulo', now()), 'YYYY-MM-DD');

  PERFORM public.perfis_ia_usage_write_bypass();

  UPDATE perfis
  SET uso_ia_mes = v_day,
      buscas_ia = 0,
      roteiros_ia = 0
  WHERE id = p_user_id
    AND (
      uso_ia_mes IS DISTINCT FROM v_day
      OR uso_ia_mes ~ '^\d{4}-\d{2}$'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.align_perfil_usage_to_day(uuid) TO authenticated;
