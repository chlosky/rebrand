-- Add username, email_consent, and sms_consent as separate columns to onboarding_sessions
-- This aligns the structure with post-auth tables (user_preferences has email_marketing and texts_enabled as columns)
-- Only support_focus and accountability remain in onboarding_answers JSONB

DO $$
BEGIN
  -- Add username column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'onboarding_sessions' 
    AND column_name = 'username'
  ) THEN
    ALTER TABLE public.onboarding_sessions 
      ADD COLUMN username TEXT;
    RAISE NOTICE 'Added username column to onboarding_sessions';
  END IF;

  -- Add email_consent column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'onboarding_sessions' 
    AND column_name = 'email_consent'
  ) THEN
    ALTER TABLE public.onboarding_sessions 
      ADD COLUMN email_consent BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added email_consent column to onboarding_sessions';
  END IF;

  -- Add sms_consent column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'onboarding_sessions' 
    AND column_name = 'sms_consent'
  ) THEN
    ALTER TABLE public.onboarding_sessions 
      ADD COLUMN sms_consent BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added sms_consent column to onboarding_sessions';
  END IF;

  -- Migrate existing data from onboarding_answers JSONB to columns (if they exist)
  -- This is a one-time migration for existing sessions
  UPDATE public.onboarding_sessions
  SET 
    username = CASE 
      WHEN onboarding_answers->>'username' IS NOT NULL 
      THEN onboarding_answers->>'username' 
      ELSE username 
    END,
    email_consent = CASE 
      WHEN onboarding_answers->>'email_consent' IS NOT NULL 
      THEN (onboarding_answers->>'email_consent')::boolean 
      ELSE COALESCE(email_consent, false)
    END,
    sms_consent = CASE 
      WHEN onboarding_answers->>'sms_consent' IS NOT NULL 
      THEN (onboarding_answers->>'sms_consent')::boolean 
      ELSE COALESCE(sms_consent, false)
    END
  WHERE onboarding_answers IS NOT NULL 
    AND (
      onboarding_answers->>'username' IS NOT NULL 
      OR onboarding_answers->>'email_consent' IS NOT NULL 
      OR onboarding_answers->>'sms_consent' IS NOT NULL
    );

  RAISE NOTICE 'Migrated existing data from onboarding_answers to columns';
END $$;
