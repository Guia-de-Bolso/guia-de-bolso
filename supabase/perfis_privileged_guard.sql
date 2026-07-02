-- Bloqueia escalação de privilégio e bypass de cotas IA em UPDATE/INSERT de perfis.
-- Protege: role, premium_*, buscas_ia, roteiros_ia, uso_ia_mes.
-- Contadores IA só mudam via RPC (perfis_ia_usage_write_bypass) ou service_role/admin.
-- Rode após perfis_premium_policies.sql, perfis_rls_fix.sql e perfis_ia_usage_write.sql.

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

DROP TRIGGER IF EXISTS perfis_guard_privileged_columns ON perfis;
CREATE TRIGGER perfis_guard_privileged_columns
  BEFORE INSERT OR UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.perfis_guard_privileged_columns();
