-- Create user_affirmation_sets table for storing user-created affirmation sets
CREATE TABLE IF NOT EXISTS public.user_affirmation_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  affirmations JSONB NOT NULL, -- Array of affirmation strings
  images JSONB, -- Array of image objects with id, url, prompt
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_affirmation_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own affirmation sets"
  ON public.user_affirmation_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affirmation sets"
  ON public.user_affirmation_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affirmation sets"
  ON public.user_affirmation_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affirmation sets"
  ON public.user_affirmation_sets FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_affirmation_sets_user_id ON public.user_affirmation_sets(user_id);
CREATE INDEX idx_user_affirmation_sets_created_at ON public.user_affirmation_sets(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_user_affirmation_sets_updated_at
BEFORE UPDATE ON public.user_affirmation_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create belief_refactor_entries table for storing belief refactor analyses
CREATE TABLE IF NOT EXISTS public.belief_refactor_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belief TEXT NOT NULL,
  analysis JSONB NOT NULL, -- Full BeliefAnalysis object
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.belief_refactor_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own belief refactor entries"
  ON public.belief_refactor_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own belief refactor entries"
  ON public.belief_refactor_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own belief refactor entries"
  ON public.belief_refactor_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own belief refactor entries"
  ON public.belief_refactor_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_belief_refactor_entries_user_id ON public.belief_refactor_entries(user_id);
CREATE INDEX idx_belief_refactor_entries_created_at ON public.belief_refactor_entries(created_at DESC);



























































