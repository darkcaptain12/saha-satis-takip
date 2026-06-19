# Saha Satış Takip Sistemi — Özellikler

> Matbaa şirketi saha satış ekibi için geliştirilmiş, tam web tabanlı mobil öncelikli takip uygulaması.

---

## Teknoloji Altyapısı

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript 5 |
| Veritabanı | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Stil | TailwindCSS 3 |
| Harita | Leaflet / react-leaflet |
| İkonlar | Lucide React |
| Excel | xlsx (import/export) |
| Tarih | date-fns (Türkçe yerel) |
| Depolama | Supabase Storage |

---

## Kullanıcı Rolleri

### Admin
- Sisteme tam erişim
- Personel oluşturma, düzenleme, silme
- Tüm ziyaretleri görüntüleme ve düzenleme
- Firma yönetimi
- Raporlara erişim

### Personel
- Kendi ziyaretlerini görme ve oluşturma
- Profil fotoğrafı yükleme
- GPS ile yakın firma önerisi alma

---

## Özellik Listesi

### 🔐 Kimlik Doğrulama

- **Tek giriş ekranı** — Admin ve personel aynı `/login` sayfasından girer, rol tespitine göre farklı panele yönlendirilir.
- **Middleware koruma** — Tüm route'lar `middleware.ts` tarafından korunur; oturum yoksa `/login`'e yönlendirilir.
- **Null-safe rol kontrolü** — Ağ hatası/timeout durumunda middleware hatalı yönlendirme yapmaz; mevcut session korunur (mobil stabilite için kritik).
- **Otomatik oturum yenileme** — Supabase SSR ile token refresh otomatik yapılır.

---

### 🏠 Admin Dashboard

- **İstatistik kartları:** Bugün / Bu hafta / Bu ay ziyaret sayısı, aktif personel sayısı, toplam firma sayısı.
- **Son ziyaretler listesi** — En son 10 ziyaret; personel adı, firma, durum ve tarihiyle birlikte.
- **Hızlı bağlantılar** — Tüm ziyaretler, personel yönetimi, firmalar, raporlar.

---

### 👷 Personel Yönetimi (Admin)

| Özellik | Detay |
|---------|-------|
| Personel listeleme | Tablo (masaüstü) + kart (mobil) görünümü |
| Yeni personel ekleme | E-posta, şifre ve ad girişi; Supabase Auth üzerinden hesap oluşturma |
| Personel düzenleme | Ad, e-posta değiştirme |
| Aktif / Pasif toggle | `profiles.active` alanıyla; pasif personel giriş yapamaz |
| Personel silme | 2 adımlı onay modalı; geri alınamaz uyarısı; cascade delete (auth + profiles) |
| Ziyaret sayacı | Her personelin toplam ziyaret sayısı listelenir |

**Silme güvenliği:** `profiles` tablosunda `ON DELETE CASCADE` kısıtı; Supabase Auth'tan kullanıcı silindiğinde profil kaydı otomatik temizlenir.

---

### 🏢 Firma Yönetimi (Admin)

| Özellik | Detay |
|---------|-------|
| Firma listeleme | Ad, adres, telefon, ziyaret sayısı, kayıt tarihi |
| Firma ekleme / düzenleme | Modal form; ad, adres, telefon, not alanları |
| Firma detay sayfası | `/admin/firmalar/[id]` — firma bilgileri + o firmaya ait tüm ziyaretler |
| Excel import | `.xlsx` dosyasından toplu firma aktarımı; kolon eşleştirme arayüzü |
| Koordinat Geocoding | OpenStreetMap Nominatim ile adres → enlem/boylam dönüşümü; toplu işlem, canlı progress bar |

**691 Bursa Özel Okul** önceden sisteme aktarılmıştır. Koordinat doldurma işlemi tamamlandıktan sonra GPS yakın firma önerisi tam hassasiyetle çalışır.

---

### 📍 Ziyaret Kaydı (Personel)

Personel `/personel/yeni-ziyaret` sayfasından yeni ziyaret oluşturur.

**Form alanları:**

| Alan | Açıklama |
|------|----------|
| Firma | Listeden seçim veya metin girişi |
| Yakın Firmalar | GPS konumuna göre 500m içindeki firmalar otomatik önerilir |
| GPS Konumu | Tarayıcı Geolocation API; 15 sn timeout, yüksek hassasiyet |
| Konum durumu | `Başarılı / Başarısız / Atlandı / Manuel` |
| Ziyaret tarihi & saati | Varsayılan: şimdiki zaman |
| Ziyaret durumu | Görüşüldü / Teklif Verildi / Takip Gerekli / Sipariş Alındı |
| Fotoğraf | Kamera ile çekme veya galeriden seçme; önizleme + kaldırma; Supabase Storage'a yükleme |
| Not | Serbest metin |

---

### 🗺️ GPS & Yakın Firma Önerisi

- **Haversine mesafe hesabı** — Koordinatı olan firmalar için metre cinsinden gerçek mesafe hesaplanır (≤ 500m eşiği).
- **Nominatim reverse geocoding** — Koordinatı olmayan firmalar için GPS'ten adres metni elde edilip adres eşleştirmesi yapılır.
- **Sonuç sıralaması** — GPS eşleşenler önce, adres eşleşenler sonra; toplam 5 öneri.
- **Koordinat Geocoding (toplu)** — Admin panelinden tek tıkla tüm koordinatsız firmalar kuyruğa alınır, 1.3 sn aralıklarla Nominatim'e sorgulanır ve DB güncellenir.

---

### 📊 Ziyaret Durumları

| Durum | Renk | Anlamı |
|-------|------|--------|
| Görüşüldü | Yeşil | Yüz yüze görüşme gerçekleşti |
| Teklif Verildi | Mavi | Fiyat teklifi iletildi |
| Takip Gerekli | Sarı | Geri arama veya tekrar ziyaret planlanmalı |
| Sipariş Alındı | Gri | Satış kapandı |

---

### ✏️ Admin Ziyaret Düzenleme

- Admin, herhangi bir ziyaretin **not** ve **durum** alanını düzenleyebilir.
- Değişiklik ziyaret detay sayfasında anında yansır.
- Personel kendi ziyaretini düzenleyemez (sadece okuma yetkisi).

---

### 📸 Fotoğraf Yönetimi

- Ziyaret oluşturulurken fotoğraf eklenir.
- Fotoğraf **Supabase Storage**'a yüklenir; veritabanında yalnızca URL saklanır.
- Ziyaret detay sayfasında tam boyut görüntülenebilir.
- Fotoğraf kaldırılabilir (Storage'dan da silinir).

---

### 👤 Personel Profil Sayfası

- Ad ve e-posta görüntüleme.
- **Profil fotoğrafı yükleme** — Supabase Storage + `profiles.avatar_url`.
- Oturumu kapat butonu.

---

### 🗺️ Harita Görünümü (Admin)

- Tüm ziyaret konumları Leaflet haritasında pin olarak gösterilir.
- Pinlere tıklandığında ziyaret özeti görüntülenir.
- `/admin/harita` sayfası.

---

### 📈 Raporlar (Admin)

- Personel bazlı ziyaret özeti.
- Tarih aralığına göre filtreleme.
- **CSV export** — Tüm ziyaret verisini Excel'e aktarma.

---

### 📱 Mobil Uyumluluk

- **Personel paneli** tamamen mobil öncelikli tasarım; alt gezinme çubuğu (bottom nav).
- **Admin paneli** masaüstünde sidebar + mobilde hamburger/bottom nav.
- Viewport zoom kilidi; iOS Safari'de doğal uygulama hissi.
- Manifest.json ile "Ana Ekrana Ekle" desteği (PWA temel altyapısı).

---

## Veritabanı Tabloları

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
  id            UUID
  user_id       UUID (FK → profiles)
  company_id    UUID | NULL (FK → companies)
  company_name_snapshot  TEXT
  note          TEXT | NULL
  visit_date    DATE
  visit_time    TIME
  latitude      NUMERIC | NULL
  longitude     NUMERIC | NULL
  accuracy      NUMERIC | NULL
  location_status  TEXT  ('success' | 'failed' | 'skipped' | 'manual')
  address       TEXT | NULL
  status        TEXT  ('gorusuldu' | 'teklif_verildi' | 'takip_gerekli' | 'siparis_alindi') | NULL
  photo_url     TEXT | NULL
  created_at    TIMESTAMPTZ
```

---

## API Rotaları

| Rota | Metod | Açıklama |
|------|-------|----------|
| `/api/admin/create-user` | POST | Yeni personel hesabı oluşturma (service role) |
| `/api/admin/delete-user` | DELETE | Personel hesabını auth + profiles'dan silme |

---

## Ortam Değişkenleri

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Sonraki Planlanan Özellikler

| # | Özellik | Durum |
|---|---------|-------|
| 1 | Dashboard ziyaret grafiği (recharts) | 🔲 Planlandı |
| 2 | Tekrar ziyaret hatırlatıcısı | 🔲 Planlandı |
| 3 | Hedef / kota takibi | 🔲 Planlandı |
| 4 | Firma ziyaret geçmişi sayfası | 🔲 Planlandı |
| 5 | Genel arama kutusu | 🔲 Planlandı |
| 6 | PDF rapor export | 🔲 Planlandı |

---

*Son güncelleme: Nisan 2026*
