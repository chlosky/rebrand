-- Rename email_reminders to email_marketing for clarity
-- This field is for marketing email consent, not reminders

DO $$
BEGIN
  -- Check if email_reminders column exists and email_marketing doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'email_reminders'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'email_marketing'
  ) THEN
    -- Rename the column
    ALTER TABLE public.user_preferences 
      RENAME COLUMN email_reminders TO email_marketing;
    
    -- Update comment if it exists
    COMMENT ON COLUMN public.user_preferences.email_marketing IS 'User consent for marketing email communications (separate from transactional emails)';
  END IF;
END $$;













































