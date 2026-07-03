-- Remove public access policy for subliminal-tracks storage bucket
-- Tracks should be PRIVATE - users can only see their own tracks
-- Just like custom affirmations, journal entries, and refactors

-- ============================================================================
-- Drop the public viewing policy
-- ============================================================================
DROP POLICY IF EXISTS "Public can view subliminal tracks" ON storage.objects;

-- ============================================================================
-- Update the authenticated user policy to ONLY allow viewing their own files
-- Remove the OR clause that allowed viewing any file in a public bucket
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own subliminal tracks" ON storage.objects;

CREATE POLICY "Users can view their own subliminal tracks"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'subliminal-tracks' AND
    (SELECT auth.uid())::text = (string_to_array(name, '/'))[1]
  );
























































