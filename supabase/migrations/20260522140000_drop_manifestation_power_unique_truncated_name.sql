-- Repeat mirror_work / affirm_visualize sessions per day require NO unique on
-- (user_id, signal_date, signal_kind). Earlier migrations used:
--   DROP CONSTRAINT IF EXISTS manifestation_power_daily_signals_user_id_signal_date_signal_kind_key;
-- but that identifier is 71 characters; PostgreSQL stores a 63-char truncation such as
--   manifestation_power_daily_sig_user_id_signal_date_signal_ki_key
-- so the DROP never ran and production still returns 23505 on the second insert.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'manifestation_power_daily_signals'
      AND c.contype = 'u'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.manifestation_power_daily_signals DROP CONSTRAINT %I',
      r.conname
    );
  END LOOP;
END $$;

-- Re-assert the four allowed kinds (idempotent with 20260512100000).
ALTER TABLE public.manifestation_power_daily_signals
  DROP CONSTRAINT IF EXISTS manifestation_power_daily_signals_kind_check;

DELETE FROM public.manifestation_power_daily_signals
WHERE signal_kind NOT IN (
  'affirm_visualize',
  'mirror_work',
  'subliminal_listen',
  'belief_view'
);

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
  'Manifestation Charge: four kinds; multiple rows per user per day per kind allowed; UI caps display at 3.';
