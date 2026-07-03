-- Ensure belief_refactor_generation_log table and function exist
-- This migration creates the table and function if they don't exist

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.belief_refactor_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID, -- Reference to belief_refactor_entries.id (may be NULL if entry was deleted)
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.belief_refactor_generation_log ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (drop and recreate to ensure they're correct)
DROP POLICY IF EXISTS "Users can view their own belief refactor generation logs" ON public.belief_refactor_generation_log;
CREATE POLICY "Users can view their own belief refactor generation logs"
  ON public.belief_refactor_generation_log FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own belief refactor generation logs" ON public.belief_refactor_generation_log;
CREATE POLICY "Users can insert their own belief refactor generation logs"
  ON public.belief_refactor_generation_log FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_belief_refactor_generation_log_user_id ON public.belief_refactor_generation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_belief_refactor_generation_log_generated_at ON public.belief_refactor_generation_log(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_belief_refactor_generation_log_user_generated ON public.belief_refactor_generation_log(user_id, generated_at DESC);

-- Create or replace the function
CREATE OR REPLACE FUNCTION public.get_weekly_belief_refactor_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start TIMESTAMP WITH TIME ZONE;
  count_result INTEGER;
BEGIN
  -- Calculate start of current week (Monday 00:00:00 UTC)
  week_start := date_trunc('week', CURRENT_TIMESTAMP);
  
  -- Count generations from this week
  SELECT COUNT(*) INTO count_result
  FROM public.belief_refactor_generation_log
  WHERE user_id = p_user_id
    AND generated_at >= week_start;
  
  RETURN COALESCE(count_result, 0);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_weekly_belief_refactor_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_belief_refactor_count(UUID) TO anon;










































