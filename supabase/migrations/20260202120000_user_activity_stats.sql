-- Aggregate activity metrics (durations + session counts) for Your Journey progress.
-- Rows are created/updated only via bump_user_activity_stats (SECURITY DEFINER).

CREATE TABLE IF NOT EXISTS public.user_activity_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subliminal_creation_seconds_total BIGINT NOT NULL DEFAULT 0,
  subliminal_listen_seconds_total BIGINT NOT NULL DEFAULT 0,
  visualize_sessions_total INTEGER NOT NULL DEFAULT 0,
  mirror_sessions_total INTEGER NOT NULL DEFAULT 0,
  tap_in_sessions_total INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity stats"
  ON public.user_activity_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_user_activity_stats(
  p_subliminal_creation_seconds bigint DEFAULT 0,
  p_subliminal_listen_seconds bigint DEFAULT 0,
  p_visualize_sessions integer DEFAULT 0,
  p_mirror_sessions integer DEFAULT 0,
  p_tap_in_sessions integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_activity_stats (
    user_id,
    subliminal_creation_seconds_total,
    subliminal_listen_seconds_total,
    visualize_sessions_total,
    mirror_sessions_total,
    tap_in_sessions_total
  )
  VALUES (
    auth.uid(),
    GREATEST(COALESCE(p_subliminal_creation_seconds, 0), 0),
    GREATEST(COALESCE(p_subliminal_listen_seconds, 0), 0),
    GREATEST(COALESCE(p_visualize_sessions, 0), 0),
    GREATEST(COALESCE(p_mirror_sessions, 0), 0),
    GREATEST(COALESCE(p_tap_in_sessions, 0), 0)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    subliminal_creation_seconds_total =
      user_activity_stats.subliminal_creation_seconds_total
      + GREATEST(COALESCE(p_subliminal_creation_seconds, 0), 0),
    subliminal_listen_seconds_total =
      user_activity_stats.subliminal_listen_seconds_total
      + GREATEST(COALESCE(p_subliminal_listen_seconds, 0), 0),
    visualize_sessions_total =
      user_activity_stats.visualize_sessions_total
      + GREATEST(COALESCE(p_visualize_sessions, 0), 0),
    mirror_sessions_total =
      user_activity_stats.mirror_sessions_total
      + GREATEST(COALESCE(p_mirror_sessions, 0), 0),
    tap_in_sessions_total =
      user_activity_stats.tap_in_sessions_total
      + GREATEST(COALESCE(p_tap_in_sessions, 0), 0),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.bump_user_activity_stats(
  bigint, bigint, integer, integer, integer
) TO authenticated;

CREATE TRIGGER update_user_activity_stats_updated_at
  BEFORE UPDATE ON public.user_activity_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
