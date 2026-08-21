-- Müşteri notlarının düzenlenip silinebilmesi + dükkan konum bağlantısı.
--
-- customer_notes tablosunda yalnızca INSERT ve SELECT politikaları vardı;
-- yazılan bir not hiçbir rol tarafından değiştirilemiyor veya silinemiyordu.
-- Yanlış yazılan bir not paneli kalıcı olarak kirletiyordu.

-- ---------------------------------------------------------------
-- 1) Dükkan konumu
-- ---------------------------------------------------------------
alter table public.shops
  add column if not exists maps_url text;

comment on column public.shops.maps_url is
  'Google Haritalar bağlantısı. Boşsa iletişim sayfasındaki harita address alanından türetilir.';

-- ---------------------------------------------------------------
-- 2) Not düzenleme izi
-- ---------------------------------------------------------------
alter table public.customer_notes
  add column if not exists updated_at timestamptz;

comment on column public.customer_notes.updated_at is
  'Not düzenlendiyse son düzenleme zamanı; hiç düzenlenmediyse NULL.';

-- ---------------------------------------------------------------
-- 3) Not güncelleme politikaları
--
-- Sahip dükkandaki her notu düzeltebilir — panelin sorumlusu odur.
-- Çalışan yalnızca kendi yazdığı notu düzeltebilir: başkasının müşteri
-- gözlemini sessizce değiştirebilmesi denetim izini anlamsız kılardı.
-- ---------------------------------------------------------------
drop policy if exists "owner can update any customer note" on public.customer_notes;
create policy "owner can update any customer note"
  on public.customer_notes
  for update
  using (shop_id = current_staff_shop_id() and current_staff_is_owner())
  with check (shop_id = current_staff_shop_id() and current_staff_is_owner());

drop policy if exists "employee can update own customer note" on public.customer_notes;
create policy "employee can update own customer note"
  on public.customer_notes
  for update
  using (
    shop_id = current_staff_shop_id()
    and author_staff_id = current_staff_id()
  )
  with check (
    shop_id = current_staff_shop_id()
    and author_staff_id = current_staff_id()
  );

-- ---------------------------------------------------------------
-- 4) Not silme politikaları — güncellemeyle aynı yetki sınırları
-- ---------------------------------------------------------------
drop policy if exists "owner can delete any customer note" on public.customer_notes;
create policy "owner can delete any customer note"
  on public.customer_notes
  for delete
  using (shop_id = current_staff_shop_id() and current_staff_is_owner());

drop policy if exists "employee can delete own customer note" on public.customer_notes;
create policy "employee can delete own customer note"
  on public.customer_notes
  for delete
  using (
    shop_id = current_staff_shop_id()
    and author_staff_id = current_staff_id()
  );
