-- Snapshot preferred_locale on Brevo queue rows for email routing (en | es-419 | pt-BR).

ALTER TABLE public.user_plan_brevo_welcome_queue
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT;

COMMENT ON COLUMN public.user_plan_brevo_welcome_queue.preferred_locale IS
  'App locale at enqueue time (user_preferences then profiles); used by process-user-plan-brevo-welcome for Brevo contact attributes/tags.';

ALTER TABLE public.user_plan_brevo_cancellation_queue
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT;

COMMENT ON COLUMN public.user_plan_brevo_cancellation_queue.preferred_locale IS
  'App locale at enqueue time (user_preferences then profiles); used by process-user-plan-brevo-cancellation for Brevo contact attributes/tags.';

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_brevo_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locale text;
BEGIN
  IF NEW.welcome_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  SELECT preferred_locale INTO v_locale
  FROM public.user_preferences
  WHERE user_id = NEW.user_id;

  IF v_locale IS NULL OR btrim(v_locale) = '' THEN
    SELECT preferred_locale INTO v_locale
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;

  INSERT INTO public.user_plan_brevo_welcome_queue (user_id, send_after, preferred_locale)
  VALUES (NEW.user_id, now() + interval '1 minute', NULLIF(btrim(v_locale), ''))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_brevo_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locale text;
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

  SELECT preferred_locale INTO v_locale
  FROM public.user_preferences
  WHERE user_id = NEW.user_id;

  IF v_locale IS NULL OR btrim(v_locale) = '' THEN
    SELECT preferred_locale INTO v_locale
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;

  INSERT INTO public.user_plan_brevo_cancellation_queue (user_id, send_after, preferred_locale)
  VALUES (NEW.user_id, now() + interval '1 minute', NULLIF(btrim(v_locale), ''))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
