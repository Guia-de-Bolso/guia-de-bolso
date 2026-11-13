-- Ativação Premium atômica.
-- Não desliga perfis_guard_privileged_columns e não cria flag de sessão.
-- O papel service_role já passa no trigger; anon e authenticated não conseguem
-- gravar premium_ativo nem premium_ate. A RPC só é executável por service_role.
-- Não transfere purchase_token entre contas. Não encolhe premium_ate do perfil.
--
-- Aplicar no SQL Editor ou com supabase db push. Não roda sozinho neste repositório.
-- Não apaga linhas de play_subscriptions nem de perfis.
--
-- Rollback: ver o bloco no final deste arquivo.

DROP FUNCTION IF EXISTS public.perfis_premium_write_bypass();

CREATE OR REPLACE FUNCTION public.perfis_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ia_bypass boolean;
BEGIN
  -- Ausente não é bypass. A comparação NULL = '1' faria o IF NOT ignorar o bloqueio.
  v_ia_bypass := COALESCE(current_setting('app.perfis_ia_usage_write', true), '') = '1';

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

-- ROLLBACK
-- 1. Recolocar public.activate_premium_subscription com o corpo anterior a esta
--    migration. Aquele corpo reescrevia user_id no conflito e usava
--    ALTER TABLE ... DISABLE TRIGGER. Isso reabre a corrida de transferência.
-- 2. A função do trigger instalada aqui é a mesma de
--    supabase/migrations/20260702150000_dev_role_access.sql. Recolocá-la só é
--    necessário se alguma versão com flag de premium tiver sido aplicada.
-- 3. DROP FUNCTION IF EXISTS public.perfis_premium_write_bypass();
-- Não é preciso alterar linhas de play_subscriptions nem de perfis.
-- Um ponto no tempo do Supabase também reverte os dois objetos.
