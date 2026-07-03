-- homesurge: Add deposit, utility, and feature fields
-- Run this in: Supabase Dashboard â†’ SQL Editor â†’ Paste â†’ Run

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_deposit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS electricity_deposit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_price_per_unit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_balcony boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_rooftop boolean DEFAULT false;

-- Admin-only property note / internal description
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS admin_description text;

-- Create admin user: erickneko12@gmail.com / 12345678
-- Run this AFTER creating the user via Dashboard → Authentication → Users → Create user
-- Then update their profile role:
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'erickneko12@gmail.com'
);

