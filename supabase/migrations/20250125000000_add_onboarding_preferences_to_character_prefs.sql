-- Ensure character_type enum exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'character_type') THEN
    CREATE TYPE public.character_type AS ENUM ('river', 'sage', 'rose', 'oliver');
  END IF;
END $$;

-- Ensure user_character_preferences table exists (for character selection and SMS settings only)
-- This table should NOT contain onboarding form answers - those go in profiles.onboarding_answers
DO $$ 
BEGIN
  -- Create table if it doesn't exist (in case migration 20250120000000 wasn't run)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_character_preferences') THEN
    CREATE TABLE public.user_character_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      selected_character character_type NOT NULL,
      texts_enabled BOOLEAN NOT NULL DEFAULT true,
      preferred_send_window TEXT CHECK (preferred_send_window IN ('morning', 'evening', 'both')) DEFAULT 'both',
      timezone TEXT DEFAULT 'America/New_York',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE(user_id)
    );

    -- Enable RLS
    ALTER TABLE public.user_character_preferences ENABLE ROW LEVEL SECURITY;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_user_character_preferences_user ON public.user_character_preferences(user_id);
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_character_preferences_user ON public.user_character_preferences(user_id);

