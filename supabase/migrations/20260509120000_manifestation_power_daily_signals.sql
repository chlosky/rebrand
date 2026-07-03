-- Per-day signals for Manifestation Power Meter (affirmation visualize / mirror start).
CREATE TABLE IF NOT EXISTS public.manifestation_power_daily_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_date date NOT NULL,
  signal_kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manifestation_power_daily_signals_kind_check
    CHECK (signal_kind IN ('affirm_visualize', 'mirror_work')),
  UNIQUE (user_id, signal_date, signal_kind)
);

ALTER TABLE public.manifestation_power_daily_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manifestation_power_daily_signals_select_own"
  ON public.manifestation_power_daily_signals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "manifestation_power_daily_signals_insert_own"
  ON public.manifestation_power_daily_signals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "manifestation_power_daily_signals_update_own"
  ON public.manifestation_power_daily_signals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "manifestation_power_daily_signals_delete_own"
  ON public.manifestation_power_daily_signals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_manifestation_power_daily_signals_user_date
  ON public.manifestation_power_daily_signals (user_id, signal_date DESC);

COMMENT ON TABLE public.manifestation_power_daily_signals IS
  'One row per user per local calendar day per kind: affirm_visualize (play/visualize set), mirror_work (camera started).';
