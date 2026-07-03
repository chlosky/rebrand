-- Add weekly_checkin_enabled column to user_preferences table
-- This column stores whether the user wants to enable the in-app weekly check-in card

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'weekly_checkin_enabled'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN weekly_checkin_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.user_preferences.weekly_checkin_enabled IS 'Whether user wants to enable the in-app weekly check-in card';

