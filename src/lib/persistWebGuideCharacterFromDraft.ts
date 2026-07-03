import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { readSetupDraft } from "@/lib/setupDraft";

const VALID_GUIDE_IDS = new Set(["river", "sage", "rose", "oliver"]);

function normalizeGuideCharacterId(raw: unknown): string | null {
  const id = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return VALID_GUIDE_IDS.has(id) ? id : null;
}

/**
 * Web-only: copy Guide step choice into `user_preferences.selected_character` before
 * post-paywall provisioning clears the setup draft. Idempotent; no-op on native.
 */
export async function persistWebGuideCharacterFromDraft(): Promise<void> {
  if (Capacitor.isNativePlatform()) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  const characterId = normalizeGuideCharacterId(readSetupDraft().guideCharacterId);
  if (!characterId) return;

  const { error } = await supabase.from("user_preferences").upsert(
    { user_id: userId, selected_character: characterId },
    { onConflict: "user_id" },
  );

  if (error && import.meta.env.DEV) {
    console.warn("[persistWebGuideCharacterFromDraft] selected_character upsert:", error.message);
  }
}
