-- Bloqueia escalação de privilégio em UPDATE/INSERT de perfis (role, premium_*).
-- Rode após perfis_premium_policies.sql e perfis_rls_fix.sql.

CREATE OR REPLACE FUNCTION public.perfis_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    RETURN NEW;
  END IF;

  IF auth.role() = 'service_role' OR public.is_admin_or_dev() THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.premium_ativo := OLD.premium_ativo;
  NEW.premium_ate := OLD.premium_ate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS perfis_guard_privileged_columns ON perfis;
CREATE TRIGGER perfis_guard_privileged_columns
  BEFORE INSERT OR UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.perfis_guard_privileged_columns();
