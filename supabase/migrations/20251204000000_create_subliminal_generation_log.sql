-- Create subliminal_generation_log table to track all successful generations
-- This ensures weekly generation counts include deleted tracks
-- Weekly reset happens on Monday (start of week) for all users

CREATE TABLE IF NOT EXISTS public.subliminal_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID, -- Reference to subliminal_tracks.id (may be NULL if track was deleted)
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subliminal_generation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own generation logs"
  ON public.subliminal_generation_log FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own generation logs"
  ON public.subliminal_generation_log FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subliminal_generation_log_user_id ON public.subliminal_generation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_subliminal_generation_log_generated_at ON public.subliminal_generation_log(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_subliminal_generation_log_user_generated ON public.subliminal_generation_log(user_id, generated_at DESC);

-- Function to get weekly generation count for a user
-- Counts all generations from Monday 00:00:00 UTC of current week
-- Uses PostgreSQL's native date_trunc('week') which starts on Monday
CREATE OR REPLACE FUNCTION public.get_weekly_generation_count(p_user_id UUID)
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
  FROM public.subliminal_generation_log
  WHERE user_id = p_user_id
    AND generated_at >= week_start;
  
  RETURN COALESCE(count_result, 0);
END;
$$;

-- Function to clean up old generation logs (older than 8 weeks)
-- This can be run periodically to keep the table size manageable
CREATE OR REPLACE FUNCTION public.cleanup_old_generation_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Keep logs for 8 weeks
  cutoff_date := CURRENT_TIMESTAMP - INTERVAL '8 weeks';
  
  DELETE FROM public.subliminal_generation_log
  WHERE generated_at < cutoff_date;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

