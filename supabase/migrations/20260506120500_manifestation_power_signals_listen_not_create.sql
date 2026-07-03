-- Manifestation Power: credit listening/usage, not creation.
-- - Remove auto-signals for affirmation set creation and subliminal generation.
-- - Add a dedicated daily signal for subliminal listening.

-- Expand allowed kinds to include subliminal_listen (keep older kinds for existing data).
ALTER TABLE public.manifestation_power_daily_signals
  DROP CONSTRAINT IF EXISTS manifestation_power_daily_signals_kind_check;

ALTER TABLE public.manifestation_power_daily_signals
  ADD CONSTRAINT manifestation_power_daily_signals_kind_check
  CHECK (
    signal_kind IN (
      'affirm_visualize',
      'mirror_work',
      'reflect',
      'affirm_set',
      'weekly_goal',
      'subliminal_generated',
      'belief_refactor',
      'subliminal_listen',
      'belief_view'
    )
  );

-- Stop awarding "creation" signals.
DROP TRIGGER IF EXISTS user_affirmation_sets_manifestation_signal_affirm_set ON public.user_affirmation_sets;
DROP TRIGGER IF EXISTS subliminal_generation_log_manifestation_signal_generated ON public.subliminal_generation_log;

