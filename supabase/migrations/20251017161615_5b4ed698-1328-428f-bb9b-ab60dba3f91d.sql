-- Drop trigger first, then function, then recreate with proper search path
DROP TRIGGER IF EXISTS update_org_seats_count ON public.organization_members;
DROP FUNCTION IF EXISTS public.update_organization_seats_used() CASCADE;

-- Recreate function with proper search path
CREATE OR REPLACE FUNCTION public.update_organization_seats_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.organizations
    SET seats_used = seats_used + 1
    WHERE id = NEW.organization_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.organizations
    SET seats_used = GREATEST(0, seats_used - 1)
    WHERE id = OLD.organization_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_org_seats_count
  AFTER INSERT OR DELETE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_seats_used();