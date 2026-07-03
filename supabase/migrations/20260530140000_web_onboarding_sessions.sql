-- Web onboarding funnel tracking (separate from payment-first onboarding_sessions).
-- One row per browser visit when the user starts /onboarding/welcome on web.
-- Does not participate in checkout, resume tokens, or account claim flows.

CREATE TABLE IF NOT EXISTS public.web_onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  /** Stable id in sessionStorage — dedupes remounts within the same tab session. */
  client_visit_id text NOT NULL,
  entry_path text NOT NULL DEFAULT '/onboarding/welcome',
  page_path text,
  referrer text,
  is_mobile_viewport boolean,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  is_paid boolean,
  from_tiktok boolean,
  user_agent text
);

CREATE UNIQUE INDEX IF NOT EXISTS web_onboarding_sessions_client_visit_id_idx
  ON public.web_onboarding_sessions (client_visit_id);

CREATE INDEX IF NOT EXISTS web_onboarding_sessions_created_at_idx
  ON public.web_onboarding_sessions (created_at DESC);

ALTER TABLE public.web_onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous web onboarding session inserts"
  ON public.web_onboarding_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.web_onboarding_sessions IS
  'Analytics: web-only onboarding starts at /onboarding/welcome. Independent of onboarding_sessions payment-first flow.';
