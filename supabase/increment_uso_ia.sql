-- Funções atômicas para contadores de IA (limite diário, fuso America/Sao_Paulo).
-- A coluna perfis.uso_ia_mes armazena a chave do dia (YYYY-MM-DD).
-- Depende de: premium_usuario.sql, perfis_ia_usage_write.sql
-- Após aplicar, rode perfis_privileged_guard.sql (bloqueia UPDATE client nos contadores).

CREATE OR REPLACE FUNCTION increment_busca_ia(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day text;
  v_perfil perfis%ROWTYPE;
  v_used int;
  v_roteiros int;
  v_limit int := 5;
  v_resets_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'LOGIN_REQUIRED',
      'message', 'Faça login para usar a busca com IA.'
    );
  END IF;

  v_day := to_char(timezone('America/Sao_Paulo', now()), 'YYYY-MM-DD');
  v_resets_at := (
    (timezone('America/Sao_Paulo', now())::date + 1)::timestamp
    AT TIME ZONE 'America/Sao_Paulo'
  );

  SELECT * INTO v_perfil FROM perfis WHERE id = p_user_id;

  IF NOT FOUND THEN
    PERFORM public.perfis_ia_usage_write_bypass();
    INSERT INTO perfis (id, nome, uso_ia_mes, buscas_ia, roteiros_ia)
    VALUES (
      p_user_id,
      COALESCE(auth.jwt() ->> 'email', 'Usuário'),
      v_day,
      1,
      0
    );
    RETURN jsonb_build_object(
      'allowed', true,
      'code', 'OK',
      'usage', jsonb_build_object(
        'premium', false,
        'day', v_day,
        'month', v_day,
        'resets_at', v_resets_at,
        'buscas', jsonb_build_object('used', 1, 'limit', v_limit, 'remaining', v_limit - 1),
        'roteiros', jsonb_build_object('used', 0, 'limit', 2, 'remaining', 2)
      )
    );
  END IF;

  IF v_perfil.premium_ativo IS TRUE
     AND (v_perfil.premium_ate IS NULL OR v_perfil.premium_ate > now()) THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'code', 'OK',
      'usage', jsonb_build_object(
        'premium', true,
        'day', v_day,
        'month', v_day,
        'resets_at', v_resets_at,
        'buscas', jsonb_build_object('used', COALESCE(v_perfil.buscas_ia, 0), 'limit', v_limit, 'remaining', null),
        'roteiros', jsonb_build_object('used', COALESCE(v_perfil.roteiros_ia, 0), 'limit', 2, 'remaining', null)
      )
    );
  END IF;

  -- Dia corrente SP apenas; chave legada YYYY-MM ou outro dia → contadores do dia = 0
  v_used := CASE
    WHEN v_perfil.uso_ia_mes = v_day THEN COALESCE(v_perfil.buscas_ia, 0)
    ELSE 0
  END;

  v_roteiros := CASE
    WHEN v_perfil.uso_ia_mes = v_day THEN COALESCE(v_perfil.roteiros_ia, 0)
    ELSE 0
  END;

  IF v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'LIMIT_REACHED',
      'message', 'Você usou suas 5 buscas com IA de hoje. O limite reinicia à meia-noite. Assine o Premium por R$9,90/mês para uso ilimitado.',
      'usage', jsonb_build_object(
        'premium', false,
        'day', v_day,
        'month', v_day,
        'resets_at', v_resets_at,
        'buscas', jsonb_build_object('used', v_used, 'limit', v_limit, 'remaining', 0),
        'roteiros', jsonb_build_object('used', v_roteiros, 'limit', 2, 'remaining', greatest(0, 2 - v_roteiros))
      )
    );
  END IF;

  PERFORM public.perfis_ia_usage_write_bypass();
  UPDATE perfis
  SET uso_ia_mes = v_day,
      buscas_ia = v_used + 1,
      roteiros_ia = v_roteiros
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'code', 'OK',
    'usage', jsonb_build_object(
      'premium', false,
      'day', v_day,
      'month', v_day,
      'resets_at', v_resets_at,
      'buscas', jsonb_build_object('used', v_used + 1, 'limit', v_limit, 'remaining', greatest(0, v_limit - v_used - 1)),
      'roteiros', jsonb_build_object('used', v_roteiros, 'limit', 2, 'remaining', greatest(0, 2 - v_roteiros))
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION increment_roteiro_ia(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day text;
  v_perfil perfis%ROWTYPE;
  v_used int;
  v_buscas int;
  v_limit int := 2;
  v_resets_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'LOGIN_REQUIRED',
      'message', 'Faça login para criar roteiros com IA.'
    );
  END IF;

  v_day := to_char(timezone('America/Sao_Paulo', now()), 'YYYY-MM-DD');
  v_resets_at := (
    (timezone('America/Sao_Paulo', now())::date + 1)::timestamp
    AT TIME ZONE 'America/Sao_Paulo'
  );

  SELECT * INTO v_perfil FROM perfis WHERE id = p_user_id;

  IF NOT FOUND THEN
    PERFORM public.perfis_ia_usage_write_bypass();
    INSERT INTO perfis (id, nome, uso_ia_mes, buscas_ia, roteiros_ia)
    VALUES (
      p_user_id,
      COALESCE(auth.jwt() ->> 'email', 'Usuário'),
      v_day,
      0,
      1
    );
    RETURN jsonb_build_object(
      'allowed', true,
      'code', 'OK',
      'usage', jsonb_build_object(
        'premium', false,
        'day', v_day,
        'month', v_day,
        'resets_at', v_resets_at,
        'buscas', jsonb_build_object('used', 0, 'limit', 5, 'remaining', 5),
        'roteiros', jsonb_build_object('used', 1, 'limit', v_limit, 'remaining', v_limit - 1)
      )
    );
  END IF;

  IF v_perfil.premium_ativo IS TRUE
     AND (v_perfil.premium_ate IS NULL OR v_perfil.premium_ate > now()) THEN
    RETURN jsonb_build_object('allowed', true, 'code', 'OK', 'usage', jsonb_build_object(
      'premium', true,
      'day', v_day,
      'month', v_day,
      'resets_at', v_resets_at,
      'buscas', jsonb_build_object('used', COALESCE(v_perfil.buscas_ia, 0), 'limit', 5, 'remaining', null),
      'roteiros', jsonb_build_object('used', COALESCE(v_perfil.roteiros_ia, 0), 'limit', v_limit, 'remaining', null)
    ));
  END IF;

  v_used := CASE
    WHEN v_perfil.uso_ia_mes = v_day THEN COALESCE(v_perfil.roteiros_ia, 0)
    ELSE 0
  END;

  v_buscas := CASE
    WHEN v_perfil.uso_ia_mes = v_day THEN COALESCE(v_perfil.buscas_ia, 0)
    ELSE 0
  END;

  IF v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'code', 'LIMIT_REACHED',
      'message', 'Você usou seus 2 roteiros com IA de hoje. O limite reinicia à meia-noite. Assine o Premium por R$9,90/mês para uso ilimitado.',
      'usage', jsonb_build_object(
        'premium', false,
        'day', v_day,
        'month', v_day,
        'resets_at', v_resets_at,
        'buscas', jsonb_build_object('used', v_buscas, 'limit', 5, 'remaining', greatest(0, 5 - v_buscas)),
        'roteiros', jsonb_build_object('used', v_used, 'limit', v_limit, 'remaining', 0)
      )
    );
  END IF;

  PERFORM public.perfis_ia_usage_write_bypass();
  UPDATE perfis
  SET uso_ia_mes = v_day,
      roteiros_ia = v_used + 1,
      buscas_ia = v_buscas
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'code', 'OK',
    'usage', jsonb_build_object(
      'premium', false,
      'day', v_day,
      'month', v_day,
      'resets_at', v_resets_at,
      'buscas', jsonb_build_object('used', v_buscas, 'limit', 5, 'remaining', greatest(0, 5 - v_buscas)),
      'roteiros', jsonb_build_object('used', v_used + 1, 'limit', v_limit, 'remaining', greatest(0, v_limit - v_used - 1))
    )
  );
END;
$$;

-- Estorna 1 unidade de cota quando a chamada à IA falha após reserva (increment antes da Claude).
CREATE OR REPLACE FUNCTION decrement_busca_ia(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day text;
  v_perfil perfis%ROWTYPE;
  v_used int;
  v_roteiros int;
  v_limit int := 5;
  v_resets_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'LOGIN_REQUIRED');
  END IF;

  v_day := to_char(timezone('America/Sao_Paulo', now()), 'YYYY-MM-DD');
  v_resets_at := (
    (timezone('America/Sao_Paulo', now())::date + 1)::timestamp
    AT TIME ZONE 'America/Sao_Paulo'
  );

  SELECT * INTO v_perfil FROM perfis WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'code', 'OK', 'usage', jsonb_build_object(
      'premium', false, 'day', v_day, 'month', v_day, 'resets_at', v_resets_at,
      'buscas', jsonb_build_object('used', 0, 'limit', v_limit, 'remaining', v_limit),
      'roteiros', jsonb_build_object('used', 0, 'limit', 2, 'remaining', 2)
    ));
  END IF;

  IF v_perfil.premium_ativo IS TRUE
     AND (v_perfil.premium_ate IS NULL OR v_perfil.premium_ate > now()) THEN
    RETURN jsonb_build_object('allowed', true, 'code', 'OK', 'usage', jsonb_build_object(
      'premium', true, 'day', v_day, 'month', v_day, 'resets_at', v_resets_at,
      'buscas', jsonb_build_object('used', COALESCE(v_perfil.buscas_ia, 0), 'limit', v_limit, 'remaining', null),
      'roteiros', jsonb_build_object('used', COALESCE(v_perfil.roteiros_ia, 0), 'limit', 2, 'remaining', null)
    ));
  END IF;

  v_used := CASE
    WHEN v_perfil.uso_ia_mes = v_day THEN COALESCE(v_perfil.buscas_ia, 0)
    ELSE 0
  END;
  v_roteiros := CASE
    WHEN v_perfil.uso_ia_mes = v_day THEN COALESCE(v_perfil.roteiros_ia, 0)
    ELSE 0
  END;

  IF v_used > 0 THEN
    PERFORM public.perfis_ia_usage_write_bypass();
    UPDATE perfis
    SET uso_ia_mes = v_day,
        buscas_ia = v_used - 1,
        roteiros_ia = v_roteiros
    WHERE id = p_user_id;
    v_used := v_used - 1;
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'code', 'OK',
    'usage', jsonb_build_object(
      'premium', false,
      'day', v_day,
      'month', v_day,
      'resets_at', v_resets_at,
      'buscas', jsonb_build_object('used', v_used, 'limit', v_limit, 'remaining', greatest(0, v_limit - v_used)),
      'roteiros', jsonb_build_object('used', v_roteiros, 'limit', 2, 'remaining', greatest(0, 2 - v_roteiros))
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION decrement_roteiro_ia(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day text;
  v_perfil perfis%ROWTYPE;
  v_used int;
  v_buscas int;
  v_limit int := 2;
  v_resets_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('allowed', false, 'code', 'LOGIN_REQUIRED');
  END IF;

  v_day := to_char(timezone('America/Sao_Paulo', now()), 'YYYY-MM-DD');
  v_resets_at := (
    (timezone('America/Sao_Paulo', now())::date + 1)::timestamp
    AT TIME ZONE 'America/Sao_Paulo'
  );

  SELECT * INTO v_perfil FROM perfis WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'code', 'OK', 'usage', jsonb_build_object(
      'premium', false, 'day', v_day, 'month', v_day, 'resets_at', v_resets_at,
      'buscas', jsonb_build_object('used', 0, 'limit', 5, 'remaining', 5),
      'roteiros', jsonb_build_object('used', 0, 'limit', v_limit, 'remaining', v_limit)
    ));
  END IF;

  IF v_perfil.premium_ativo IS TRUE
     AND (v_perfil.premium_ate IS NULL OR v_perfil.premium_ate > now()) THEN
    RETURN jsonb_build_object('allowed', true, 'code', 'OK', 'usage', jsonb_build_object(
      'premium', true, 'day', v_day, 'month', v_day, 'resets_at', v_resets_at,
      'buscas', jsonb_build_object('used', COALESCE(v_perfil.buscas_ia, 0), 'limit', 5, 'remaining', null),
      'roteiros', jsonb_build_object('used', COALESCE(v_perfil.roteiros_ia, 0), 'limit', v_limit, 'remaining', null)
    ));
  END IF;

  v_used := CASE
    WHEN v_perfil.uso_ia_mes = v_day THEN COALESCE(v_perfil.roteiros_ia, 0)
    ELSE 0
  END;
  v_buscas := CASE
    WHEN v_perfil.uso_ia_mes = v_day THEN COALESCE(v_perfil.buscas_ia, 0)
    ELSE 0
  END;

  IF v_used > 0 THEN
    PERFORM public.perfis_ia_usage_write_bypass();
    UPDATE perfis
    SET uso_ia_mes = v_day,
        roteiros_ia = v_used - 1,
        buscas_ia = v_buscas
    WHERE id = p_user_id;
    v_used := v_used - 1;
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'code', 'OK',
    'usage', jsonb_build_object(
      'premium', false,
      'day', v_day,
      'month', v_day,
      'resets_at', v_resets_at,
      'buscas', jsonb_build_object('used', v_buscas, 'limit', 5, 'remaining', greatest(0, 5 - v_buscas)),
      'roteiros', jsonb_build_object('used', v_used, 'limit', v_limit, 'remaining', greatest(0, v_limit - v_used))
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION increment_busca_ia(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_roteiro_ia(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_busca_ia(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_roteiro_ia(uuid) TO authenticated;
