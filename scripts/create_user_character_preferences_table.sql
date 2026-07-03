-- Create user_character_preferences table if it doesn't exist
-- Run this in Supabase SQL Editor if the table is missing

-- Create character enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.character_type AS ENUM ('river', 'sage', 'rose', 'oliver');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_character_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_character_preferences (
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

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_character_preferences_user ON public.user_character_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_character_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own character preferences" ON public.user_character_preferences;
DROP POLICY IF EXISTS "Users can update their own character preferences" ON public.user_character_preferences;
DROP POLICY IF EXISTS "Users can insert their own character preferences" ON public.user_character_preferences;

-- Create RLS Policies for user_character_preferences
CREATE POLICY "Users can view their own character preferences"
  ON public.user_character_preferences
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own character preferences"
  ON public.user_character_preferences
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own character preferences"
  ON public.user_character_preferences
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Function to update updated_at timestamp (create if doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_user_character_preferences_updated_at ON public.user_character_preferences;
CREATE TRIGGER update_user_character_preferences_updated_at
  BEFORE UPDATE ON public.user_character_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();





















































