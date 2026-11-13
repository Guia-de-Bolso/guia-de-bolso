-- Ativa Premium após verificação de assinatura (chamada via service role).
-- A função e o trigger atuais estão em
-- supabase/migrations/20261103180000_activate_premium_subscription_atomic.sql.
-- Rode esse arquivo em ambiente já existente. O bloco abaixo fica para instalação nova.

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

-- Corpo idêntico à migration 20261103180000. O trigger existente deixa o
-- service_role gravar premium e bloqueia anon/authenticated. Não há flag de sessão.

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
  v_token text := NULLIF(trim(p_purchase_token), '');
  v_product text := NULLIF(trim(p_product_id), '');
  v_incoming timestamptz;
  v_saved_user uuid;
  v_had_ativo boolean;
  v_had_ate timestamptz;
  v_subs_open boolean;
  v_subs_max timestamptz;
  v_effective timestamptz;
  v_ativo boolean;
BEGIN
  IF p_user_id IS NULL OR v_token IS NULL OR v_product IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'VALIDATION',
      'message', 'Dados da assinatura incompletos.'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'VALIDATION',
      'message', 'Conta da assinatura não encontrada.'
    );
  END IF;

  v_incoming := COALESCE(p_premium_ate, now() + interval '35 days');

  INSERT INTO public.play_subscriptions (
    user_id, purchase_token, product_id, order_id, expires_at, updated_at
  )
  VALUES (
    p_user_id, v_token, v_product, NULLIF(trim(p_order_id), ''), v_incoming, now()
  )
  ON CONFLICT (purchase_token) DO UPDATE SET
    product_id = EXCLUDED.product_id,
    order_id = COALESCE(EXCLUDED.order_id, play_subscriptions.order_id),
    expires_at = CASE
      WHEN play_subscriptions.expires_at IS NULL THEN NULL
      ELSE GREATEST(play_subscriptions.expires_at, EXCLUDED.expires_at)
    END,
    updated_at = now()
  WHERE play_subscriptions.user_id = EXCLUDED.user_id
  RETURNING user_id INTO v_saved_user;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'PURCHASE_INVALID',
      'message', 'Esta compra já está vinculada a outra conta.'
    );
  END IF;

  INSERT INTO public.perfis (id, nome, premium_ativo, premium_ate)
  VALUES (p_user_id, 'Usuário', false, NULL)
  ON CONFLICT (id) DO NOTHING;

  SELECT premium_ativo, premium_ate
  INTO v_had_ativo, v_had_ate
  FROM public.perfis
  WHERE id = p_user_id
  FOR UPDATE;

  SELECT
    COALESCE(bool_or(expires_at IS NULL), false),
    max(expires_at)
  INTO v_subs_open, v_subs_max
  FROM public.play_subscriptions
  WHERE user_id = p_user_id;

  IF (v_had_ativo IS TRUE AND v_had_ate IS NULL) OR v_subs_open THEN
    v_effective := NULL;
    v_ativo := true;
  ELSE
    v_effective := v_subs_max;
    IF v_had_ate IS NOT NULL AND (v_effective IS NULL OR v_had_ate > v_effective) THEN
      v_effective := v_had_ate;
    END IF;
    v_ativo := v_effective IS NOT NULL AND v_effective > now();
  END IF;

  UPDATE public.perfis
  SET
    premium_ativo = v_ativo,
    premium_ate = v_effective
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil ausente depois da reserva da assinatura';
  END IF;

  RETURN jsonb_build_object('ok', true, 'premium_ate', v_effective);
END;
$$;

REVOKE ALL ON FUNCTION public.activate_premium_subscription(uuid, timestamptz, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_premium_subscription(uuid, timestamptz, text, text, text) TO service_role;
