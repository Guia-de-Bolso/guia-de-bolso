-- Copy de push em pt-BR natural, com CTA para abrir o app.
-- Aplica CREATE OR REPLACE na função do trigger de lugares.

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
