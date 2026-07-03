-- Dedupes server-scheduled routine push sends (send-routine-push-notifications cron).

CREATE TABLE IF NOT EXISTS public.routine_push_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_slot int NOT NULL CHECK (alert_slot >= 1 AND alert_slot <= 3),
  scheduled_for_date date NOT NULL,
  scheduled_time text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  onesignal_response jsonb,
  UNIQUE (user_id, alert_slot, scheduled_for_date)
);

COMMENT ON TABLE public.routine_push_delivery_log IS
  'One row per user/alert-slot/local calendar day; prevents duplicate routine push sends from the 5-minute cron worker.';

CREATE INDEX IF NOT EXISTS idx_routine_push_delivery_log_user_date
  ON public.routine_push_delivery_log (user_id, scheduled_for_date);

ALTER TABLE public.routine_push_delivery_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.routine_push_delivery_log FROM anon, authenticated;
GRANT ALL ON public.routine_push_delivery_log TO service_role;

-- Push tap: no launch url by default (tap foregrounds app). Optional secret:
-- ROUTINE_PUSH_LAUNCH_URL=capacitor://localhost/dashboard
--
-- pg_cron (Supabase Dashboard → Database → Cron, every 5 minutes):
--
-- SELECT cron.schedule(
--   'send-routine-push-notifications',
--   '*/5 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://hyckwyjznishkjijrhcw.supabase.co/functions/v1/send-routine-push-notifications',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
