-- Ensure feature_flags table exists (may have been removed from live DB).
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feature_flags' AND policyname = 'Anyone can view feature flags'
  ) THEN
    CREATE POLICY "Anyone can view feature flags"
    ON public.feature_flags FOR SELECT
    USING (true);
  END IF;
END $$;

-- Seed the review-prompt feature flag.
-- description doubles as the audience selector:
--   "trial_only"  → only users whose on_trial = true
--   "all_new"     → every new subscriber (trial or not)
-- Enabled for trial users by default.
INSERT INTO public.feature_flags (feature_name, is_enabled, description)
VALUES ('review_prompt', false, 'trial_only')
ON CONFLICT (feature_name) DO NOTHING;

-- Nullable timestamp on user_plans — null = never prompted.
ALTER TABLE public.user_plans
ADD COLUMN IF NOT EXISTS review_prompt_attempted_at TIMESTAMPTZ;

-- Include submitter first name in support reports and cases.
ALTER TABLE public.app_support_reports
ADD COLUMN IF NOT EXISTS user_first_name TEXT;

ALTER TABLE public.support_cases
ADD COLUMN IF NOT EXISTS user_first_name TEXT;
