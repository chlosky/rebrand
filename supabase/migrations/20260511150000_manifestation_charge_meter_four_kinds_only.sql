-- Manifestation Charge: single table, four signal kinds only (client inserts).
-- Stops trigger-driven rows (reflect, weekly_goal, belief_refactor, etc.) from polluting the meter.

DROP TRIGGER IF EXISTS chrono_entries_manifestation_signal_reflect ON public.chrono_entries;
DROP TRIGGER IF EXISTS weekly_goals_manifestation_signal_weekly_goal ON public.weekly_goals;
DROP TRIGGER IF EXISTS belief_refactor_entries_manifestation_signal_belief_refactor ON public.belief_refactor_entries;

DROP FUNCTION IF EXISTS public.trg_manifestation_signal_chrono_reflect();
DROP FUNCTION IF EXISTS public.trg_manifestation_signal_weekly_goal();
DROP FUNCTION IF EXISTS public.trg_manifestation_signal_belief_refactor();
DROP FUNCTION IF EXISTS public.trg_manifestation_signal_affirm_set();
DROP FUNCTION IF EXISTS public.trg_manifestation_signal_subliminal_generated();

DELETE FROM public.manifestation_power_daily_signals
WHERE signal_kind NOT IN (
  'affirm_visualize',
  'mirror_work',
  'subliminal_listen',
  'belief_view'
);

ALTER TABLE public.manifestation_power_daily_signals
  DROP CONSTRAINT IF EXISTS manifestation_power_daily_signals_kind_check;

ALTER TABLE public.manifestation_power_daily_signals
  ADD CONSTRAINT manifestation_power_daily_signals_kind_check
  CHECK (
    signal_kind IN (
      'affirm_visualize',
      'mirror_work',
      'subliminal_listen',
      'belief_view'
    )
  );

COMMENT ON TABLE public.manifestation_power_daily_signals IS
  'Manifestation Charge: affirm_visualize, mirror_work, subliminal_listen, belief_view only (signal_date = app local day). Unlimited rows per user per day; UI shows min(row count, 3) segments.';
