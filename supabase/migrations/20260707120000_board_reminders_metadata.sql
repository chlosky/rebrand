ALTER TABLE public.board_reminders
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
