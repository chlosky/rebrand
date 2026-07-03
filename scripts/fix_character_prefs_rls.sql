-- Fix RLS policies for user_character_preferences to ensure they work during signup
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own character preferences" ON public.user_character_preferences;
  DROP POLICY IF EXISTS "Users can update their own character preferences" ON public.user_character_preferences;
  DROP POLICY IF EXISTS "Users can insert their own character preferences" ON public.user_character_preferences;

  -- Create policies with TO authenticated and proper checks
  CREATE POLICY "Users can view their own character preferences"
    ON public.user_character_preferences
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

  CREATE POLICY "Users can update their own character preferences"
    ON public.user_character_preferences
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

  CREATE POLICY "Users can insert their own character preferences"
    ON public.user_character_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
END $$;





















































