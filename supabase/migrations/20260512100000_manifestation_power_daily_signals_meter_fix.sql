-- Repair meter inserts when older migrations were skipped or partial:
-- - DROP unique(user_id, signal_date, signal_kind) so repeats count toward charge.
-- - Ensure CHECK allows only the four client meter kinds (drops stray rows first).

ALTER TABLE public.manifestation_power_daily_signals
  DROP CONSTRAINT IF EXISTS manifestation_power_daily_signals_user_id_signal_date_signal_kind_key;

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
  'Manifestation Charge: four kinds only; multiple rows per user per day per kind allowed; UI caps display at 3.';
