-- Consolidate user_preferences and user_character_preferences into a single table
-- This migration merges all user preferences into user_preferences and drops user_character_preferences

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
-- Step 2: Add SMS-related columns to user_preferences if they don't exist
-- ============================================================================

ALTER TABLE public.user_preferences 
  ADD COLUMN IF NOT EXISTS texts_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_send_window TEXT CHECK (preferred_send_window IN ('morning', 'evening', 'both')) DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- ============================================================================
-- Step 3: Migrate selected_character from user_character_preferences to user_preferences
-- Update user_preferences with data from user_character_preferences
-- ============================================================================

-- First, update existing user_preferences records with data from user_character_preferences
UPDATE public.user_preferences up
SET 
  selected_character = CASE 
    WHEN ucp.selected_character::text IS NOT NULL THEN ucp.selected_character::text
    ELSE up.selected_character
  END,
  texts_enabled = COALESCE(ucp.texts_enabled, up.texts_enabled, true),
  preferred_send_window = COALESCE(ucp.preferred_send_window, up.preferred_send_window, 'both'),
  timezone = COALESCE(ucp.timezone, up.timezone, 'America/New_York'),
  updated_at = GREATEST(up.updated_at, ucp.updated_at)
FROM public.user_character_preferences ucp
WHERE up.user_id = ucp.user_id;

-- ============================================================================
-- Step 4: Insert any user_character_preferences records that don't exist in user_preferences
-- ============================================================================

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
  ucp.user_id,
  ucp.selected_character::text,
  false, -- Default email_reminders
  ucp.texts_enabled,
  ucp.preferred_send_window,
  ucp.timezone,
  ucp.created_at,
  ucp.updated_at
FROM public.user_character_preferences ucp
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_preferences up WHERE up.user_id = ucp.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- Step 5: Convert selected_character from TEXT to character_type ENUM
-- ============================================================================

-- First, add a new column with the ENUM type
ALTER TABLE public.user_preferences 
  ADD COLUMN IF NOT EXISTS selected_character_enum character_type;

-- Update the new column with converted values
UPDATE public.user_preferences
SET selected_character_enum = CASE 
  WHEN LOWER(selected_character) = 'river' THEN 'river'::character_type
  WHEN LOWER(selected_character) = 'sage' THEN 'sage'::character_type
  WHEN LOWER(selected_character) = 'rose' THEN 'rose'::character_type
  WHEN LOWER(selected_character) = 'oliver' THEN 'oliver'::character_type
  ELSE 'river'::character_type -- Default fallback
END
WHERE selected_character IS NOT NULL;

-- Drop the old TEXT column
ALTER TABLE public.user_preferences 
  DROP COLUMN IF EXISTS selected_character;

-- Rename the new column to selected_character
ALTER TABLE public.user_preferences 
  RENAME COLUMN selected_character_enum TO selected_character;

-- ============================================================================
-- Step 6: Drop user_character_preferences table and related objects
-- ============================================================================

-- Drop indexes first
DROP INDEX IF EXISTS public.idx_user_character_preferences_user;

-- Drop triggers
DROP TRIGGER IF EXISTS update_user_character_preferences_updated_at ON public.user_character_preferences;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view their own character preferences" ON public.user_character_preferences;
DROP POLICY IF EXISTS "Users can update their own character preferences" ON public.user_character_preferences;
DROP POLICY IF EXISTS "Users can insert their own character preferences" ON public.user_character_preferences;
DROP POLICY IF EXISTS "Users can delete their own character preferences" ON public.user_character_preferences;

-- Drop the table
DROP TABLE IF EXISTS public.user_character_preferences CASCADE;

-- ============================================================================
-- Step 7: Ensure user_preferences has proper constraints and indexes
-- ============================================================================

-- Ensure user_id is unique (should already be, but make sure)
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

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- ============================================================================
-- Verification Query (run this after migration to check results)
-- ============================================================================

-- SELECT 
--   user_id,
--   selected_character,
--   email_reminders,
--   texts_enabled,
--   preferred_send_window,
--   timezone
-- FROM public.user_preferences
-- ORDER BY updated_at DESC
-- LIMIT 10;



















































