-- ============================================================
-- PERFORMANS OPTİMİZASYONU — migration_performance_v1.sql
-- Supabase Dashboard → SQL Editor'da çalıştırın
-- Mevcut veriler DOKUNULMAZ — sadece index ve fonksiyon ekleme
-- ============================================================

-- Eksik index'ler (CREATE INDEX IF NOT EXISTS: var olanı etkilemez)
CREATE INDEX IF NOT EXISTS idx_visits_status
  ON public.visits(status);

CREATE INDEX IF NOT EXISTS idx_visits_location_status
  ON public.visits(location_status);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles(role);

-- ============================================================
-- RPC: Firma başına ziyaret sayısı
-- firmalar/page.tsx — JS GROUP BY yerine SQL aggregation
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_company_visit_counts()
RETURNS TABLE(company_id uuid, visit_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id, COUNT(*) AS visit_count
  FROM public.visits
  WHERE company_id IS NOT NULL
  GROUP BY company_id;
$$;

-- ============================================================
-- RPC: Personel başına ziyaret sayısı
-- personeller/page.tsx — JS GROUP BY yerine SQL aggregation
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_visit_counts()
RETURNS TABLE(user_id uuid, visit_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, COUNT(*) AS visit_count
  FROM public.visits
  GROUP BY user_id;
$$;
