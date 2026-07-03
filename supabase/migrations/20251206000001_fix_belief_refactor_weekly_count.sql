-- Fix get_weekly_belief_refactor_count function permissions and ensure it exists
-- This ensures the function is accessible to authenticated users

-- Ensure the function exists
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_weekly_belief_refactor_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_belief_refactor_count(UUID) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_weekly_belief_refactor_count(UUID) IS 'Returns the count of belief refactor generations for a user from the start of the current week (Monday)';










































