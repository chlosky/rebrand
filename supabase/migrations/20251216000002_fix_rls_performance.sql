-- Fix RLS performance issues by using (select auth.uid()) instead of auth.uid()
-- This prevents the function from being re-evaluated for each row

-- Fix character_messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.character_messages;
CREATE POLICY "Users can view their own messages"
  ON public.character_messages
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- Fix user_message_limits policies
DROP POLICY IF EXISTS "Users can view their own message limits" ON public.user_message_limits;
CREATE POLICY "Users can view their own message limits"
  ON public.user_message_limits
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- Fix weekly_goals policies
DROP POLICY IF EXISTS "Users can view their own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can view their own weekly goals"
  ON public.weekly_goals
  FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can insert their own weekly goals"
  ON public.weekly_goals
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can update their own weekly goals"
  ON public.weekly_goals
  FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can delete their own weekly goals"
  ON public.weekly_goals
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- Note: Multiple permissive policies (Service role + User policies) are intentional
-- The "Service role can manage all X" policies allow edge functions to access all data
-- The "Users can X their own Y" policies allow users to access only their data
-- Both are needed for the app to function correctly
-- Supabase flags this as a warning but it's not a bug - it's by design

