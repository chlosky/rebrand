-- Ensure title column exists in belief_refactor_entries table
-- This migration adds the column if it doesn't exist

-- Add title column if it doesn't exist
ALTER TABLE public.belief_refactor_entries 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Create index for title searches (optional, but helpful if users search by title)
CREATE INDEX IF NOT EXISTS idx_belief_refactor_entries_title 
ON public.belief_refactor_entries(title) 
WHERE title IS NOT NULL;










































