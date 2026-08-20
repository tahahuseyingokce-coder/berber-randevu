-- ============================================================
-- Faz 0: RLS politikaları
--
-- Model: her auth.users kaydı staff tablosunda bir satıra bağlı.
-- owner -> kendi shop_id'sindeki her şeye erişir.
-- employee -> sadece kendi staff_id'sine bağlı randevulara ve o
-- randevulardaki müşterilere erişir (docs: "tüm CRM'i arayamaz").
--
-- Public (anon) taraf: sadece randevu formu ve iptal sayfası için
-- gereken minimum okuma/yazma (RPC'ler security definer olduğu
-- için asıl yazma orada; burada sadece formun ihtiyacı olan
-- select'ler açılıyor).
-- ============================================================

alter table shops enable row level security;
alter table shop_hours enable row level security;
alter table staff enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table customer_notes enable row level security;
alter table appointments enable row level security;
alter table audit_log enable row level security;

-- ------------------------------------------------------------
-- Yardımcı fonksiyonlar: current_setting yerine auth.uid() ile
-- giriş yapan kullanıcının staff kaydını çözer.
-- ------------------------------------------------------------
create or replace function current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from staff where auth_user_id = auth.uid();
$$;

create or replace function current_staff_shop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select shop_id from staff where auth_user_id = auth.uid();
$$;

create or replace function current_staff_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff where auth_user_id = auth.uid() and role = 'owner'
  );
$$;

-- ------------------------------------------------------------
-- shops
-- ------------------------------------------------------------
create policy "shop staff can read own shop"
  on shops for select
  using (id = current_staff_shop_id());

create policy "owner can update own shop"
  on shops for update
  using (id = current_staff_shop_id() and current_staff_is_owner());

create policy "public can read shop basics"
  on shops for select
  to anon
  using (true); -- ana sayfa, iletişim, randevu formu dükkan bilgisini gösterir

-- ------------------------------------------------------------
-- shop_hours
-- ------------------------------------------------------------
create policy "public can read shop hours"
  on shop_hours for select
  to anon
  using (true);

create policy "staff can read shop hours"
  on shop_hours for select
  using (shop_id = current_staff_shop_id());

create policy "owner can manage shop hours"
  on shop_hours for all
  using (shop_id = current_staff_shop_id() and current_staff_is_owner())
  with check (shop_id = current_staff_shop_id() and current_staff_is_owner());

-- ------------------------------------------------------------
-- staff
-- ------------------------------------------------------------
create policy "staff can read own shop roster"
  on staff for select
  using (shop_id = current_staff_shop_id());

create policy "public can read active staff names"
  on staff for select
  to anon
  using (is_active); -- randevu formunda çalışan seçimi için

create policy "owner can manage staff"
  on staff for all
  using (shop_id = current_staff_shop_id() and current_staff_is_owner())
  with check (shop_id = current_staff_shop_id() and current_staff_is_owner());

-- ------------------------------------------------------------
-- services
-- ------------------------------------------------------------
create policy "public can read active services"
  on services for select
  to anon
  using (is_active);

create policy "staff can read shop services"
  on services for select
  using (shop_id = current_staff_shop_id());

create policy "owner can manage services"
  on services for all
  using (shop_id = current_staff_shop_id() and current_staff_is_owner())
  with check (shop_id = current_staff_shop_id() and current_staff_is_owner());

-- ------------------------------------------------------------
-- customers: owner hepsini görür, employee sadece kendisinde
-- randevusu olan müşterileri görür.
-- ------------------------------------------------------------
create policy "owner can read all shop customers"
  on customers for select
  using (shop_id = current_staff_shop_id() and current_staff_is_owner());

create policy "employee can read own customers"
  on customers for select
  using (
    shop_id = current_staff_shop_id()
    and exists (
      select 1 from appointments a
      where a.customer_id = customers.id
        and a.staff_id = current_staff_id()
    )
  );

create policy "staff can update shop customers"
  on customers for update
  using (shop_id = current_staff_shop_id())
  with check (shop_id = current_staff_shop_id());

-- ------------------------------------------------------------
-- customer_notes: herkes (owner + ilgili employee) okur/ekler,
-- silme yok (docs: "üzerine eklenir, silinmez").
-- ------------------------------------------------------------
create policy "owner can read all customer notes"
  on customer_notes for select
  using (shop_id = current_staff_shop_id() and current_staff_is_owner());

create policy "employee can read notes of own customers"
  on customer_notes for select
  using (
    shop_id = current_staff_shop_id()
    and exists (
      select 1 from appointments a
      where a.customer_id = customer_notes.customer_id
        and a.staff_id = current_staff_id()
    )
  );

create policy "staff can insert customer notes"
  on customer_notes for insert
  with check (shop_id = current_staff_shop_id());

-- ------------------------------------------------------------
-- appointments: owner hepsini görür, employee sadece kendi
-- randevularını görür/onaylar.
-- ------------------------------------------------------------
create policy "owner can read all appointments"
  on appointments for select
  using (shop_id = current_staff_shop_id() and current_staff_is_owner());

create policy "employee can read own appointments"
  on appointments for select
  using (shop_id = current_staff_shop_id() and staff_id = current_staff_id());

create policy "owner can manage all appointments"
  on appointments for update
  using (shop_id = current_staff_shop_id() and current_staff_is_owner())
  with check (shop_id = current_staff_shop_id() and current_staff_is_owner());

create policy "employee can update own appointments"
  on appointments for update
  using (shop_id = current_staff_shop_id() and staff_id = current_staff_id())
  with check (shop_id = current_staff_shop_id() and staff_id = current_staff_id());

-- Not: appointments için doğrudan insert politikası yok — tüm
-- oluşturma create_appointment() RPC'si (security definer)
-- üzerinden yapılır, böylece exclusion constraint + müşteri
-- upsert atomik kalır.

-- ------------------------------------------------------------
-- audit_log: sadece owner okur, insert uygulama tarafından
-- (security definer fonksiyonlar veya service role ile) yapılır.
-- ------------------------------------------------------------
create policy "owner can read audit log"
  on audit_log for select
  using (shop_id = current_staff_shop_id() and current_staff_is_owner());
