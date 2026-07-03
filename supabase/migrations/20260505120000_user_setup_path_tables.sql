-- Normalized storage for the guided setup path (not a single JSON blob on profiles).
-- Pre-auth: one row per onboarding_sessions (edge functions write).
-- Post-auth: one row per user (RLS; client + edge can upsert).

CREATE TABLE IF NOT EXISTS public.onboarding_session_setup (
  onboarding_session_id UUID PRIMARY KEY REFERENCES public.onboarding_sessions (id) ON DELETE CASCADE,
  first_name TEXT,
  email TEXT,
  desire_category TEXT,
  desire_text TEXT,
  why_it_matters TEXT,
  current_friction TEXT,
  desired_identity TEXT,
  tool_preferences TEXT[] NOT NULL DEFAULT '{}',
  conditional_specificity JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_session_setup_updated
  ON public.onboarding_session_setup (updated_at DESC);

DROP TRIGGER IF EXISTS trg_onboarding_session_setup_updated ON public.onboarding_session_setup;
CREATE TRIGGER trg_onboarding_session_setup_updated
  BEFORE UPDATE ON public.onboarding_session_setup
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.onboarding_session_setup ENABLE ROW LEVEL SECURITY;

-- No direct client access; service role (edge functions) only
CREATE POLICY "Service role full access onboarding_session_setup"
  ON public.onboarding_session_setup
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.onboarding_session_setup IS 'Setup path answers keyed by anonymous onboarding session (written via Edge Functions).';

CREATE TABLE IF NOT EXISTS public.user_setup_path (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name TEXT,
  email TEXT,
  desire_category TEXT,
  desire_text TEXT,
  why_it_matters TEXT,
  current_friction TEXT,
  desired_identity TEXT,
  tool_preferences TEXT[] NOT NULL DEFAULT '{}',
  conditional_specificity JSONB NOT NULL DEFAULT '{}'::jsonb,
  post_paywall_provisioned_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_setup_path_updated
  ON public.user_setup_path (updated_at DESC);

DROP TRIGGER IF EXISTS trg_user_setup_path_updated ON public.user_setup_path;
CREATE TRIGGER trg_user_setup_path_updated
  BEFORE UPDATE ON public.user_setup_path
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.user_setup_path ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own setup path"
  ON public.user_setup_path FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users insert own setup path"
  ON public.user_setup_path FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users update own setup path"
  ON public.user_setup_path FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.user_setup_path IS 'Setup path answers for logged-in users; personalization and provisioning flags.';
COMMENT ON COLUMN public.user_setup_path.post_paywall_provisioned_at IS 'When idempotent post-paywall provisioning completed.';
