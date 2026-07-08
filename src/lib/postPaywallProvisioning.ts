// Starter provisioning: create the user's first board workspace after payment.
// starter_provisioned === true → skip forever.

import { supabase } from "@/integrations/supabase/client";
import { ensureStarterWorkspaceFromCategories, ensureStarterWorkspaceFromSlug, fetchUserWorkspaces } from "@/lib/boards/api";
import {
  DEFAULT_FOUR_BOARD_TEMPLATE,
  FOUR_BOARD_FOCUS_CATEGORIES_SLUG,
  HOME_FOCUS_TO_TEMPLATE,
  MOODBOARD_FOCUS_TO_TEMPLATE,
  OFFICE_SYSTEM_TO_TEMPLATE,
  normalizeFocusCategoryNames,
  type StartingSystem,
} from "@/lib/boards/starterTemplates";
import { clearSetupDraft, readSetupDraft, type SetupDraft } from "@/lib/setupDraft";

const ONBOARDING_SESSION_STORAGE_KEY = "onboarding_session";

type OnboardingSessionRow = {
  user_id?: string | null;
  email?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
};

type StarterProvisioningSeed = {
  startingSystem?: StartingSystem;
  desireCategories: string[];
  templateSlug: string;
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

function readStartingSystem(
  setupPath: Record<string, unknown> | null,
  localDraft: SetupDraft,
): StartingSystem | undefined {
  const fromPath = setupPath?.starting_system;
  if (
    fromPath === "life_rebranding" ||
    fromPath === "home_organization" ||
    fromPath === "office_work" ||
    fromPath === "moodboarding"
  ) {
    return fromPath;
  }
  return localDraft.startingSystem;
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

function readStringField(
  setupPath: Record<string, unknown> | null,
  pathKey: string,
  draftValue: string | undefined,
): string | undefined {
  const fromPath = setupPath?.[pathKey];
  if (typeof fromPath === "string" && fromPath.trim()) return fromPath.trim();
  if (typeof draftValue === "string" && draftValue.trim()) return draftValue.trim();
  return undefined;
}

function resolveTemplateSlugFromSetup(
  startingSystem: StartingSystem | undefined,
  setupPath: Record<string, unknown> | null,
  localDraft: SetupDraft,
): string {
  if (startingSystem === "home_organization") {
    const homeFocusKey = readStringField(setupPath, "home_focus_key", localDraft.homeFocusKey);
    if (homeFocusKey && HOME_FOCUS_TO_TEMPLATE[homeFocusKey]) {
      return HOME_FOCUS_TO_TEMPLATE[homeFocusKey];
    }
  }
  if (startingSystem === "office_work") {
    const officeSystem = readStringField(setupPath, "office_planning_system", localDraft.officePlanningSystem);
    if (officeSystem && OFFICE_SYSTEM_TO_TEMPLATE[officeSystem]) {
      return OFFICE_SYSTEM_TO_TEMPLATE[officeSystem];
    }
  }
  if (startingSystem === "moodboarding") {
    const moodboardFocusKey = readStringField(setupPath, "moodboard_focus_key", localDraft.moodboardFocusKey);
    if (moodboardFocusKey && MOODBOARD_FOCUS_TO_TEMPLATE[moodboardFocusKey]) {
      return MOODBOARD_FOCUS_TO_TEMPLATE[moodboardFocusKey];
    }
  }
  return DEFAULT_FOUR_BOARD_TEMPLATE.slug;
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

  const startingSystem = readStartingSystem(setupPath, localDraft);

  return {
    startingSystem,
    desireCategories: readDesireCategories(setupPath, localDraft),
    templateSlug: resolveTemplateSlugFromSetup(startingSystem, setupPath, localDraft),
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

  report(24);
  const existingWorkspaces = await fetchUserWorkspaces(userId);
  if (existingWorkspaces.length > 0) {
    await (supabase as any)
      .from("user_plans")
      .update({ starter_provisioned: true })
      .eq("user_id", userId);
    report(100);
    return { ran: false, skipped: true, reason: "workspace_already_exists" };
  }

  report(28);
  const seed = await resolveStarterProvisioningSeed(userId, session.user.email);

  try {
    report(40);
    const useCategoryBoards =
      seed.startingSystem === "life_rebranding" && seed.desireCategories.length > 0;
    if (useCategoryBoards) {
      const created = await ensureStarterWorkspaceFromCategories(userId, seed.desireCategories);
      if (!created) {
        await ensureStarterWorkspaceFromSlug(userId, FOUR_BOARD_FOCUS_CATEGORIES_SLUG);
      }
    } else {
      await ensureStarterWorkspaceFromSlug(userId, seed.templateSlug);
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
    "Self & Direction",
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
  return "Self & Direction";
}
