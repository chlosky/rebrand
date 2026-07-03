-- Retired web subliminal fast-path handoff worker and queue.

DROP TRIGGER IF EXISTS on_user_plans_insert_subliminal_handoff ON public.user_plans;
DROP TRIGGER IF EXISTS on_user_plans_update_subliminal_handoff ON public.user_plans;
DROP TRIGGER IF EXISTS on_onboarding_sessions_subliminal_handoff ON public.onboarding_sessions;
DROP TRIGGER IF EXISTS trg_user_plan_subliminal_handoff_queue_updated ON public.user_plan_subliminal_handoff_queue;

DROP FUNCTION IF EXISTS public.enqueue_onboarding_session_subliminal_handoff();
DROP FUNCTION IF EXISTS public.enqueue_user_plan_subliminal_handoff();
DROP FUNCTION IF EXISTS public.try_enqueue_subliminal_handoff_for_user(uuid);
DROP FUNCTION IF EXISTS public.enqueue_subliminal_handoff_if_ready(uuid);

DROP TABLE IF EXISTS public.user_plan_subliminal_handoff_queue;
