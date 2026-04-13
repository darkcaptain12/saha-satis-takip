-- ============================================================
-- MİGRASYON v2: Ziyaret durumu + fotoğraf + profil avatar
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

-- 1. visits: status kolonu
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS status text
  CHECK (status IN ('gorusuldu', 'teklif_verildi', 'takip_gerekli', 'siparis_alindi'));

-- 2. visits: photo_url kolonu
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS photo_url text;

-- 3. profiles: avatar_url kolonu
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Yorumlar
COMMENT ON COLUMN public.visits.status IS 'Ziyaret sonucu: gorusuldu, teklif_verildi, takip_gerekli, siparis_alindi';
COMMENT ON COLUMN public.visits.photo_url IS 'Supabase Storage public URL (visit-photos bucket)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Supabase Storage public URL (avatars bucket)';

-- ============================================================
-- STORAGE RLS - SQL Editor'da ayrı çalıştırın
-- (Storage bucket'larını önce Dashboard'dan oluşturun)
-- ============================================================

-- visit-photos bucket politikaları
CREATE POLICY "public_read_visit_photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'visit-photos');

CREATE POLICY "auth_insert_visit_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'visit-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "admin_delete_visit_photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'visit-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- avatars bucket politikaları
CREATE POLICY "public_read_avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "auth_insert_avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "auth_update_avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
