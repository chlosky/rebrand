-- Add tutorial tracking columns to user_preferences table
-- This stores tutorial completion status and last slide position in the database

DO $$
BEGIN
  -- Add tutorial_completed (JSONB to store which slides are completed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'tutorial_completed'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN tutorial_completed JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add tutorial_last_slide (INTEGER to track last slide position)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'tutorial_last_slide'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN tutorial_last_slide INTEGER DEFAULT 0;
  END IF;
END $$;
