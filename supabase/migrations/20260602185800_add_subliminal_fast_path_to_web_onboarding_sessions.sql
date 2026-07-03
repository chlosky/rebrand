ALTER TABLE public.web_onboarding_sessions
ADD COLUMN IF NOT EXISTS subliminal_fast_path jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.web_onboarding_sessions.subliminal_fast_path IS
  'Web subliminal fast-path reporting payload: manifestation topic, generated affirmations, audio/settings metadata, and completion timestamps.';

CREATE OR REPLACE FUNCTION public.upsert_web_onboarding_subliminal_fast_path(
  p_client_visit_id text,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.web_onboarding_sessions (
    client_visit_id,
    entry_path,
    subliminal_fast_path
  )
  VALUES (
    p_client_visit_id,
    '/onboarding/subliminal/welcome',
    COALESCE(p_payload, '{}'::jsonb)
  )
  ON CONFLICT (client_visit_id) DO UPDATE
  SET subliminal_fast_path =
    COALESCE(public.web_onboarding_sessions.subliminal_fast_path, '{}'::jsonb)
    || COALESCE(EXCLUDED.subliminal_fast_path, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_web_onboarding_subliminal_fast_path(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_web_onboarding_subliminal_fast_path(text, jsonb) TO anon, authenticated;
