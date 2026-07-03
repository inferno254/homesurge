-- Create property-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "property_images_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "property_images_admin_update_delete" ON storage.objects;

CREATE POLICY "property_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "property_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'updater')));
CREATE POLICY "property_images_admin_update_delete" ON storage.objects
  FOR ALL USING (bucket_id = 'property-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'updater')))
  WITH CHECK (bucket_id = 'property-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'updater')));