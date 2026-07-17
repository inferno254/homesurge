-- ============================================================
-- homesurge — role-based access control
--   admin     : full power (delete, users, logs, analytics)
--   publisher : can manage listings (create / edit / publish + images,
--               amenities, inquiries) but CANNOT delete properties, and
--               CANNOT see users, logs, or analytics
--   customer  : read-only public listings (served via RPCs)
-- Admin sees everything a publisher does: every property create / edit /
-- publish / unpublish / delete is auto-logged to admin_activity_log with
-- the actor's id + role (see trigger at the bottom).
-- Safe to re-run (uses drop ... if exists / create or replace).
-- ============================================================

-- 1) Allow the 'publisher' role
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'publisher', 'admin'));

-- 2) is_publisher(): publishers + admins may manage listings
create or replace function public.is_publisher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('publisher', 'admin')
  );
$$;

-- (is_admin() already exists and is true only for role = 'admin')

-- 3) Let admins assign roles from the Users tab
drop policy if exists profiles_admin_update on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- 4) Properties: publishers manage; only admins may DELETE
drop policy if exists "properties_staff_select" on public.properties;
drop policy if exists "properties_staff_insert" on public.properties;
drop policy if exists "properties_staff_update" on public.properties;
drop policy if exists "properties_admin_delete" on public.properties;

create policy "properties_staff_select" on public.properties
  for select using (public.is_publisher());
create policy "properties_staff_insert" on public.properties
  for insert with check (public.is_publisher());
create policy "properties_staff_update" on public.properties
  for update using (public.is_publisher()) with check (public.is_publisher());
create policy "properties_admin_delete" on public.properties
  for delete using (public.is_admin());

-- 5) Images & amenities: staff-managed
drop policy if exists "images_staff_all" on public.property_images;
create policy "images_staff_all" on public.property_images
  for all using (public.is_publisher()) with check (public.is_publisher());

drop policy if exists "amenities_staff_all" on public.amenities;
create policy "amenities_staff_all" on public.amenities
  for all using (public.is_publisher()) with check (public.is_publisher());

-- 6) Inquiries: publishers handle them
drop policy if exists "inquiries_staff_all" on public.property_inquiries;
create policy "inquiries_staff_all" on public.property_inquiries
  for all using (public.is_publisher()) with check (public.is_publisher());

-- 7) Logs & analytics stay ADMIN-ONLY (publishers must not read these)
drop policy if exists activity_admin_read on public.admin_activity_log;
create policy "activity_admin_read" on public.admin_activity_log
  for select using (public.is_admin());
drop policy if exists activity_append on public.admin_activity_log;
create policy "activity_append" on public.admin_activity_log
  for insert with check (public.is_admin());

-- 8) Auto-log every property change with the actor (publisher or admin).
--    log_property_change() + tr_log_property_changes already existed; this
--    recreates them idempotently and records the actor's role for clarity.
create or replace function public.log_property_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  action_text text;
begin
  if tg_op = 'INSERT' then
    action_text := 'CREATE';
  elsif tg_op = 'UPDATE' then
    if new.is_published and not old.is_published then
      action_text := 'PUBLISH';
    elsif not new.is_published and old.is_published then
      action_text := 'UNPUBLISH';
    else
      action_text := 'UPDATE';
    end if;
  elsif tg_op = 'DELETE' then
    action_text := 'DELETE';
  end if;

  insert into public.admin_activity_log (admin_id, action, property_id, property_ref, details)
  values (
    auth.uid(),
    action_text,
    coalesce(new.id, old.id),
    coalesce(new.listing_reference, old.listing_reference),
    jsonb_build_object(
      'before', case when tg_op <> 'INSERT' then to_jsonb(old) else null end,
      'after',  case when tg_op <> 'DELETE' then to_jsonb(new) else null end,
      'actor_role', (select role from public.profiles where id = auth.uid())
    )
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists tr_log_property_changes on public.properties;
create trigger tr_log_property_changes
  after insert or update or delete on public.properties
  for each row execute function public.log_property_change();
