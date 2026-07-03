-- Queue web subliminal handoff mix when user_plans becomes active (INSERT or status UPDATE).
-- Source of truth is public.onboarding_sessions.onboarding_answers->'subliminal_fast_path_v1'.
-- No user_setup_path dependency and no RevenueCat sync hook. Cron drains queue.

CREATE TABLE IF NOT EXISTS public.user_plan_subliminal_handoff_queue (
  user_id uuid PRIMARY KEY REFERENCES public.user_plans(user_id) ON DELETE CASCADE,
  handoff_draft jsonb NOT NULL,
  onboarding_vocal_storage_path text,
  process_after timestamptz NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_plan_subliminal_handoff_queue IS
  'Web subliminal builder handoff mix after user_plans is active; sourced from onboarding_sessions and drained by process-user-plan-subliminal-handoff.';

ALTER TABLE public.user_plan_subliminal_handoff_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_plan_subliminal_handoff_queue FROM anon, authenticated;
GRANT ALL ON public.user_plan_subliminal_handoff_queue TO service_role;

DROP TRIGGER IF EXISTS trg_user_plan_subliminal_handoff_queue_updated ON public.user_plan_subliminal_handoff_queue;
CREATE TRIGGER trg_user_plan_subliminal_handoff_queue_updated
  BEFORE UPDATE ON public.user_plan_subliminal_handoff_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_subliminal_handoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  handoff jsonb;
  vocal_path text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  SELECT os.onboarding_answers->'subliminal_fast_path_v1',
         os.onboarding_answers #>> '{subliminal_fast_path_v1,onboardingVocalStoragePath}'
    INTO handoff, vocal_path
  FROM public.onboarding_sessions os
  LEFT JOIN auth.users au ON au.id = NEW.user_id
  WHERE (
      os.user_id = NEW.user_id
      OR (au.email IS NOT NULL AND lower(os.email) = lower(au.email))
    )
    AND os.onboarding_answers ? 'subliminal_fast_path_v1'
    AND COALESCE((os.onboarding_answers #>> '{subliminal_fast_path_v1,handoffPending}')::boolean, false) = true
  ORDER BY os.updated_at DESC NULLS LAST, os.created_at DESC
  LIMIT 1;

  IF handoff IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_plan_subliminal_handoff_queue (
    user_id,
    handoff_draft,
    onboarding_vocal_storage_path,
    process_after
  )
  VALUES (
    NEW.user_id,
    handoff,
    NULLIF(vocal_path, ''),
    now() + interval '1 minute'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET handoff_draft = EXCLUDED.handoff_draft,
      onboarding_vocal_storage_path = EXCLUDED.onboarding_vocal_storage_path,
      process_after = EXCLUDED.process_after,
      processed_at = NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_plans_insert_subliminal_handoff ON public.user_plans;
DROP TRIGGER IF EXISTS on_user_plans_update_subliminal_handoff ON public.user_plans;

CREATE TRIGGER on_user_plans_insert_subliminal_handoff
  AFTER INSERT ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_user_plan_subliminal_handoff();

CREATE TRIGGER on_user_plans_update_subliminal_handoff
  AFTER UPDATE OF status ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_user_plan_subliminal_handoff();
