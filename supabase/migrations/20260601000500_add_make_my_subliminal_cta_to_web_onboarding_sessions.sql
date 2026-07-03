ALTER TABLE public.web_onboarding_sessions
ADD COLUMN IF NOT EXISTS make_my_subliminal_cta_clicked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.web_onboarding_sessions.make_my_subliminal_cta_clicked IS
  'True when the user clicked the web welcome "Make my subliminal" CTA for this browser visit.';

CREATE OR REPLACE FUNCTION public.mark_web_onboarding_make_my_subliminal_cta_clicked(
  p_client_visit_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.web_onboarding_sessions
  SET make_my_subliminal_cta_clicked = true
  WHERE client_visit_id = p_client_visit_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_web_onboarding_make_my_subliminal_cta_clicked(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_web_onboarding_make_my_subliminal_cta_clicked(text) TO anon, authenticated;
