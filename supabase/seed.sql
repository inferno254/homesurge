-- homesurge schema for Supabase (run in SQL editor)
-- 1) Create tables 2) Storage bucket "property-images" (public read) 3) Run policies below

create extension if not exists "pgcrypto";

-- Profiles (1:1 auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  listing_reference text unique,
  title text not null,
  description text,
  ai_generated_description text,
  price numeric not null,
  price_type text not null default 'monthly' check (price_type in ('monthly', 'sale', 'negotiable')),
  bedrooms int,
  bathrooms int,
  property_type text not null default 'apartment',
  furnished boolean default false,
  size_sqm numeric,
  county text not null default '',
  town text not null default '',
  area_label text,
  estate text,
  address text,
  latitude numeric,
  longitude numeric,
  owner_phone text,
  is_available boolean not null default true,
  is_published boolean not null default false,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  image_url text not null,
  is_cover boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.amenities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null
);

create table if not exists public.property_inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  phone text not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_properties_pub on public.properties (is_published, is_available, county, town);

-- Auto profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_properties_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists tr_props_updated on public.properties;
create trigger tr_props_updated
  before update on public.properties
  for each row execute function public.set_properties_updated_at();

-- Human-readable reference HT-YYYY-XXXXXX
create or replace function public.assign_listing_reference()
returns trigger
language plpgsql
as $$
declare
  yr text := to_char(now(), 'YYYY');
  seq int;
begin
  if new.listing_reference is not null and new.listing_reference <> '' then
    return new;
  end if;
  select count(*) + 1 into seq from public.properties where listing_reference like 'HT-' || yr || '-%';
  new.listing_reference := 'HT-' || yr || '-' || lpad(seq::text, 6, '0');
  return new;
end;
$$;

drop trigger if exists tr_listing_ref on public.properties;
create trigger tr_listing_ref
  before insert on public.properties
  for each row execute function public.assign_listing_reference();

-- Admin helper
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Public-safe reads (no exact location or owner phone leaked)
create or replace function public.fetch_public_properties()
returns table (
  id uuid,
  title text,
  description text,
  ai_generated_description text,
  price numeric,
  price_type text,
  bedrooms int,
  bathrooms int,
  property_type text,
  county text,
  town text,
  area_label text,
  listing_reference text,
  cover_image_url text,
  image_urls text[],
  amenity_names text[],
  furnished boolean,
  size_sqm numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.title,
    p.description,
    p.ai_generated_description,
    p.price,
    p.price_type,
    p.bedrooms,
    p.bathrooms,
    p.property_type,
    p.county,
    p.town,
    p.area_label,
    p.listing_reference,
    p.cover_image_url,
    coalesce(
      (select array_agg(pi.image_url order by pi.sort_order, pi.created_at)
       from public.property_images pi where pi.property_id = p.id),
      array[]::text[]
    ) as image_urls,
    coalesce(
      (select array_agg(a.name order by a.name)
       from public.amenities a where a.property_id = p.id),
      array[]::text[]
    ) as amenity_names,
    p.furnished,
    p.size_sqm,
    p.created_at
  from public.properties p
  where p.is_published and p.is_available;
$$;

create or replace function public.fetch_public_property(target_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  ai_generated_description text,
  price numeric,
  price_type text,
  bedrooms int,
  bathrooms int,
  property_type text,
  county text,
  town text,
  area_label text,
  listing_reference text,
  cover_image_url text,
  image_urls text[],
  amenity_names text[],
  furnished boolean,
  size_sqm numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select * from public.fetch_public_properties() fp where fp.id = target_id limit 1;
$$;

create or replace function public.submit_inquiry(
  p_property_id uuid,
  p_name text,
  p_phone text,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.property_inquiries (property_id, name, phone, message)
  values (p_property_id, p_name, p_phone, p_message)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.submit_inquiry(uuid, text, text, text) to anon, authenticated;

grant execute on function public.fetch_public_properties() to anon, authenticated;
grant execute on function public.fetch_public_property(uuid) to anon, authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.amenities enable row level security;
alter table public.property_inquiries enable row level security;

-- Profiles: users read/update self
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Admins: full CRUD on operational tables
create policy "properties_admin_select" on public.properties
  for select using (public.is_admin());
create policy "properties_admin_insert" on public.properties
  for insert with check (public.is_admin());
create policy "properties_admin_update" on public.properties
  for update using (public.is_admin()) with check (public.is_admin());
create policy "properties_admin_delete" on public.properties
  for delete using (public.is_admin());

create policy "images_admin_all" on public.property_images
  for all using (public.is_admin()) with check (public.is_admin());
create policy "amenities_admin_all" on public.amenities
  for all using (public.is_admin()) with check (public.is_admin());

create policy "inquiries_admin_all" on public.property_inquiries
  for all using (public.is_admin()) with check (public.is_admin());

-- No direct SELECT on properties for anon (prevents column leaks)

-- Storage policies (run after bucket exists)
-- insert into storage.buckets (id, public) values ('property-images', true);
-- create policy "Public read" on storage.objects for select using (bucket_id = 'property-images');
-- create policy "Admin upload" on storage.objects for insert with check (bucket_id = 'property-images' and public.is_admin());
-- create policy "Admin update" on storage.objects for update using (bucket_id = 'property-images' and public.is_admin());
-- create policy "Admin delete" on storage.objects for delete using (bucket_id = 'property-images' and public.is_admin());

-- ============================================================
-- Interactive Map + Enhancements (Sprint 2-3)
-- ============================================================

-- Geocoding helper RPC
create or replace function public.geocode_property(
  p_id uuid, p_lat numeric, p_lng numeric
)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.properties
  set latitude = p_lat, longitude = p_lng, updated_at = now()
  where id = p_id and public.is_admin();
end; $$;

create policy geocode_admin on public.properties
  for update using (public.is_admin());

grant execute on function public.geocode_property(uuid, numeric, numeric) to authenticated;


-- Duplicate property RPC
create or replace function public.duplicate_property(source_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  insert into public.properties (
    title, description, ai_generated_description, price, price_type,
    bedrooms, bathrooms, property_type, furnished, size_sqm,
    county, town, area_label, estate, address, latitude, longitude,
    owner_phone, is_available, is_published, cover_image_url
  )
  select title || ' (Copy)', description, ai_generated_description, price, price_type,
    bedrooms, bathrooms, property_type, furnished, size_sqm,
    county, town, area_label, estate, address, latitude, longitude,
    owner_phone, false, false, cover_image_url
  from public.properties where id = source_id and public.is_admin()
  returning id into new_id;
  return new_id;
end; $$;

grant execute on function public.duplicate_property(uuid) to authenticated;

-- Admin activity log for audit trail
create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text not null,
  property_id uuid references public.properties(id),
  property_ref text,
  details jsonb,
  created_at timestamptz default now()
);

alter table public.admin_activity_log enable row level security;
create policy activity_admin_read on public.admin_activity_log for select using (public.is_admin());
create policy activity_append on public.admin_activity_log for insert with check (public.is_admin());

create or replace function public.log_property_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare action_text text;
begin
  if tg_op = INSERT then action_text := CREATE;
  elsif tg_op = UPDATE then
    if new.is_published and not old.is_published then action_text := PUBLISH;
    elsif not new.is_published and old.is_published then action_text := UNPUBLISH;
    else action_text := UPDATE; end if;
  elsif tg_op = DELETE then action_text := DELETE; end if;
  insert into public.admin_activity_log (admin_id, action, property_id, property_ref, details)
  values (
    auth.uid(), action_text, coalesce(new.id, old.id),
    coalesce(new.listing_reference, old.listing_reference),
    jsonb_build_object(
      before, case when tg_op <> INSERT then old else null end,
      after, case when tg_op <> DELETE then new else null end
    )
  );
  return coalesce(new, old);
end; $$;


create trigger tr_log_property_changes
  after insert or update or delete on public.properties
  for each row execute function public.log_property_change();

