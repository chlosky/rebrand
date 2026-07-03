-- Fix all RLS performance issues and consolidate multiple permissive policies
-- This migration addresses:
-- 1. Replacing auth.uid() with (SELECT auth.uid()) for optimal performance
-- 2. Consolidating multiple permissive policies into single combined policies
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- Ensure helper functions exist
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
-- user_plans table - Consolidate and optimize all policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans'
  ) THEN
    -- Drop ALL existing policies to start fresh
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all plans" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own plan" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own plan or admins can view all" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all plans" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own plan" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own plan or admins can update all" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile or admins can update all" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete all plans" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can create user plans" ON public.user_plans';

    -- Create consolidated SELECT policy (combines user and admin access)
    EXECUTE 'CREATE POLICY "Users can view their own plan or admins can view all"
      ON public.user_plans FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) = user_id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    -- Create consolidated UPDATE policy (combines user and admin access)
    EXECUTE 'CREATE POLICY "Users can update their own plan or admins can update all"
      ON public.user_plans FOR UPDATE
      TO authenticated
      USING (
        (SELECT auth.uid()) = user_id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    -- Admin-only policies for DELETE and INSERT
    EXECUTE 'CREATE POLICY "Admins can delete all plans"
      ON public.user_plans FOR DELETE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can create user plans"
      ON public.user_plans FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- user_roles table - Optimize auth.uid() call
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles';

    EXECUTE 'CREATE POLICY "Users can view their own roles"
      ON public.user_roles FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================================================
-- profiles table - Optimize auth.uid() calls
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Drop all existing profile policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile or admins can update all" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "own_profile_insert" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "own_profile_update" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "own_profile_delete" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users view own complete profile" ON public.profiles';

    -- Create consolidated SELECT policy
    EXECUTE 'CREATE POLICY "Users can view their own profile or admins can view all"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) = profiles.id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    -- Create consolidated UPDATE policy
    EXECUTE 'CREATE POLICY "Users can update their own profile or admins can update all"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (
        (SELECT auth.uid()) = profiles.id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    -- INSERT policy (users can create their own profile)
    EXECUTE 'CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = profiles.id)';

    -- DELETE policy (users can delete their own profile)
    EXECUTE 'CREATE POLICY "Users can delete their own profile"
      ON public.profiles FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = profiles.id)';
  END IF;
END $$;









































