-- Mirror routine notification timezone on profiles (same as user_preferences).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT;

COMMENT ON COLUMN public.profiles.timezone IS
  'IANA timezone for routine notifications (e.g. America/Chicago). Mirrors user_preferences.timezone.';
