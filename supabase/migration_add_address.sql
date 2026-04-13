-- ============================================================
-- MİGRASYON: visits tablosuna address kolonu ekle
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

-- 1. address kolonu ekle
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS address text;

-- 2. location_status check constraint'i güncelle ('manual' ekle)
ALTER TABLE public.visits
  DROP CONSTRAINT IF EXISTS visits_location_status_check;

ALTER TABLE public.visits
  ADD CONSTRAINT visits_location_status_check
  CHECK (location_status IN ('success', 'failed', 'skipped', 'manual'));

COMMENT ON COLUMN public.visits.address IS 'Manuel adres girişi (location_status=manual olduğunda kullanılır)';
