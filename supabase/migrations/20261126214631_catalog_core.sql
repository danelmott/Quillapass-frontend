-- D1 · Territorio, catálogo e identidad + RLS de lectura del catálogo
-- ---------------------------------------------------------------- territorio
create table public.zones (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  zone_type   text not null check (zone_type in ('distrito','localidad','barrio','sector_turistico')),
  parent_id   uuid references public.zones(id),
  is_tourist  boolean not null default false,
  price_tier  smallint not null default 2 check (price_tier between 1 and 4),
  geom        extensions.geometry(MultiPolygon, 4326) not null,
  area_m2     double precision generated always as (extensions.st_area(geom::extensions.geography)) stored,
  created_at  timestamptz not null default now()
);
create index zones_geom_gix on public.zones using gist (geom);

-- ---------------------------------------------------------------- catálogos pequeños
create table public.place_categories (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  name_i18n jsonb not null,
  icon      text
);

create table public.interests (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  name_i18n jsonb not null,
  icon      text
);

create table public.accessibility_features (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,
  name_i18n jsonb not null
);

-- ---------------------------------------------------------------- comercios
create table public.merchants (
  id          uuid primary key default gen_random_uuid(),
  trade_name  text not null,
  legal_name  text,
  nit         text unique,
  status      text not null default 'pending' check (status in ('pending','verified','suspended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger merchants_updated_at before update on public.merchants
  for each row execute function extensions.moddatetime(updated_at);

-- ---------------------------------------------------------------- lugares
create table public.places (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null check (kind in ('atractivo','cultural','comercio','punto_habilitado','estadio','fan_zone')),
  category_id      uuid references public.place_categories(id),
  merchant_id      uuid references public.merchants(id),
  zone_id          uuid references public.zones(id),          -- lo asigna places_assign_zone
  name             text not null,
  description_i18n jsonb not null default '{}',
  address          text,
  location         extensions.geography(Point, 4326) not null,
  opening_hours    jsonb,                                       -- {"mon": [["08:00","18:00"]], ...}; null = siempre abierto
  price_level      smallint check (price_level between 1 and 4),
  tags             text[] not null default '{}',                -- slugs de interests
  is_outdoor       boolean not null default false,
  image_url        text,
  popularity       real not null default 0,
  status           text not null default 'draft' check (status in ('draft','published','suspended')),
  search_tsv       tsvector generated always as (
                     to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description_i18n ->> 'es',''))
                   ) stored,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  archived_at      timestamptz
);
create index places_location_gix on public.places using gist (location);
create index places_search_gin   on public.places using gin (search_tsv);
create index places_name_trgm    on public.places using gin (name extensions.gin_trgm_ops);
create index places_zone_idx     on public.places (zone_id);
create index places_merchant_idx on public.places (merchant_id);
create index places_category_idx on public.places (category_id);
create trigger places_updated_at before update on public.places
  for each row execute function extensions.moddatetime(updated_at);

-- Asigna la zona más pequeña que contiene el punto (barrio/sector antes que localidad o distrito)
create or replace function public.fn_zone_for_point(p_location extensions.geography)
returns uuid language sql stable security definer set search_path = '' as $$
  select z.id from public.zones z
   where extensions.st_contains(z.geom, p_location::extensions.geometry)
   order by z.area_m2 asc
   limit 1
$$;

create or replace function public.places_assign_zone() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.zone_id := public.fn_zone_for_point(new.location);
  return new;
end $$;
create trigger places_assign_zone before insert or update of location on public.places
  for each row execute function public.places_assign_zone();

create table public.place_accessibility (
  place_id    uuid not null references public.places(id) on delete cascade,
  feature_id  uuid not null references public.accessibility_features(id),
  level       text not null check (level in ('total','parcial','no')),
  verified_at timestamptz,
  primary key (place_id, feature_id)
);
create index on public.place_accessibility (feature_id);

-- ---------------------------------------------------------------- eventos
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  place_id         uuid not null references public.places(id),
  title_i18n       jsonb not null,
  description_i18n jsonb not null default '{}',
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  is_mundial       boolean not null default false,
  price_cop        bigint check (price_cop is null or price_cop >= 0),
  capacity         integer,
  status           text not null default 'published' check (status in ('draft','published','cancelled')),
  created_at       timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index events_starts_idx on public.events (starts_at);
create index events_place_idx  on public.events (place_id);

-- ---------------------------------------------------------------- identidad
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  display_name       text,
  language           text not null default 'es' check (language in ('es','en','pt')),
  user_type          text check (user_type in ('residente','visitante')),
  birth_year         smallint check (birth_year between 1900 and 2100),
  country_code       text check (country_code is null or char_length(country_code) = 2),
  notification_prefs jsonb not null default '{"activities": true, "benefits": true, "reports": true, "alerts": true}',
  onboarded_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function extensions.moddatetime(updated_at);

create table public.profile_interests (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.interests(id),
  primary key (profile_id, interest_id)
);
create index on public.profile_interests (interest_id);

create table public.profile_accessibility_needs (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  feature_id uuid not null references public.accessibility_features(id),
  primary key (profile_id, feature_id)
);
create index on public.profile_accessibility_needs (feature_id);

-- ---------------------------------------------------------------- RLS
alter table public.zones                       enable row level security;
alter table public.place_categories            enable row level security;
alter table public.interests                   enable row level security;
alter table public.accessibility_features      enable row level security;
alter table public.merchants                   enable row level security;
alter table public.places                      enable row level security;
alter table public.place_accessibility         enable row level security;
alter table public.events                      enable row level security;
alter table public.profiles                    enable row level security;
alter table public.profile_interests           enable row level security;
alter table public.profile_accessibility_needs enable row level security;

-- Catálogo visible sin sesión
create policy zones_select_all on public.zones for select to anon, authenticated using (true);
create policy place_categories_select_all on public.place_categories for select to anon, authenticated using (true);
create policy interests_select_all on public.interests for select to anon, authenticated using (true);
create policy accessibility_features_select_all on public.accessibility_features for select to anon, authenticated using (true);
create policy merchants_select_verified on public.merchants for select to anon, authenticated using (status = 'verified');
create policy places_select_published on public.places for select to anon, authenticated using (status = 'published');
create policy place_accessibility_select_all on public.place_accessibility for select to anon, authenticated using (true);
create policy events_select_published on public.events for select to anon, authenticated using (status = 'published');

-- Perfil propio
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profile_interests_select_own on public.profile_interests
  for select to authenticated using (profile_id = (select auth.uid()));
create policy profile_needs_select_own on public.profile_accessibility_needs
  for select to authenticated using (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------- auditoría de configuración
create trigger audit_changes after insert or update or delete on public.zones
  for each row execute function audit.log_change();
create trigger audit_changes after insert or update or delete on public.places
  for each row execute function audit.log_change();
create trigger audit_changes after insert or update or delete on public.merchants
  for each row execute function audit.log_change();
