-- Permite ativar Premium via RPC (service role) sem o trigger reverter premium_ativo.
-- Rode no SQL Editor do Supabase se compras Play/App Store concluem mas premium_ativo não muda.

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

-- Recria RPC com bypass explícito do trigger durante UPDATE de premium
CREATE OR REPLACE FUNCTION public.activate_premium_subscription(
  p_user_id uuid,
  p_premium_ate timestamptz,
  p_purchase_token text,
  p_product_id text,
  p_order_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing play_subscriptions%ROWTYPE;
  v_premium_ate timestamptz;
BEGIN
  IF p_user_id IS NULL OR NULLIF(trim(p_purchase_token), '') IS NULL OR NULLIF(trim(p_product_id), '') IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'VALIDATION',
      'message', 'Dados da assinatura incompletos.'
    );
  END IF;

  SELECT * INTO v_existing
  FROM play_subscriptions
  WHERE purchase_token = trim(p_purchase_token);

  IF FOUND AND v_existing.user_id IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'PURCHASE_INVALID',
      'message', 'Esta compra já está vinculada a outra conta.'
    );
  END IF;

  v_premium_ate := COALESCE(p_premium_ate, now() + interval '35 days');

  INSERT INTO play_subscriptions (user_id, purchase_token, product_id, order_id, expires_at, updated_at)
  VALUES (p_user_id, trim(p_purchase_token), trim(p_product_id), NULLIF(trim(p_order_id), ''), v_premium_ate, now())
  ON CONFLICT (purchase_token) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    product_id = EXCLUDED.product_id,
    order_id = COALESCE(EXCLUDED.order_id, play_subscriptions.order_id),
    expires_at = EXCLUDED.expires_at,
    updated_at = now();

  ALTER TABLE perfis DISABLE TRIGGER perfis_guard_privileged_columns;

  UPDATE perfis
  SET
    premium_ativo = true,
    premium_ate = v_premium_ate
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO perfis (id, nome, premium_ativo, premium_ate)
    VALUES (p_user_id, 'Usuário', true, v_premium_ate);
  END IF;

  ALTER TABLE perfis ENABLE TRIGGER perfis_guard_privileged_columns;

  RETURN jsonb_build_object('ok', true, 'premium_ate', v_premium_ate);
END;
$$;

REVOKE ALL ON FUNCTION public.activate_premium_subscription(uuid, timestamptz, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_premium_subscription(uuid, timestamptz, text, text, text) TO service_role;
