-- Backfill NULL values in profiles table from user_plans and auth.users
-- This ensures profiles has complete data where it already exists elsewhere
-- Does NOT modify user_plans or auth.users, only references them to update profiles

-- ============================================================================
-- Step 1: Update email in profiles from auth.users if profiles.email is NULL
-- (user_plans doesn't typically store email, but auth.users does)
-- ============================================================================

UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
AND p.email IS NULL
AND au.email IS NOT NULL;

-- ============================================================================
-- Step 2: Update phone/phone_number in profiles from user_plans if profiles has NULL
-- First check if user_plans has these columns, if not, skip
-- ============================================================================

-- Update phone_number if column exists in both tables
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'phone_number'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans' 
    AND column_name = 'phone_number'
  ) THEN
    UPDATE public.profiles p
    SET phone_number = up.phone_number
    FROM public.user_plans up
    WHERE p.id = up.user_id
    AND (p.phone_number IS NULL OR p.phone_number = '')
    AND up.phone_number IS NOT NULL
    AND up.phone_number != '';
  END IF;

  -- Update phone if column exists in both tables
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'phone'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans' 
    AND column_name = 'phone'
  ) THEN
    UPDATE public.profiles p
    SET phone = up.phone
    FROM public.user_plans up
    WHERE p.id = up.user_id
    AND (p.phone IS NULL OR p.phone = '')
    AND up.phone IS NOT NULL
    AND up.phone != '';
  END IF;
END $$;

-- ============================================================================
-- Step 3: Update username in profiles from user_plans if it exists there
-- Otherwise, generate username from email if profiles.username is NULL
-- ============================================================================

DO $$
BEGIN
  -- First try from user_plans if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans' 
    AND column_name = 'username'
  ) THEN
    UPDATE public.profiles p
    SET username = up.username
    FROM public.user_plans up
    WHERE p.id = up.user_id
    AND (p.username IS NULL OR p.username = '')
    AND up.username IS NOT NULL
    AND up.username != '';
  END IF;

  -- If still NULL, generate from email (extract part before @)
  UPDATE public.profiles p
  SET username = COALESCE(
    split_part(p.email, '@', 1),
    split_part(au.email, '@', 1)
  )
  FROM auth.users au
  WHERE p.id = au.id
  AND (p.username IS NULL OR p.username = '')
  AND (p.email IS NOT NULL OR au.email IS NOT NULL);
END $$;

-- ============================================================================
-- Step 4: Update first_name in profiles from user_plans if profiles.first_name is NULL
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans' 
    AND column_name = 'first_name'
  ) THEN
    UPDATE public.profiles p
    SET first_name = up.first_name
    FROM public.user_plans up
    WHERE p.id = up.user_id
    AND p.first_name IS NULL
    AND up.first_name IS NOT NULL
    AND up.first_name != '';
  END IF;
END $$;

-- ============================================================================
-- Step 5: Update last_name in profiles from user_plans if profiles.last_name is NULL
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans' 
    AND column_name = 'last_name'
  ) THEN
    UPDATE public.profiles p
    SET last_name = up.last_name
    FROM public.user_plans up
    WHERE p.id = up.user_id
    AND p.last_name IS NULL
    AND up.last_name IS NOT NULL
    AND up.last_name != '';
  END IF;
END $$;

-- ============================================================================
-- Step 6: Update any other common fields that might exist in both tables
-- ============================================================================

-- Update avatar_url if it exists in both
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans' 
    AND column_name = 'avatar_url'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    UPDATE public.profiles p
    SET avatar_url = up.avatar_url
    FROM public.user_plans up
    WHERE p.id = up.user_id
    AND p.avatar_url IS NULL
    AND up.avatar_url IS NOT NULL
    AND up.avatar_url != '';
  END IF;
END $$;

-- Update preset_theme if it exists in both
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans' 
    AND column_name = 'preset_theme'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'preset_theme'
  ) THEN
    UPDATE public.profiles p
    SET preset_theme = up.preset_theme
    FROM public.user_plans up
    WHERE p.id = up.user_id
    AND p.preset_theme IS NULL
    AND up.preset_theme IS NOT NULL
    AND up.preset_theme != '';
  END IF;
END $$;

