-- ============================================================
-- Faz 3: log_audit_event yetkisi düzeltmesi.
-- Postgres yeni fonksiyonlara varsayılan olarak PUBLIC'e EXECUTE verir;
-- anon bu haktan miras aldığı için "revoke ... from anon" tek başına
-- etkisiz kalıyordu. Doğrusu PUBLIC'ten alıp yalnızca authenticated'a vermek.
--
-- Not: current_staff_id / current_staff_shop_id / current_staff_is_owner
-- bilerek PUBLIC'te bırakıldı — bunlar anon'a açık tablolardaki (shops,
-- services, staff) RLS politikalarında değerlendiriliyor ve politika ifadeleri
-- çağıran rolün yetkisiyle çalışıyor. anon için auth.uid() null döndüğünden
-- bu fonksiyonlar null/false üretir, veri sızdırmaz.
-- ============================================================
revoke execute on function log_audit_event(text, text, uuid, jsonb) from public;
grant execute on function log_audit_event(text, text, uuid, jsonb) to authenticated;
