# Veritabanı Şeması ve Teknik Kritik Noktalar

## Teknik Kritik Noktalar
- **Çifte randevu koruması:** PostgreSQL exclusion constraint
  (`EXCLUDE USING GIST` on `tstzrange`) — veritabanı seviyesinde, uygulama
  kodunda değil
- **Transaction:** supabase-js çoklu-işlem transaction desteklemiyor, bu yüzden
  randevu oluşturma bir Postgres fonksiyonu (RPC) olarak yazılacak
- **Timezone:** UTC olarak saklanacak (`timestamptz`), dükkanın IANA timezone'ı
  ayrı tutulacak, gösterimde çevrilecek
- **RLS:** Her tabloda etkin, owner/employee rolüne göre farklı erişim kuralları

## Tablolar (özet)
- `shops`
- `staff`
- `services`
- `customers`
- `customer_notes`
- `appointments` (exclusion constraint burada)
- `audit_log`
- `shop_values` (Hakkımızda değer kartları)
- `site_photos` (Galeri ızgarası + Hakkımızda salon fotoğrafı)

## Site içeriği ve fotoğraflar
Galeri/Hakkımızda sayfalarındaki her şey panelden yönetilir (`/admin/icerik`);
şablonda sabit metin bırakılmaz, çünkü her müşteri ayrı deploy alıyor.

- Serbest metin `shops.about_title` / `shops.about_body` kolonlarında.
- Çalışan portresi `staff.photo_path`, diğer fotoğraflar `site_photos`.
- Dosyalar `site-photos` adlı **public** Storage bucket'ında; tabloda yalnızca
  yol tutulur, URL `sitePhotoUrl()` ile üretilir.
- **Dikkat:** `staff` üzerinde anon'a kolon bazlı SELECT verilmiştir
  (e-posta/telefon public tarafa sızmasın diye). `staff`'a public sayfada
  gösterilecek yeni bir kolon eklerken o kolona ayrıca
  `grant select (kolon) on staff to anon` gerekir; yoksa sayfa
  "permission denied for table staff" ile 500 verir.

> Not: Bu dosyada tablo alanları (kolonlar) henüz detaylandırılmadı. Faz 0
> kapsamında Claude Code ile birlikte kolon bazında şema tasarlanacak.
