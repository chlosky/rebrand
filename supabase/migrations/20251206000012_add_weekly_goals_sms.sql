-- Add weekly_goals_sms column to user_preferences table
-- This column stores whether the user wants to receive SMS reminders about their weekly goals

-- Add weekly_goals_sms column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'weekly_goals_sms'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN weekly_goals_sms BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.user_preferences.weekly_goals_sms IS 'Whether user wants to receive SMS reminders about their weekly goals';

