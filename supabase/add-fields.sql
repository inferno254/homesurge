-- homesurge: Add deposit and utility fields to properties table
-- Run this in Supabase Dashboard â†’ SQL Editor

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_deposit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS electricity_deposit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_price_per_unit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_balcony boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_rooftop boolean DEFAULT false;

