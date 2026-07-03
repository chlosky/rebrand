-- Create function to check if email exists (for signup validation)
-- Uses SECURITY DEFINER to bypass RLS for this specific check
-- Checks auth.users table where emails are actually stored
-- Only checks confirmed users (excludes unverified signups)
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(check_email))
      AND confirmed_at IS NOT NULL
  );
END;
$$;

-- Create function to check if username exists (for signup validation)
-- Uses SECURITY DEFINER to bypass RLS for this specific check
CREATE OR REPLACE FUNCTION public.check_username_exists(check_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE LOWER(TRIM(username)) = LOWER(TRIM(check_username))
  );
END;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_exists(TEXT) TO anon, authenticated;

-- Add unique constraints to ensure data integrity
-- Note: Email uniqueness is already enforced by auth.users, but we add it here for profiles consistency
-- Username must be unique

-- Add unique constraint on username (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_key'
  ) THEN
    -- First, handle any potential duplicates by keeping only the first occurrence
    -- (This is a safety measure in case duplicates exist)
    DELETE FROM public.profiles p1
    WHERE EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE LOWER(TRIM(p2.username)) = LOWER(TRIM(p1.username))
        AND p2.id < p1.id
        AND p1.username IS NOT NULL
        AND p2.username IS NOT NULL
    );
    
    -- Create unique index on username (case-insensitive)
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
    ON public.profiles (LOWER(TRIM(username))) 
    WHERE username IS NOT NULL;
  END IF;
END $$;

-- Add unique constraint on email (if it doesn't exist)
-- Note: This is redundant with auth.users, but ensures consistency in profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_key'
  ) THEN
    -- First, handle any potential duplicates by keeping only the first occurrence
    DELETE FROM public.profiles p1
    WHERE EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE LOWER(TRIM(p2.email)) = LOWER(TRIM(p1.email))
        AND p2.id < p1.id
        AND p1.email IS NOT NULL
        AND p2.email IS NOT NULL
    );
    
    -- Create unique index on email (case-insensitive)
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx 
    ON public.profiles (LOWER(TRIM(email))) 
    WHERE email IS NOT NULL;
  END IF;
END $$;
