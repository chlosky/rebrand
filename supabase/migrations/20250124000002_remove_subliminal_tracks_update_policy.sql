-- Remove UPDATE policy for subliminal-tracks storage bucket
-- Users don't need to update/replace files - they can delete and re-upload instead
-- This simplifies the policy set and reduces unnecessary permissions

-- ============================================================================
-- Drop the UPDATE policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can update their own subliminal tracks" ON storage.objects;










