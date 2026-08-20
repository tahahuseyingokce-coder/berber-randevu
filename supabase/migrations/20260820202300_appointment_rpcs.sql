-- ============================================================
-- Faz 0: Randevu oluşturma / iptal RPC'leri
-- supabase-js multi-statement transaction desteklemediği için
-- "müşteri upsert + randevu insert" tek bir Postgres fonksiyonunda
-- atomik olarak yapılıyor. Çakışma exclusion constraint'ten gelir,
-- burada yakalanıp anlamlı bir hataya çevrilir.
-- ============================================================

create or replace function create_appointment(
  p_shop_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_starts_at timestamptz,
  p_status appointment_status default 'pending',
  p_source appointment_source default 'online',
  p_created_by_staff_id uuid default null
)
returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration_minutes integer;
  v_ends_at timestamptz;
  v_customer_id uuid;
  v_appointment appointments;
begin
  select duration_minutes into v_duration_minutes
  from services
  where id = p_service_id and shop_id = p_shop_id and is_active;

  if v_duration_minutes is null then
    raise exception 'Hizmet bulunamadı veya pasif.' using errcode = 'P0001';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration_minutes);

  -- Aynı telefonla daha önce kayıt varsa güncelle, yoksa oluştur.
  insert into customers (shop_id, full_name, phone, email)
  values (p_shop_id, p_customer_name, p_customer_phone, p_customer_email)
  on conflict (shop_id, phone)
  do update set full_name = excluded.full_name, email = excluded.email
  returning id into v_customer_id;

  begin
    insert into appointments (
      shop_id, staff_id, service_id, customer_id,
      starts_at, ends_at, status, source, created_by_staff_id
    ) values (
      p_shop_id, p_staff_id, p_service_id, v_customer_id,
      p_starts_at, v_ends_at, p_status, p_source, p_created_by_staff_id
    )
    returning * into v_appointment;
  exception
    when exclusion_violation then
      raise exception 'Bu saat dolu, lütfen başka bir saat seçin.' using errcode = 'P0001';
  end;

  return v_appointment;
end;
$$;

-- ------------------------------------------------------------
-- cancel_appointment: iptal cutoff kontrolü burada yapılır.
-- p_by_customer = true ise dükkanın cutoff_hours ayarına göre
-- kontrol uygulanır; admin/çalışan iptalinde cutoff uygulanmaz.
-- ------------------------------------------------------------
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
  end if;

  update appointments
  set status = 'cancelled'
  where id = p_appointment_id
  returning * into v_appointment;

  return v_appointment;
end;
$$;
