import { supabase } from "@/integrations/supabase/client";
import {
  dispatchManifestationPowerMeterRefresh,
  manifestationPowerCalendarDateToday,
} from "@/lib/manifestationPowerSignals";

export const INSPIRED_ACTION_HISTORY_REFRESH_EVENT =
  "paletteplotting-inspired-action-history-refresh";

export function dispatchInspiredActionHistoryRefresh() {
  try {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(INSPIRED_ACTION_HISTORY_REFRESH_EVENT));
    dispatchManifestationPowerMeterRefresh();
  } catch {
    /* noop */
  }
}

/** YYYY-MM-DD in local timezone (matches Embody + milestones calendar). */
export function inspiredActionDateLocal(date?: Date): string {
  return manifestationPowerCalendarDateToday(date);
}

export async function loadInspiredActionHistory(): Promise<Record<string, string[]>> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) return {};

  const { data, error } = await supabase
    .from("user_double_action_history")
    .select("action_date, actions")
    .order("action_date", { ascending: false });

  if (error) throw error;

  const history: Record<string, string[]> = {};
  for (const entry of data ?? []) {
    history[entry.action_date] = (entry.actions as string[]) || [];
  }
  return history;
}

async function upsertInspiredActionsForDate(
  actionDate: string,
  actions: string[],
): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.user?.id) {
    throw new Error("No valid session");
  }

  const { error } = await supabase.from("user_double_action_history").upsert(
    {
      user_id: session.user.id,
      action_date: actionDate,
      actions,
    },
    { onConflict: "user_id,action_date" },
  );

  if (error) throw error;
}

/** Merge today's `user_double_progress.completed_actions` into history when calendar is behind. */
export async function syncTodayProgressIntoActionHistory(): Promise<boolean> {
  const today = inspiredActionDateLocal();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return false;

  const { data: progress } = await supabase
    .from("user_double_progress")
    .select("completed_actions")
    .eq("user_id", session.user.id)
    .eq("progress_date", today)
    .maybeSingle();

  const fromProgress = Array.isArray(progress?.completed_actions)
    ? (progress.completed_actions as string[])
    : [];
  if (fromProgress.length === 0) return false;

  const history = await loadInspiredActionHistory();
  const todayActions = history[today] ?? [];
  const merged = [...new Set([...todayActions, ...fromProgress])];
  if (merged.length === todayActions.length && merged.every((a) => todayActions.includes(a))) {
    return false;
  }

  await upsertInspiredActionsForDate(today, merged);
  return true;
}
