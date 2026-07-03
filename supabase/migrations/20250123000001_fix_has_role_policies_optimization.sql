-- Fix RLS policies using has_role() to optimize auth.uid() calls
-- Wrap auth.uid() in (SELECT auth.uid()) so it evaluates once per statement
-- Also ensure has_role function is properly marked as STABLE

-- ============================================================================
-- Ensure has_role function is STABLE and SECURITY DEFINER
-- This prevents recursive RLS checks and allows query planner optimizations
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
-- user_plans table - Admin policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all plans" ON public.user_plans;
DROP POLICY IF EXISTS "Admins can update all plans" ON public.user_plans;
DROP POLICY IF EXISTS "Admins can delete all plans" ON public.user_plans;

CREATE POLICY "Admins can view all plans"
  ON public.user_plans FOR SELECT
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update all plans"
  ON public.user_plans FOR UPDATE
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete all plans"
  ON public.user_plans FOR DELETE
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================================================
-- user_roles table - Fix auth.uid() call
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- Note: Other tables with has_role policies will need to be updated individually
-- if they are actively used. The has_role function is now optimized and STABLE.
-- Policies using has_role(auth.uid(), ...) should be updated to 
-- has_role((SELECT auth.uid()), ...) for optimal performance.
-- ============================================================================

