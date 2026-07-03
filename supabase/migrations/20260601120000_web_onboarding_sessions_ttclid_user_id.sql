-- TikTok Events API: persist click id + link browser visit to auth user for server-side match.
ALTER TABLE public.web_onboarding_sessions
ADD COLUMN IF NOT EXISTS ttclid text,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS web_onboarding_sessions_user_id_created_at_idx
  ON public.web_onboarding_sessions (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.web_onboarding_sessions.ttclid IS
  'TikTok click id from ad landing URL (?ttclid=). Used for Events API attribution.';

COMMENT ON COLUMN public.web_onboarding_sessions.user_id IS
  'Auth user linked after web onboarding email signup (same tab client_visit_id).';

CREATE OR REPLACE FUNCTION public.link_web_onboarding_session_user(
  p_client_visit_id text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.web_onboarding_sessions
  SET user_id = p_user_id
  WHERE client_visit_id = p_client_visit_id
    AND user_id IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.link_web_onboarding_session_user(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_web_onboarding_session_user(text, uuid) TO anon, authenticated;
