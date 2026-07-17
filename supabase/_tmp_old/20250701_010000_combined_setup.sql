-- 20250701_010000_combined_setup.sql
-- Combined: deposit/updater fields + admin role + avatar support

-- Add deposit and utility fields to properties (safe if already exists)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_deposit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS electricity_deposit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_price_per_unit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_balcony boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_rooftop boolean DEFAULT false;

-- Update role check constraint to include updater
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin', 'updater'));

-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Set erickneko12@gmail.com as admin (by email)
DO $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = 'erickneko12@gmail.com';
  IF target_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, role) VALUES (target_id, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END $$;

-- Create storage bucket for profile avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Storage policies
create policy "Avatar public read" on storage.objects
  for select using (bucket_id = 'profile-avatars');

create policy "Avatar upload own" on storage.objects
  for insert with check (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Avatar update own" on storage.objects
  for update using (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Avatar delete own" on storage.objects
  for delete using (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
