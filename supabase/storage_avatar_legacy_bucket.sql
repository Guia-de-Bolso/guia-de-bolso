-- Policies de avatar no bucket legado de produção: "Guia de Bolso - Imagens".
-- O bucket `imagens` NÃO existe neste projeto — rode este arquivo no SQL Editor.
-- Caminho do arquivo no app: avatars/{user_id}/avatar.jpg

DROP POLICY IF EXISTS "Avatar insert Guia de Bolso Imagens" ON storage.objects;
CREATE POLICY "Avatar insert Guia de Bolso Imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Guia de Bolso - Imagens'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

DROP POLICY IF EXISTS "Avatar update Guia de Bolso Imagens" ON storage.objects;
CREATE POLICY "Avatar update Guia de Bolso Imagens"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Guia de Bolso - Imagens'
  AND auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'Guia de Bolso - Imagens'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Leitura pública dos avatares (bucket já é público; policy explícita evita surpresas).
DROP POLICY IF EXISTS "Avatar public read Guia de Bolso Imagens" ON storage.objects;
CREATE POLICY "Avatar public read Guia de Bolso Imagens"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'Guia de Bolso - Imagens'
  AND (storage.foldername(name))[1] = 'avatars'
);
