-- ============================================================
-- Faz 3: audit_log yazımı
-- Tabloda yalnızca owner için SELECT politikası vardı, INSERT yolu yoktu.
-- Kayıt, aktörü auth.uid()'den kendisi çözen security definer bir fonksiyon
-- üzerinden atılır; böylece uygulama actor_staff_id'yi taklit edemez.
-- ============================================================
create or replace function log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
  v_shop_id uuid;
begin
  select id, shop_id into v_staff_id, v_shop_id
  from staff
  where auth_user_id = auth.uid();

  -- Giriş yapmamış (anon) çağrılarda kayıt atılmaz.
  if v_staff_id is null then
    return;
  end if;

  insert into audit_log (shop_id, actor_staff_id, action, entity_type, entity_id, metadata)
  values (v_shop_id, v_staff_id, p_action, p_entity_type, p_entity_id, p_metadata);
end;
$$;

revoke execute on function log_audit_event(text, text, uuid, jsonb) from anon;
grant execute on function log_audit_event(text, text, uuid, jsonb) to authenticated;
