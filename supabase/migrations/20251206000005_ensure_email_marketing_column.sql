-- Ensure email_marketing column exists in user_preferences table
-- This handles both renaming email_reminders if it exists, or creating email_marketing if neither exists

DO $$
BEGIN
  -- Check if email_marketing column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'email_marketing'
  ) THEN
    -- If email_reminders exists, rename it to email_marketing
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_preferences' 
      AND column_name = 'email_reminders'
    ) THEN
      ALTER TABLE public.user_preferences 
        RENAME COLUMN email_reminders TO email_marketing;
    ELSE
      -- Neither exists, add email_marketing
      ALTER TABLE public.user_preferences 
        ADD COLUMN email_marketing BOOLEAN DEFAULT false;
    END IF;
    
    -- Add comment
    COMMENT ON COLUMN public.user_preferences.email_marketing IS 'User consent for marketing email communications (separate from transactional emails)';
  END IF;
END $$;












































