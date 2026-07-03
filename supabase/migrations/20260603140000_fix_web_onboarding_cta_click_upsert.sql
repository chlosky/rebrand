-- CTA click mark must upsert: welcome insert can fail (migration drift, rate limit, race)
-- or finish after the click; plain UPDATE matched 0 rows and failed silently.

CREATE OR REPLACE FUNCTION public.mark_web_onboarding_make_my_subliminal_cta_clicked(
  p_client_visit_id text
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
    make_my_subliminal_cta_clicked
  )
  VALUES (
    p_client_visit_id,
    '/onboarding/welcome',
    true
  )
  ON CONFLICT (client_visit_id) DO UPDATE
  SET make_my_subliminal_cta_clicked = true;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_web_onboarding_make_my_subliminal_cta_clicked(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_web_onboarding_make_my_subliminal_cta_clicked(text) TO anon, authenticated;
