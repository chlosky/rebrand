-- Setup storage bucket policies for subliminal-tracks
-- This allows authenticated users to upload, read, and delete their own files
--
-- IMPORTANT: The bucket must be created first via Supabase Dashboard:
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
-- 2. Click "New bucket"
-- 3. Name: subliminal-tracks
-- 4. Make it Private (RLS policies will control access - users can only access their own files)
-- 5. Click "Create bucket"
--
-- This migration only creates the RLS policies for the bucket.
-- It does NOT create the bucket or modify storage.objects table structure.

-- ============================================================================
-- Drop existing policies for subliminal-tracks bucket (if any)
-- ============================================================================
DROP POLICY IF EXISTS "Users can upload their own subliminal tracks" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own subliminal tracks" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own subliminal tracks" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own subliminal tracks" ON storage.objects;
DROP POLICY IF EXISTS "Public can view subliminal tracks" ON storage.objects;

-- ============================================================================
-- Policy: Users can upload files to their own folder
-- Files are stored as {user_id}/{filename}
-- Check if the path starts with the user's UUID
-- ============================================================================
CREATE POLICY "Users can upload their own subliminal tracks"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'subliminal-tracks' AND
    (SELECT auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- ============================================================================
-- Policy: Users can view/read ONLY their own files (PRIVATE)
-- ============================================================================
CREATE POLICY "Users can view their own subliminal tracks"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'subliminal-tracks' AND
    (SELECT auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- ============================================================================
-- Policy: Users can delete their own files
-- ============================================================================
CREATE POLICY "Users can delete their own subliminal tracks"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'subliminal-tracks' AND
    (SELECT auth.uid())::text = (string_to_array(name, '/'))[1]
  );

-- ============================================================================
-- Note: UPDATE policy removed - users don't need to update/replace files
-- If they want a new version, they can delete and re-upload
-- ============================================================================

