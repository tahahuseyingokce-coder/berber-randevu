-- ============================================================
-- Site içeriği: Galeri ve Hakkımızda sayfaları
--
-- Bu iki sayfa eklendiğinde metin ve fotoğraf yerleri koda gömülüydü.
-- Şablon her müşteri için ayrı deploy edildiğinden, sabit metin
-- ("Kesim bir zanaattır") ve sabit galeri etiketleri her dükkanda
-- aynı çıkıyordu; dükkan sahibi panelden değiştiremiyordu. Diğer tüm
-- public içerik (hizmet, çalışan, saat, adres) zaten veritabanından
-- geldiği için bu iki sayfa istisna kalmıştı.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Hakkımızda sayfasının serbest metni
-- ------------------------------------------------------------
alter table public.shops
  add column if not exists about_title text,
  add column if not exists about_body text;

comment on column public.shops.about_title is
  'Hakkımızda sayfasının ana başlığı. Boşsa sayfada varsayılan metin gösterilir.';
comment on column public.shops.about_body is
  'Hakkımızda sayfasının giriş paragrafı.';

-- ------------------------------------------------------------
-- 2) Hakkımızda değer kartları ("Tek seansta tek müşteri" vb.)
-- ------------------------------------------------------------
create table if not exists public.shop_values (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists shop_values_shop_id_idx on public.shop_values(shop_id);

-- ------------------------------------------------------------
-- 3) Site fotoğrafları
--
-- placement, fotoğrafın hangi sayfada kullanılacağını söyler:
--   gallery -> /galeri ızgarası (ve anasayfadaki önizleme)
--   about   -> /hakkimizda üstündeki tek salon fotoğrafı
-- Dosyanın kendisi Storage'da; burada yalnızca yolu tutulur.
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'site_photo_placement') then
    create type site_photo_placement as enum ('gallery', 'about');
  end if;
end
$$;

create table if not exists public.site_photos (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  storage_path text not null,
  alt text,
  placement site_photo_placement not null default 'gallery',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists site_photos_shop_id_idx on public.site_photos(shop_id);
create index if not exists site_photos_placement_idx on public.site_photos(shop_id, placement, sort_order);

-- ------------------------------------------------------------
-- 4) Çalışan portresi — ekip kartlarında kullanılır
-- ------------------------------------------------------------
alter table public.staff
  add column if not exists photo_path text;

comment on column public.staff.photo_path is
  'site-photos bucket''ındaki portre dosyasının yolu. Boşsa yer tutucu gösterilir.';

-- staff üzerinde anon'a kolon bazlı SELECT verilmişti (e-posta ve telefon
-- public tarafa sızmasın diye, bkz. 20260821130000). Yeni kolon o listede
-- olmadığı için Hakkımızda sayfası "permission denied for table staff"
-- veriyordu; portre public olarak gösterileceği için listeye ekleniyor.
grant select (photo_path) on public.staff to anon;

-- ------------------------------------------------------------
-- 5) RLS
-- ------------------------------------------------------------
alter table public.shop_values enable row level security;
alter table public.site_photos enable row level security;

drop policy if exists "public can read active shop values" on public.shop_values;
create policy "public can read active shop values"
  on public.shop_values for select
  to anon
  using (is_active);

drop policy if exists "staff can read shop values" on public.shop_values;
create policy "staff can read shop values"
  on public.shop_values for select
  using (shop_id = current_staff_shop_id());

drop policy if exists "owner can manage shop values" on public.shop_values;
create policy "owner can manage shop values"
  on public.shop_values for all
  using (shop_id = current_staff_shop_id() and current_staff_is_owner())
  with check (shop_id = current_staff_shop_id() and current_staff_is_owner());

drop policy if exists "public can read site photos" on public.site_photos;
create policy "public can read site photos"
  on public.site_photos for select
  to anon
  using (true);

drop policy if exists "staff can read site photos" on public.site_photos;
create policy "staff can read site photos"
  on public.site_photos for select
  using (shop_id = current_staff_shop_id());

drop policy if exists "owner can manage site photos" on public.site_photos;
create policy "owner can manage site photos"
  on public.site_photos for all
  using (shop_id = current_staff_shop_id() and current_staff_is_owner())
  with check (shop_id = current_staff_shop_id() and current_staff_is_owner());

-- ------------------------------------------------------------
-- 6) Storage bucket
--
-- Fotoğraflar herkese açık okunur (public sayfada gösterilecekler);
-- yazma yalnızca dükkan sahibinde.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-photos',
  'site-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site photos are publicly readable" on storage.objects;
create policy "site photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'site-photos');

drop policy if exists "owner can upload site photos" on storage.objects;
create policy "owner can upload site photos"
  on storage.objects for insert
  with check (bucket_id = 'site-photos' and current_staff_is_owner());

drop policy if exists "owner can update site photos" on storage.objects;
create policy "owner can update site photos"
  on storage.objects for update
  using (bucket_id = 'site-photos' and current_staff_is_owner());

drop policy if exists "owner can delete site photos" on storage.objects;
create policy "owner can delete site photos"
  on storage.objects for delete
  using (bucket_id = 'site-photos' and current_staff_is_owner());

-- ------------------------------------------------------------
-- 7) Varsayılan değer kartları
--
-- Yeni bir dükkan deploy edildiğinde Hakkımızda sayfası boş
-- görünmesin diye; panelden düzenlenebilir/silinebilir.
-- ------------------------------------------------------------
insert into public.shop_values (shop_id, title, body, sort_order)
select
  s.id,
  v.title,
  v.body,
  v.sort_order
from public.shops s
cross join (values
  ('Tek seansta tek müşteri',
   'Koltuklar arasında koşturmuyoruz. Randevunuz size ayrılmıştır, üzerine pay bırakılır.',
   1),
  ('Önce tespit, sonra kesim',
   'Saç tipiniz ve günlük rutininiz üzerine kısa bir konuşma yapmadan makasa dokunmuyoruz.',
   2),
  ('Şeffaf fiyat',
   'Liste sitede ve salonda aynı. Uzunluk farkı doğuracak işlerde ücret randevu öncesi söylenir.',
   3)
) as v(title, body, sort_order)
where not exists (
  select 1 from public.shop_values existing where existing.shop_id = s.id
);
