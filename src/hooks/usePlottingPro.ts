import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/** One RPC per signed-in user per session — dashboard lock state only. */
const proCache = new Map<string, boolean>();
const proInFlight = new Map<string, Promise<boolean>>();

export function invalidatePlottingProCache(userId?: string) {
  if (userId) proCache.delete(userId);
  else proCache.clear();
}

export function usePlottingPro() {
  const { user, isLoading: authLoading } = useAuth();
  const cached = user?.id ? proCache.get(user.id) : undefined;
  const [hasPro, setHasPro] = useState(cached ?? false);
  const [loading, setLoading] = useState(cached === undefined && !authLoading);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setHasPro(false);
      setLoading(false);
      return;
    }

    const hit = proCache.get(user.id);
    if (hit !== undefined) {
      setHasPro(hit);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      if (!proInFlight.has(user.id)) {
        proInFlight.set(
          user.id,
          supabase.rpc("has_active_plotting_subscription").then(({ data, error }) => {
            const value = !error && Boolean(data);
            proCache.set(user.id, value);
            return value;
          }),
        );
      }

      try {
        const value = await proInFlight.get(user.id)!;
        if (!cancelled) setHasPro(value);
      } catch {
        if (!cancelled) {
          proCache.set(user.id, false);
          setHasPro(false);
        }
      } finally {
        proInFlight.delete(user.id);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  return { hasPro, loading: authLoading || loading };
}
