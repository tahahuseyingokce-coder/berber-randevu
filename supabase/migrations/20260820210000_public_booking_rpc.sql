-- ============================================================
-- Faz 1: Herkese açık müsaitlik sorgusu.
-- appointments tablosunun tamamını anon'a açmak yerine, sadece
-- dolu zaman aralıklarını (müşteri bilgisi içermeden) döner.
-- ============================================================
create or replace function get_busy_ranges(
  p_staff_id uuid,
  p_date date,
  p_timezone text
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.starts_at, a.ends_at
  from appointments a
  where a.staff_id = p_staff_id
    and a.status <> 'cancelled'
    and (a.starts_at at time zone p_timezone)::date = p_date;
$$;

grant execute on function get_busy_ranges(uuid, date, text) to anon;
