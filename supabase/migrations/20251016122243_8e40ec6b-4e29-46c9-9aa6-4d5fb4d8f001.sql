-- Add preset_theme column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preset_theme TEXT DEFAULT 'command' CHECK (preset_theme IN ('command', 'glow', 'volt', 'ground'));