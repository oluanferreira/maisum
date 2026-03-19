-- ===========================================
-- Migration 007: Storage Buckets
-- ===========================================

-- Restaurant photos bucket (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-photos', 'restaurant-photos', true);

-- Social proof screenshots bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('social-proofs', 'social-proofs', false);

-- Storage policies for restaurant-photos
CREATE POLICY "Super admin upload restaurant photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'restaurant-photos' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'restaurant_admin'));

CREATE POLICY "Super admin delete restaurant photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'restaurant-photos' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'restaurant_admin'));

CREATE POLICY "Public read restaurant photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-photos');

-- Storage policies for social-proofs
CREATE POLICY "Users upload social proofs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'social-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read social proofs" ON storage.objects FOR SELECT
  USING (bucket_id = 'social-proofs' AND auth.uid() IS NOT NULL);
