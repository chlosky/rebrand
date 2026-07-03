-- Fix security issue: update_updated_at function has mutable search_path
-- Setting search_path to a fixed value prevents SQL injection attacks
-- This fixes the function created in recent migrations that were missing this security setting

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
