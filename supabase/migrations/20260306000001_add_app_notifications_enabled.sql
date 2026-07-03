-- Add app_notifications_enabled column to user_preferences for push/app notification consent
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS app_notifications_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.user_preferences
  ALTER COLUMN app_notifications_enabled SET NOT NULL;

COMMENT ON COLUMN public.user_preferences.app_notifications_enabled IS 'User consent for in-app/push notifications (e.g. new tools, promotions, app news)';
