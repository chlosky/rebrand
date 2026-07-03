-- App shell during guided setup (ThemeContext: light | dark | blush | pale-blue).
-- This project also supports onboarding_session_setup / user_setup_path in some deployments;
-- your database only needs this column on onboarding_sessions.

ALTER TABLE public.onboarding_sessions
  ADD COLUMN IF NOT EXISTS shell_appearance TEXT;

COMMENT ON COLUMN public.onboarding_sessions.shell_appearance IS
  'App shell during onboarding: light | dark | blush | pale-blue (mirror ThemeContext).';

UPDATE public.onboarding_sessions
SET shell_appearance = onboarding_answers->>'setup_appearance'
WHERE shell_appearance IS NULL
  AND onboarding_answers IS NOT NULL
  AND onboarding_answers ? 'setup_appearance'
  AND (onboarding_answers->>'setup_appearance') IN ('light', 'dark', 'blush', 'pale-blue');
