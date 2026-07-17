-- Add email to profiles and keep it in sync with auth.users
-- (the users tab currently only has id/full_name/role, so it shows the raw UUID)

alter table public.profiles add column if not exists email text;

-- Capture email for new signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'customer'
  );
  return new;
end;
$$;

-- Backfill email for existing profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

-- Keep email in sync if it changes in auth.users
create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email on auth.users;
create trigger on_auth_user_email
  after update of email on auth.users
  for each row execute function public.sync_user_email();
