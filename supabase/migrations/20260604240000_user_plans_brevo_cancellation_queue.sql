-- Queue Brevo cancellation list sync 1 minute after user_plans.status changes to canceled (UPDATE only).
-- Server-only: DB trigger + cron edge function. Not called from web/mobile app builds.

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS brevo_cancellation_list_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_plans.brevo_cancellation_list_synced_at IS
  'When the user was first synced to the Brevo cancellation list; prevents duplicate list adds.';

CREATE TABLE IF NOT EXISTS public.user_plan_brevo_cancellation_queue (
  user_id uuid PRIMARY KEY REFERENCES public.user_plans(user_id) ON DELETE CASCADE,
  send_after timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_plan_brevo_cancellation_queue IS
  'Delayed Brevo cancellation list sync when user_plans.status becomes canceled; drained by process-user-plan-brevo-cancellation.';

ALTER TABLE public.user_plan_brevo_cancellation_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_plan_brevo_cancellation_queue FROM anon, authenticated;
GRANT ALL ON public.user_plan_brevo_cancellation_queue TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_brevo_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.brevo_cancellation_list_synced_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM 'canceled' THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM 'canceled' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_plan_brevo_cancellation_queue (user_id, send_after)
  VALUES (NEW.user_id, now() + interval '1 minute')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_plans_update_brevo_cancellation ON public.user_plans;
DROP TRIGGER IF EXISTS on_user_plans_insert_brevo_cancellation ON public.user_plans;

CREATE TRIGGER on_user_plans_update_brevo_cancellation
  AFTER UPDATE OF status ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_user_plan_brevo_cancellation();
