-- Snapshot público do autor na própria avaliação.
-- Motivo: RLS de `perfis` só permite ler o próprio perfil (e listagem só `dev`),
-- então o embed `perfis:user_id(nome, foto_url)` volta vazio para visitantes/outros
-- usuários e a UI cai no fallback "Usuário".
--
-- Rode no SQL Editor do Supabase (produção). Idempotente.

DROP TRIGGER IF EXISTS avaliacoes_autor_snapshot ON public.avaliacoes;

ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS autor_nome text;

ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS autor_foto_url text;

-- Backfill com trigger desligado (re-runs seguros)
UPDATE public.avaliacoes AS a
SET
  autor_nome = COALESCE(NULLIF(btrim(p.nome), ''), 'Usuário'),
  autor_foto_url = p.foto_url
FROM public.perfis AS p
WHERE p.id = a.user_id;

UPDATE public.avaliacoes
SET autor_nome = 'Usuário'
WHERE autor_nome IS NULL OR btrim(autor_nome) = '';

CREATE OR REPLACE FUNCTION public.avaliacoes_set_autor_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text;
  v_foto text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Impede spoofing via update do cliente; preserva snapshot já gravado.
    NEW.autor_nome := OLD.autor_nome;
    NEW.autor_foto_url := OLD.autor_foto_url;
    RETURN NEW;
  END IF;

  SELECT p.nome, p.foto_url
  INTO v_nome, v_foto
  FROM public.perfis AS p
  WHERE p.id = NEW.user_id;

  NEW.autor_nome := COALESCE(NULLIF(btrim(v_nome), ''), 'Usuário');
  NEW.autor_foto_url := v_foto;
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
