# Saha Satış Takip Sistemi

Matbaa şirketi saha satış ekibi için geliştirilmiş, tam web tabanlı **mobil öncelikli** ziyaret takip uygulaması. Personel GPS destekli ziyaret kaydı oluştururken admin tüm süreci tek panelden yönetir.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript 5 |
| Veritabanı | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT + SSR) |
| Stil | TailwindCSS 3 |
| Harita | Leaflet / react-leaflet |
| İkonlar | Lucide React |
| Excel | xlsx (import / export) |
| Tarih | date-fns (Türkçe yerel) |
| Depolama | Supabase Storage |

---

## Özellikler

### Kimlik Doğrulama
- Admin ve personel aynı `/login` sayfasından girer; rol tespitine göre ilgili panele yönlendirilir
- `middleware.ts` tüm route'ları korur; oturum yoksa `/login`'e yönlendirilir
- Supabase SSR ile token refresh otomatik yapılır

### Admin Paneli
- **Dashboard** — Bugün / bu hafta / bu ay ziyaret sayısı, aktif personel, toplam firma istatistikleri ve son 10 ziyaret listesi
- **Personel Yönetimi** — Personel ekleme, düzenleme, aktif/pasif toggle, cascade delete (auth + profil)
- **Firma Yönetimi** — CRUD işlemleri, Excel'den toplu import, OpenStreetMap Nominatim ile toplu koordinat (geocoding)
- **Tüm Ziyaretler** — Personel / durum / tarih filtresiyle listeleme; detay sayfasında not + durum düzenleme
- **Harita** — Tüm ziyaret lokasyonlarının Leaflet haritasında pin olarak görüntülenmesi
- **Raporlar** — Personel bazlı özet, tarih aralığı filtreleme, CSV export

### Personel Paneli
- **Dashboard** — Kişisel ziyaret istatistikleri ve son aktiviteler
- **Yeni Ziyaret** — GPS konumu alır, 500 m içindeki firmaları Haversine mesafe ile önerir; fotoğraf çekme/yükleme, durum ve not girişi
- **Ziyaretlerim** — Kendi ziyaret geçmişi, detay sayfası
- **Profil** — Ad, e-posta görüntüleme, profil fotoğrafı yükleme, oturum kapatma

### GPS & Yakın Firma
- Tarayıcı Geolocation API (15 sn timeout, yüksek hassasiyet)
- Koordinatı olan firmalar için Haversine ile gerçek metre hesabı (≤ 500 m eşiği)
- Koordinatı olmayan firmalar için Nominatim reverse geocoding ile adres eşleştirmesi
- GPS eşleşenler önce, adres eşleşenler sonra sıralanır; toplamda 5 öneri

### Ziyaret Durumları

| Durum | Renk | Anlamı |
|-------|------|--------|
| Görüşüldü | Yeşil | Yüz yüze görüşme gerçekleşti |
| Teklif Verildi | Mavi | Fiyat teklifi iletildi |
| Takip Gerekli | Sarı | Geri arama / tekrar ziyaret planlanmalı |
| Sipariş Alındı | Gri | Satış kapandı |

### Mobil Uyumluluk
- Personel paneli tamamen mobil öncelikli; alt gezinme çubuğu (bottom nav)
- Admin panelinde masaüstünde sidebar, mobilde hamburger/bottom nav
- Viewport zoom kilidi; iOS Safari'de doğal uygulama hissi
- `manifest.json` ile "Ana Ekrana Ekle" (PWA) desteği

---

## Veritabanı Şeması

```
profiles
  id            UUID (FK → auth.users ON DELETE CASCADE)
  name          TEXT
  email         TEXT
  role          TEXT  ('admin' | 'personel')
  active        BOOLEAN
  avatar_url    TEXT | NULL
  created_at    TIMESTAMPTZ

companies
  id            UUID
  name          TEXT
  address       TEXT | NULL
  phone         TEXT | NULL
  note          TEXT | NULL
  latitude      NUMERIC(10,7) | NULL
  longitude     NUMERIC(10,7) | NULL
  created_at    TIMESTAMPTZ

visits
  id                     UUID
  user_id                UUID (FK → profiles)
  company_id             UUID | NULL (FK → companies)
  company_name_snapshot  TEXT
  note                   TEXT | NULL
  visit_date             DATE
  visit_time             TIME
  latitude               NUMERIC | NULL
  longitude              NUMERIC | NULL
  accuracy               NUMERIC | NULL
  location_status        TEXT  ('success' | 'failed' | 'skipped' | 'manual')
  address                TEXT | NULL
  status                 TEXT  ('gorusuldu' | 'teklif_verildi' | 'takip_gerekli' | 'siparis_alindi') | NULL
  photo_url              TEXT | NULL
  created_at             TIMESTAMPTZ
```

---

## Kurulum

### Gereksinimler
- Node.js 18+
- Supabase hesabı

### 1. Supabase Projesi Oluştur

1. [supabase.com](https://supabase.com) adresine gidin, yeni proje oluşturun
2. **Project Settings → API** bölümünden şunları kopyalayın:
   - `Project URL`
   - `anon` public key
   - `service_role` secret key

### 2. Veritabanı Şemasını Uygula

Supabase Dashboard → **SQL Editor**'da sırasıyla çalıştırın:

```
supabase/schema.sql   →  Tablo tanımları
supabase/rls.sql      →  Row Level Security politikaları
supabase/seed.sql     →  Demo veriler (isteğe bağlı)
```

### 3. Environment Değişkenleri

Proje kök dizininde `.env.local` oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Kurulum ve Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

### 5. İlk Admin Kullanıcısı

Supabase Dashboard → **Authentication → Users → Add user** ile kullanıcı oluşturun, ardından rolü admin'e yükseltin:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@sirketiniz.com';
```

> **Not:** Geliştirme ortamında **Authentication → Providers → Email → "Confirm email" → OFF** yapın.

---

## Proje Yapısı

```
src/
├── app/
│   ├── login/                    → /login
│   ├── (admin)/admin/
│   │   ├── dashboard/            → /admin/dashboard
│   │   ├── personeller/          → /admin/personeller
│   │   ├── firmalar/             → /admin/firmalar
│   │   ├── ziyaretler/           → /admin/ziyaretler
│   │   ├── harita/               → /admin/harita
│   │   └── raporlar/             → /admin/raporlar
│   ├── (personel)/personel/
│   │   ├── dashboard/            → /personel/dashboard
│   │   ├── yeni-ziyaret/         → /personel/yeni-ziyaret
│   │   ├── ziyaretlerim/         → /personel/ziyaretlerim
│   │   └── profil/               → /personel/profil
│   └── api/admin/
│       ├── create-user/          → POST — yeni personel hesabı
│       └── delete-user/          → DELETE — personel silme
├── components/
│   ├── ui/                       → Button, Card, Modal, Badge...
│   ├── auth/                     → LoginForm
│   ├── layout/                   → Sidebar, Header, BottomNav
│   ├── visits/                   → VisitForm, VisitStatusBadge...
│   ├── companies/                → ExcelImport, GeocodeButton...
│   ├── map/                      → VisitMap, BolgePlanlamaMap
│   └── dashboard/                → StatCard, RaporlarClient
├── hooks/
│   ├── useAuth.ts
│   ├── useGPS.ts
│   ├── useNearbyCompanies.ts
│   └── usePhotoUpload.ts
├── lib/supabase/
│   ├── client.ts                 → Tarayıcı taraflı istemci
│   └── server.ts                 → Sunucu taraflı istemci
└── types/index.ts
supabase/
├── schema.sql
├── rls.sql
└── seed.sql
```

---

## Güvenlik

- **RLS** tüm tablolarda aktif; personel yalnızca kendi `visits` kayıtlarını okuyup ekleyebilir
- `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu tarafı API route'larında kullanılır, istemciye asla sızmamalı
- Pasif personelin yeni kayıt oluşturması veritabanı seviyesinde engellenir
- Personel silme işlemi 2 adımlı onay modalı gerektirir; `ON DELETE CASCADE` ile auth + profil birlikte temizlenir

---

## Deployment

```bash
npm run build
npm start
```

**Vercel'e deploy** için aşağıdaki ortam değişkenlerini Vercel Dashboard'a ekleyin:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## Planlanan Özellikler

| # | Özellik |
|---|---------|
| 1 | Dashboard ziyaret grafiği (recharts) |
| 2 | Tekrar ziyaret hatırlatıcısı |
| 3 | Hedef / kota takibi |
| 4 | Firma ziyaret geçmişi sayfası |
| 5 | Genel arama kutusu |
| 6 | PDF rapor export |
