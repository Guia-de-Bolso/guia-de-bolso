-- Objetivo: fila idempotente para campanhas automáticas de push.
-- Depende de: lugares, roteiros, perfis e função public.is_admin_or_dev().
-- Aplicar em: Supabase SQL Editor antes de ativar /api/cron/push-automations.

CREATE TABLE IF NOT EXISTS public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  type text NOT NULL CHECK (
    type IN (
      'novo_local',
      'novo_parceiro',
      'destaque_semana',
      'clima',
      'lembrete_roteiro'
    )
  ),
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'user')),
  user_id uuid REFERENCES public.perfis(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  url text CHECK (url IS NULL OR char_length(url) <= 500),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'sent', 'partial', 'failed', 'skipped')
  ),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  sent_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  token_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  error_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_campaigns_audience_user_check CHECK (
    (audience = 'all' AND user_id IS NULL)
    OR (audience = 'user' AND user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS push_campaigns_due_idx
  ON public.push_campaigns (scheduled_for, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS push_campaigns_user_idx
  ON public.push_campaigns (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin le campanhas push" ON public.push_campaigns;
CREATE POLICY "Admin le campanhas push"
  ON public.push_campaigns
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_dev());

-- O service role é o único writer. Admins não escrevem campanhas pelo browser.
REVOKE INSERT, UPDATE, DELETE ON public.push_campaigns FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_lugar_push_campaigns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  became_public boolean;
  became_partner boolean;
BEGIN
  became_public :=
    NEW.status = 'ativo'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'ativo');

  became_partner :=
    NEW.status = 'ativo'
    AND COALESCE(NEW.eh_parceiro, false)
    AND (
      TG_OP = 'INSERT'
      OR NOT COALESCE(OLD.eh_parceiro, false)
      OR OLD.status IS DISTINCT FROM 'ativo'
    );

  -- Um local publicado já como parceiro recebe só a campanha mais específica,
  -- evitando dois pushes consecutivos para o mesmo cadastro.
  IF became_public AND NOT became_partner THEN
    INSERT INTO public.push_campaigns (
      event_key,
      type,
      audience,
      title,
      body,
      url
    )
    VALUES (
      'novo_local:' || NEW.id::text,
      'novo_local',
      'all',
      '📍 Novidade no app',
      left(
        COALESCE(NULLIF(NEW.nome, ''), 'Um novo lugar')
          || ' acabou de entrar no Guia de Bolso. Toque para conhecer.',
        500
      ),
      '/lugares/' || NEW.id::text
    )
    ON CONFLICT (event_key) DO NOTHING;
  END IF;

  IF became_partner THEN
    INSERT INTO public.push_campaigns (
      event_key,
      type,
      audience,
      title,
      body,
      url
    )
    VALUES (
      'novo_parceiro:' || NEW.id::text,
      'novo_parceiro',
      'all',
      '🤝 Novo Parceiro Oficial',
      left(
        COALESCE(NULLIF(NEW.nome, ''), 'Um estabelecimento')
          || ' agora é Parceiro Oficial. Abra o app e conheça.',
        500
      ),
      '/lugares/' || NEW.id::text
    )
    ON CONFLICT (event_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lugares_enqueue_push_campaigns ON public.lugares;
CREATE TRIGGER lugares_enqueue_push_campaigns
  AFTER INSERT OR UPDATE OF status, eh_parceiro
  ON public.lugares
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_lugar_push_campaigns();

REVOKE ALL ON FUNCTION public.enqueue_lugar_push_campaigns() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.claim_push_campaigns(p_limit integer DEFAULT 20)
RETURNS SETOF public.push_campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recupera um processamento interrompido sem duplicar indefinidamente.
  UPDATE public.push_campaigns
  SET
    status = CASE WHEN attempts < 3 THEN 'pending' ELSE 'failed' END,
    processing_started_at = NULL,
    updated_at = now(),
    last_error = CASE
      WHEN attempts < 3 THEN last_error
      ELSE COALESCE(last_error, 'Processamento expirou após 3 tentativas.')
    END
  WHERE status = 'processing'
    AND processing_started_at < now() - interval '15 minutes';

  RETURN QUERY
  WITH picked AS (
    SELECT campaign.id
    FROM public.push_campaigns AS campaign
    WHERE campaign.status = 'pending'
      AND campaign.scheduled_for <= now()
    ORDER BY campaign.scheduled_for, campaign.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)
  )
  UPDATE public.push_campaigns AS campaign
  SET
    status = 'processing',
    processing_started_at = now(),
    attempts = campaign.attempts + 1,
    updated_at = now()
  FROM picked
  WHERE campaign.id = picked.id
  RETURNING campaign.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_push_campaigns(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_push_campaigns(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_campaigns(integer) TO service_role;
