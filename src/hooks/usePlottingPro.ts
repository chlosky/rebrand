import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PlottingPlanSnapshot = {
  hasPro: boolean;
  onTrial: boolean;
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
  current_period_end: string | null;
};

function snapshotFromPlan(row: UserPlanRow | null): PlottingPlanSnapshot {
  if (!row?.tier) {
    return { hasPro: false, onTrial: false };
  }

  const status = row.status ?? "";
  const periodOk =
    !row.current_period_end || new Date(row.current_period_end).getTime() > Date.now();
  const hasPro = (status === "active" || status === "trialing") && periodOk;
  const onTrial = hasPro && (row.on_trial === true || status === "trialing");

  return { hasPro, onTrial };
}

async function fetchPlottingPlan(userId: string): Promise<PlottingPlanSnapshot> {
  const { data, error } = await supabase
    .from("user_plans")
    .select("tier, status, on_trial, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[usePlottingPro] user_plans lookup failed:", error.message);
    return { hasPro: false, onTrial: false };
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
      setLoading(false);
      return;
    }

    const hit = refreshToken === 0 ? planCache.get(user.id) : undefined;
    if (hit !== undefined) {
      setHasPro(hit.hasPro);
      setOnTrial(hit.onTrial);
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
        }
      } catch {
        if (!cancelled) {
          planCache.set(user.id, { hasPro: false, onTrial: false });
          setHasPro(false);
          setOnTrial(false);
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

  return { hasPro, onTrial, loading: authLoading || loading, refreshPlan };
}
