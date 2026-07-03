-- Fix search_path for existing update_story_updated_at function
CREATE OR REPLACE FUNCTION public.update_story_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;