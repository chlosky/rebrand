-- Add marketing_sms_enabled column to user_preferences table
-- This is separate from texts_enabled which is for Your Double proactive messages
-- marketing_sms_enabled is for promotional/marketing text notifications

DO $$
BEGIN
  -- Add marketing_sms_enabled if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'marketing_sms_enabled'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN marketing_sms_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;













































