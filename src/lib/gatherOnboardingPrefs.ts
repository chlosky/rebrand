import { supabase } from "@/integrations/supabase/client";
import { readSetupDraft } from "@/lib/setupDraft";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import { readStoredPreferredLocale, resolveAppLocale } from "@/lib/locale";
import { readDeviceTimeZone } from "@/services/oneSignal";
import i18n from "@/i18n";

const VALID_CHARACTERS = new Set(["river", "sage", "rose", "oliver"]);

/** Payload for `sync-revenuecat-entitlement` onboarding_prefs (native + web). */
export interface OnboardingPrefsPayload {
  selected_character?: string | null;
  first_name?: string | null;
  username?: string | null;
  phone?: string | null;
  app_notifications_enabled?: boolean | null;
  manifestation_intensity?: string | null;
  manifest_routine_items?: unknown[] | null;
  routine_notification_times?: string[] | null;
  timezone?: string | null;
  notification_permission_status?: string | null;
  texts_enabled?: boolean | null;
  email_marketing?: boolean | null;
  preferred_send_window?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
  embody_active_practices?: string[] | null;
  preferred_locale?: string | null;
}

function normalizeGuideCharacterId(raw: unknown): string | null {
  const id = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return VALID_CHARACTERS.has(id) ? id : null;
}

/**
 * Collect onboarding choices from setup draft + onboarding session for backend activation.
 * Used after RevenueCat purchase on native and web so `user_preferences` is populated.
 */
export async function gatherOnboardingPrefs(): Promise<OnboardingPrefsPayload | null> {
  const draft = readSetupDraft();
  const charFromDraft = normalizeGuideCharacterId(draft.guideCharacterId);

  const selectedFromLegacy =
    typeof localStorage !== "undefined" ? localStorage.getItem("selectedCharacter") : null;
  const charFromLegacy = normalizeGuideCharacterId(selectedFromLegacy);

  let session: {
    character_id?: string | null;
    first_name?: string | null;
    username?: string | null;
    phone?: string | null;
    app_notifications_consent?: boolean | null;
    email_consent?: boolean | null;
    sms_consent?: boolean | null;
    onboarding_answers?: Record<string, unknown> | null;
  } | null = null;

  try {
    const storedRaw =
      typeof localStorage !== "undefined" ? localStorage.getItem("onboarding_session") : null;
    if (storedRaw) {
      const stored = JSON.parse(storedRaw) as { sessionId?: string; resumeToken?: string };
      if (stored?.sessionId && stored?.resumeToken) {
        const { data } = await supabase.functions.invoke("get-onboarding-session", {
          body: { sessionId: stored.sessionId, resumeToken: stored.resumeToken },
        });
        if (data?.session) session = data.session as typeof session;
      }
    }
  } catch {
    // ignore
  }

  const prefs: OnboardingPrefsPayload = {};
  const char =
    normalizeGuideCharacterId(session?.character_id) ?? charFromDraft ?? charFromLegacy;
  if (char) prefs.selected_character = char;

  if (session?.first_name != null) prefs.first_name = session.first_name;
  else if (typeof draft.firstName === "string" && draft.firstName.trim()) {
    prefs.first_name = draft.firstName.trim();
  }

  if (session?.username != null) prefs.username = session.username;
  if (session?.phone != null) prefs.phone = session.phone;
  if (session?.app_notifications_consent != null) {
    prefs.app_notifications_enabled = session.app_notifications_consent;
  } else if (typeof draft.appNotificationsConsent === "boolean") {
    prefs.app_notifications_enabled = draft.appNotificationsConsent;
  }
  if (
    draft.manifestationIntensity === "light" ||
    draft.manifestationIntensity === "consistent" ||
    draft.manifestationIntensity === "locked_in"
  ) {
    prefs.manifestation_intensity = draft.manifestationIntensity;
  }
  if (Array.isArray(draft.manifestRoutineItems) && draft.manifestRoutineItems.length > 0) {
    prefs.manifest_routine_items = draft.manifestRoutineItems;
  }
  if (Array.isArray(draft.routineNotificationTimes) && draft.routineNotificationTimes.length > 0) {
    prefs.routine_notification_times = draft.routineNotificationTimes;
  }
  prefs.timezone =
    typeof draft.timezone === "string" && draft.timezone.trim()
      ? draft.timezone.trim()
      : readDeviceTimeZone();
  if (
    draft.notificationPermissionStatus === "granted" ||
    draft.notificationPermissionStatus === "denied" ||
    draft.notificationPermissionStatus === "skipped"
  ) {
    prefs.notification_permission_status = draft.notificationPermissionStatus;
  }
  if (session?.email_consent != null) prefs.email_marketing = session.email_consent;
  else if (typeof draft.emailMarketingConsent === "boolean") {
    prefs.email_marketing = draft.emailMarketingConsent;
  }
  if (session?.sms_consent != null) prefs.texts_enabled = session.sms_consent;
  if (session?.onboarding_answers != null) prefs.onboarding_answers = session.onboarding_answers;
  prefs.preferred_send_window = "both";

  const embodySlugs = mapOnboardingEmbodyKeysToAppSlugs(draft.embodyDailyPractices);
  if (embodySlugs) prefs.embody_active_practices = embodySlugs;

  prefs.preferred_locale = resolveAppLocale(
    i18n.resolvedLanguage || i18n.language || readStoredPreferredLocale() || draft.locale,
  );

  if (Object.keys(prefs).length === 0) return null;
  return prefs;
}
