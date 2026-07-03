-- Daily routine push alert times (HH:mm, 24h), aligned with manifestation_intensity slot count.

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS routine_notification_times JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_preferences.routine_notification_times IS
  'Daily routine notification times as JSON array of "HH:mm" strings (1 light, 2 consistent, 3 locked_in).';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS routine_notification_times JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.routine_notification_times IS
  'Mirrors user_preferences.routine_notification_times for profile-level reads.';
