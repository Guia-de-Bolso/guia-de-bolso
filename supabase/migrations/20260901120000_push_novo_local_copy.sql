-- Copy de novo local: nome no título; categoria vira um substantivo no corpo
-- (evita "Serviços acabou de chegar").
-- CREATE OR REPLACE na função do trigger de lugares.

CREATE OR REPLACE FUNCTION public.enqueue_lugar_push_campaigns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  became_public boolean;
  became_partner boolean;
  novo_local_intro text;
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

  novo_local_intro := CASE NEW.categoria
    WHEN 'Natureza' THEN 'Um novo ponto de natureza'
    WHEN 'Gastronomia' THEN 'Um novo lugar para comer'
    WHEN 'Noite' THEN 'Um novo ponto na noite'
    WHEN 'Serviços' THEN 'Um novo serviço'
    WHEN 'Cultura' THEN 'Um novo ponto de cultura'
    WHEN 'Aventura' THEN 'Um novo ponto de aventura'
    WHEN 'Bem-estar' THEN 'Um novo espaço de bem-estar'
    ELSE 'Um novo lugar'
  END;

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
      left('Novo no Guia: ' || COALESCE(NULLIF(NEW.nome, ''), 'Um novo lugar'), 120),
      left(
        novo_local_intro || ' acabou de chegar ao Guia de Bolso. Conheça agora.',
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
