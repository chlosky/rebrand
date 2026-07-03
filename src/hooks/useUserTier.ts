import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SubscribedTier } from "@/lib/featureGating";

const SUBSCRIBED_TIERS: readonly string[] = ['monthly', 'annual', 'basic', 'plus', 'premium'];

interface UseUserTierReturn {
  tier: SubscribedTier | null;
  /** From `user_plans.status` (e.g. active, canceled, past_due). */
  status: string | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Module-level cache so every tool page that reads tier doesn't re-query
 * `user_plans` on every navigation. Keyed by user.id, invalidated when the
 * authenticated user changes. `refetch()` always bypasses the cache.
 */
type TierCacheEntry = {
  tier: SubscribedTier | null;
  status: string | null;
};
const tierCache = new Map<string, TierCacheEntry>();
const tierInFlight = new Map<string, Promise<TierCacheEntry>>();

/**
 * Returns tier and status from `user_plans`. Gating uses `status === 'active'` plus a subscribed tier (see featureGating).
 */
export const useUserTier = (): UseUserTierReturn => {
  const { user } = useAuth();
  const cached = user?.id ? tierCache.get(user.id) : undefined;
  const [tier, setTier] = useState<SubscribedTier | null>(cached?.tier ?? null);
  const [status, setStatus] = useState<string | null>(cached?.status ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);

  const fetchTier = async () => {
    if (!user) {
      setTier(null);
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      // Coalesce concurrent callers for the same user into a single request.
      let pending = tierInFlight.get(user.id);
      if (!pending) {
        pending = (async () => {
          const { data: planData, error: fetchError } = await supabase
            .from('user_plans')
            .select('tier, status')
            .eq('user_id', user.id)
            .maybeSingle();

          if (fetchError) throw fetchError;

          const next: TierCacheEntry = {
            tier:
              planData?.tier && SUBSCRIBED_TIERS.includes(planData.tier)
                ? (planData.tier as SubscribedTier)
                : null,
            status: planData?.status ?? null,
          };
          tierCache.set(user.id, next);
          return next;
        })();
        tierInFlight.set(user.id, pending);
      }

      try {
        const next = await pending;
        setTier(next.tier);
        setStatus(next.status);
      } finally {
        tierInFlight.delete(user.id);
      }
    } catch (err) {
      setError(err as Error);
      const cachedEntry = tierCache.get(user.id);
      if (cachedEntry) {
        setTier(cachedEntry.tier);
        setStatus(cachedEntry.status);
      } else {
        setTier(null);
        setStatus(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we already hydrated from cache, do a quiet background revalidate.
    if (!cached) setLoading(true);
    void fetchTier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { tier, status, loading, error, refetch: fetchTier };
};













































