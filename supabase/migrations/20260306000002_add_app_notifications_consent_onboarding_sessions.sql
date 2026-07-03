-- Add app_notifications_consent to onboarding_sessions (synced to user_preferences.app_notifications_enabled on claim)
ALTER TABLE public.onboarding_sessions
  ADD COLUMN IF NOT EXISTS app_notifications_consent BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.onboarding_sessions.app_notifications_consent IS 'Optional consent for app/push notifications; synced to user_preferences.app_notifications_enabled when session is claimed';
