import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PlottingPlanSnapshot = {
  hasPro: boolean;
  onTrial: boolean;
  hadTrial: boolean;
  currentPeriodEnd: string | null;
};

/** One fetch per signed-in user per session — dashboard lock state only. */
const planCache = new Map<string, PlottingPlanSnapshot>();
const planInFlight = new Map<string, Promise<PlottingPlanSnapshot>>();

export function invalidatePlottingProCache(userId?: string) {
  if (userId) planCache.delete(userId);
  else planCache.clear();
}

type UserPlanRow = {
  tier: string | null;
  status: string | null;
  on_trial: boolean | null;
  had_trial: boolean | null;
  current_period_end: string | null;
};

function snapshotFromPlan(row: UserPlanRow | null): PlottingPlanSnapshot {
  if (!row?.tier) {
    return { hasPro: false, onTrial: false, hadTrial: false, currentPeriodEnd: null };
  }

  const status = row.status ?? "";
  const periodOk =
    !row.current_period_end || new Date(row.current_period_end).getTime() > Date.now();
  const hasPro = (status === "active" || status === "trialing") && periodOk;
  const onTrial = hasPro && (row.on_trial === true || status === "trialing");
  const hadTrial = row.had_trial === true || status === "trialing";

  return { hasPro, onTrial, hadTrial, currentPeriodEnd: row.current_period_end ?? null };
}

async function fetchPlottingPlan(userId: string): Promise<PlottingPlanSnapshot> {
  const { data, error } = await supabase
    .from("user_plans")
    .select("tier, status, on_trial, had_trial, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[usePlottingPro] user_plans lookup failed:", error.message);
    return { hasPro: false, onTrial: false, hadTrial: false };
  }

  const snapshot = snapshotFromPlan(data as UserPlanRow | null);
  planCache.set(userId, snapshot);
  return snapshot;
}

export function usePlottingPro() {
  const { user, isLoading: authLoading } = useAuth();
  const cached = user?.id ? planCache.get(user.id) : undefined;
  const [hasPro, setHasPro] = useState(cached?.hasPro ?? false);
  const [onTrial, setOnTrial] = useState(cached?.onTrial ?? false);
  const [hadTrial, setHadTrial] = useState(cached?.hadTrial ?? false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(cached?.currentPeriodEnd ?? null);
  const [loading, setLoading] = useState(cached === undefined && !authLoading);
  const [refreshToken, setRefreshToken] = useState(0);

  const refreshPlan = useCallback(() => {
    if (user?.id) {
      invalidatePlottingProCache(user.id);
      planInFlight.delete(user.id);
    }
    setRefreshToken((n) => n + 1);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setHasPro(false);
      setOnTrial(false);
      setHadTrial(false);
      setCurrentPeriodEnd(null);
      setLoading(false);
      return;
    }

    const hit = refreshToken === 0 ? planCache.get(user.id) : undefined;
    if (hit !== undefined) {
      setHasPro(hit.hasPro);
      setOnTrial(hit.onTrial);
      setHadTrial(hit.hadTrial);
      setCurrentPeriodEnd(hit.currentPeriodEnd);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!planInFlight.has(user.id)) {
        planInFlight.set(user.id, fetchPlottingPlan(user.id));
      }

      try {
        const snapshot = await planInFlight.get(user.id)!;
        if (!cancelled) {
          setHasPro(snapshot.hasPro);
          setOnTrial(snapshot.onTrial);
          setHadTrial(snapshot.hadTrial);
          setCurrentPeriodEnd(snapshot.currentPeriodEnd);
        }
      } catch {
        if (!cancelled) {
          planCache.set(user.id, { hasPro: false, onTrial: false, hadTrial: false, currentPeriodEnd: null });
          setHasPro(false);
          setOnTrial(false);
          setHadTrial(false);
          setCurrentPeriodEnd(null);
        }
      } finally {
        planInFlight.delete(user.id);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, refreshToken]);

  return { hasPro, onTrial, hadTrial, currentPeriodEnd, loading: authLoading || loading, refreshPlan };
}
