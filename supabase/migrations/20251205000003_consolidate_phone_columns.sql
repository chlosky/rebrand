-- Consolidate phone columns in profiles table
-- Keep only 'phone' column since that's where the data is
-- Remove 'phone_number' column to eliminate redundancy

-- ============================================================================
-- Step 1: Migrate any data from phone_number to phone (if phone is NULL)
-- ============================================================================

UPDATE public.profiles
SET phone = phone_number
WHERE phone IS NULL
AND phone_number IS NOT NULL
AND phone_number != '';

-- ============================================================================
-- Step 2: Remove phone_number column from profiles
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN phone_number;
    RAISE NOTICE 'Dropped phone_number column from profiles table';
  ELSE
    RAISE NOTICE 'phone_number column does not exist in profiles table';
  END IF;
END $$;

-- ============================================================================
-- Step 3: Also remove phone_number from user_preferences if it exists
-- (Keep only phone for consistency)
-- ============================================================================

DO $$
BEGIN
  -- First migrate any data from phone_number to phone in user_preferences
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'phone_number'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'phone'
  ) THEN
    UPDATE public.user_preferences
    SET phone = phone_number
    WHERE phone IS NULL
    AND phone_number IS NOT NULL
    AND phone_number != '';
  END IF;

  -- Then drop phone_number column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.user_preferences DROP COLUMN phone_number;
    RAISE NOTICE 'Dropped phone_number column from user_preferences table';
  END IF;
END $$;













































