-- Snapshot público do autor na própria avaliação.
-- Ordem do nome: nome do perfil → e-mail (local) → telefone mascarado → Visitante.
-- Motivo: RLS de `perfis` não permite ler perfil de terceiros na UI pública.
--
-- Rode no SQL Editor do Supabase (produção). Idempotente.

DROP TRIGGER IF EXISTS avaliacoes_autor_snapshot ON public.avaliacoes;

ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS autor_nome text;

ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS autor_foto_url text;

CREATE OR REPLACE FUNCTION public.is_placeholder_autor_nome(p_nome text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_nome IS NULL
    OR btrim(p_nome) = ''
    OR lower(btrim(p_nome)) IN (
      'usuário', 'usuario', 'visitante', 'user', 'anonymous', 'anônimo', 'anonimo'
    );
$$;

CREATE OR REPLACE FUNCTION public.mask_phone_for_display(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 4
      THEN '•••' || right(regexp_replace(p_phone, '\D', '', 'g'), 4)
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_autor_display_name(
  p_nome text,
  p_email text,
  p_user_id uuid
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_local text;
  v_phone text;
  v_masked text;
BEGIN
  IF NOT public.is_placeholder_autor_nome(p_nome) THEN
    RETURN btrim(p_nome);
  END IF;

  IF p_email IS NOT NULL AND position('@' in p_email) > 1 THEN
    v_email_local := btrim(split_part(p_email, '@', 1));
    IF NOT public.is_placeholder_autor_nome(v_email_local) THEN
      RETURN v_email_local;
    END IF;
  END IF;

  SELECT u.phone INTO v_phone
  FROM auth.users AS u
  WHERE u.id = p_user_id;

  v_masked := public.mask_phone_for_display(v_phone);
  IF v_masked IS NOT NULL THEN
    RETURN v_masked;
  END IF;

  RETURN 'Visitante';
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_autor_display_name(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_autor_display_name(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_autor_display_name(text, text, uuid) TO service_role;

-- Backfill (trigger desligado acima)
UPDATE public.avaliacoes AS a
SET
  autor_nome = public.resolve_autor_display_name(p.nome, p.email, a.user_id),
  autor_foto_url = p.foto_url
FROM public.perfis AS p
WHERE p.id = a.user_id;

UPDATE public.avaliacoes
SET autor_nome = 'Visitante'
WHERE public.is_placeholder_autor_nome(autor_nome);

CREATE OR REPLACE FUNCTION public.avaliacoes_set_autor_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text;
  v_email text;
  v_foto text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Impede spoofing via update do cliente; preserva snapshot já gravado.
    NEW.autor_nome := OLD.autor_nome;
    NEW.autor_foto_url := OLD.autor_foto_url;
    RETURN NEW;
  END IF;

  -- Preferência: nome explícito no insert (já validado no app / perfil atualizado).
  IF NOT public.is_placeholder_autor_nome(NEW.autor_nome) THEN
    NEW.autor_nome := btrim(NEW.autor_nome);
    SELECT p.foto_url INTO v_foto
    FROM public.perfis AS p
    WHERE p.id = NEW.user_id;
    NEW.autor_foto_url := COALESCE(NEW.autor_foto_url, v_foto);
    RETURN NEW;
  END IF;

  SELECT p.nome, p.email, p.foto_url
  INTO v_nome, v_email, v_foto
  FROM public.perfis AS p
  WHERE p.id = NEW.user_id;

  NEW.autor_nome := public.resolve_autor_display_name(v_nome, v_email, NEW.user_id);
  NEW.autor_foto_url := COALESCE(NEW.autor_foto_url, v_foto);
  RETURN NEW;
END;
$$;

CREATE TRIGGER avaliacoes_autor_snapshot
  BEFORE INSERT OR UPDATE OF autor_nome, autor_foto_url ON public.avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.avaliacoes_set_autor_snapshot();

COMMENT ON COLUMN public.avaliacoes.autor_nome IS
  'Nome de exibição no momento da avaliação (snapshot; não depende de RLS de perfis).';
COMMENT ON COLUMN public.avaliacoes.autor_foto_url IS
  'Foto de perfil no momento da avaliação (snapshot).';
