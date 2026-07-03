-- Ensure user_preferences table exists with all required columns and policies
-- This migration is idempotent and safe to run multiple times

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
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_character character_type,
  email_reminders BOOLEAN DEFAULT false,
  texts_enabled BOOLEAN DEFAULT true,
  preferred_send_window TEXT CHECK (preferred_send_window IN ('morning', 'evening', 'both')) DEFAULT 'both',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

-- ============================================================================
-- Step 3: Add missing columns if they don't exist
-- ============================================================================

DO $$
BEGIN
  -- Add selected_character if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'selected_character'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN selected_character character_type;
  END IF;

  -- Add email_reminders if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'email_reminders'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN email_reminders BOOLEAN DEFAULT false;
  END IF;

  -- Add texts_enabled if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'texts_enabled'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN texts_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Add preferred_send_window if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'preferred_send_window'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN preferred_send_window TEXT CHECK (preferred_send_window IN ('morning', 'evening', 'both')) DEFAULT 'both';
  END IF;

  -- Add timezone if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
  END IF;

  -- Add phone_number if it doesn't exist (from profiles)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN phone_number TEXT;
  END IF;

  -- Add phone if it doesn't exist (from profiles, alternative to phone_number)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN phone TEXT;
  END IF;

  -- Add preset_theme if it doesn't exist (from profiles)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'preset_theme'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN preset_theme TEXT;
  END IF;

  -- Add avatar_url if it doesn't exist (from profiles)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add first_name if it doesn't exist (from profiles)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN first_name TEXT;
  END IF;

  -- Add last_name if it doesn't exist (from profiles)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences' 
    AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD COLUMN last_name TEXT;
  END IF;
END $$;

-- ============================================================================
-- Step 4: Ensure unique constraint on user_id
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_preferences_user_id_key'
  ) THEN
    ALTER TABLE public.user_preferences 
      ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- ============================================================================
-- Step 5: Enable RLS
-- ============================================================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 6: Create RLS policies (drop and recreate to ensure they're correct)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can create their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- Step 7: Create index if it doesn't exist
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- ============================================================================
-- Step 8: Create trigger for updated_at if it doesn't exist
-- ============================================================================

-- First, ensure the update_updated_at function exists
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- Step 9: (Columns already added in Step 3 above - this step removed to avoid duplication)
-- ============================================================================

-- ============================================================================
-- Step 10: Migrate data from profiles table to user_preferences (if profiles exists)
-- ============================================================================

DO $$
BEGIN
  -- Check if profiles table exists and has relevant columns
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Migrate selected_character from profiles if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'selected_character'
    ) THEN
      -- Update existing user_preferences records with data from profiles
      UPDATE public.user_preferences up
      SET 
        selected_character = CASE 
          WHEN p.selected_character IS NOT NULL THEN 
            CASE 
              WHEN LOWER(p.selected_character::text) = 'river' THEN 'river'::character_type
              WHEN LOWER(p.selected_character::text) = 'sage' THEN 'sage'::character_type
              WHEN LOWER(p.selected_character::text) = 'rose' THEN 'rose'::character_type
              WHEN LOWER(p.selected_character::text) = 'oliver' THEN 'oliver'::character_type
              ELSE up.selected_character
            END
          ELSE up.selected_character
        END,
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.selected_character IS NOT NULL
      AND (
        up.selected_character IS NULL 
        OR up.selected_character != CASE 
          WHEN LOWER(p.selected_character::text) = 'river' THEN 'river'::character_type
          WHEN LOWER(p.selected_character::text) = 'sage' THEN 'sage'::character_type
          WHEN LOWER(p.selected_character::text) = 'rose' THEN 'rose'::character_type
          WHEN LOWER(p.selected_character::text) = 'oliver' THEN 'oliver'::character_type
          ELSE up.selected_character
        END
      );

      -- Insert new user_preferences records for profiles that don't have one yet
      INSERT INTO public.user_preferences (
        user_id,
        selected_character,
        email_reminders,
        texts_enabled,
        preferred_send_window,
        timezone,
        phone_number,
        phone,
        preset_theme,
        avatar_url,
        first_name,
        last_name,
        created_at,
        updated_at
      )
      SELECT 
        p.id,
        CASE 
          WHEN LOWER(p.selected_character::text) = 'river' THEN 'river'::character_type
          WHEN LOWER(p.selected_character::text) = 'sage' THEN 'sage'::character_type
          WHEN LOWER(p.selected_character::text) = 'rose' THEN 'rose'::character_type
          WHEN LOWER(p.selected_character::text) = 'oliver' THEN 'oliver'::character_type
          ELSE NULL
        END,
        COALESCE(p.email_reminders, false),
        COALESCE(p.texts_enabled, true),
        COALESCE(p.preferred_send_window, 'both'),
        COALESCE(p.timezone, 'America/New_York'),
        p.phone_number,
        p.phone,
        p.preset_theme,
        p.avatar_url,
        p.first_name,
        p.last_name,
        COALESCE(p.created_at, now()),
        COALESCE(p.updated_at, p.created_at, now())
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
        phone_number = COALESCE(EXCLUDED.phone_number, user_preferences.phone_number),
        phone = COALESCE(EXCLUDED.phone, user_preferences.phone),
        preset_theme = COALESCE(EXCLUDED.preset_theme, user_preferences.preset_theme),
        avatar_url = COALESCE(EXCLUDED.avatar_url, user_preferences.avatar_url),
        first_name = COALESCE(EXCLUDED.first_name, user_preferences.first_name),
        last_name = COALESCE(EXCLUDED.last_name, user_preferences.last_name),
        updated_at = GREATEST(user_preferences.updated_at, EXCLUDED.updated_at);
    END IF;

    -- Migrate email_reminders from profiles if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'email_reminders'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        email_reminders = COALESCE(p.email_reminders, up.email_reminders),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.email_reminders IS NOT NULL
      AND up.email_reminders IS NULL;
    END IF;

    -- Migrate texts_enabled from profiles if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'texts_enabled'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        texts_enabled = COALESCE(p.texts_enabled, up.texts_enabled),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.texts_enabled IS NOT NULL
      AND up.texts_enabled IS NULL;
    END IF;

    -- Migrate preferred_send_window from profiles if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'preferred_send_window'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        preferred_send_window = COALESCE(p.preferred_send_window, up.preferred_send_window),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.preferred_send_window IS NOT NULL
      AND up.preferred_send_window IS NULL;
    END IF;

    -- Migrate timezone from profiles if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'timezone'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        timezone = COALESCE(p.timezone, up.timezone),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.timezone IS NOT NULL
      AND up.timezone IS NULL;
    END IF;

    -- Migrate any other preference-related columns that were added in Step 9
    -- This handles phone_number, phone, preset_theme, avatar_url, first_name, last_name, etc.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_preferences' 
      AND column_name = 'phone_number'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'phone_number'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        phone_number = COALESCE(p.phone_number, up.phone_number),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.phone_number IS NOT NULL
      AND (up.phone_number IS NULL OR up.phone_number = '');
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_preferences' 
      AND column_name = 'phone'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'phone'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        phone = COALESCE(p.phone, up.phone),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.phone IS NOT NULL
      AND (up.phone IS NULL OR up.phone = '');
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_preferences' 
      AND column_name = 'preset_theme'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'preset_theme'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        preset_theme = COALESCE(p.preset_theme, up.preset_theme),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.preset_theme IS NOT NULL
      AND up.preset_theme IS NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_preferences' 
      AND column_name = 'avatar_url'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'avatar_url'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        avatar_url = COALESCE(p.avatar_url, up.avatar_url),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.avatar_url IS NOT NULL
      AND up.avatar_url IS NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_preferences' 
      AND column_name = 'first_name'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'first_name'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        first_name = COALESCE(p.first_name, up.first_name),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.first_name IS NOT NULL
      AND up.first_name IS NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_preferences' 
      AND column_name = 'last_name'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'last_name'
    ) THEN
      UPDATE public.user_preferences up
      SET 
        last_name = COALESCE(p.last_name, up.last_name),
        updated_at = GREATEST(up.updated_at, COALESCE(p.updated_at, p.created_at, now()))
      FROM public.profiles p
      WHERE up.user_id = p.id
      AND p.last_name IS NOT NULL
      AND up.last_name IS NULL;
    END IF;
  END IF;
END $$;

