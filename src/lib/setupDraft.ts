import type { Appearance } from "@/contexts/ThemeContext";
import type { PrimarySetupIntent } from "@/lib/boards/starterTemplates";

export type SetupDraft = {
  firstName?: string;
  email?: string;
  /** Email marketing (optional) — same meaning as legacy EmailCollection `email_consent` on onboarding_sessions. */
  emailMarketingConsent?: boolean;
  /** App / push notifications (optional) — maps to onboarding_sessions.app_notifications_consent. */
  appNotificationsConsent?: boolean;
  intensity?: "light" | "consistent" | "locked_in";
  /** Daily alert times as "HH:mm" (24h); count matches intensity (1 / 2 / 3). */
  routineNotificationTimes?: string[];
  /** IANA timezone for routine notification times (e.g. America/Chicago). */
  timezone?: string;
  notificationPermissionStatus?: "granted" | "denied" | "skipped";
  routineItems?: {
    slug: string;
    label: string;
    cadence: string;
    target_per_week: number;
  }[];
  /** How the user found Palette Plotting (onboarding attribution step). */
  attributionSource?: string;
  /** Pre-permission choice for iOS ATT prompt; actual permission remains `trackingAuthorizationStatus`. */
  trackingPrePermissionChoice?: "yes" | "no" | null;
  trackingAuthorizationStatus?:
    | "authorized"
    | "denied"
    | "restricted"
    | "notDetermined"
    | "notRequested"
    | "unavailable"
    | "unknown"
    | null;
  trackingPermissionAskedAt?: string | null;
  desireCategory?: string;
  /** Focus categories (names matching `FOCUS_CATEGORIES`). Up to three; primary field is `desireCategory` (first). */
  desireCategories?: string[];
  currentFriction?: string;
  desiredIdentity?: string;
  conditionalSpecificity?: Record<string, unknown>;
  /** App shell appearance (`light` | `dark`). */
  appearance?: Appearance;
  toolPreferences?: string[];
  /** Keys from the "embody your new identity each day" setup step (exactly five when completed). Not synced to user_setup_path until a column exists. */
  embodyDailyPractices?: string[];
  /** Board workspace preset — chosen during setup; applied at first entitlement. */
  boardStarterTemplateSlug?: string;
  /** Primary setup path — seeds starter entitlement pack. */
  primaryIntent?: PrimarySetupIntent;
  homeFocusKey?: string;
  officePlanningSystem?: string;
  moodboardFocusKey?: string;
  /** UI locale (`en` | `es-419`) — set on welcome switcher or auto-detect. */
  locale?: "en" | "es-419";
};

const KEY = "pp_setup_draft_v1";
const LEGACY_KEY = "sv_setup_draft_v1";

export function readSetupDraft(): SetupDraft {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        localStorage.setItem(KEY, raw);
        localStorage.removeItem(LEGACY_KEY);
      }
    }
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as SetupDraft) : {};
  } catch {
    return {};
  }
}

export async function writeSetupDraft(
  patch: Partial<SetupDraft>,
  options?: { awaitBackendSync?: boolean },
): Promise<SetupDraft> {
  const prev = readSetupDraft();
  const next: SetupDraft = { ...prev, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  const syncPromise = import("./setupDraftBackendSync").then(({ syncSetupJourneyToBackend }) =>
    syncSetupJourneyToBackend(next),
  );
  if (options?.awaitBackendSync) {
    await syncPromise;
  } else {
    void syncPromise.catch((e) => {
      console.warn("[writeSetupDraft] backend sync failed:", e);
    });
  }
  return next;
}

export function clearSetupDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

