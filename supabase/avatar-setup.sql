-- ============================================================
-- Avatar storage setup for homesurge KE
-- Run this once in: Supabase Dashboard â†’ SQL Editor
-- ============================================================

-- 1. Add avatar_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create storage bucket for profile avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- 3. Storage RLS policies (drop first if they exist, then create)
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload own" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update own" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete own" ON storage.objects;

create policy "Avatar public read" on storage.objects for select using (bucket_id = 'profile-avatars');
create policy "Avatar upload own" on storage.objects for insert with check (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Avatar update own" on storage.objects for update using (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Avatar delete own" on storage.objects for delete using (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

