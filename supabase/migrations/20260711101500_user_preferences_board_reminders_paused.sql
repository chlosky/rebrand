ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS board_reminders_paused boolean NOT NULL DEFAULT false;
