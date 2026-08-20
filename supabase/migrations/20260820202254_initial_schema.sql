-- ============================================================
-- Faz 0: Temel şema — shops, staff, services, customers,
-- customer_notes, appointments, audit_log
-- ============================================================

create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- shops: her deploy tek bir dükkan temsil eder ama şema
-- ileride çoklu-dükkan senaryosuna da açık kalsın diye
-- shop_id her tabloda tutuluyor.
-- ------------------------------------------------------------
create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Europe/Istanbul',
  phone text,
  address text,
  cutoff_hours integer not null default 2,
  created_at timestamptz not null default now()
);

-- Bir dükkanın haftalık çalışma saatleri (slot üretimi için gerekli;
-- docs'ta kolon bazında detaylandırılmamıştı, randevu formu için
-- zorunlu olduğundan bu adımda eklendi — gözden geçirilebilir).
create table shop_hours (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Pazar
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  unique (shop_id, day_of_week)
);

-- ------------------------------------------------------------
-- staff: hem "Ana Admin" hem "Çalışan" burada, role ile ayrılır.
-- auth_user_id -> auth.users, admin panelden çalışan eklenirken
-- Supabase Auth'ta gerçek kullanıcı oluşturulup buraya bağlanır.
-- ------------------------------------------------------------
create type staff_role as enum ('owner', 'employee');

create table staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  role staff_role not null default 'employee',
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index staff_shop_id_idx on staff(shop_id);
create unique index staff_auth_user_id_idx on staff(auth_user_id) where auth_user_id is not null;

-- ------------------------------------------------------------
-- services
-- ------------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2), -- null = fiyat belirtilmemiş, UI'da gizlenir
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index services_shop_id_idx on services(shop_id);

-- ------------------------------------------------------------
-- customers: üyelik yok, ad+telefon+e-posta ile tutuluyor.
-- Aynı telefon numarasıyla tekrar randevu alan müşteri
-- güncellenip yeni randevuya bağlanır (RPC bunu upsert eder).
-- ------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text not null,
  created_at timestamptz not null default now(),
  unique (shop_id, phone)
);

create index customers_shop_id_idx on customers(shop_id);

-- ------------------------------------------------------------
-- customer_notes: müşteriye bağlı, silinmez, üzerine eklenir.
-- ------------------------------------------------------------
create table customer_notes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  author_staff_id uuid references staff(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index customer_notes_customer_id_idx on customer_notes(customer_id);

-- ------------------------------------------------------------
-- appointments: çekirdek tablo, çifte randevu koruması burada.
-- ------------------------------------------------------------
create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type appointment_source as enum ('online', 'manual');

create table appointments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  customer_id uuid not null references customers(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status appointment_status not null default 'pending',
  source appointment_source not null default 'online',
  cancel_token uuid not null default gen_random_uuid(), -- /randevu/[token] iptal linki için
  created_by_staff_id uuid references staff(id) on delete set null, -- manuel giriş yapan çalışan/admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Çifte randevu koruması: aynı çalışanın aynı zaman aralığında
  -- iptal edilmemiş iki randevusu olamaz.
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelled')
);

create index appointments_shop_id_idx on appointments(shop_id);
create index appointments_staff_id_idx on appointments(staff_id);
create index appointments_customer_id_idx on appointments(customer_id);
create unique index appointments_cancel_token_idx on appointments(cancel_token);

-- ------------------------------------------------------------
-- audit_log
-- ------------------------------------------------------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  actor_staff_id uuid references staff(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_shop_id_idx on audit_log(shop_id);

-- ------------------------------------------------------------
-- updated_at otomatik güncelleme
-- ------------------------------------------------------------
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger appointments_set_updated_at
  before update on appointments
  for each row
  execute function set_updated_at();
