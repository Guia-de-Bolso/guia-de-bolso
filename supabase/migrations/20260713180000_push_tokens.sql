-- Push notifications — tokens FCM/APNs por dispositivo.
-- Fonte canônica: supabase/push_tokens.sql

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_tokens_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON public.push_tokens (user_id);
CREATE INDEX IF NOT EXISTS push_tokens_enabled_idx ON public.push_tokens (enabled) WHERE enabled = true;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_tokens_select_own_or_admin ON public.push_tokens;
DROP POLICY IF EXISTS push_tokens_insert_own ON public.push_tokens;
DROP POLICY IF EXISTS push_tokens_update_own ON public.push_tokens;
DROP POLICY IF EXISTS push_tokens_delete_own ON public.push_tokens;

CREATE POLICY push_tokens_select_own_or_admin
  ON public.push_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_or_dev());

CREATE POLICY push_tokens_insert_own
  ON public.push_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_tokens_update_own
  ON public.push_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_tokens_delete_own
  ON public.push_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
