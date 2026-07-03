-- Add data_training_opt_in column to user_preferences if missing
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS data_training_opt_in BOOLEAN DEFAULT false;

-- Ensure the column is not nullable to keep defaults consistent
ALTER TABLE public.user_preferences
  ALTER COLUMN data_training_opt_in SET NOT NULL;

-- Keep existing RLS policies (they already scope by auth.uid() on user_id)

