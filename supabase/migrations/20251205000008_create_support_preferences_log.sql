-- Create support_preferences_log table to track all support focus and support style changes over time
-- This logs every time a user changes their support focus or support style preferences

CREATE TABLE IF NOT EXISTS public.support_preferences_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  support_focus TEXT[], -- Array of selected support focus areas
  previous_support_focus TEXT[], -- Previous support focus (NULL for initial selection)
  support_style TEXT, -- Renamed from accountability: "Daily motivation", "Light motivational nudges", "Structured check-in", "A mix"
  previous_support_style TEXT, -- Previous support style (NULL for initial selection)
  source TEXT, -- 'onboarding', 'sms_settings', 'backfill', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- Create indexes for efficient queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_support_preferences_log_user_id ON public.support_preferences_log(user_id);
CREATE INDEX IF NOT EXISTS idx_support_preferences_log_created_at ON public.support_preferences_log(created_at);
CREATE INDEX IF NOT EXISTS idx_support_preferences_log_user_created ON public.support_preferences_log(user_id, created_at DESC);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE public.support_preferences_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Create RLS policies
-- ============================================================================

-- Users can view their own support preferences history
DROP POLICY IF EXISTS "Users can view their own support preferences log" ON public.support_preferences_log;
CREATE POLICY "Users can view their own support preferences log"
  ON public.support_preferences_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own support preferences log entries
DROP POLICY IF EXISTS "Users can insert their own support preferences log" ON public.support_preferences_log;
CREATE POLICY "Users can insert their own support preferences log"
  ON public.support_preferences_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.support_preferences_log IS 'Logs all support focus and support style changes over time, starting from initial onboarding selection';
COMMENT ON COLUMN public.support_preferences_log.support_style IS 'Renamed from accountability. Options: Daily motivation, Light motivational nudges, Structured check-in, A mix';
COMMENT ON COLUMN public.support_preferences_log.previous_support_focus IS 'The support focus that was selected before this change. NULL for initial selection.';
COMMENT ON COLUMN public.support_preferences_log.previous_support_style IS 'The support style that was selected before this change. NULL for initial selection.';













































