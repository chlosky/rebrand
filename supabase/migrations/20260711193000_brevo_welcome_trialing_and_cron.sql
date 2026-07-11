-- Brevo paywall welcome: queue on trialing OR active (all web subscribers start on trial).
-- Flow: user_plans -> welcome queue -> cron -> process-user-plan-brevo-welcome -> Brevo list #8 -> automation email.

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

  IF NEW.status NOT IN ('trialing', 'active') THEN
    RETURN NEW;
  END IF;

  -- On status updates, only queue when newly entering trialing/active (e.g. upsert updated an existing row).
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('trialing', 'active') THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.user_plan_brevo_welcome_queue (user_id, send_after)
  VALUES (NEW.user_id, now() + interval '1 minute')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_plans_update_brevo_welcome ON public.user_plans;

CREATE TRIGGER on_user_plans_update_brevo_welcome
  AFTER UPDATE OF status ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_user_plan_brevo_welcome();

-- Backfill subscribers who paid/trialed before this fix but never hit the queue.
INSERT INTO public.user_plan_brevo_welcome_queue (user_id, send_after)
SELECT up.user_id, now() + interval '1 minute'
FROM public.user_plans up
WHERE up.welcome_email_sent_at IS NULL
  AND up.status IN ('trialing', 'active')
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_plan_brevo_welcome_queue q
    WHERE q.user_id = up.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Cron: POST process-user-plan-brevo-welcome every 2 minutes (requires pg_cron, pg_net, vault CRON_SECRET).
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'process-user-plan-brevo-welcome';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'process-user-plan-brevo-welcome',
    '*/2 * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://essjyrhhaiywotvgjkcg.supabase.co/functions/v1/process-user-plan-brevo-welcome',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'CRON_SECRET'
          LIMIT 1
        )
      ),
      body := '{}'::jsonb
    ) AS request_id;
    $cron$
  );
END;
$$;
