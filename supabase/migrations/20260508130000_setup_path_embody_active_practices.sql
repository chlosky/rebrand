-- Embody slugs on the post-auth setup row only.
--
-- Anonymous onboarding path (desire, conditional, friction, embody, etc.) is persisted by
-- `update-onboarding-session` into `public.onboarding_sessions.onboarding_answers` as
-- `setup_path_v1` and merged `setup_journey_v1` — not a separate `onboarding_session_setup` table.

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_setup_path'
  ) THEN
    ALTER TABLE public.user_setup_path
      ADD COLUMN IF NOT EXISTS embody_active_practices text[];

    COMMENT ON COLUMN public.user_setup_path.embody_active_practices IS
      'Five embody catalog slugs; mirrors user_preferences.embody_active_practices.';
  END IF;
END
$migration$;
