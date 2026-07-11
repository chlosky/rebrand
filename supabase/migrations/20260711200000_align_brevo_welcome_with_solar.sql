-- Paywall welcome enqueue: INSERT only, status = active.

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

DROP TRIGGER IF EXISTS on_user_plans_update_brevo_welcome ON public.user_plans;
