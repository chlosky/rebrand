-- Ensure welcome queue is not readable/writable by app clients (service_role / cron only).
REVOKE ALL ON public.user_plan_brevo_welcome_queue FROM anon, authenticated;
GRANT ALL ON public.user_plan_brevo_welcome_queue TO service_role;
