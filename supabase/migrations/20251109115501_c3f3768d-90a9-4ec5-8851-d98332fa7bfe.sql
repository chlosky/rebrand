-- Create chrono_entries table for timeline journaling
CREATE TABLE public.chrono_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  entry_text TEXT NOT NULL,
  photo_url TEXT,
  location_name TEXT,
  location_type TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  ai_best_timeline TEXT,
  ai_worst_timeline TEXT,
  ai_affirmation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chrono_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own entries
CREATE POLICY "Users can view their own chrono entries"
ON public.chrono_entries
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own entries
CREATE POLICY "Users can create their own chrono entries"
ON public.chrono_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update their own chrono entries"
ON public.chrono_entries
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete their own chrono entries"
ON public.chrono_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_chrono_entries_user_date ON public.chrono_entries(user_id, entry_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_chrono_entries_updated_at
BEFORE UPDATE ON public.chrono_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();