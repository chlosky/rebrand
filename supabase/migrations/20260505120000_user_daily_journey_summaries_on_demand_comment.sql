-- Journey summaries are generated only on demand (check-daily-progress), not by a scheduled batch.
COMMENT ON TABLE public.user_daily_journey_summaries IS
  'OpenAI-generated reflection for a calendar day; written when the user requests it (check-daily-progress), at most once per local day per user.';
