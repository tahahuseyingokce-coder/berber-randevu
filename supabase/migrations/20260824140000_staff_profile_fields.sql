-- ============================================================
-- Ekip kartları: unvan ve kısa tanıtım
--
-- Hakkımızda sayfasındaki ekip kartları tasarımda ad + unvan +
-- bir cümlelik tanıtım gösteriyor, ama şemada yalnızca full_name
-- vardı; kartlar tek satırlık isimden ibaret kalıyordu.
--
-- staff.role zaten yetki alanı (owner/employee) olduğu için
-- görünen unvan ayrı bir kolonda tutuluyor.
-- ============================================================

alter table public.staff
  add column if not exists title text,
  add column if not exists bio text;

comment on column public.staff.title is
  'Ekip kartında görünen unvan ("Kurucu · Berber"). Yetki alanı olan role''den ayrıdır.';
comment on column public.staff.bio is
  'Ekip kartındaki bir-iki cümlelik tanıtım.';

-- DİKKAT: staff üzerinde anon'a kolon bazlı SELECT verilmiştir
-- (e-posta/telefon public tarafa sızmasın diye, bkz. 20260821130000).
-- Public sayfada gösterilecek her yeni kolonun ayrıca burada
-- yetkilendirilmesi gerekir; yoksa sayfa
-- "permission denied for table staff" ile 500 verir.
grant select (title, bio) on public.staff to anon;
