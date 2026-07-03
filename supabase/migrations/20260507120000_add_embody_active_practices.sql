-- Five Embody / microgoal columns chosen by user (subset of ten canonical practices).
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS embody_active_practices text[];

COMMENT ON COLUMN public.user_preferences.embody_active_practices IS 'Exactly five keys from embody catalog (clean, drink-water, exercise, self-care, rest, have-fun, glam-up, connect, seen, work); drives Embody UI and daily progress grid.';
