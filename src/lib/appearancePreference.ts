import type { Appearance } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";

export const APPEARANCE_STORAGE_KEY = "theme";

/** Legacy palette names — `command` was the DB default, not an explicit dark choice. */
const LEGACY_PROFILE_THEMES: Record<string, Appearance> = {
  command: "light",
  glow: "dark",
  volt: "dark",
  ground: "dark",
  blush: "dark",
  "pale-blue": "dark",
  sage: "dark",
};

export function isStoredDashboardAppearance(
  raw: string | null | undefined,
): raw is Appearance {
  return raw === "light" || raw === "dark";
}

export function normalizeAppearance(raw: string | null | undefined): Appearance {
  if (isStoredDashboardAppearance(raw)) return raw;
  if (raw && LEGACY_PROFILE_THEMES[raw]) return LEGACY_PROFILE_THEMES[raw];
  return "light";
}

export function readStoredAppearance(): Appearance {
  if (typeof window === "undefined") return "light";
  return normalizeAppearance(localStorage.getItem(APPEARANCE_STORAGE_KEY));
}

export function writeStoredAppearance(appearance: Appearance): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  } catch {
    /* ignore quota / private mode */
  }
}

export async function fetchProfileAppearance(
  userId: string,
): Promise<Appearance | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("preset_theme")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.preset_theme) return null;
  return normalizeAppearance(data.preset_theme);
}

export async function persistProfileAppearance(
  userId: string,
  appearance: Appearance,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ preset_theme: appearance })
    .eq("id", userId);

  if (error) {
    console.warn("[appearance] Failed to save preset_theme to profile:", error.message);
  }
}

/** Prefer saved profile on login; otherwise localStorage; otherwise light. */
export function resolveAppearancePreference(
  localRaw: string | null,
  profileAppearance: Appearance | null,
): Appearance {
  if (profileAppearance) return profileAppearance;
  if (isStoredDashboardAppearance(localRaw)) return localRaw;
  return "light";
}
