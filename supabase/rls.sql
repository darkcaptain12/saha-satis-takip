-- ============================================================
-- SAHA SATIŞ TAKİP SİSTEMİ - ROW LEVEL SECURITY POLİTİKALARI
-- schema.sql çalıştırıldıktan sonra çalıştırın
-- ============================================================

-- RLS'yi aktif et
alter table public.profiles  enable row level security;
alter table public.companies enable row level security;
alter table public.visits    enable row level security;

-- Var olan politikaları temizle (idempotent kurulum)
drop policy if exists "admin_all_profiles"        on public.profiles;
drop policy if exists "personel_own_profile"      on public.profiles;
drop policy if exists "personel_update_own"       on public.profiles;
drop policy if exists "admin_all_companies"       on public.companies;
drop policy if exists "personel_read_companies"   on public.companies;
drop policy if exists "admin_all_visits"          on public.visits;
drop policy if exists "personel_select_own"       on public.visits;
drop policy if exists "personel_insert_own"       on public.visits;

-- ============================================================
-- PROFILES POLİTİKALARI
-- ============================================================

-- Admin: tüm profilleri görebilir ve yönetebilir
create policy "admin_all_profiles"
  on public.profiles
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Personel: sadece kendi profilini okuyabilir
create policy "personel_own_profile"
  on public.profiles
  for select
  using (id = auth.uid());

-- Personel: kendi adını güncelleyebilir (rol/aktiflik değiştirilemez)
create policy "personel_update_own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- role ve active alanlarını değiştiremez; sadece name değişebilir
  );

-- ============================================================
-- COMPANIES POLİTİKALARI
-- ============================================================

-- Admin: tüm firmalara tam erişim
create policy "admin_all_companies"
  on public.companies
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Personel: firmaları sadece okuyabilir (ziyaret formu dropdown için)
create policy "personel_read_companies"
  on public.companies
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.active = true
    )
  );

-- ============================================================
-- VISITS POLİTİKALARI
-- ============================================================

-- Admin: tüm ziyaretlere tam erişim
create policy "admin_all_visits"
  on public.visits
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Personel: sadece kendi ziyaretlerini görebilir
create policy "personel_select_own"
  on public.visits
  for select
  using (user_id = auth.uid());

-- Personel: sadece kendi adına kayıt ekleyebilir (aktif hesap şartı)
create policy "personel_insert_own"
  on public.visits
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.active = true
    )
  );

-- NOT: Personelin UPDATE ve DELETE yetkisi yok.
-- Ziyaret kayıtları değiştirilemez audit trail oluşturur.
-- Sadece admin silebilir/güncelleyebilir.
