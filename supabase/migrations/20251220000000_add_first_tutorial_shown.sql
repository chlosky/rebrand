-- Add first_tutorial_shown column to user_preferences table
-- This tracks whether the user has seen the tutorial after their first payment

-- Add first_tutorial_shown column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'first_tutorial_shown'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN first_tutorial_shown BOOLEAN DEFAULT false;
  END IF;
END $$;

