-- Fix multiple permissive policies by restricting service role policies to service_role only
-- This prevents redundant policy evaluation and improves performance

-- ============================================================================
-- character_messages
-- ============================================================================

-- Drop old broad "FOR ALL" policy that applies to all roles
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.character_messages;

-- Create role-specific policies for service_role only
CREATE POLICY "Service role can view all messages"
  ON public.character_messages
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert messages"
  ON public.character_messages
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update messages"
  ON public.character_messages
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete messages"
  ON public.character_messages
  FOR DELETE
  TO service_role
  USING (true);

-- Ensure user policy only applies to authenticated users
DROP POLICY IF EXISTS "Users can view their own messages" ON public.character_messages;
CREATE POLICY "Users can view their own messages"
  ON public.character_messages
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- user_message_limits
-- ============================================================================

-- Drop old broad "FOR ALL" policy that applies to all roles
DROP POLICY IF EXISTS "Service role can manage all message limits" ON public.user_message_limits;

-- Create role-specific policies for service_role only
CREATE POLICY "Service role can view all message limits"
  ON public.user_message_limits
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert message limits"
  ON public.user_message_limits
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update message limits"
  ON public.user_message_limits
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete message limits"
  ON public.user_message_limits
  FOR DELETE
  TO service_role
  USING (true);

-- Ensure user policy only applies to authenticated users
DROP POLICY IF EXISTS "Users can view their own message limits" ON public.user_message_limits;
CREATE POLICY "Users can view their own message limits"
  ON public.user_message_limits
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- weekly_goals
-- ============================================================================

-- Drop old broad "FOR ALL" policy that applies to all roles
DROP POLICY IF EXISTS "Service role can manage all weekly goals" ON public.weekly_goals;

-- Create role-specific policies for service_role only
CREATE POLICY "Service role can view all weekly goals"
  ON public.weekly_goals
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert weekly goals"
  ON public.weekly_goals
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update weekly goals"
  ON public.weekly_goals
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete weekly goals"
  ON public.weekly_goals
  FOR DELETE
  TO service_role
  USING (true);

-- Ensure user policies only apply to authenticated users
DROP POLICY IF EXISTS "Users can view their own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can view their own weekly goals"
  ON public.weekly_goals
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can insert their own weekly goals"
  ON public.weekly_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can update their own weekly goals"
  ON public.weekly_goals
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own weekly goals" ON public.weekly_goals;
CREATE POLICY "Users can delete their own weekly goals"
  ON public.weekly_goals
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Result: Each role now has exactly ONE policy per action
-- - service_role: can access ALL rows (for edge functions)
-- - authenticated: can access ONLY their own rows (for users)
-- - No more redundant policy evaluation

