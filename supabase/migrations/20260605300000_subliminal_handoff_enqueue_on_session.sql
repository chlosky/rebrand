-- Enqueue subliminal handoff when onboarding_sessions saves handoff data (not only user_plans flip).
-- Fixes race: user_plans active before handoff row exists, or handoff saved after paywall.

CREATE OR REPLACE FUNCTION public.try_enqueue_subliminal_handoff_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  handoff jsonb;
  vocal_path text;
  plan_active boolean;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_plans up
    WHERE up.user_id = p_user_id
      AND up.status = 'active'
      AND (up.current_period_end IS NULL OR up.current_period_end > now())
  )
  INTO plan_active;

  IF NOT plan_active THEN
    RETURN;
  END IF;

  SELECT os.onboarding_answers->'subliminal_fast_path_v1',
         os.onboarding_answers #>> '{subliminal_fast_path_v1,onboardingVocalStoragePath}'
    INTO handoff, vocal_path
  FROM public.onboarding_sessions os
  LEFT JOIN auth.users au ON au.id = p_user_id
  WHERE (
      os.user_id = p_user_id
      OR (au.email IS NOT NULL AND os.email IS NOT NULL AND lower(os.email) = lower(au.email))
    )
    AND os.onboarding_answers ? 'subliminal_fast_path_v1'
    AND COALESCE((os.onboarding_answers #>> '{subliminal_fast_path_v1,handoffPending}')::boolean, false) = true
  ORDER BY os.updated_at DESC NULLS LAST, os.created_at DESC
  LIMIT 1;

  IF handoff IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_plan_subliminal_handoff_queue (
    user_id,
    handoff_draft,
    onboarding_vocal_storage_path,
    process_after
  )
  VALUES (
    p_user_id,
    handoff,
    NULLIF(vocal_path, ''),
    now() + interval '1 minute'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET handoff_draft = EXCLUDED.handoff_draft,
      onboarding_vocal_storage_path = EXCLUDED.onboarding_vocal_storage_path,
      process_after = EXCLUDED.process_after,
      processed_at = NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_subliminal_handoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  PERFORM public.try_enqueue_subliminal_handoff_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_onboarding_session_subliminal_handoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_user_id uuid;
  handoff_pending boolean;
BEGIN
  IF NOT (NEW.onboarding_answers ? 'subliminal_fast_path_v1') THEN
    RETURN NEW;
  END IF;

  handoff_pending := COALESCE(
    (NEW.onboarding_answers #>> '{subliminal_fast_path_v1,handoffPending}')::boolean,
    false
  );

  IF NOT handoff_pending THEN
    RETURN NEW;
  END IF;

  resolved_user_id := NEW.user_id;

  IF resolved_user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT au.id
      INTO resolved_user_id
    FROM auth.users au
    WHERE lower(au.email) = lower(NEW.email)
    LIMIT 1;
  END IF;

  IF resolved_user_id IS NOT NULL THEN
    PERFORM public.try_enqueue_subliminal_handoff_for_user(resolved_user_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_onboarding_sessions_subliminal_handoff ON public.onboarding_sessions;

CREATE TRIGGER on_onboarding_sessions_subliminal_handoff
  AFTER INSERT OR UPDATE OF onboarding_answers, user_id, email ON public.onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_onboarding_session_subliminal_handoff();

CREATE OR REPLACE FUNCTION public.enqueue_subliminal_handoff_if_ready(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.try_enqueue_subliminal_handoff_for_user(p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_subliminal_handoff_if_ready(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_subliminal_handoff_if_ready(uuid) TO authenticated;
