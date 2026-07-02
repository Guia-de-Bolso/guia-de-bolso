-- Storage: apenas admin/dev pode gravar em lugares-fotos e rotas-fotos.
-- Rode no SQL Editor após criar os buckets. Substitui policies permissivas de fotos_migration.sql.

DROP POLICY IF EXISTS "Auth upload lugares fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth update lugares fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete lugares fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload rotas fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth update rotas fotos" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete rotas fotos" ON storage.objects;

DROP POLICY IF EXISTS "Admin upload lugares fotos" ON storage.objects;
CREATE POLICY "Admin upload lugares fotos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lugares-fotos'
    AND public.is_admin_user()
  );

DROP POLICY IF EXISTS "Admin update lugares fotos" ON storage.objects;
CREATE POLICY "Admin update lugares fotos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lugares-fotos' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'lugares-fotos' AND public.is_admin_user());

DROP POLICY IF EXISTS "Admin delete lugares fotos" ON storage.objects;
CREATE POLICY "Admin delete lugares fotos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'lugares-fotos' AND public.is_admin_user());

DROP POLICY IF EXISTS "Admin upload rotas fotos" ON storage.objects;
CREATE POLICY "Admin upload rotas fotos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rotas-fotos'
    AND public.is_admin_user()
  );

DROP POLICY IF EXISTS "Admin update rotas fotos" ON storage.objects;
CREATE POLICY "Admin update rotas fotos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'rotas-fotos' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'rotas-fotos' AND public.is_admin_user());

DROP POLICY IF EXISTS "Admin delete rotas fotos" ON storage.objects;
CREATE POLICY "Admin delete rotas fotos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'rotas-fotos' AND public.is_admin_user());

-- Leitura pública permanece (definida em fotos_migration.sql)
