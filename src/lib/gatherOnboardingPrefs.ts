import { supabase } from "@/integrations/supabase/client";
import { readSetupDraft } from "@/lib/setupDraft";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import { readStoredPreferredLocale, resolveAppLocale } from "@/lib/locale";
import { readDeviceTimeZone } from "@/services/oneSignal";
import i18n from "@/i18n";

/** Payload for `sync-revenuecat-entitlement` onboarding_prefs (native + web). */
export interface OnboardingPrefsPayload {
  first_name?: string | null;
  username?: string | null;
  phone?: string | null;
  app_notifications_enabled?: boolean | null;
  routine_intensity?: string | null;
  routine_items?: unknown[] | null;
  routine_notification_times?: string[] | null;
  timezone?: string | null;
  notification_permission_status?: string | null;
  texts_enabled?: boolean | null;
  email_marketing?: boolean | null;
  preferred_send_window?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
  embody_active_practices?: string[] | null;
  preferred_locale?: string | null;
  preferred_reminder_channels?: string | null;
  phone_number_e164?: string | null;
  sms_reminders_enabled?: boolean | null;
  sms_reminder_consent_at?: string | null;
  sms_reminder_consent_source?: string | null;
}

/**
 * Collect onboarding choices from setup draft + onboarding session for backend activation.
 * Used after RevenueCat purchase on native and web so `user_preferences` is populated.
 */
export async function gatherOnboardingPrefs(): Promise<OnboardingPrefsPayload | null> {
  const draft = readSetupDraft();

  let session: {
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
    draft.intensity === "light" ||
    draft.intensity === "consistent" ||
    draft.intensity === "locked_in"
  ) {
    prefs.routine_intensity = draft.intensity;
  }
  if (Array.isArray(draft.routineItems) && draft.routineItems.length > 0) {
    prefs.routine_items = draft.routineItems;
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

  if (typeof draft.preferredReminderChannels === "string" && draft.preferredReminderChannels.trim()) {
    prefs.preferred_reminder_channels = draft.preferredReminderChannels.trim();
  }
  const draftWithSms = draft as {
    phoneNumberE164?: string;
    smsReminderConsent?: boolean;
    preferredReminderChannels?: string;
  };
  if (typeof draftWithSms.phoneNumberE164 === "string" && draftWithSms.phoneNumberE164.trim()) {
    prefs.phone_number_e164 = draftWithSms.phoneNumberE164.trim();
    prefs.phone = draftWithSms.phoneNumberE164.trim();
  }
  if (
    draftWithSms.smsReminderConsent === true &&
    typeof draftWithSms.preferredReminderChannels === "string" &&
    draftWithSms.preferredReminderChannels.includes("sms")
  ) {
    prefs.sms_reminders_enabled = true;
    prefs.sms_reminder_consent_at = new Date().toISOString();
    prefs.sms_reminder_consent_source = "onboarding";
  }

  if (Object.keys(prefs).length === 0) return null;
  return prefs;
}
