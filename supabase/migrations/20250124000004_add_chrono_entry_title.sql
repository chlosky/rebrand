-- Add title and has_wins columns to chrono_entries table

ALTER TABLE public.chrono_entries 
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE public.chrono_entries 
ADD COLUMN IF NOT EXISTS has_wins BOOLEAN;

-- Add comments for documentation
COMMENT ON COLUMN public.chrono_entries.title IS 'Title or name of the journal entry';
COMMENT ON COLUMN public.chrono_entries.has_wins IS 'Whether the user had wins on this day (Yes/No)';

