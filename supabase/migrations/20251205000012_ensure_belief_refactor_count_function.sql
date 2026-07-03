-- Ensure get_weekly_belief_refactor_count function exists
-- This migration ensures the function is created even if the previous migration wasn't applied

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











































