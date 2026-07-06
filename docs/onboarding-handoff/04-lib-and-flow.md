# Part 4 — Lib & flow

## src/lib/onboardingFlow.ts

```typescript
/** Native + default path list (full suite funnel). */
export const ONBOARDING_ROUTES = [
  "/onboarding/welcome",
  "/onboarding/setup/name",
  "/onboarding/setup/primary-intent",
  "/onboarding/setup/focus-categories",
  "/onboarding/setup/home-focus",
  "/onboarding/setup/office-planning-system",
  "/onboarding/setup/moodboard-focus",
  "/onboarding/setup/current-friction",
  "/onboarding/setup/begin-journey",
  "/onboarding/setup/attribution",
  "/onboarding/setup/intensity",
  "/onboarding/setup/notifications",
  "/onboarding/setup/workspace-template",
  "/onboarding/setup/plot-loading",
  "/onboarding/setup/plot-synthesis",
  "/onboarding/setup/email",
] as const;

/** Preserved suite web funnel for comprehensive-app ad work (`/onboarding/suite/...`). */
export const SUITE_WEB_ONBOARDING_ROUTES = [
  "/onboarding/suite/welcome",
  "/onboarding/suite/setup/name",
  "/onboarding/suite/setup/primary-intent",
  "/onboarding/suite/setup/focus-categories",
  "/onboarding/suite/setup/home-focus",
  "/onboarding/suite/setup/office-planning-system",
  "/onboarding/suite/setup/moodboard-focus",
  "/onboarding/suite/setup/current-friction",
  "/onboarding/suite/setup/begin-journey",
  "/onboarding/suite/setup/attribution",
  "/onboarding/suite/setup/intensity",
  "/onboarding/suite/setup/notifications",
  "/onboarding/suite/setup/workspace-template",
  "/onboarding/suite/setup/plot-loading",
  "/onboarding/suite/setup/plot-synthesis",
  "/onboarding/suite/setup/email",
] as const;

/** Web default onboarding path (shorter path, name before account). */
export const WEB_FAST_ONBOARDING_ROUTES = [
  "/onboarding/welcome",
  "/onboarding/setup/primary-intent",
  "/onboarding/setup/focus-categories",
  "/onboarding/setup/home-focus",
  "/onboarding/setup/office-planning-system",
  "/onboarding/setup/moodboard-focus",
  "/onboarding/setup/workspace-template",
  "/onboarding/setup/begin-journey",
  "/onboarding/setup/attribution",
  "/onboarding/setup/intensity",
  "/onboarding/setup/plot-loading",
  "/onboarding/setup/plot-synthesis",
  "/onboarding/setup/name",
  "/onboarding/setup/email",
] as const;

/** Setup steps only (after Welcome, before pricing): used for top progress bar. */
export const ONBOARDING_SETUP_PROGRESS_ROUTES = ONBOARDING_ROUTES.slice(1, -1);

export const SUITE_WEB_SETUP_PROGRESS_ROUTES = SUITE_WEB_ONBOARDING_ROUTES.slice(1, -1);

export const WEB_FAST_SETUP_PROGRESS_ROUTES = WEB_FAST_ONBOARDING_ROUTES.slice(1, -1);

export const ONBOARDING_STEP_LABELS = [
  "Welcome",
  "Your Name",
  "Intent",
  "Focus boards",
  "Friction",
  "Your studio",
  "Found us",
  "Rhythm",
  "Permissions",
  "Building room",
  "Your plot",
  "Account",
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_ROUTES.length;

```

---

## src/lib/focusDetailOptions.ts

```typescript
/**
 * Follow-up options for the focus-details step, keyed by focus category
 * (`FOCUS_CATEGORIES[].name`). Labels live in i18n; here we only branch on the id.
 */

export type FocusDetailOption = {
  /** Persisted in the focus-details payload (English) */
  value: string;
  labelKey: string;
};

export type FocusDetailOptionSet = {
  headlineKey: string;
  options: readonly FocusDetailOption[];
};

const CHOICE: Record<string, FocusDetailOptionSet> = {
  Identity: {
    headlineKey: "setup.focusDetails.categories.Identity.headline",
    options: [
      { value: "Confidence", labelKey: "setup.focusDetails.categories.Identity.options.confidence" },
      { value: "Discipline", labelKey: "setup.focusDetails.categories.Identity.options.discipline" },
      { value: "A new chapter", labelKey: "setup.focusDetails.categories.Identity.options.newChapter" },
      { value: "Self-trust", labelKey: "setup.focusDetails.categories.Identity.options.selfTrust" },
      { value: "Fresh start", labelKey: "setup.focusDetails.categories.Identity.options.freshStart" },
    ],
  },
  "Career & Money": {
    headlineKey: "setup.focusDetails.categories.Career & Money.headline",
    options: [
      { value: "New job", labelKey: "setup.focusDetails.categories.Career & Money.options.newJob" },
      { value: "Promotion", labelKey: "setup.focusDetails.categories.Career & Money.options.promotion" },
      { value: "Higher income", labelKey: "setup.focusDetails.categories.Career & Money.options.higherIncome" },
      { value: "Debt freedom", labelKey: "setup.focusDetails.categories.Career & Money.options.debtFreedom" },
      { value: "Start a business", labelKey: "setup.focusDetails.categories.Career & Money.options.startBusiness" },
    ],
  },
  "Love & Relationships": {
    headlineKey: "setup.focusDetails.categories.Love & Relationships.headline",
    options: [
      { value: "Dating", labelKey: "setup.focusDetails.categories.Love & Relationships.options.dating" },
      { value: "Deeper connection", labelKey: "setup.focusDetails.categories.Love & Relationships.options.deeperConnection" },
      { value: "Self-love", labelKey: "setup.focusDetails.categories.Love & Relationships.options.selfLove" },
      { value: "Better boundaries", labelKey: "setup.focusDetails.categories.Love & Relationships.options.betterBoundaries" },
      { value: "Quality time", labelKey: "setup.focusDetails.categories.Love & Relationships.options.quality" },
    ],
  },
  "Home & Space": {
    headlineKey: "setup.focusDetails.categories.Home & Space.headline",
    options: [
      { value: "Redecorate", labelKey: "setup.focusDetails.categories.Home & Space.options.redecorate" },
      { value: "Declutter & reset", labelKey: "setup.focusDetails.categories.Home & Space.options.declutter" },
      { value: "A new place", labelKey: "setup.focusDetails.categories.Home & Space.options.newPlace" },
      { value: "Cozy upgrade", labelKey: "setup.focusDetails.categories.Home & Space.options.cozyUpgrade" },
      { value: "Organized systems", labelKey: "setup.focusDetails.categories.Home & Space.options.systems" },
    ],
  },
  "Beauty & Wellness": {
    headlineKey: "setup.focusDetails.categories.Beauty & Wellness.headline",
    options: [
      { value: "Skin & beauty", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.skinBeauty" },
      { value: "Self-care routine", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.selfCare" },
      { value: "Better rest", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.betterRest" },
      { value: "Confidence", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.confidence" },
      { value: "Overall wellness", labelKey: "setup.focusDetails.categories.Beauty & Wellness.options.overallWellness" },
    ],
  },
  "Travel & Adventure": {
    headlineKey: "setup.focusDetails.categories.Travel & Adventure.headline",
    options: [
      { value: "Dream trip", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.dreamTrip" },
      { value: "Move abroad", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.moveAbroad" },
      { value: "Weekend escapes", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.weekendEscapes" },
      { value: "Bucket list", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.bucketList" },
      { value: "Digital nomad life", labelKey: "setup.focusDetails.categories.Travel & Adventure.options.nomadLife" },
    ],
  },
  "Organization & Plan": {
    headlineKey: "setup.focusDetails.categories.Organization & Plan.headline",
    options: [
      { value: "My schedule", labelKey: "setup.focusDetails.categories.Organization & Plan.options.mySchedule" },
      { value: "My space", labelKey: "setup.focusDetails.categories.Organization & Plan.options.mySpace" },
      { value: "My routines", labelKey: "setup.focusDetails.categories.Organization & Plan.options.myRoutines" },
      { value: "My priorities", labelKey: "setup.focusDetails.categories.Organization & Plan.options.myPriorities" },
      { value: "My whole life", labelKey: "setup.focusDetails.categories.Organization & Plan.options.myWholeLife" },
    ],
  },
  "Aesthetic & Mood": {
    headlineKey: "setup.focusDetails.categories.Aesthetic & Mood.headline",
    options: [
      { value: "Personal style", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.personalStyle" },
      { value: "Interiors", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.interiors" },
      { value: "Color palette", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.colorPalette" },
      { value: "Creative direction", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.creativeDirection" },
      { value: "Overall aesthetic", labelKey: "setup.focusDetails.categories.Aesthetic & Mood.options.overallAesthetic" },
    ],
  },
  "College & School": {
    headlineKey: "setup.focusDetails.categories.College & School.headline",
    options: [
      { value: "Better grades", labelKey: "setup.focusDetails.categories.College & School.options.betterGrades" },
      { value: "Exam success", labelKey: "setup.focusDetails.categories.College & School.options.examSuccess" },
      { value: "College acceptance", labelKey: "setup.focusDetails.categories.College & School.options.collegeAcceptance" },
      { value: "Scholarship", labelKey: "setup.focusDetails.categories.College & School.options.scholarship" },
      { value: "Focus & study habits", labelKey: "setup.focusDetails.categories.College & School.options.studyHabits" },
    ],
  },
  "Health & Fitness": {
    headlineKey: "setup.focusDetails.categories.Health & Fitness.headline",
    options: [
      { value: "Strength", labelKey: "setup.focusDetails.categories.Health & Fitness.options.strength" },
      { value: "Shape & tone", labelKey: "setup.focusDetails.categories.Health & Fitness.options.shapeTone" },
      { value: "Energy", labelKey: "setup.focusDetails.categories.Health & Fitness.options.energy" },
      { value: "Consistent workouts", labelKey: "setup.focusDetails.categories.Health & Fitness.options.consistentWorkouts" },
      { value: "Nutrition", labelKey: "setup.focusDetails.categories.Health & Fitness.options.nutrition" },
    ],
  },
};

export function getFocusDetailOptions(category: string): FocusDetailOptionSet | null {
  return CHOICE[category.trim()] ?? null;
}

/** Focus-details step removed from onboarding — categories are enough for starter boards. */
export function needsFocusDetailsStep(_category: string): boolean {
  return false;
}

export function normalizeFocusCategory(raw: string | undefined): string {
  return (raw ?? "").trim();
}

```

---

## src/lib/focusCategories.ts

```typescript
import i18n from "@/i18n";

/** `name` is the stored value (DB, AI, onboarding storage) and equals `label`. */
export interface FocusCategoryDef {
  name: string;
  label: string;
  color: string;
}

// Board focus categories (10 total). Order = 2-col grid on the setup focus screen.
// `name` === `label` — no separate internal taxonomy. Keep in sync with the board image library themes.
export const FOCUS_CATEGORIES: FocusCategoryDef[] = [
  { name: "Identity", label: "Identity", color: "#E8B4B8" },
  { name: "Career & Money", label: "Career & Money", color: "#3CB371" },
  { name: "Love & Relationships", label: "Love & Relationships", color: "#FF4DA6" },
  { name: "Home & Space", label: "Home & Space", color: "#87CEEB" },
  { name: "Beauty & Wellness", label: "Beauty & Wellness", color: "#F8BBD0" },
  { name: "Travel & Adventure", label: "Travel & Adventure", color: "#FF8C42" },
  { name: "Organization & Plan", label: "Organization & Plan", color: "#2563EB" },
  { name: "Aesthetic & Mood", label: "Aesthetic & Mood", color: "#FFD93D" },
  { name: "College & School", label: "College & School", color: "#98FB98" },
  { name: "Health & Fitness", label: "Health & Fitness", color: "#E63946" },
];

export function getFocusCategoryLabel(category: string | null | undefined): string {
  if (category == null || category === "") return "";
  const key = `focusCategories.${category}`;
  if (i18n.exists(key, { ns: "tools" })) {
    return i18n.t(key, { ns: "tools" });
  }
  const row = FOCUS_CATEGORIES.find((c) => c.name === category);
  return row?.label ?? category;
}

```

---

## src/lib/setupDraft.ts

```typescript
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


```

---

## src/lib/setupDraftBackendSync.ts

```typescript
import { supabase } from "@/integrations/supabase/client";
import type { SetupDraft } from "@/lib/setupDraft";
import { normalizeFocusDetailFromUnknown } from "@/lib/focusDetailStorage";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import { buildOnboardingAttributionPatch } from "@/lib/attribution";

const SHELL_APPEARANCES = new Set(["light", "dark"]);

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
    desire_categories: Array.isArray(draft.desireCategories)
      ? draft.desireCategories.filter((c): c is string => typeof c === "string").slice(0, 3)
      : null,
    // Do not persist a separate "desire text" anymore; the setup flow uses friction/identity + signals instead.
    desire_text: null,
    why_it_matters: null,
    current_friction: typeof draft.currentFriction === "string" ? draft.currentFriction : null,
    desired_identity: typeof draft.desiredIdentity === "string" ? draft.desiredIdentity.trim().slice(0, 200) || null : null,
    tool_preferences: Array.isArray(draft.toolPreferences)
      ? draft.toolPreferences.filter((t): t is string => typeof t === "string")
      : [],
    conditional_specificity: normalizeFocusDetailFromUnknown(
      draft.conditionalSpecificity,
      draft.desireCategory,
    ),
    shell_appearance:
      typeof draft.appearance === "string" && SHELL_APPEARANCES.has(draft.appearance) ? draft.appearance : null,
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
          routine_intensity: draft.intensity,
          routine_items: draft.routineItems ?? [],
          routine_notification_times: draft.routineNotificationTimes ?? [],
          notification_permission_status: draft.notificationPermissionStatus ?? null,
        },
      };
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

    const creds = readStoredCreds();
    if (creds) {
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
    }

    const embodySlugs = mapOnboardingEmbodyKeysToAppSlugs(draft.embodyDailyPractices);

    const prefRow: Record<string, unknown> = { user_id: userId };
    const profileRow: Record<string, unknown> = { id: userId };
    if (embodySlugs) prefRow.embody_active_practices = embodySlugs;
    if (draft.locale === "en" || draft.locale === "es-419") {
      prefRow.preferred_locale = draft.locale;
      profileRow.preferred_locale = draft.locale;
    }
    if (
      draft.intensity === "light" ||
      draft.intensity === "consistent" ||
      draft.intensity === "locked_in"
    ) {
      prefRow.routine_intensity = draft.intensity;
      profileRow.routine_intensity = draft.intensity;
      prefRow.routine_items = draft.routineItems ?? [];
      profileRow.routine_items = draft.routineItems ?? [];
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

```

---

## src/lib/postPaywallProvisioning.ts

```typescript
// Starter provisioning: create the user's first board workspace after payment.
// starter_provisioned === true → skip forever.

import { supabase } from "@/integrations/supabase/client";
import { ensureStarterWorkspaceFromCategories, ensureStarterWorkspaceFromSlug } from "@/lib/boards/api";
import {
  DEFAULT_FOUR_BOARD_TEMPLATE,
  FOUR_BOARD_FOCUS_CATEGORIES_SLUG,
  normalizeFocusCategoryNames,
  type PrimarySetupIntent,
} from "@/lib/boards/starterTemplates";
import { clearSetupDraft, readSetupDraft, type SetupDraft } from "@/lib/setupDraft";

const ONBOARDING_SESSION_STORAGE_KEY = "onboarding_session";

type OnboardingSessionRow = {
  user_id?: string | null;
  email?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
};

type StarterProvisioningSeed = {
  boardStarterTemplateSlug: string;
  primaryIntent?: PrimarySetupIntent;
  desireCategories: string[];
  usedTrustedLocalDraft: boolean;
};

function readOnboardingSessionCreds(): { sessionId: string; resumeToken: string } | null {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const raw = storage.getItem(ONBOARDING_SESSION_STORAGE_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { sessionId?: string; resumeToken?: string };
      if (parsed?.sessionId && parsed?.resumeToken) {
        return { sessionId: String(parsed.sessionId), resumeToken: String(parsed.resumeToken) };
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function fetchCurrentOnboardingSession(): Promise<OnboardingSessionRow | null> {
  const creds = readOnboardingSessionCreds();
  if (!creds) return null;
  try {
    const { data } = await supabase.functions.invoke("get-onboarding-session", {
      body: { sessionId: creds.sessionId, resumeToken: creds.resumeToken },
    });
    if (data?.session && typeof data.session === "object") {
      return data.session as OnboardingSessionRow;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readSetupPathV1(answers: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!answers || typeof answers !== "object") return null;
  const sp = answers.setup_path_v1;
  return sp && typeof sp === "object" && !Array.isArray(sp) ? (sp as Record<string, unknown>) : null;
}

function isOnboardingSessionTrustedForAuth(
  userId: string,
  authEmail: string | undefined,
  onboardingSession: OnboardingSessionRow | null,
): boolean {
  if (!onboardingSession) return false;
  if (onboardingSession.user_id && onboardingSession.user_id === userId) return true;
  const authNorm = authEmail?.trim().toLowerCase() ?? "";
  const sessionEmail = onboardingSession.email?.trim().toLowerCase() ?? "";
  if (sessionEmail && authNorm && sessionEmail === authNorm) return true;
  return false;
}

function isLocalSetupDraftTrusted(
  draft: SetupDraft,
  userId: string,
  authEmail: string | undefined,
  onboardingSession: OnboardingSessionRow | null,
): boolean {
  if (!isOnboardingSessionTrustedForAuth(userId, authEmail, onboardingSession)) return false;
  const authNorm = authEmail?.trim().toLowerCase() ?? "";
  const draftEmail = draft.email?.trim().toLowerCase() ?? "";
  if (draftEmail && authNorm && draftEmail !== authNorm) return false;
  const sessionEmail = onboardingSession!.email?.trim().toLowerCase() ?? "";
  if (draftEmail && sessionEmail && draftEmail !== sessionEmail) return false;
  return true;
}

function readPrimaryIntent(
  setupPath: Record<string, unknown> | null,
  localDraft: SetupDraft,
): PrimarySetupIntent | undefined {
  const fromPath = setupPath?.primary_intent;
  if (
    fromPath === "life_rebranding" ||
    fromPath === "home_organization" ||
    fromPath === "office_work" ||
    fromPath === "moodboarding"
  ) {
    return fromPath;
  }
  return localDraft.primaryIntent;
}

function readDesireCategories(
  setupPath: Record<string, unknown> | null,
  localDraft: SetupDraft,
): string[] {
  const fromPath = setupPath?.desire_categories;
  if (Array.isArray(fromPath)) {
    const normalized = normalizeFocusCategoryNames(fromPath.filter((c): c is string => typeof c === "string"));
    if (normalized.length > 0) return normalized;
  }
  return normalizeFocusCategoryNames(localDraft.desireCategories);
}

async function resolveStarterProvisioningSeed(
  userId: string,
  authEmail: string | undefined,
): Promise<StarterProvisioningSeed> {
  const onboardingSession = await fetchCurrentOnboardingSession();
  const localDraft = readSetupDraft();
  const sessionTrustedForAuth = isOnboardingSessionTrustedForAuth(userId, authEmail, onboardingSession);
  const trustedLocalDraft = isLocalSetupDraftTrusted(localDraft, userId, authEmail, onboardingSession);
  const setupPath = sessionTrustedForAuth
    ? readSetupPathV1(onboardingSession?.onboarding_answers ?? null)
    : null;

  const boardStarterTemplateSlug =
    (typeof setupPath?.board_starter_template_slug === "string" && setupPath.board_starter_template_slug.trim()) ||
    localDraft.boardStarterTemplateSlug?.trim() ||
    DEFAULT_FOUR_BOARD_TEMPLATE.slug;

  return {
    boardStarterTemplateSlug,
    primaryIntent: readPrimaryIntent(setupPath, localDraft),
    desireCategories: readDesireCategories(setupPath, localDraft),
    usedTrustedLocalDraft: trustedLocalDraft,
  };
}

export type ProvisionPostPaywallResult = { ran: boolean; skipped: boolean; reason?: string };

export async function provisionPostPaywallIfNeeded(options?: {
  quiet?: boolean;
  onProgress?: (percent: number) => void;
}): Promise<ProvisionPostPaywallResult> {
  const report = (percent: number) => options?.onProgress?.(percent);

  report(8);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    return { ran: false, skipped: true, reason: "no_session" };
  }

  const userId = session.user.id;
  report(18);

  const { data: planRow } = await (supabase as any)
    .from("user_plans")
    .select("starter_provisioned")
    .eq("user_id", userId)
    .maybeSingle();

  if (planRow?.starter_provisioned) {
    report(100);
    return { ran: false, skipped: true, reason: "already_provisioned" };
  }

  report(28);
  const seed = await resolveStarterProvisioningSeed(userId, session.user.email);

  try {
    report(40);
    const useCategoryBoards =
      seed.primaryIntent === "life_rebranding" && seed.desireCategories.length > 0;
    if (useCategoryBoards) {
      const created = await ensureStarterWorkspaceFromCategories(userId, seed.desireCategories);
      if (!created) {
        await ensureStarterWorkspaceFromSlug(userId, FOUR_BOARD_FOCUS_CATEGORIES_SLUG);
      }
    } else {
      await ensureStarterWorkspaceFromSlug(userId, seed.boardStarterTemplateSlug);
    }

    await (supabase as any)
      .from("user_plans")
      .update({ starter_provisioned: true })
      .eq("user_id", userId);

    if (seed.usedTrustedLocalDraft) {
      clearSetupDraft();
    }

    report(100);
    return { ran: true, skipped: false };
  } catch (e) {
    if (import.meta.env.DEV) console.error("[postPaywallProvisioning] unexpected:", e);
    return { ran: true, skipped: true, reason: "error" };
  }
}

// Kept for callers that still map onboarding focus keys to weekly goal categories.
export function mapDesireSetupKeyToWeeklyCategory(desireCategory?: string): string {
  const raw = (desireCategory || "").trim();
  const categories = new Set([
    "Identity",
    "Career & Money",
    "Love & Relationships",
    "Home & Space",
    "Beauty & Wellness",
    "Travel & Adventure",
    "Organization & Plan",
    "Aesthetic & Mood",
    "College & School",
    "Health & Fitness",
  ]);
  if (categories.has(raw)) return raw;
  return "Identity";
}

```

---

## src/lib/marketingConversionCopy.ts

```typescript
/** Shared marketing copy — Palette Plotting (fresh names, full toolkit depth). */

/** White line, then pink accent line (see MarketingHeroCopy). */
export const MARKETING_HEADLINE_LINE1 = "Plot the life you're";
export const MARKETING_HEADLINE_ACCENT = "stepping into";

export const MARKETING_HERO_FREE_TRIAL_LINE = "Start Your Free Trial Now";
/** Shorter hero pill on mobile — full download line lives in sticky bar / download section. */
export const MARKETING_CTA_HERO_MOBILE = "Start your free trial";

export const MARKETING_SUBHEAD_LINES = [
  "Four boards + The Plan",
  "Drag-and-drop editor + themed images",
  "Journal + progress tracking",
] as const;

export const MARKETING_AWARD_LINE = "The viral 4-board system — now digital";

/** Bottom download section — short mobile heading above store badges. */
export const MARKETING_DOWNLOAD_SECTION_HEADING = "Download the app";
export const MARKETING_CTA_DOWNLOAD = "Download the app & start free trial";
export const MARKETING_CTA_DOWNLOAD_IOS = "Download the app & start free trial";
export const MARKETING_CTA_DOWNLOAD_ANDROID = "Download the app & start free trial";
export const MARKETING_FREE_TRIAL_UNDER_BADGES = "Start your free trial in the App Store";
/** Primary CTA on /onboarding/welcome (browser). */
export const MARKETING_CTA_PRIMARY = "Get started";
export const MARKETING_WEB_ONBOARDING_WELCOME_PATH = "/onboarding/welcome";
export const MARKETING_WEB_ONBOARDING_SETUP_PATH = "/onboarding/setup/primary-intent";
export const MARKETING_CTA_WEB_SETUP = "~3 min set up · no card to browse";

```

---

