-- ============================================================
-- Faz 2: cancel_appointment güvenlik düzeltmesi.
-- p_by_customer=false yolu (admin/personel iptali) hiçbir yetki
-- kontrolü yapmıyordu — appointment_id bilen herkes (anon dahil)
-- herhangi bir randevuyu iptal edebiliyordu. Artık bu yol sadece
-- ilgili dükkanın owner'ı veya randevunun atandığı çalışan
-- tarafından çağrılabiliyor.
-- ============================================================
create or replace function cancel_appointment(
  p_appointment_id uuid,
  p_cancel_token uuid default null,
  p_by_customer boolean default false
)
returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment appointments;
  v_cutoff_hours integer;
begin
  select * into v_appointment
  from appointments
  where id = p_appointment_id
  for update;

  if v_appointment.id is null then
    raise exception 'Randevu bulunamadı.' using errcode = 'P0001';
  end if;

  if p_by_customer then
    if v_appointment.cancel_token is distinct from p_cancel_token then
      raise exception 'Geçersiz iptal linki.' using errcode = 'P0001';
    end if;

    select cutoff_hours into v_cutoff_hours
    from shops where id = v_appointment.shop_id;

    if v_appointment.starts_at <= now() + make_interval(hours => v_cutoff_hours) then
      raise exception 'Bu randevu için iptal süresi geçti.' using errcode = 'P0001';
    end if;
  else
    if not exists (
      select 1 from staff s
      where s.auth_user_id = auth.uid()
        and s.shop_id = v_appointment.shop_id
        and (s.role = 'owner' or s.id = v_appointment.staff_id)
    ) then
      raise exception 'Bu randevuyu iptal etme yetkiniz yok.' using errcode = 'P0001';
    end if;
  end if;

  update appointments
  set status = 'cancelled'
  where id = p_appointment_id
  returning * into v_appointment;

  return v_appointment;
end;
$$;
