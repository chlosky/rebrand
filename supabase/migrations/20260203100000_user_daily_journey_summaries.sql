-- AI-generated end-of-day reflection for Your Journey (one row per user per local calendar day summarized).

CREATE TABLE IF NOT EXISTS public.user_daily_journey_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  summary_text TEXT NOT NULL,
  daily_power_percent INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_journey_summaries_user_date
  ON public.user_daily_journey_summaries(user_id, summary_date DESC);

ALTER TABLE public.user_daily_journey_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own journey summaries"
  ON public.user_daily_journey_summaries FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_daily_journey_summaries IS
  'OpenAI-generated reflection for a closed calendar day; written by scheduled edge function.';
