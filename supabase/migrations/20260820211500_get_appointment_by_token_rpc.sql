-- ============================================================
-- Faz 1: /randevu/[token] iptal sayfası için randevuyu token ile
-- getir. Token rastgele bir uuid olduğundan enumeration riski yok;
-- sadece token sahibinin zaten bildiği bilgiler döner.
-- ============================================================
create or replace function get_appointment_by_token(p_token uuid)
returns table (
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  status appointment_status,
  service_name text,
  staff_name text,
  shop_cutoff_hours integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.starts_at,
    a.ends_at,
    a.status,
    s.name as service_name,
    st.full_name as staff_name,
    sh.cutoff_hours as shop_cutoff_hours
  from appointments a
  join services s on s.id = a.service_id
  join staff st on st.id = a.staff_id
  join shops sh on sh.id = a.shop_id
  where a.cancel_token = p_token;
$$;

grant execute on function get_appointment_by_token(uuid) to anon;
