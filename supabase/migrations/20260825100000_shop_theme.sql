-- ============================================================
-- Dükkana göre renk paleti
--
-- Palet globals.css'te sabitti. Her berberin kendi rengi olduğu için bu,
-- her müşteride kodu değiştirmeyi (ya da kod tabanını kopyalamayı)
-- gerektiriyordu — şablonun tek kod tabanından deploy edilme fikrine
-- aykırıydı.
--
-- İki değer yetiyor: vurgu rengi (butonlar, fiyatlar) ve mürekkep
-- (koyu bant, yazı, çizgiler). Geri kalan tonlar bu ikisinden
-- türetiliyor, böylece dükkan sahibi okunabilirliği bozacak bir
-- kombinasyon seçemiyor.
-- ============================================================

alter table public.shops
  add column if not exists theme_accent text,
  add column if not exists theme_ink text;

comment on column public.shops.theme_accent is
  'Vurgu rengi (#rrggbb). Butonlar, fiyatlar, aktif sekme. Boşsa varsayılan kullanılır.';
comment on column public.shops.theme_ink is
  'Mürekkep rengi (#rrggbb). Koyu bant, yazı ve çizgiler. Boşsa varsayılan kullanılır.';

-- Geçersiz değer sayfayı bozacağı için biçim veritabanında zorlanıyor.
alter table public.shops
  drop constraint if exists shops_theme_accent_format;
alter table public.shops
  add constraint shops_theme_accent_format
  check (theme_accent is null or theme_accent ~* '^#[0-9a-f]{6}$');

alter table public.shops
  drop constraint if exists shops_theme_ink_format;
alter table public.shops
  add constraint shops_theme_ink_format
  check (theme_ink is null or theme_ink ~* '^#[0-9a-f]{6}$');

-- Palet public sayfada da uygulanacağı için anon okuyabilmeli.
-- (shops'ta anon zaten satır bazlı okuyor; burada ek kolon yetkisi
-- gerekmiyor çünkü shops'ta kolon bazlı kısıt yok — staff'takinden farklı.)
