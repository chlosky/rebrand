-- Default binaural layer volume 10% for new rows when not specified (matches app UI default).
ALTER TABLE public.subliminal_tracks
  ALTER COLUMN binaural_volume SET DEFAULT 0.1;

COMMENT ON COLUMN public.subliminal_tracks.binaural_volume IS 'Relative binaural layer volume 0–1; default 0.1 (10%).';
