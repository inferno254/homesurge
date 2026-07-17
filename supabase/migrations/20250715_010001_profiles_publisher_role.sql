-- Add a 'publisher' role (separate from 'admin') and let admins assign roles.

-- 1) Widen the role check constraint to include 'publisher'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'publisher', 'admin'));

-- 2) Let admins change other users' roles from the Users tab
drop policy if exists profiles_admin_update on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());
