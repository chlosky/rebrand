-- Queue Brevo welcome email 1 minute after a new user_plans row is inserted.
-- Server-only: DB trigger + cron edge function. Not called from web/mobile app builds.

CREATE TABLE IF NOT EXISTS public.user_plan_brevo_welcome_queue (  user_id uuid PRIMARY KEY REFERENCES public.user_plans(user_id) ON DELETE CASCADE,
  send_after timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_plan_brevo_welcome_queue IS
  'Delayed Brevo welcome emails for new paywall user_plans rows; drained by process-user-plan-brevo-welcome.';

ALTER TABLE public.user_plan_brevo_welcome_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_plan_brevo_welcome_queue FROM anon, authenticated;
GRANT ALL ON public.user_plan_brevo_welcome_queue TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_brevo_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.welcome_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_plan_brevo_welcome_queue (user_id, send_after)
  VALUES (NEW.user_id, now() + interval '1 minute')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_plans_insert_brevo_welcome ON public.user_plans;

CREATE TRIGGER on_user_plans_insert_brevo_welcome
  AFTER INSERT ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_user_plan_brevo_welcome();

COMMENT ON COLUMN public.user_plans.welcome_email_sent_at IS
  'When the Brevo welcome email was first sent; prevents duplicate welcomes.';
