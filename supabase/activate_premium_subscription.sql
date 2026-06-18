-- Ativa Premium após verificação de assinatura Google Play (chamada via service role).
-- Rode no SQL Editor do Supabase após premium_usuario.sql.

CREATE TABLE IF NOT EXISTS play_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_token text NOT NULL UNIQUE,
  product_id text NOT NULL,
  order_id text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS play_subscriptions_user_id_idx ON play_subscriptions(user_id);

ALTER TABLE play_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS play_subscriptions_service_only ON play_subscriptions;
CREATE POLICY play_subscriptions_service_only ON play_subscriptions
  FOR ALL
  USING (false)
  WITH CHECK (false);

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

  UPDATE perfis
  SET
    premium_ativo = true,
    premium_ate = v_premium_ate
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO perfis (id, nome, premium_ativo, premium_ate)
    VALUES (p_user_id, 'Usuário', true, v_premium_ate);
  END IF;

  RETURN jsonb_build_object('ok', true, 'premium_ate', v_premium_ate);
END;
$$;

REVOKE ALL ON FUNCTION public.activate_premium_subscription(uuid, timestamptz, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_premium_subscription(uuid, timestamptz, text, text, text) TO service_role;
