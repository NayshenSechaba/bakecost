-- Add photo_path column to recipes table if not exists
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS photo_path text;

-- Create recipe-photos storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-photos',
  'recipe-photos',
  false,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/jpg'];

-- Storage RLS policies
DROP POLICY IF EXISTS "Authenticated users can read recipe photos" ON storage.objects;
DROP POLICY IF EXISTS "Tenants can upload their own recipe photos" ON storage.objects;
DROP POLICY IF EXISTS "Tenants can update their own recipe photos" ON storage.objects;
DROP POLICY IF EXISTS "Tenants can delete their own recipe photos" ON storage.objects;

CREATE POLICY "Authenticated users can read recipe photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'recipe-photos');

CREATE POLICY "Tenants can upload their own recipe photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recipe-photos');

CREATE POLICY "Tenants can update their own recipe photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'recipe-photos')
WITH CHECK (bucket_id = 'recipe-photos');

CREATE POLICY "Tenants can delete their own recipe photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'recipe-photos');
