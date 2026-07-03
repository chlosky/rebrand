import type { CSSProperties } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { bumpUserActivityStats, type ActivityStatDeltas } from '@/lib/userActivityStats';

export type ManifestationPowerSignalKind =
  | 'affirm_visualize'
  | 'mirror_work'
  | 'subliminal_listen'
  | 'belief_view';

/**
 * Only these rows in `manifestation_power_daily_signals` move Manifestation Charge.
 * Subliminal listen, affirm view (v1+v2 both use `affirm_visualize`), mirror, belief refactor **view**.
 */
export const MANIFESTATION_CHARGE_SIGNAL_KINDS: readonly ManifestationPowerSignalKind[] = [
  'affirm_visualize',
  'mirror_work',
  'subliminal_listen',
  'belief_view',
];

const MANIFESTATION_CHARGE_KIND_SET = new Set<string>(
  MANIFESTATION_CHARGE_SIGNAL_KINDS as readonly string[],
);

/** Bump dashboard / journey meters after a qualifying insert (same-tab refresh). */
export const MANIFESTATION_POWER_METER_REFRESH_EVENT = 'paletteplotting-manifestation-power-meter-refresh';

export function dispatchManifestationPowerMeterRefresh() {
  try {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(MANIFESTATION_POWER_METER_REFRESH_EVENT));
  } catch {
    /* noop */
  }
}

/** Checkpoint count from today’s qualifying rows (repeats count; not deduped by kind). */
export function manifestationChargeCheckpointsFromSignalRows(
  rows: ReadonlyArray<{ signal_kind: string }>,
): number {
  return rows.filter((r) => MANIFESTATION_CHARGE_KIND_SET.has(r.signal_kind)).length;
}

export function manifestationChargeTargetFromIntensity(intensity?: string | null): number {
  if (intensity === "light") return 1;
  if (intensity === "locked_in") return 3;
  return 2;
}

export function manifestationChargePercent(checkpoints: number, target: number): number {
  const safeTarget = Math.max(1, target || 2);
  const safeCheckpoints = Math.max(0, Math.floor(Number(checkpoints)) || 0);
  return Math.min(
    100,
    Math.round((Math.min(safeCheckpoints, safeTarget) / safeTarget) * 100),
  );
}

/** YYYY-MM-DD in the user's local timezone (meter + `recordDailyManifestationSignal` use the same day). */
export function manifestationPowerCalendarDateToday(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** One row per successful completion (repeats allowed; same table powers the meter). */
export async function recordDailyManifestationSignal(kind: ManifestationPowerSignalKind): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const { error } = await supabase.from("manifestation_power_daily_signals").insert({
      user_id: session.user.id,
      signal_date: manifestationPowerCalendarDateToday(),
      signal_kind: kind,
    });
    if (error) {
      console.warn(
        "[manifestation_charge] insert failed:",
        kind,
        error.code ?? "",
        error.message ?? error,
        error.code === "23505"
          ? "(UNIQUE still on manifestation_power_daily_signals — apply migration 20260522140000_drop_manifestation_power_unique_truncated_name; older DROP used a name PG truncated past 63 chars)"
          : error.code === "23514"
            ? "(CHECK constraint — apply manifestation_power migrations so subliminal_listen & belief_view are allowed)"
            : "",
      );
      return;
    }

    dispatchManifestationPowerMeterRefresh();

    const statByKind: Record<ManifestationPowerSignalKind, ActivityStatDeltas> = {
      affirm_visualize: { visualize_sessions: 1 },
      mirror_work: { mirror_sessions: 1 },
      subliminal_listen: { subliminal_listen_sessions: 1 },
      belief_view: { belief_view_sessions: 1 },
    };
    void bumpUserActivityStats(statByKind[kind]);
  } catch {
    /* non-blocking */
  }
}

/**
 * Inline styles for the meter **fill** only (parent must be `relative`, fill `absolute inset-y-0 left-0`).
 * Absolute positioning fixes visible gaps at the end of the track from flow layout + rounded clipping.
 */
export function manifestationMeterBarStyle(checkpoints: number, target = 3): CSSProperties {
  const safeTarget = Math.max(1, target || 3);
  const safeCheckpoints = Math.max(0, Math.floor(Number(checkpoints)) || 0);
  const pct = Math.min(100, (Math.min(safeCheckpoints, safeTarget) / safeTarget) * 100);
  return {
    width: `${pct}%`,
    minWidth: pct >= 100 ? "100%" : undefined,
  };
}
