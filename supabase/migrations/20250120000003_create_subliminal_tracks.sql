-- Create subliminal_tracks table for storing user-generated subliminal audio tracks
CREATE TABLE IF NOT EXISTS public.subliminal_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  binaural_beat TEXT NOT NULL,
  background_sound TEXT NOT NULL,
  affirmation_volume NUMERIC NOT NULL,
  background_volume NUMERIC NOT NULL,
  layers INTEGER NOT NULL,
  length INTEGER NOT NULL, -- in minutes
  audio_url TEXT NOT NULL, -- Supabase Storage URL
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subliminal_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subliminal tracks"
  ON public.subliminal_tracks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subliminal tracks"
  ON public.subliminal_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subliminal tracks"
  ON public.subliminal_tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subliminal tracks"
  ON public.subliminal_tracks FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_subliminal_tracks_user_id ON public.subliminal_tracks(user_id);
CREATE INDEX idx_subliminal_tracks_created_at ON public.subliminal_tracks(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_subliminal_tracks_updated_at
BEFORE UPDATE ON public.subliminal_tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

