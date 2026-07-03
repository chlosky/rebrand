-- Revert user_roles consolidation - Keep profiles, user_plans, and user_preferences separate
-- This migration reverts the consolidation of user_roles into profiles

-- ============================================================================
-- Step 1: Ensure app_role enum exists
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- ============================================================================
-- Step 2: Recreate user_roles table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ============================================================================
-- Step 3: Migrate role data from profiles back to user_roles (if profiles.role exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'role'
  ) THEN
    -- Migrate role from profiles to user_roles
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, role
    FROM public.profiles
    WHERE role IS NOT NULL
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- Step 4: Restore original has_role function to check user_roles table
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================================================
-- Step 5: Restore original trigger to set role in user_roles (not profiles)
-- ============================================================================

-- Drop the consolidated trigger/function
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- Create original function to set default role in user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN new;
END;
$$;

-- Create trigger to set default role on user creation
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- ============================================================================
-- Step 6: Restore RLS policies for user_roles
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- Step 7: Remove role column from profiles (if it exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'role'
  ) THEN
    -- Drop index first
    DROP INDEX IF EXISTS public.idx_profiles_role;
    
    -- Drop the role column
    ALTER TABLE public.profiles DROP COLUMN role;
  END IF;
END $$;

-- ============================================================================
-- Verification Query (run this after migration to check results)
-- ============================================================================

-- SELECT 
--   ur.user_id,
--   ur.role,
--   p.email,
--   p.username
-- FROM public.user_roles ur
-- LEFT JOIN public.profiles p ON p.id = ur.user_id
-- ORDER BY ur.role, ur.created_at DESC
-- LIMIT 20;



















































