import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ALL_EMBODY_PRACTICE_KEYS,
  type EmbodyPracticeDefinition,
  type EmbodyPracticeKey,
  getEmbodyPractice,
  isEmbodyPracticeKey,
} from "@/lib/embodyPracticesCatalog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type EmbodyActivePracticesState = {
  /** Exactly five practices chosen by the user (fallbacks if unset). */
  activeKeys: readonly EmbodyPracticeKey[];
  activePractices: EmbodyPracticeDefinition[];
  loaded: boolean;
  reload: () => Promise<void>;
};

const REQUIRED_ACTIVE_PRACTICES = 5;

function normalizeActiveKeys(raw: unknown): EmbodyPracticeKey[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => isEmbodyPracticeKey(x));

  const uniq: EmbodyPracticeKey[] = [];
  for (const k of cleaned) {
    if (!uniq.includes(k)) uniq.push(k);
  }
  if (uniq.length !== REQUIRED_ACTIVE_PRACTICES) return null;
  return uniq;
}

/**
 * Module-level cache so the 5+ screens that read embody active practices
 * don't re-query `user_preferences` on every navigation. Keyed by user.id.
 * `reload()` always bypasses the cache.
 */
const activeKeysCache = new Map<string, EmbodyPracticeKey[]>();
const activeKeysInFlight = new Map<string, Promise<EmbodyPracticeKey[]>>();

/** Embody selection for UI — exactly five practices, persisted in `user_preferences.embody_active_practices`. */
export function useEmbodyActivePractices(): EmbodyActivePracticesState {
  const { user } = useAuth();
  const cached = user?.id ? activeKeysCache.get(user.id) : undefined;
  const [activeKeys, setActiveKeys] = useState<EmbodyPracticeKey[]>(
    () => cached ?? ALL_EMBODY_PRACTICE_KEYS.slice(0, REQUIRED_ACTIVE_PRACTICES),
  );
  const [loaded, setLoaded] = useState(Boolean(cached));

  const reload = useCallback(async () => {
    if (!user?.id) {
      setActiveKeys(ALL_EMBODY_PRACTICE_KEYS.slice(0, REQUIRED_ACTIVE_PRACTICES));
      setLoaded(true);
      return;
    }

    const uid = user.id;
    let pending = activeKeysInFlight.get(uid);
    if (!pending) {
      pending = (async () => {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("embody_active_practices")
          .eq("user_id", uid)
          .maybeSingle();

        if (error) {
          const fallback = ALL_EMBODY_PRACTICE_KEYS.slice(0, REQUIRED_ACTIVE_PRACTICES);
          activeKeysCache.set(uid, fallback);
          return fallback;
        }

        const normalized = normalizeActiveKeys((data as any)?.embody_active_practices);
        const next = normalized ?? ALL_EMBODY_PRACTICE_KEYS.slice(0, REQUIRED_ACTIVE_PRACTICES);
        activeKeysCache.set(uid, next);
        return next;
      })();
      activeKeysInFlight.set(uid, pending);
    }

    try {
      const next = await pending;
      setActiveKeys(next);
      setLoaded(true);
    } finally {
      activeKeysInFlight.delete(uid);
    }
  }, [user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activePractices = useMemo(() => {
    const fromKeys = activeKeys
      .map((k) => getEmbodyPractice(k))
      .filter((p): p is EmbodyPracticeDefinition => p != null);
    if (fromKeys.length >= REQUIRED_ACTIVE_PRACTICES) {
      return fromKeys.slice(0, REQUIRED_ACTIVE_PRACTICES);
    }
    return ALL_EMBODY_PRACTICE_KEYS.slice(0, REQUIRED_ACTIVE_PRACTICES).map((k) =>
      getEmbodyPractice(k),
    );
  }, [activeKeys]);

  return {
    activeKeys,
    activePractices,
    loaded,
    reload,
  };
}
