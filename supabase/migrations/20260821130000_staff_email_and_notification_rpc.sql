-- ============================================================
-- Faz 3: E-posta bildirimleri altyapısı
-- ============================================================

-- 1) Çalışanlara bildirim gönderebilmek için e-posta kolonu.
--    auth.users.email RLS ile okunamadığından staff'ta ayrıca tutulur.
alter table staff add column if not exists email text;

-- 2) Kolon bazlı yetki: anon randevu formunda sadece çalışan ADINI görmeli.
--    Mevcut "public can read active staff names" politikası satır bazlıydı;
--    tüm kolonlara (telefon, e-posta) erişim açıktı. Artık kolon bazında kısıtlı.
revoke select on staff from anon;
grant select (id, shop_id, full_name, role, is_active) on staff to anon;

-- 3) Bildirim gönderimi için gereken tüm veriyi tek seferde döner.
--    Yetki kontrolü cancel_token ile yapılır: token tahmin edilemez bir uuid'dir
--    ve yalnızca randevuyu oluşturan taraf (veya RLS ile randevuyu görebilen
--    personel) elinde tutar. Böylece anon rastgele randevu verisi çekemez.
create or replace function get_notification_data(p_cancel_token uuid)
returns table (
  appointment_id uuid,
  starts_at timestamptz,
  status appointment_status,
  duration_minutes integer,
  service_name text,
  service_price numeric,
  staff_name text,
  staff_email text,
  customer_name text,
  customer_phone text,
  customer_email text,
  shop_name text,
  shop_phone text,
  shop_address text,
  shop_timezone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.starts_at,
    a.status,
    s.duration_minutes,
    s.name,
    s.price,
    st.full_name,
    st.email,
    c.full_name,
    c.phone,
    c.email,
    sh.name,
    sh.phone,
    sh.address,
    sh.timezone
  from appointments a
  join services s on s.id = a.service_id
  join staff st on st.id = a.staff_id
  join customers c on c.id = a.customer_id
  join shops sh on sh.id = a.shop_id
  where a.cancel_token = p_cancel_token;
$$;

grant execute on function get_notification_data(uuid) to anon, authenticated;
