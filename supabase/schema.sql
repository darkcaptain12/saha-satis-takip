-- ============================================================
-- SAHA SATIŞ TAKİP SİSTEMİ - VERİTABANI ŞEMASI
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

-- ============================================================
-- TABLE: profiles
-- auth.users ile 1:1 ilişki; rol ve aktiflik bilgisi burada
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null unique,
  role       text not null default 'personel'
               check (role in ('admin', 'personel')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Kullanıcı profilleri (admin ve personel)';

-- ============================================================
-- TABLE: companies
-- Ziyaret edilebilecek firmalar
-- ============================================================
create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  phone      text,
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.companies is 'Ziyaret edilen firmalar';

-- ============================================================
-- TABLE: visits
-- Saha ziyaret kayıtları
-- ============================================================
create table if not exists public.visits (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  company_id            uuid references public.companies(id) on delete set null,
  company_name_snapshot text not null,         -- kayıt anında firma adı kopyası
  note                  text,
  visit_date            date not null,
  visit_time            time not null,
  latitude              numeric(10, 7),
  longitude             numeric(10, 7),
  accuracy              numeric(8, 2),         -- metre cinsinden GPS doğruluğu
  address               text,                  -- manuel adres girişi
  location_status       text not null default 'success'
                          check (location_status in ('success', 'failed', 'skipped', 'manual')),
  created_at            timestamptz not null default now()
);

comment on table public.visits is 'Saha ziyaret kayıtları';
comment on column public.visits.company_name_snapshot is 'Kayıt anındaki firma adı - firma silinse bile korunur';
comment on column public.visits.accuracy is 'GPS konum doğruluğu (metre)';
comment on column public.visits.address is 'Manuel adres girişi (location_status=manual olduğunda kullanılır)';
comment on column public.visits.location_status is 'success: konum alındı, failed: alınamadı, skipped: atlandı, manual: elle adres girildi';

-- ============================================================
-- INDEXES - Sorgu performansı için
-- ============================================================
create index if not exists idx_visits_user_id
  on public.visits(user_id);

create index if not exists idx_visits_visit_date
  on public.visits(visit_date desc);

create index if not exists idx_visits_created_at
  on public.visits(created_at desc);

create index if not exists idx_visits_company_id
  on public.visits(company_id);

create index if not exists idx_visits_location
  on public.visits(latitude, longitude)
  where location_status = 'success';

create index if not exists idx_companies_name
  on public.companies(name);

create index if not exists idx_visits_status
  on public.visits(status);

create index if not exists idx_visits_location_status
  on public.visits(location_status);

create index if not exists idx_profiles_role
  on public.profiles(role);

-- ============================================================
-- FUNCTION + TRIGGER: Yeni kullanıcı kaydında profil oluştur
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'role',
      'personel'
    )
  )
  on conflict (id) do nothing;   -- seed verisi varsa çakışma olmaz
  return new;
end;
$$;

-- Varsa eski trigger'ı sil, yenisini oluştur
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
