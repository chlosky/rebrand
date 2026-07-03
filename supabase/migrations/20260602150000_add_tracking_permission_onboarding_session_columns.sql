-- Store iOS ATT pre-permission metadata separately from onboarding_answers JSON.
ALTER TABLE public.onboarding_sessions
  ADD COLUMN IF NOT EXISTS tracking_pre_permission_choice TEXT,
  ADD COLUMN IF NOT EXISTS tracking_authorization_status TEXT,
  ADD COLUMN IF NOT EXISTS tracking_permission_asked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.onboarding_sessions.tracking_pre_permission_choice IS 'User response to the in-app ATT pre-permission prompt: yes or no.';
COMMENT ON COLUMN public.onboarding_sessions.tracking_authorization_status IS 'Apple ATT authorization status returned by iOS, or notRequested when pre-permission was declined.';
COMMENT ON COLUMN public.onboarding_sessions.tracking_permission_asked_at IS 'Timestamp when the ATT pre-permission choice was made.';
