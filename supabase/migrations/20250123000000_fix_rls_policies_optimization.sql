-- Fix RLS policies to use (SELECT auth.uid()) instead of auth.uid()
-- This evaluates once per statement instead of once per row, improving performance

-- ============================================================================
-- subliminal_tracks table
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own subliminal tracks" ON public.subliminal_tracks;
DROP POLICY IF EXISTS "Users can create their own subliminal tracks" ON public.subliminal_tracks;
DROP POLICY IF EXISTS "Users can update their own subliminal tracks" ON public.subliminal_tracks;
DROP POLICY IF EXISTS "Users can delete their own subliminal tracks" ON public.subliminal_tracks;

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
-- user_affirmation_sets table
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own affirmation sets" ON public.user_affirmation_sets;
DROP POLICY IF EXISTS "Users can create their own affirmation sets" ON public.user_affirmation_sets;
DROP POLICY IF EXISTS "Users can update their own affirmation sets" ON public.user_affirmation_sets;
DROP POLICY IF EXISTS "Users can delete their own affirmation sets" ON public.user_affirmation_sets;

CREATE POLICY "Users can view their own affirmation sets"
  ON public.user_affirmation_sets FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own affirmation sets"
  ON public.user_affirmation_sets FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own affirmation sets"
  ON public.user_affirmation_sets FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own affirmation sets"
  ON public.user_affirmation_sets FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- belief_refactor_entries table
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own refactor entries" ON public.belief_refactor_entries;
DROP POLICY IF EXISTS "Users can create their own refactor entries" ON public.belief_refactor_entries;
DROP POLICY IF EXISTS "Users can update their own refactor entries" ON public.belief_refactor_entries;
DROP POLICY IF EXISTS "Users can delete their own refactor entries" ON public.belief_refactor_entries;

CREATE POLICY "Users can view their own refactor entries"
  ON public.belief_refactor_entries FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own refactor entries"
  ON public.belief_refactor_entries FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own refactor entries"
  ON public.belief_refactor_entries FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own refactor entries"
  ON public.belief_refactor_entries FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- user_preferences table
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can create their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- user_double_progress table
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own double progress" ON public.user_double_progress;
DROP POLICY IF EXISTS "Users can create their own double progress" ON public.user_double_progress;
DROP POLICY IF EXISTS "Users can update their own double progress" ON public.user_double_progress;
DROP POLICY IF EXISTS "Users can delete their own double progress" ON public.user_double_progress;

CREATE POLICY "Users can view their own double progress"
  ON public.user_double_progress FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own double progress"
  ON public.user_double_progress FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own double progress"
  ON public.user_double_progress FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own double progress"
  ON public.user_double_progress FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- user_double_action_history table
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own action history" ON public.user_double_action_history;
DROP POLICY IF EXISTS "Users can create their own action history" ON public.user_double_action_history;
DROP POLICY IF EXISTS "Users can update their own action history" ON public.user_double_action_history;
DROP POLICY IF EXISTS "Users can delete their own action history" ON public.user_double_action_history;

CREATE POLICY "Users can view their own action history"
  ON public.user_double_action_history FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own action history"
  ON public.user_double_action_history FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own action history"
  ON public.user_double_action_history FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own action history"
  ON public.user_double_action_history FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

