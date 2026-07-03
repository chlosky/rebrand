import { supabase } from "@/integrations/supabase/client";
import type { SetupDraft } from "@/lib/setupDraft";
import { normalizeConditionalSpecificityFromUnknown } from "@/lib/conditionalSpecificityStorage";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import { buildOnboardingAttributionPatch } from "@/lib/attribution";

const SHELL_APPEARANCES = new Set(["light", "dark"]);
const GUIDE_IDS = new Set(["river", "sage", "rose", "oliver"]);

/** Must match `useOnboardingSession` / `useLocalStorage("onboarding_session")`. */
const ONBOARDING_SESSION_STORAGE_KEY = "onboarding_session";

type StoredCreds = { sessionId: string; resumeToken: string; createdAt?: number };

function readStoredCreds(): StoredCreds | null {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const raw = storage.getItem(ONBOARDING_SESSION_STORAGE_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<StoredCreds>;
      if (parsed?.sessionId && parsed?.resumeToken) {
        return {
          sessionId: String(parsed.sessionId),
          resumeToken: String(parsed.resumeToken),
          createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : undefined,
        };
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function writeStoredCreds(creds: StoredCreds) {
  const json = JSON.stringify(creds);
  for (const storage of [localStorage, sessionStorage]) {
    try {
      storage.setItem(ONBOARDING_SESSION_STORAGE_KEY, json);
    } catch {
      /* ignore */
    }
  }
}

/** Creates or returns persisted onboarding_sessions creds (localStorage + sessionStorage mirror). */
export async function ensureOnboardingSessionCreds(): Promise<StoredCreds> {
  const existing = readStoredCreds();
  if (existing) {
    void syncAttributionToExistingSession(existing);
    return existing;
  }

  const { data, error } = await supabase.functions.invoke("create-onboarding-session", {
    body: buildOnboardingAttributionPatch(),
  });
  if (error) throw error;
  if (!data?.sessionId || !data?.resumeToken) {
    throw new Error("Invalid onboarding session response");
  }
  const next: StoredCreds = {
    sessionId: data.sessionId as string,
    resumeToken: data.resumeToken as string,
    createdAt: Date.now(),
  };
  writeStoredCreds(next);
  return next;
}

async function syncAttributionToExistingSession(creds: StoredCreds): Promise<void> {
  try {
    await supabase.functions.invoke("update-onboarding-session", {
      body: {
        sessionId: creds.sessionId,
        resumeToken: creds.resumeToken,
        patch: buildOnboardingAttributionPatch(),
      },
    });
  } catch {
    /* non-fatal */
  }
}

/** Maps SetupDraft → normalized columns (Edge + DB). */
export function draftToSetupPathPayload(draft: SetupDraft): Record<string, unknown> {
  const embodySlugs = mapOnboardingEmbodyKeysToAppSlugs(draft.embodyDailyPractices);
  return {
    first_name: typeof draft.firstName === "string" ? draft.firstName.trim().slice(0, 120) || null : null,
    email: typeof draft.email === "string" ? draft.email.trim().toLowerCase().slice(0, 320) || null : null,
    desire_category: typeof draft.desireCategory === "string" ? draft.desireCategory.trim().slice(0, 64) || null : null,
    // Do not persist a separate "desire text" anymore; the setup flow uses friction/identity + signals instead.
    desire_text: null,
    why_it_matters: null,
    current_friction: typeof draft.currentFriction === "string" ? draft.currentFriction : null,
    desired_identity: typeof draft.desiredIdentity === "string" ? draft.desiredIdentity.trim().slice(0, 200) || null : null,
    tool_preferences: Array.isArray(draft.toolPreferences)
      ? draft.toolPreferences.filter((t): t is string => typeof t === "string")
      : [],
    conditional_specificity: normalizeConditionalSpecificityFromUnknown(
      draft.conditionalSpecificity,
      draft.desireCategory,
    ),
    shell_appearance:
      typeof draft.appearance === "string" && SHELL_APPEARANCES.has(draft.appearance) ? draft.appearance : null,
    guide_character_id:
      typeof draft.guideCharacterId === "string" && GUIDE_IDS.has(draft.guideCharacterId)
        ? draft.guideCharacterId
        : null,
    embody_active_practices: embodySlugs ?? null,
    board_starter_template_slug:
      typeof draft.boardStarterTemplateSlug === "string" && draft.boardStarterTemplateSlug.trim()
        ? draft.boardStarterTemplateSlug.trim().slice(0, 64)
        : null,
    primary_intent:
      draft.primaryIntent === "life_rebranding" ||
      draft.primaryIntent === "home_organization" ||
      draft.primaryIntent === "office_work" ||
      draft.primaryIntent === "moodboarding"
        ? draft.primaryIntent
        : null,
    home_focus_key:
      typeof draft.homeFocusKey === "string" && draft.homeFocusKey.trim()
        ? draft.homeFocusKey.trim().slice(0, 64)
        : null,
    office_planning_system:
      typeof draft.officePlanningSystem === "string" && draft.officePlanningSystem.trim()
        ? draft.officePlanningSystem.trim().slice(0, 64)
        : null,
    moodboard_focus_key:
      typeof draft.moodboardFocusKey === "string" && draft.moodboardFocusKey.trim()
        ? draft.moodboardFocusKey.trim().slice(0, 64)
        : null,
  };
}

/**
 * Persists setup path to:
 * - `onboarding_sessions.onboarding_answers` (via Edge `update-onboarding-session`, pre-auth) as
 *   `setup_path_v1` plus merged `setup_journey_v1`. If a typed `onboarding_session_setup` table exists
 *   in a deployment, the edge may also upsert there first; otherwise it uses that JSON path only.
 * - `user_preferences` / `profiles` when logged in (setup path JSON stays on onboarding_sessions).
 */
export async function syncSetupJourneyToBackend(draft: SetupDraft): Promise<void> {
  const setup_path = draftToSetupPathPayload(draft);

  try {
    const creds = await ensureOnboardingSessionCreds();
    const patch: Record<string, unknown> = {
      setup_path,
      ...buildOnboardingAttributionPatch(),
    };
    if (setup_path.first_name) patch.first_name = setup_path.first_name;
    if (setup_path.email) {
      patch.email = setup_path.email;
      // Same handle as email until a dedicated username step exists (not the legacy sign-up form).
      patch.username = setup_path.email;
    }
    if (typeof draft.emailMarketingConsent === "boolean") {
      patch.email_consent = draft.emailMarketingConsent;
    }
    if (typeof draft.appNotificationsConsent === "boolean") {
      patch.app_notifications_consent = draft.appNotificationsConsent;
    }
    if (draft.trackingPrePermissionChoice === "yes" || draft.trackingPrePermissionChoice === "no") {
      patch.tracking_pre_permission_choice = draft.trackingPrePermissionChoice;
    }
    if (typeof draft.trackingAuthorizationStatus === "string") {
      patch.tracking_authorization_status = draft.trackingAuthorizationStatus;
    }
    if (typeof draft.trackingPermissionAskedAt === "string") {
      patch.tracking_permission_asked_at = draft.trackingPermissionAskedAt;
    }
    if (
      draft.intensity === "light" ||
      draft.intensity === "consistent" ||
      draft.intensity === "locked_in"
    ) {
      patch.onboarding_answers = {
        setup_journey_v1: {
          manifestation_intensity: draft.intensity,
          manifest_routine_items: draft.routineItems ?? [],
          routine_notification_times: draft.routineNotificationTimes ?? [],
          notification_permission_status: draft.notificationPermissionStatus ?? null,
        },
      };
    }
    if (typeof draft.guideCharacterId === "string" && GUIDE_IDS.has(draft.guideCharacterId)) {
      patch.character_id = draft.guideCharacterId;
    }

    const { data, error } = await supabase.functions.invoke("update-onboarding-session", {
      body: { sessionId: creds.sessionId, resumeToken: creds.resumeToken, patch },
    });
    if (error) {
      throw new Error(error.message || "update-onboarding-session invoke failed");
    }
    if (data && typeof data === "object" && "error" in data && data.error) {
      throw new Error(String(data.error));
    }
  } catch (e) {
    console.warn("[setupDraftBackendSync] onboarding session sync failed:", e);
    throw e;
  }

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (userErr || !userId) return;

    try {
      await supabase.functions.invoke("update-onboarding-session", {
        body: {
          sessionId: creds.sessionId,
          resumeToken: creds.resumeToken,
          patch: {
            revenuecat_app_user_id: userId,
            ...buildOnboardingAttributionPatch(),
          },
        },
      });
    } catch {
      /* non-fatal */
    }

    const embodySlugs = mapOnboardingEmbodyKeysToAppSlugs(draft.embodyDailyPractices);

    const prefRow: Record<string, unknown> = { user_id: userId };
    const profileRow: Record<string, unknown> = { id: userId };
    if (embodySlugs) prefRow.embody_active_practices = embodySlugs;
    if (typeof setup_path.guide_character_id === "string") {
      prefRow.selected_character = setup_path.guide_character_id;
    }
    if (draft.locale === "en" || draft.locale === "es-419" || draft.locale === "pt-BR") {
      prefRow.preferred_locale = draft.locale;
      profileRow.preferred_locale = draft.locale;
    }
    if (
      draft.intensity === "light" ||
      draft.intensity === "consistent" ||
      draft.intensity === "locked_in"
    ) {
      prefRow.manifestation_intensity = draft.intensity;
      profileRow.manifestation_intensity = draft.intensity;
      prefRow.manifest_routine_items = draft.routineItems ?? [];
      profileRow.manifest_routine_items = draft.routineItems ?? [];
      prefRow.routine_notification_times = draft.routineNotificationTimes ?? [];
      profileRow.routine_notification_times = draft.routineNotificationTimes ?? [];
    }
    if (typeof draft.appNotificationsConsent === "boolean") {
      prefRow.app_notifications_enabled = draft.appNotificationsConsent;
      profileRow.app_notifications_enabled = draft.appNotificationsConsent;
    }
    if (
      draft.notificationPermissionStatus === "granted" ||
      draft.notificationPermissionStatus === "denied" ||
      draft.notificationPermissionStatus === "skipped"
    ) {
      prefRow.notification_permission_status = draft.notificationPermissionStatus;
      profileRow.notification_permission_status = draft.notificationPermissionStatus;
    }
    if (typeof draft.timezone === "string" && draft.timezone.trim()) {
      prefRow.timezone = draft.timezone.trim();
      profileRow.timezone = draft.timezone.trim();
    }
    if (Object.keys(prefRow).length > 1) {
      const { error: prefErr } = await supabase
        .from("user_preferences")
        .upsert(prefRow, { onConflict: "user_id" });
      if (prefErr && import.meta.env.DEV) {
        console.warn("[setupDraftBackendSync] user_preferences upsert failed:", prefErr.message);
      }
    }
    if (Object.keys(profileRow).length > 1) {
      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(profileRow, { onConflict: "id" });
      if (profileErr && import.meta.env.DEV) {
        console.warn("[setupDraftBackendSync] profiles upsert failed:", profileErr.message);
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[setupDraftBackendSync] logged-in prefs sync skipped:", e);
    }
  }
}
