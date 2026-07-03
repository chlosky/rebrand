import { supabase } from "@/integrations/supabase/client";

export type ActivityStatDeltas = {
  subliminal_creation_seconds?: number;
  subliminal_listen_seconds?: number;
  /** Counted listen sessions (e.g. meter credit), separate from wall-clock `subliminal_listen_seconds`. */
  subliminal_listen_sessions?: number;
  visualize_sessions?: number;
  mirror_sessions?: number;
  tap_in_sessions?: number;
  belief_view_sessions?: number;
};

export async function bumpUserActivityStats(deltas: ActivityStatDeltas): Promise<void> {
  const { error } = await supabase.rpc("bump_user_activity_stats", {
    p_subliminal_creation_seconds: Math.max(0, Math.floor(deltas.subliminal_creation_seconds ?? 0)),
    p_subliminal_listen_seconds: Math.max(0, Math.floor(deltas.subliminal_listen_seconds ?? 0)),
    p_visualize_sessions: Math.max(0, Math.floor(deltas.visualize_sessions ?? 0)),
    p_mirror_sessions: Math.max(0, Math.floor(deltas.mirror_sessions ?? 0)),
    p_tap_in_sessions: Math.max(0, Math.floor(deltas.tap_in_sessions ?? 0)),
    p_subliminal_listen_sessions: Math.max(0, Math.floor(deltas.subliminal_listen_sessions ?? 0)),
    p_belief_view_sessions: Math.max(0, Math.floor(deltas.belief_view_sessions ?? 0)),
  });
  if (error && import.meta.env.DEV) {
    console.warn("bump_user_activity_stats:", error.message);
  }
}

/** Wall-clock listen time while audio is actively playing (handles pause / track switch). */
export function attachSubliminalListenTracking(audio: HTMLAudioElement): () => void {
  let wallStart: number | null = null;

  const flush = () => {
    if (wallStart === null) return;
    const secs = Math.floor((Date.now() - wallStart) / 1000);
    wallStart = null;
    if (secs >= 1) {
      void bumpUserActivityStats({ subliminal_listen_seconds: secs });
    }
  };

  const onPlay = () => {
    wallStart = Date.now();
  };
  const onPause = () => {
    flush();
  };
  const onEnded = () => {
    flush();
  };

  audio.addEventListener("play", onPlay);
  audio.addEventListener("pause", onPause);
  audio.addEventListener("ended", onEnded);

  return () => {
    flush();
    audio.removeEventListener("play", onPlay);
    audio.removeEventListener("pause", onPause);
    audio.removeEventListener("ended", onEnded);
  };
}
