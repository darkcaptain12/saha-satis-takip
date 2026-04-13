-- ============================================================
-- SAHA SATIŞ TAKİP SİSTEMİ - DEMO VERİLERİ
--
-- ADIMLAR:
-- 1. Supabase Dashboard → Authentication → Users → "Add user" ile:
--    - admin@baski.com / Admin123! oluştur
--    - ali@baski.com / Personel123! oluştur
--    - fatma@baski.com / Personel123! oluştur
-- 2. Oluşturulan kullanıcıların UUID'lerini aşağıya yapıştır
-- 3. Bu SQL'i çalıştır
-- ============================================================

-- Demo kullanıcı UUID'lerini buraya girin:
do $$
declare
  admin_id  uuid := 'BURAYA_ADMIN_UUID_GIRIN';
  ali_id    uuid := 'BURAYA_ALI_UUID_GIRIN';
  fatma_id  uuid := 'BURAYA_FATMA_UUID_GIRIN';

  -- Firma ID'leri
  abc_id    uuid := gen_random_uuid();
  xyz_id    uuid := gen_random_uuid();
  kirmizi_id uuid := gen_random_uuid();
  mega_id   uuid := gen_random_uuid();
  deniz_id  uuid := gen_random_uuid();
begin

-- Profilleri güncelle (trigger zaten oluşturmuş olabilir)
update public.profiles set name = 'Ahmet Yönetici', role = 'admin'  where id = admin_id;
update public.profiles set name = 'Ali Satış',      role = 'personel' where id = ali_id;
update public.profiles set name = 'Fatma Demir',    role = 'personel' where id = fatma_id;

-- Profil yoksa ekle
insert into public.profiles (id, name, email, role, active)
values
  (admin_id, 'Ahmet Yönetici', 'admin@baski.com',  'admin',    true),
  (ali_id,   'Ali Satış',      'ali@baski.com',    'personel', true),
  (fatma_id, 'Fatma Demir',    'fatma@baski.com',  'personel', true)
on conflict (id) do update set
  name   = excluded.name,
  role   = excluded.role,
  active = excluded.active;

-- Firmalar
insert into public.companies (id, name, address, phone, note)
values
  (abc_id,     'ABC Matbaa Ltd.',          'Bağcılar, İstanbul',  '0212 555 0001', 'Büyük baskı siparişleri'),
  (xyz_id,     'XYZ Reklam A.Ş.',          'Şişli, İstanbul',     '0212 555 0002', 'Tabela ve branda'),
  (kirmizi_id, 'Kırmızı Tasarım',          'Kadıköy, İstanbul',   '0216 555 0003', null),
  (mega_id,    'Mega Ofis Malzemeleri',     'Üsküdar, İstanbul',   '0216 555 0004', 'Kurumsal müşteri'),
  (deniz_id,   'Deniz Ambalaj',             'Pendik, İstanbul',    '0216 555 0005', null);

-- Ziyaret kayıtları (son 14 gün)
insert into public.visits
  (user_id, company_id, company_name_snapshot, note, visit_date, visit_time,
   latitude, longitude, accuracy, location_status)
values
  -- Ali'nin ziyaretleri
  (ali_id, abc_id,     'ABC Matbaa Ltd.',      'Yeni katalog teklifi sunuldu, olumlu karşılandı',
   current_date - 1, '10:30:00', 41.0682, 28.8553, 12.5, 'success'),
  (ali_id, xyz_id,     'XYZ Reklam A.Ş.',      'Tabela siparişi alındı, ödeme koşulları konuşuldu',
   current_date - 2, '14:15:00', 41.0688, 28.9870, 8.3,  'success'),
  (ali_id, kirmizi_id, 'Kırmızı Tasarım',      'Broşür tasarım talebi var, teknik detaylar alındı',
   current_date - 4, '09:00:00', 41.0089, 29.0261, 15.0, 'success'),
  (ali_id, abc_id,     'ABC Matbaa Ltd.',      'Sipariş teslim tarihi güncellendi',
   current_date - 7, '11:45:00', 41.0682, 28.8553, 10.2, 'success'),
  (ali_id, null,       'Yeni Tanışma - Ofset Baskı SRL', 'İlk ziyaret, kartvizit bırakıldı',
   current_date - 10, '16:30:00', 41.0550, 28.9100, 20.0, 'success'),

  -- Fatma'nın ziyaretleri
  (fatma_id, mega_id,  'Mega Ofis Malzemeleri', 'Fiyat listesi bırakıldı, yöneticiyle görüşüldü',
   current_date, '09:45:00',      41.0245, 29.0245, 15.0, 'success'),
  (fatma_id, deniz_id, 'Deniz Ambalaj',         'Ambalaj baskısı için teklif istendi, hazırlanacak',
   current_date - 1, '13:30:00', 40.9920, 29.1680, 9.8,  'success'),
  (fatma_id, xyz_id,   'XYZ Reklam A.Ş.',       'Roll-up banner siparişi tamamlandı',
   current_date - 3, '10:00:00', 41.0688, 28.9870, 12.1, 'success'),
  (fatma_id, null,     'Yeni Firma (Tanışma)',   'Kapıdan geçerken uğradım, randevu alındı',
   current_date - 3, '16:00:00', null, null, null, 'failed'),
  (fatma_id, mega_id,  'Mega Ofis Malzemeleri', 'Sözleşme yenileme görüşmesi yapıldı',
   current_date - 6, '11:00:00', 41.0245, 29.0245, 18.5, 'success'),
  (fatma_id, kirmizi_id,'Kırmızı Tasarım',      'Referans dosyalar teslim edildi',
   current_date - 8, '14:45:00', 41.0089, 29.0261, 11.3, 'success'),
  (fatma_id, deniz_id, 'Deniz Ambalaj',         'Sipariş onayı alındı',
   current_date - 12, '10:30:00', 40.9920, 29.1680, 7.6, 'success');

end $$;
