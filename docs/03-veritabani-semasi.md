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

> Not: Bu dosyada tablo alanları (kolonlar) henüz detaylandırılmadı. Faz 0
> kapsamında Claude Code ile birlikte kolon bazında şema tasarlanacak.
