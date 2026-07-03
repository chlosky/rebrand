-- Fix security issues: Functions with mutable search_path
-- Setting search_path to a fixed value prevents SQL injection attacks
-- See: https://supabase.com/docs/guides/database/postgres/security#search_path

-- ============================================================================
-- Fix update_updated_at_column function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Fix update_pricing_display_updated_at function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_pricing_display_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Fix update_updated_at function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;









































