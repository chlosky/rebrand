-- Restore user_preferences table and migrate data from profiles back to user_preferences
-- This brings user_preferences back to life since profiles is messed up
-- user_plans remains separate (subscription/billing data)

-- ============================================================================
-- Step 1: Ensure character_type enum exists
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'character_type') THEN
    CREATE TYPE public.character_type AS ENUM ('river', 'sage', 'rose', 'oliver');
  END IF;
END $$;

-- ============================================================================
-- Step 2: Create user_preferences table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  selected_character character_type,
  email_reminders BOOLEAN DEFAULT false,
  texts_enabled BOOLEAN DEFAULT true,
  preferred_send_window TEXT CHECK (preferred_send_window IN ('morning', 'evening', 'both')) DEFAULT 'both',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 3: Create RLS policies on user_preferences (if they don't exist)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_preferences' 
    AND policyname = 'Users can view their own preferences'
  ) THEN
    CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_preferences' 
    AND policyname = 'Users can create their own preferences'
  ) THEN
    CREATE POLICY "Users can create their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_preferences' 
    AND policyname = 'Users can update their own preferences'
  ) THEN
    CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- Step 4: Create index on user_preferences
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- ============================================================================
-- Step 5: Create trigger for updated_at on user_preferences
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- Step 6: Migrate data from profiles to user_preferences (if profiles exists)
-- ============================================================================

-- Update existing user_preferences with data from profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Check if profiles has the preference columns
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
      AND column_name = 'selected_character'
    ) THEN
      -- Update existing user_preferences records with data from profiles
      UPDATE public.user_preferences up
      SET 
        selected_character = COALESCE(p.selected_character::character_type, up.selected_character),
        email_reminders = COALESCE(p.email_reminders, up.email_reminders, false),
        texts_enabled = COALESCE(p.texts_enabled, up.texts_enabled, true),
        preferred_send_window = COALESCE(p.preferred_send_window, up.preferred_send_window, 'both'),
        timezone = COALESCE(p.timezone, up.timezone, 'America/New_York'),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, now()))
      FROM public.profiles p
      WHERE p.id = up.user_id;
    END IF;
  END IF;
END $$;

-- Insert any profiles records that don't have a user_preferences record yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Check if profiles has the preference columns
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
      AND column_name = 'selected_character'
    ) THEN
      INSERT INTO public.user_preferences (
        user_id,
        selected_character,
        email_reminders,
        texts_enabled,
        preferred_send_window,
        timezone,
        created_at,
        updated_at
      )
      SELECT 
        p.id,
        p.selected_character::character_type,
        COALESCE(p.email_reminders, false),
        COALESCE(p.texts_enabled, true),
        COALESCE(p.preferred_send_window, 'both'),
        COALESCE(p.timezone, 'America/New_York'),
        COALESCE(p.created_at, now()),
        COALESCE(p.updated_at, now())
      FROM public.profiles p
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_preferences up WHERE up.user_id = p.id
      )
      AND p.id IS NOT NULL
      ON CONFLICT (user_id) DO UPDATE SET
        selected_character = COALESCE(EXCLUDED.selected_character, user_preferences.selected_character),
        email_reminders = COALESCE(EXCLUDED.email_reminders, user_preferences.email_reminders),
        texts_enabled = COALESCE(EXCLUDED.texts_enabled, user_preferences.texts_enabled),
        preferred_send_window = COALESCE(EXCLUDED.preferred_send_window, user_preferences.preferred_send_window),
        timezone = COALESCE(EXCLUDED.timezone, user_preferences.timezone),
        updated_at = GREATEST(user_preferences.updated_at, EXCLUDED.updated_at);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Verification Query (run this after migration to check results)
-- ============================================================================

-- SELECT 
--   up.user_id,
--   up.selected_character,
--   up.email_reminders,
--   up.texts_enabled,
--   up.preferred_send_window,
--   up.timezone
-- FROM public.user_preferences up
-- ORDER BY up.updated_at DESC
-- LIMIT 10;
