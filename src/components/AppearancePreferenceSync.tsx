import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  APPEARANCE_STORAGE_KEY,
  fetchProfileAppearance,
  persistProfileAppearance,
  resolveAppearancePreference,
} from "@/lib/appearancePreference";

/**
 * Hydrates theme from localStorage + profile on login; mirrors dashboard changes to profile.
 * Does not touch document chrome — that stays in ThemeContext / appDocumentChrome.
 */
export function AppearancePreferenceSync() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const hydratedForUserRef = useRef<string | null>(null);
  const skipNextProfileSaveRef = useRef(false);

  useEffect(() => {
    if (isLoading || !user) {
      hydratedForUserRef.current = null;
      return;
    }
    if (hydratedForUserRef.current === user.id) return;

    let cancelled = false;
    (async () => {
      const localRaw =
        typeof window !== "undefined"
          ? localStorage.getItem(APPEARANCE_STORAGE_KEY)
          : null;
      const profileAppearance = await fetchProfileAppearance(user.id);
      if (cancelled) return;

      const next = resolveAppearancePreference(localRaw, profileAppearance);
      hydratedForUserRef.current = user.id;
      skipNextProfileSaveRef.current = true;
      setTheme(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, setTheme]);

  useEffect(() => {
    if (isLoading || !user) return;
    if (hydratedForUserRef.current !== user.id) return;
    if (skipNextProfileSaveRef.current) {
      skipNextProfileSaveRef.current = false;
      return;
    }

    const id = window.setTimeout(() => {
      void persistProfileAppearance(user.id, theme);
    }, 300);
    return () => window.clearTimeout(id);
  }, [theme, user, isLoading]);

  return null;
}
