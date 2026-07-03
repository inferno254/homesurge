-- Silence Supabaseadvisor RLS warning for PostGIS system table
ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spatial_ref_sys_public_read" ON public.spatial_ref_sys;
CREATE POLICY "spatial_ref_sys_public_read"
  ON public.spatial_ref_sys FOR SELECT
  USING (true);
