-- Storage bucket policies — idempotent
-- DROP before CREATE because storage.objects policies have no CREATE OR REPLACE

DROP POLICY IF EXISTS "public read store images"       ON storage.objects;
DROP POLICY IF EXISTS "admin manage product images"    ON storage.objects;
DROP POLICY IF EXISTS "admin update product images"    ON storage.objects;
DROP POLICY IF EXISTS "admin delete product images"    ON storage.objects;
DROP POLICY IF EXISTS "own avatar insert"              ON storage.objects;
DROP POLICY IF EXISTS "own avatar update"              ON storage.objects;
DROP POLICY IF EXISTS "own avatar delete"              ON storage.objects;

CREATE POLICY "public read store images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('product-images','content-images','avatars'));

CREATE POLICY "admin manage product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('product-images','content-images') AND public.is_admin());

CREATE POLICY "admin update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('product-images','content-images') AND public.is_admin());

CREATE POLICY "admin delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('product-images','content-images') AND public.is_admin());

CREATE POLICY "own avatar insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own avatar update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own avatar delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);