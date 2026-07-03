-- Board reminder delivery cron (process-board-reminders).
-- Requires CRON_SECRET in vault + pg_cron / net.http_post (same pattern as routine push).
--
-- SELECT cron.schedule(
--   'process-board-reminders',
--   '*/5 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-board-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

COMMENT ON TABLE public.board_reminder_deliveries IS
  'Delivery log for board reminder email, SMS, and queued push sends.';
