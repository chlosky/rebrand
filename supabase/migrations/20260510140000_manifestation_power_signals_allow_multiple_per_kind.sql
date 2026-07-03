-- Allow multiple manifestation_power_daily_signals rows per user per day per kind
-- (each completed action inserts a row; meter counts rows, not distinct kinds).

ALTER TABLE public.manifestation_power_daily_signals
  DROP CONSTRAINT IF EXISTS manifestation_power_daily_signals_user_id_signal_date_signal_kind_key;

COMMENT ON TABLE public.manifestation_power_daily_signals IS
  'Append-only rows: each qualifying action inserts one row (user_id, signal_date, signal_kind). Meter counts rows.';

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
  VALUES (p_user_id, p_signal_date, p_signal_kind);
END;
$$;
