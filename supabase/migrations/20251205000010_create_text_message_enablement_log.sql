-- Create text_message_enablement_log table to track all text message enablement changes over time
-- This logs every time a user enables or disables text messages

CREATE TABLE IF NOT EXISTS public.text_message_enablement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texts_enabled BOOLEAN NOT NULL, -- New status (true = enabled, false = disabled)
  previous_status BOOLEAN, -- Previous status (NULL for initial setting)
  source TEXT, -- 'sms_settings', 'onboarding', 'backfill', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- Create indexes for efficient queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_text_message_enablement_log_user_id ON public.text_message_enablement_log(user_id);
CREATE INDEX IF NOT EXISTS idx_text_message_enablement_log_created_at ON public.text_message_enablement_log(created_at);
CREATE INDEX IF NOT EXISTS idx_text_message_enablement_log_user_created ON public.text_message_enablement_log(user_id, created_at DESC);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE public.text_message_enablement_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Create RLS policies
-- ============================================================================

-- Users can view their own text message enablement history
DROP POLICY IF EXISTS "Users can view their own text message enablement log" ON public.text_message_enablement_log;
CREATE POLICY "Users can view their own text message enablement log"
  ON public.text_message_enablement_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own text message enablement log entries
DROP POLICY IF EXISTS "Users can insert their own text message enablement log" ON public.text_message_enablement_log;
CREATE POLICY "Users can insert their own text message enablement log"
  ON public.text_message_enablement_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.text_message_enablement_log IS 'Logs all text message enablement changes over time, tracking when users enable or disable SMS features';
COMMENT ON COLUMN public.text_message_enablement_log.previous_status IS 'The previous enablement status before this change. NULL for initial setting.';
COMMENT ON COLUMN public.text_message_enablement_log.source IS 'Where the change originated: sms_settings, onboarding, backfill, etc.';













































