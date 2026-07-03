-- User-adjustable binaural layer level (0–1 scales proprietary binaural gain)
ALTER TABLE public.subliminal_tracks
ADD COLUMN IF NOT EXISTS binaural_volume NUMERIC NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.subliminal_tracks.binaural_volume IS 'Relative binaural layer volume 0–1; 1 preserves prior mix level.';
