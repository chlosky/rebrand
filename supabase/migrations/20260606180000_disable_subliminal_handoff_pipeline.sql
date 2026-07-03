-- Web subliminal fast-path handoff is retired; starter subliminals use post-paywall provisioning only.

DROP TRIGGER IF EXISTS on_user_plans_insert_subliminal_handoff ON public.user_plans;
DROP TRIGGER IF EXISTS on_user_plans_update_subliminal_handoff ON public.user_plans;
DROP TRIGGER IF EXISTS on_onboarding_sessions_subliminal_handoff ON public.onboarding_sessions;

CREATE OR REPLACE FUNCTION public.try_enqueue_subliminal_handoff_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_subliminal_handoff_if_ready(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_subliminal_handoff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_onboarding_session_subliminal_handoff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

DELETE FROM public.user_plan_subliminal_handoff_queue;
