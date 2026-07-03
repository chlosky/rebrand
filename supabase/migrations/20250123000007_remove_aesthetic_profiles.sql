-- Remove aesthetic_profiles table and all related objects

-- ============================================================================
-- Drop table and related objects
-- ============================================================================

-- Drop trigger first
DROP TRIGGER IF EXISTS update_aesthetic_profiles_updated_at ON public.aesthetic_profiles;

-- Drop table (this will cascade and drop policies automatically)
DROP TABLE IF EXISTS public.aesthetic_profiles CASCADE;


























































