-- Session-style counters for subliminal listen + belief view (aligns with recordDailyManifestationSignal kinds).

ALTER TABLE public.user_activity_stats
  ADD COLUMN IF NOT EXISTS subliminal_listen_sessions_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS belief_view_sessions_total integer NOT NULL DEFAULT 0;

DROP FUNCTION IF EXISTS public.bump_user_activity_stats(bigint, bigint, integer, integer, integer);

CREATE OR REPLACE FUNCTION public.bump_user_activity_stats(
  p_subliminal_creation_seconds bigint DEFAULT 0,
  p_subliminal_listen_seconds bigint DEFAULT 0,
  p_visualize_sessions integer DEFAULT 0,
  p_mirror_sessions integer DEFAULT 0,
  p_tap_in_sessions integer DEFAULT 0,
  p_subliminal_listen_sessions integer DEFAULT 0,
  p_belief_view_sessions integer DEFAULT 0
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
    tap_in_sessions_total,
    subliminal_listen_sessions_total,
    belief_view_sessions_total
  )
  VALUES (
    auth.uid(),
    GREATEST(COALESCE(p_subliminal_creation_seconds, 0), 0),
    GREATEST(COALESCE(p_subliminal_listen_seconds, 0), 0),
    GREATEST(COALESCE(p_visualize_sessions, 0), 0),
    GREATEST(COALESCE(p_mirror_sessions, 0), 0),
    GREATEST(COALESCE(p_tap_in_sessions, 0), 0),
    GREATEST(COALESCE(p_subliminal_listen_sessions, 0), 0),
    GREATEST(COALESCE(p_belief_view_sessions, 0), 0)
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
    subliminal_listen_sessions_total =
      user_activity_stats.subliminal_listen_sessions_total
      + GREATEST(COALESCE(p_subliminal_listen_sessions, 0), 0),
    belief_view_sessions_total =
      user_activity_stats.belief_view_sessions_total
      + GREATEST(COALESCE(p_belief_view_sessions, 0), 0),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.bump_user_activity_stats(
  bigint, bigint, integer, integer, integer, integer, integer
) TO authenticated;
