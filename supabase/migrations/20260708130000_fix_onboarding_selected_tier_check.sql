-- The baseline defined onboarding_sessions.selected_tier_check using billing periods
-- ('monthly','annual') instead of tier values, so web checkout writing selected_tier='premium'
-- failed the CHECK and update-onboarding-session returned 500. Correct it to tier values.

ALTER TABLE public.onboarding_sessions
  DROP CONSTRAINT IF EXISTS onboarding_sessions_selected_tier_check;

-- Existing rows stored a billing period ('monthly'/'annual') in selected_tier under the old,
-- incorrect constraint. The billing period lives in the `billing` column, so coerce these to the
-- only paid tier ('premium') to preserve the "a plan was chosen" signal before re-adding the CHECK.
UPDATE public.onboarding_sessions
SET selected_tier = 'premium'
WHERE selected_tier IS NOT NULL
  AND selected_tier NOT IN ('basic', 'plus', 'premium');

ALTER TABLE public.onboarding_sessions
  ADD CONSTRAINT onboarding_sessions_selected_tier_check
    CHECK (selected_tier IS NULL OR selected_tier IN ('basic', 'plus', 'premium'));
