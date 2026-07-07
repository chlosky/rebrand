-- Reminder channel preferences and transactional SMS logging (Brevo).

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS preferred_reminder_channels text DEFAULT 'email_calendar',
  ADD COLUMN IF NOT EXISTS phone_number_e164 text,
  ADD COLUMN IF NOT EXISTS sms_reminders_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_reminder_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sms_reminder_consent_source text,
  ADD COLUMN IF NOT EXISTS sms_reminder_opted_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS sms_daily_limit integer NOT NULL DEFAULT 5;

ALTER TABLE public.board_reminders
  ADD COLUMN IF NOT EXISTS sms_content text,
  ADD COLUMN IF NOT EXISTS sms_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sms_brevo_message_id text,
  ADD COLUMN IF NOT EXISTS sms_send_status text,
  ADD COLUMN IF NOT EXISTS sms_send_error text,
  ADD COLUMN IF NOT EXISTS sms_attempt_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.palette_sms_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id uuid REFERENCES public.board_reminders(id) ON DELETE SET NULL,
  phone_number_e164 text NOT NULL,
  content text NOT NULL,
  provider text NOT NULL DEFAULT 'brevo',
  provider_message_id text,
  status text NOT NULL,
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS palette_sms_send_log_user_sent_idx
  ON public.palette_sms_send_log (user_id, sent_at DESC);

ALTER TABLE public.palette_sms_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "palette_sms_send_log_select_own"
  ON public.palette_sms_send_log
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
