-- ============================================================
-- Faz 0: Advisor uyarılarının giderilmesi
-- ============================================================

-- set_updated_at search_path sabitlensin
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- btree_gist/pgcrypto public şemadan extensions şemasına taşınsın
create schema if not exists extensions;
alter extension btree_gist set schema extensions;
alter extension pgcrypto set schema extensions;

-- Yardımcı staff-context fonksiyonları anon'a gereksiz açık kalmasın;
-- sadece giriş yapmış (authenticated) kullanıcılar çağırabilsin.
-- Not: shops/services/staff gibi genel-okunabilir tablolardaki "to anon"
-- olmayan (public) politikalar bu fonksiyonları yine değerlendirir,
-- ancak auth.uid() anon için null döneceğinden veri sızmaz — bu revoke
-- sadece PUBLIC grant'ı olmayan senaryolar için ek bir sertleştirme.
revoke execute on function current_staff_id() from anon;
revoke execute on function current_staff_shop_id() from anon;
revoke execute on function current_staff_is_owner() from anon;
