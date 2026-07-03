-- Fix security issue: Function with mutable search_path
-- Setting search_path prevents security exploits where malicious users
-- could create objects in their schema to intercept function calls

-- Drop and recreate with explicit search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate all triggers that use this function
-- (CASCADE drop removed them, so we need to recreate)

-- user_character_preferences trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_character_preferences'
  ) THEN
    DROP TRIGGER IF EXISTS update_user_character_preferences_updated_at ON public.user_character_preferences;
    CREATE TRIGGER update_user_character_preferences_updated_at
      BEFORE UPDATE ON public.user_character_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- character_messages trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'character_messages'
  ) THEN
    DROP TRIGGER IF EXISTS update_character_messages_updated_at ON public.character_messages;
    CREATE TRIGGER update_character_messages_updated_at
      BEFORE UPDATE ON public.character_messages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- user_message_limits trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_message_limits'
  ) THEN
    DROP TRIGGER IF EXISTS update_user_message_limits_updated_at ON public.user_message_limits;
    CREATE TRIGGER update_user_message_limits_updated_at
      BEFORE UPDATE ON public.user_message_limits
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Note: Function now has fixed search_path and is secure

