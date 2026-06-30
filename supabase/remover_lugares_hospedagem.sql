-- Remove locais da categoria Hospedagem (categoria oculta temporariamente no app).
-- Execute no Supabase SQL Editor após deploy.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM lugares WHERE categoria = 'Hospedagem'
  LOOP
    DELETE FROM destaques WHERE lugar_id = r.id;
    DELETE FROM favoritos WHERE lugar_id = r.id;
    DELETE FROM avaliacoes WHERE lugar_id = r.id;
    DELETE FROM lugares_tags WHERE lugar_id = r.id;
    DELETE FROM localizacoes WHERE lugar_id = r.id;
    DELETE FROM fotos_lugar WHERE lugar_id = r.id;
    DELETE FROM lugares WHERE id = r.id;
  END LOOP;
END $$;
