-- Add onboarding_answers and phone_number to profiles if they don't exist
DO $$ 
BEGIN
  -- Add onboarding_answers column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onboarding_answers'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_answers JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add phone_number column if it doesn't exist (check for both phone and phone_number)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND (column_name = 'phone_number' OR column_name = 'phone')
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
  END IF;

  -- If phone column exists but phone_number doesn't, copy data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
    UPDATE public.profiles SET phone_number = phone WHERE phone IS NOT NULL;
  END IF;
END $$;

