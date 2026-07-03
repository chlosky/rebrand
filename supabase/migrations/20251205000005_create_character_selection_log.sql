-- Create character_selection_log table to track all character selection changes over time
-- This logs every time a user selects or changes their Double character

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
-- Step 2: Create character_selection_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.character_selection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_character character_type NOT NULL,
  previous_character character_type, -- NULL for initial selection
  source TEXT, -- 'onboarding', 'signup', 'settings', 'your_double', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- Step 3: Create indexes for efficient queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_character_selection_log_user_id ON public.character_selection_log(user_id);
CREATE INDEX IF NOT EXISTS idx_character_selection_log_created_at ON public.character_selection_log(created_at);
CREATE INDEX IF NOT EXISTS idx_character_selection_log_user_created ON public.character_selection_log(user_id, created_at DESC);

-- ============================================================================
-- Step 4: Enable RLS
-- ============================================================================

ALTER TABLE public.character_selection_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 5: Create RLS policies
-- ============================================================================

-- Users can view their own character selection history
DROP POLICY IF EXISTS "Users can view their own character selection log" ON public.character_selection_log;
CREATE POLICY "Users can view their own character selection log"
  ON public.character_selection_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own character selection log entries
DROP POLICY IF EXISTS "Users can insert their own character selection log" ON public.character_selection_log;
CREATE POLICY "Users can insert their own character selection log"
  ON public.character_selection_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Step 6: Add comment for documentation
-- ============================================================================

COMMENT ON TABLE public.character_selection_log IS 'Logs all character selection changes over time, starting from initial onboarding/signup selection';
COMMENT ON COLUMN public.character_selection_log.previous_character IS 'The character that was selected before this change. NULL for initial selection.';
COMMENT ON COLUMN public.character_selection_log.source IS 'Where the selection was made: onboarding, signup, settings, your_double, etc.';













































