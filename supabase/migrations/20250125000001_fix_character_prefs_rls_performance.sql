-- Fix RLS policies for user_character_preferences to use (SELECT auth.uid()) for better performance
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own character preferences" ON public.user_character_preferences;
  DROP POLICY IF EXISTS "Users can update their own character preferences" ON public.user_character_preferences;
  DROP POLICY IF EXISTS "Users can insert their own character preferences" ON public.user_character_preferences;

  -- Create optimized policies with (SELECT auth.uid())
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























































