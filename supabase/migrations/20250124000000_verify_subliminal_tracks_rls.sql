-- Verify and fix subliminal_tracks RLS policies
-- This migration ensures the RLS policies are correctly set up

-- ============================================================================
-- Drop existing policies to recreate them correctly
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own subliminal tracks" ON public.subliminal_tracks;
DROP POLICY IF EXISTS "Users can create their own subliminal tracks" ON public.subliminal_tracks;
DROP POLICY IF EXISTS "Users can update their own subliminal tracks" ON public.subliminal_tracks;
DROP POLICY IF EXISTS "Users can delete their own subliminal tracks" ON public.subliminal_tracks;

-- ============================================================================
-- Recreate policies with correct syntax
-- ============================================================================
CREATE POLICY "Users can view their own subliminal tracks"
  ON public.subliminal_tracks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own subliminal tracks"
  ON public.subliminal_tracks FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own subliminal tracks"
  ON public.subliminal_tracks FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own subliminal tracks"
  ON public.subliminal_tracks FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- Verify RLS is enabled
-- ============================================================================
ALTER TABLE public.subliminal_tracks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Create a test function to verify auth.uid() works
-- ============================================================================
CREATE OR REPLACE FUNCTION public.test_auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

























































