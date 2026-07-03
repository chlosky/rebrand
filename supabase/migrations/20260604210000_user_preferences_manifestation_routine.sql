ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS manifestation_intensity TEXT
    CHECK (manifestation_intensity IN ('light', 'consistent', 'locked_in')),
  ADD COLUMN IF NOT EXISTS manifest_routine_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_permission_status TEXT
    CHECK (notification_permission_status IN ('granted', 'denied', 'skipped'));

COMMENT ON COLUMN public.user_preferences.manifestation_intensity IS 'User-chosen manifestation routine intensity (light, consistent, locked_in).';
COMMENT ON COLUMN public.user_preferences.manifest_routine_items IS 'Default routine items generated from intensity and tool preferences.';
COMMENT ON COLUMN public.user_preferences.notification_permission_status IS 'Last OS notification permission outcome from onboarding or settings.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manifestation_intensity TEXT
    CHECK (manifestation_intensity IN ('light', 'consistent', 'locked_in')),
  ADD COLUMN IF NOT EXISTS manifest_routine_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_permission_status TEXT
    CHECK (notification_permission_status IN ('granted', 'denied', 'skipped')),
  ADD COLUMN IF NOT EXISTS app_notifications_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.manifestation_intensity IS 'Mirrors user_preferences.manifestation_intensity for profile-level reads.';
COMMENT ON COLUMN public.profiles.manifest_routine_items IS 'Mirrors user_preferences.manifest_routine_items for profile-level reads.';
COMMENT ON COLUMN public.profiles.notification_permission_status IS 'Mirrors user_preferences.notification_permission_status for profile-level reads.';
COMMENT ON COLUMN public.profiles.app_notifications_enabled IS 'Mirrors user_preferences.app_notifications_enabled for profile-level reads.';
