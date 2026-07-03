-- Enable RLS on ai_usage table (if it was created without RLS)
-- This migration adds RLS to the existing ai_usage table

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "Users can view their own AI usage logs" ON public.ai_usage;

-- RLS Policies
-- Users can view their own AI usage logs
CREATE POLICY "Users can view their own AI usage logs"
  ON public.ai_usage FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Inserts are done via Edge Functions using service role (bypasses RLS)
-- No INSERT policy needed as service role has full access

