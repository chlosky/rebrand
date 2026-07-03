-- Fix RLS policies for user_background_tracks table
-- Replace auth.uid() with (SELECT auth.uid()) for better query performance
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_background_tracks'
  ) THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own background tracks" ON public.user_background_tracks;
    DROP POLICY IF EXISTS "Users can create their own background tracks" ON public.user_background_tracks;
    DROP POLICY IF EXISTS "Users can update their own background tracks" ON public.user_background_tracks;
    DROP POLICY IF EXISTS "Users can delete their own background tracks" ON public.user_background_tracks;

    -- Recreate policies with optimized auth.uid() calls
    CREATE POLICY "Users can view their own background tracks"
      ON public.user_background_tracks FOR SELECT
      USING ((SELECT auth.uid()) = user_id);

    CREATE POLICY "Users can create their own background tracks"
      ON public.user_background_tracks FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);

    CREATE POLICY "Users can update their own background tracks"
      ON public.user_background_tracks FOR UPDATE
      USING ((SELECT auth.uid()) = user_id);

    CREATE POLICY "Users can delete their own background tracks"
      ON public.user_background_tracks FOR DELETE
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

