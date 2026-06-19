# Saha Satış Takip Sistemi — Kurulum Kılavuzu

## Gereksinimler

- Node.js 18+
- Supabase hesabı (supabase.com)

---

## 1. Supabase Projesi Oluştur

1. https://supabase.com adresine gidin ve giriş yapın
2. **"New Project"** oluşturun (örn. `saha-satis`)
3. Proje hazır olduktan sonra:
   - **Project Settings → API** bölümüne gidin
   - `Project URL` ve `anon` public key'i kopyalayın
   - `service_role` key'i de kopyalayın (gizli tutun!)

---

## 2. Veritabanı Tablolarını Oluştur

Supabase Dashboard → **SQL Editor** açın ve sırasıyla çalıştırın:

### Adım 1: Şema
```
supabase/schema.sql dosyasının içeriğini SQL Editor'a yapıştırıp Run edin
```

### Adım 2: RLS Politikaları
```
supabase/rls.sql dosyasının içeriğini SQL Editor'a yapıştırıp Run edin
```

---

## 3. Environment Dosyasını Oluştur

Proje kök dizininde `.env.local` dosyası oluşturun:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Personel oluşturma için zorunlu (Settings > API > Service Role)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 4. Bağımlılıkları Yükle ve Çalıştır

```bash
npm install
npm run dev
```

Tarayıcıda http://localhost:3000 adresini açın.

---

## 5. Demo Hesapları Oluştur

### Supabase Dashboard → Authentication → Users → "Add user" ile oluşturun:

| E-posta             | Şifre        | Rol    |
|---------------------|--------------|--------|
| admin@baski.com     | Admin123!    | admin  |
| ali@baski.com       | Personel123! | personel |
| fatma@baski.com     | Personel123! | personel |

> **Önemli:** Kullanıcıları ekledikten sonra UUID'lerini kopyalayın.

### Profilleri ve Demo Verileri Ekle

`supabase/seed.sql` dosyasını açın ve UUID'leri ilgili yerlere yapıştırın, ardından SQL Editor'da çalıştırın.

**Alternatif:** İlk giriş sonrası admin panelinden personel ekleyebilirsiniz.
Admin menüden **"Personel Ekle"** butonuna tıklayın, e-posta + şifre + isim girin.

---

## 6. Admin Rolü Ata

`admin@baski.com` kullanıcısını admin olarak ayarlamak için SQL Editor'da çalıştırın:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@baski.com';
```

---

## Proje Yapısı

```
src/
├── app/
│   ├── login/                    → /login (giriş ekranı)
│   ├── (admin)/admin/
│   │   ├── dashboard/            → /admin/dashboard
│   │   ├── personeller/          → /admin/personeller
│   │   ├── firmalar/             → /admin/firmalar
│   │   ├── ziyaretler/           → /admin/ziyaretler
│   │   ├── harita/               → /admin/harita
│   │   └── raporlar/             → /admin/raporlar
│   └── (personel)/personel/
│       ├── dashboard/            → /personel/dashboard
│       ├── yeni-ziyaret/         → /personel/yeni-ziyaret
│       ├── ziyaretlerim/         → /personel/ziyaretlerim
│       └── profil/               → /personel/profil
├── components/                   → Paylaşılan UI bileşenleri
├── hooks/                        → useAuth, useGPS
├── lib/supabase/                 → Client, Server Supabase istemcileri
└── types/index.ts                → TypeScript tipleri
supabase/
├── schema.sql                    → Tablo tanımları
├── rls.sql                       → Güvenlik politikaları
└── seed.sql                      → Demo veriler
```

---

## Güvenlik Notları

- RLS (Row Level Security) tüm tablolarda aktiftir
- Personel sadece kendi `visits` kayıtlarını görebilir/ekleyebilir
- Admin her şeye erişebilir
- `SUPABASE_SERVICE_ROLE_KEY` sadece sunucu tarafı API route'larında kullanılır
- Pasif personelin yeni kayıt oluşturması DB seviyesinde engellidir

---

## Supabase E-posta Doğrulaması

Geliştirme ortamında e-posta doğrulamasını devre dışı bırakmak için:

**Authentication → Providers → Email → "Confirm email" → OFF** yapın

---

## Production'a Al

```bash
npm run build
npm start
```

Ya da Vercel'e deploy edin:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

ortam değişkenlerini Vercel Dashboard'a ekleyin.
