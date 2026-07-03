-- Fix RLS policies with complex subqueries by creating STABLE helper functions
-- and ensuring proper composite indexes for optimal performance

-- ============================================================================
-- Create composite indexes for organization_members table
-- These enable fast lookups in RLS policies
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user 
  ON public.organization_members(organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_user_role 
  ON public.organization_members(organization_id, user_id, role);

-- ============================================================================
-- Create STABLE helper functions for organization membership checks
-- These functions are marked STABLE so the query planner can optimize them
-- ============================================================================

-- Check if user is a member of an organization
CREATE OR REPLACE FUNCTION public.is_organization_member(_organization_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = _organization_id
      AND user_id = _user_id
  )
$$;

-- Check if user is an owner or admin of an organization
CREATE OR REPLACE FUNCTION public.is_organization_admin(_organization_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = _organization_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- ============================================================================
-- organizations table - Replace complex subqueries with helper functions
-- ============================================================================
DROP POLICY IF EXISTS "Organization members can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners and admins can update organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;

CREATE POLICY "Organization members can view their organization"
  ON public.organizations FOR SELECT
  USING (public.is_organization_member(organizations.id, (SELECT auth.uid())));

CREATE POLICY "Organization owners and admins can update organization"
  ON public.organizations FOR UPDATE
  USING (public.is_organization_admin(organizations.id, (SELECT auth.uid())));

CREATE POLICY "Admins can manage all organizations"
  ON public.organizations FOR ALL
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================================================
-- organization_members table - Replace complex subqueries with helper functions
-- ============================================================================
DROP POLICY IF EXISTS "Organization members can view other members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage all organization members" ON public.organization_members;

CREATE POLICY "Organization members can view other members"
  ON public.organization_members FOR SELECT
  USING (public.is_organization_member(organization_members.organization_id, (SELECT auth.uid())));

CREATE POLICY "Organization owners and admins can manage members"
  ON public.organization_members FOR ALL
  USING (public.is_organization_admin(organization_members.organization_id, (SELECT auth.uid())));

CREATE POLICY "Admins can manage all organization members"
  ON public.organization_members FOR ALL
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================================================
-- organization_presets table - Replace complex subqueries with helper functions
-- ============================================================================
DROP POLICY IF EXISTS "Organization members can view presets" ON public.organization_presets;
DROP POLICY IF EXISTS "Organization owners and admins can manage presets" ON public.organization_presets;
DROP POLICY IF EXISTS "Admins can manage all organization presets" ON public.organization_presets;

CREATE POLICY "Organization members can view presets"
  ON public.organization_presets FOR SELECT
  USING (public.is_organization_member(organization_presets.organization_id, (SELECT auth.uid())));

CREATE POLICY "Organization owners and admins can manage presets"
  ON public.organization_presets FOR ALL
  USING (public.is_organization_admin(organization_presets.organization_id, (SELECT auth.uid())));

CREATE POLICY "Admins can manage all organization presets"
  ON public.organization_presets FOR ALL
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));


























































