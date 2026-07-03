-- Expand Manifestation Power daily signals and keep them in-sync automatically.
-- Goal: Dashboard meter should not infer "today activity" by querying many tables.

-- 1) Expand allowed kinds
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
      'belief_refactor'
    )
  );

COMMENT ON TABLE public.manifestation_power_daily_signals IS
  'One row per user per UTC calendar day per kind: affirm_visualize, mirror_work, reflect, affirm_set, weekly_goal, subliminal_generated, belief_refactor.';

-- 2) Shared helper to upsert a signal for a given day.
CREATE OR REPLACE FUNCTION public.upsert_manifestation_power_signal(
  p_user_id uuid,
  p_signal_date date,
  p_signal_kind text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.manifestation_power_daily_signals (user_id, signal_date, signal_kind)
  VALUES (p_user_id, p_signal_date, p_signal_kind)
  ON CONFLICT (user_id, signal_date, signal_kind) DO NOTHING;
END;
$$;

-- 3) Triggers
-- Chrono reflections
CREATE OR REPLACE FUNCTION public.trg_manifestation_signal_chrono_reflect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- chrono_entries has entry_date (date). Treat as the "day" of the reflection.
  PERFORM public.upsert_manifestation_power_signal(NEW.user_id, NEW.entry_date, 'reflect');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chrono_entries_manifestation_signal_reflect ON public.chrono_entries;
CREATE TRIGGER chrono_entries_manifestation_signal_reflect
AFTER INSERT ON public.chrono_entries
FOR EACH ROW
EXECUTE FUNCTION public.trg_manifestation_signal_chrono_reflect();

-- Affirmation set created
CREATE OR REPLACE FUNCTION public.trg_manifestation_signal_affirm_set()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.upsert_manifestation_power_signal(NEW.user_id, (NEW.created_at AT TIME ZONE 'UTC')::date, 'affirm_set');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_affirmation_sets_manifestation_signal_affirm_set ON public.user_affirmation_sets;
CREATE TRIGGER user_affirmation_sets_manifestation_signal_affirm_set
AFTER INSERT ON public.user_affirmation_sets
FOR EACH ROW
EXECUTE FUNCTION public.trg_manifestation_signal_affirm_set();

-- Weekly goal created
CREATE OR REPLACE FUNCTION public.trg_manifestation_signal_weekly_goal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.upsert_manifestation_power_signal(NEW.user_id, (NEW.created_at AT TIME ZONE 'UTC')::date, 'weekly_goal');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS weekly_goals_manifestation_signal_weekly_goal ON public.weekly_goals;
CREATE TRIGGER weekly_goals_manifestation_signal_weekly_goal
AFTER INSERT ON public.weekly_goals
FOR EACH ROW
EXECUTE FUNCTION public.trg_manifestation_signal_weekly_goal();

-- Subliminal generated
CREATE OR REPLACE FUNCTION public.trg_manifestation_signal_subliminal_generated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.upsert_manifestation_power_signal(NEW.user_id, (NEW.generated_at AT TIME ZONE 'UTC')::date, 'subliminal_generated');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subliminal_generation_log_manifestation_signal_generated ON public.subliminal_generation_log;
CREATE TRIGGER subliminal_generation_log_manifestation_signal_generated
AFTER INSERT ON public.subliminal_generation_log
FOR EACH ROW
EXECUTE FUNCTION public.trg_manifestation_signal_subliminal_generated();

-- Belief refactor created
CREATE OR REPLACE FUNCTION public.trg_manifestation_signal_belief_refactor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.upsert_manifestation_power_signal(NEW.user_id, (NEW.created_at AT TIME ZONE 'UTC')::date, 'belief_refactor');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS belief_refactor_entries_manifestation_signal_belief_refactor ON public.belief_refactor_entries;
CREATE TRIGGER belief_refactor_entries_manifestation_signal_belief_refactor
AFTER INSERT ON public.belief_refactor_entries
FOR EACH ROW
EXECUTE FUNCTION public.trg_manifestation_signal_belief_refactor();

