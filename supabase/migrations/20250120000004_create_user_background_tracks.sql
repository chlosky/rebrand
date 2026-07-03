-- Create user_background_tracks table for storing user-created music tracks
-- These tracks can be used as background sounds in subliminal audio
CREATE TABLE IF NOT EXISTS public.user_background_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL, -- Supabase Storage URL
  file_size_mb NUMERIC,
  duration_seconds NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_track_name UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.user_background_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own background tracks"
  ON public.user_background_tracks FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own background tracks"
  ON public.user_background_tracks FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own background tracks"
  ON public.user_background_tracks FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own background tracks"
  ON public.user_background_tracks FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_background_tracks_user_id ON public.user_background_tracks(user_id);
CREATE INDEX idx_user_background_tracks_created_at ON public.user_background_tracks(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_user_background_tracks_updated_at
BEFORE UPDATE ON public.user_background_tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

