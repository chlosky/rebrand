// Starter provisioning is a first-payment creation step, not a repair system.
// - starter_provisioned === true → skip forever
// - post-paywall + authenticated + starter_provisioned !== true → run once
// - affirmations first (intermediate); subliminal DB insert second (terminal success)
// - starter_provisioned = true only after subliminal insert succeeds
// - if subliminal fails after affirmations, leave affirmations; flag stays false
// - no inspection of historical starter rows; no missing-content repair; no rollback deletes

import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { ensureStarterWorkspaceFromSlug } from "@/lib/boards/api";
import { DEFAULT_FOUR_BOARD_TEMPLATE } from "@/lib/boards/starterTemplates";
import { clearSetupDraft, readSetupDraft, type SetupDraft } from "@/lib/setupDraft";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import { getSupportCategoryLabel } from "@/lib/affirmations-data";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { readStoredPreferredLocale, resolveAppLocale, type AppLocale } from "@/lib/locale";
import i18n from "@/i18n";

// Post-paywall provisioning intentionally does NOT generate a starter belief
// elimination. Earlier iterations called `ensureStarterBeliefEntry`, which hit
// `check-content-moderation` + `refactor-belief` edge functions (multiple LLM
// round-trips) on top of the affirmation and subliminal pipeline. That added
// 5–15s to the post-paywall wait, which is why the loading meter sat at 92%.
// Beliefs are created on demand from the Refactor tool; do not re-add a
// starter belief here.

/** Manifestation milestones categories (weekly_goals) — mirrors ActivityTracking. */
const SUPPORT_CATEGORY_NAMES = new Set([
  "Career",
  "Business",
  "Learning",
  "Finances",
  "Productivity",
  "Organization",
  "Confidence",
  "Self-Love",
  "Connections",
  "Fitness",
  "Nutrition",
  "Discipline",
]);

const DESIRE_SETUP_KEY_TO_CATEGORY: Record<string, string> = {
  sp_love: "Self-Love",
  money_wealth: "Finances",
  self_concept: "Confidence",
  beauty_self_image: "Self-Love",
  career_success: "Career",
  peace_detachment: "Confidence",
  multiple: "Productivity",
  custom: "Productivity",
};

const STARTER_AFFIRMATION_SET_NAME_BY_LOCALE: Record<AppLocale, string> = {
  en: "Your starter path",
  "es-419": "Tu camino inicial",
  "pt-BR": "Seu caminho inicial",
};

const STARTER_SUBLIMINAL_NAME_BY_LOCALE: Record<AppLocale, string> = {
  en: "Starter subliminal",
  "es-419": "Tu subliminal inicial",
  "pt-BR": "Seu subliminal inicial",
};

const LEGACY_STARTER_SUBLIMINAL_NAME = "Starter subliminal (TTS)";

/** English canonical names (backward compat for imports). */
export const STARTER_AFFIRMATION_SET_NAME = STARTER_AFFIRMATION_SET_NAME_BY_LOCALE.en;
export const STARTER_SUBLIMINAL_NAME = STARTER_SUBLIMINAL_NAME_BY_LOCALE.en;

/** All stored starter names — used by feature UI to recognize localized starter content labels. */
export const STARTER_AFFIRMATION_SET_NAMES = Object.values(STARTER_AFFIRMATION_SET_NAME_BY_LOCALE);
export const STARTER_SUBLIMINAL_NAMES = [
  ...Object.values(STARTER_SUBLIMINAL_NAME_BY_LOCALE),
  LEGACY_STARTER_SUBLIMINAL_NAME,
];

/** iOS/web keep a 5-min starter; Android uses 1 min to cut WASM encode time on device. */
export function getStarterSubliminalDurationMinutes(): number {
  return isAndroidPaywallContext() ? 1 : 5;
}

const ONBOARDING_SESSION_STORAGE_KEY = "onboarding_session";

type OnboardingSessionRow = {
  user_id?: string | null;
  email?: string | null;
  first_name?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
};

type StarterProvisioningSeed = {
  locale: AppLocale;
  category: string;
  topicDraft: SetupDraft;
  embodySlugs: string[] | null;
  boardStarterTemplateSlug: string;
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

async function fetchUserPreferredLocaleFromDb(userId: string): Promise<string | null> {
  const [{ data: prefs }, { data: profile }] = await Promise.all([
    supabase.from("user_preferences").select("preferred_locale").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("preferred_locale").eq("id", userId).maybeSingle(),
  ]);
  const fromPrefs = (prefs as { preferred_locale?: string | null } | null)?.preferred_locale;
  const fromProfile = (profile as { preferred_locale?: string | null } | null)?.preferred_locale;
  return fromPrefs ?? fromProfile ?? null;
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

function topicDraftFromSetupPath(setupPath: Record<string, unknown>): SetupDraft {
  const draft: SetupDraft = {};
  if (typeof setupPath.desire_category === "string" && setupPath.desire_category.trim()) {
    draft.desireCategory = setupPath.desire_category.trim();
  }
  if (
    setupPath.conditional_specificity &&
    typeof setupPath.conditional_specificity === "object" &&
    !Array.isArray(setupPath.conditional_specificity)
  ) {
    draft.conditionalSpecificity = setupPath.conditional_specificity as Record<string, unknown>;
  }
  if (typeof setupPath.board_starter_template_slug === "string" && setupPath.board_starter_template_slug.trim()) {
    draft.boardStarterTemplateSlug = setupPath.board_starter_template_slug.trim();
  }
  return draft;
}

function embodySlugsFromSetupPath(setupPath: Record<string, unknown> | null): string[] | null {
  if (!setupPath) return null;
  const raw = setupPath.embody_active_practices;
  if (!Array.isArray(raw)) return null;
  const slugs = raw.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
  return slugs.length ? slugs : null;
}

async function resolveStarterProvisioningSeed(
  userId: string,
  authEmail: string | undefined,
): Promise<StarterProvisioningSeed> {
  const [onboardingSession, dbLocale] = await Promise.all([
    fetchCurrentOnboardingSession(),
    fetchUserPreferredLocaleFromDb(userId),
  ]);
  const localDraft = readSetupDraft();
  const sessionTrustedForAuth = isOnboardingSessionTrustedForAuth(
    userId,
    authEmail,
    onboardingSession,
  );
  const trustedLocalDraft = isLocalSetupDraftTrusted(localDraft, userId, authEmail, onboardingSession);
  const setupPath = sessionTrustedForAuth
    ? readSetupPathV1(onboardingSession?.onboarding_answers ?? null)
    : null;
  const serverTopicDraft = setupPath ? topicDraftFromSetupPath(setupPath) : {};
  const topicDraft: SetupDraft = trustedLocalDraft
    ? {
        ...serverTopicDraft,
        desireCategory: serverTopicDraft.desireCategory ?? localDraft.desireCategory,
        conditionalSpecificity:
          serverTopicDraft.conditionalSpecificity ?? localDraft.conditionalSpecificity,
        boardStarterTemplateSlug:
          serverTopicDraft.boardStarterTemplateSlug ?? localDraft.boardStarterTemplateSlug,
      }
    : serverTopicDraft;

  const locale = resolveAppLocale(
    i18n.resolvedLanguage ||
      i18n.language ||
      readStoredPreferredLocale() ||
      dbLocale ||
      (trustedLocalDraft ? localDraft.locale : undefined) ||
      "en",
  );

  const category = mapDesireSetupKeyToWeeklyCategory(topicDraft.desireCategory);

  const embodySlugs =
    embodySlugsFromSetupPath(setupPath) ??
    (trustedLocalDraft ? mapOnboardingEmbodyKeysToAppSlugs(localDraft.embodyDailyPractices) : null);

  const boardStarterTemplateSlug =
    topicDraft.boardStarterTemplateSlug?.trim() || DEFAULT_FOUR_BOARD_TEMPLATE.slug;

  return {
    locale,
    category,
    topicDraft,
    embodySlugs,
    boardStarterTemplateSlug,
    usedTrustedLocalDraft: trustedLocalDraft,
  };
}

export function mapDesireSetupKeyToWeeklyCategory(desireCategory?: string): string {
  const raw = (desireCategory || "").trim();
  if (SUPPORT_CATEGORY_NAMES.has(raw)) return raw;
  const mapped = DESIRE_SETUP_KEY_TO_CATEGORY[raw];
  const category = mapped && SUPPORT_CATEGORY_NAMES.has(mapped) ? mapped : "Confidence";
  return category;
}

function buildConditionalAnswer(draft: SetupDraft): string {
  const raw = draft.conditionalSpecificity;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  const rec = raw as Record<string, unknown>;

  const branch = typeof rec.branch === "string" ? rec.branch : "";

  if (branch === "sp_person") {
    const spRaw = rec.sp;
    if (!spRaw || typeof spRaw !== "object" || Array.isArray(spRaw)) return "";
    const sp = spRaw as Record<string, unknown>;
    const choice = typeof sp.hasSpecificPerson === "string" ? sp.hasSpecificPerson : "";
    const label = typeof sp.label === "string" ? sp.label.trim() : "";
    const choiceLabel =
      choice === "yes"
        ? "Yes"
        : choice === "no"
          ? "No"
          : choice === "complicated"
            ? "It's complicated"
            : choice === "prefer_not"
              ? "Prefer not to say"
              : "";
    if (!choiceLabel) return "";
    return label ? `${choiceLabel} — ${label}` : choiceLabel;
  }

  if (branch === "step7_options") {
    const s7Raw = rec.step7;
    if (!s7Raw || typeof s7Raw !== "object" || Array.isArray(s7Raw)) return "";
    const s7 = s7Raw as Record<string, unknown>;
    const sel = typeof s7.selection === "string" ? s7.selection.trim() : "";
    const custom = typeof s7.customText === "string" ? s7.customText.trim() : "";
    if (!sel) return "";
    if (sel === "Custom" && custom) return custom;
    return sel;
  }

  return "";
}

function buildAffirmationTopic(draft: SetupDraft): string {
  const category = mapDesireSetupKeyToWeeklyCategory(draft.desireCategory);
  const displayCategory = (() => {
    const label = getSupportCategoryLabel(category);
    // UI-only rename: "Beauty / Glow Up" should be "Glow Up" as a topic seed.
    return label === "Beauty / Glow Up" ? "Glow Up" : label;
  })();
  // Special exception: for Love/SP, use only the category (no conditional text).
  if (category === "Connections" || category === "sp_love") {
    return displayCategory.length > 50 ? displayCategory.slice(0, 50) : displayCategory;
  }
  const answer = buildConditionalAnswer(draft);
  if (!answer) {
    return displayCategory.length > 50 ? displayCategory.slice(0, 50) : displayCategory;
  }
  const combined = `${displayCategory} — ${answer}`.trim();
  return combined.length > 50 ? combined.slice(0, 50) : combined;
}

function clipAffirmationsForTts(affirmations: string[], maxChars: number): string[] {
  const joined = affirmations.map((a) => a.trim()).filter(Boolean);
  if (joined.length === 0) return ["I am moving forward with calm confidence."];
  const total = joined.join(" ").length;
  if (total <= maxChars) return joined;
  const out: string[] = [];
  let used = 0;
  for (const line of joined) {
    const next = used + line.length + (out.length > 0 ? 1 : 0);
    if (next > maxChars) {
      const room = maxChars - used - (out.length > 0 ? 1 : 0);
      if (room > 12) out.push(line.slice(0, room).trim());
      break;
    }
    out.push(line);
    used = next;
  }
  return out.length ? out : [joined[0].slice(0, maxChars)];
}

async function createStarterAffirmationSet(
  userId: string,
  draft: SetupDraft,
  category: string,
  locale: AppLocale
): Promise<{ id: string; affirmations: string[] } | null> {
  const topic = buildAffirmationTopic(draft);
  const { data, error } = await supabase.functions.invoke("generate-affirmations", {
    body: { topic, category, locale },
  });

  if (data?.error || data?.blocked) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] generate-affirmations body error:", data);
    return null;
  }
  if (error) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] generate-affirmations invoke error:", error);
    return null;
  }
  const affirmations = Array.isArray(data?.affirmations) ? (data.affirmations as string[]) : [];
  if (affirmations.length === 0) return null;

  const setId = crypto.randomUUID();
  const { error: insertError } = await (supabase as any).from("user_affirmation_sets").insert({
    id: setId,
    user_id: userId,
    name: STARTER_AFFIRMATION_SET_NAME_BY_LOCALE[locale],
    affirmations,
    images: [],
    category: SUPPORT_CATEGORY_NAMES.has(category) ? category : "Confidence",
  });

  if (insertError) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] affirmation set insert failed:", insertError);
    return null;
  }

  await (supabase as any).from("ai_affirmation_generation_log").insert({
    user_id: userId,
    set_id: setId,
    generated_at: new Date().toISOString(),
  });

  return { id: setId, affirmations };
}

async function fetchVocalBaseMp3Blob(accessToken: string, affirmations: string[]): Promise<Blob | null> {
  const clipped = clipAffirmationsForTts(affirmations, 480);
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-affirmation-audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ affirmations: clipped, voice: "nova" }),
  });
  const raw = await response.text();
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
  if (!response.ok || parsed?.error || !parsed?.audioContent) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] TTS failed", response.status, parsed?.error);
    return null;
  }
  try {
    const binaryString = atob(parsed.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return new Blob([bytes], { type: "audio/mpeg" });
  } catch {
    return null;
  }
}

async function ensureStarterSubliminalTrack(
  userId: string,
  accessToken: string,
  affirmations: string[],
  locale: AppLocale,
  onProgress?: (percent: number) => void
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const starterSubliminalName = STARTER_SUBLIMINAL_NAME_BY_LOCALE[locale];

  onProgress?.(62);
  const vocalBaseBlob = await fetchVocalBaseMp3Blob(accessToken, affirmations);
  if (!vocalBaseBlob) return { ok: false, reason: "starter_subliminal_tts_failed" };

  onProgress?.(68);
  const durationMinutes = getStarterSubliminalDurationMinutes();
  let AudioProcessor: typeof import("@/lib/audioProcessor").AudioProcessor;
  try {
    ({ AudioProcessor } = await import("@/lib/audioProcessor"));
  } catch {
    return { ok: false, reason: "starter_subliminal_processor_load_failed" };
  }
  const processor = new AudioProcessor();
  let subliminalBlob: Blob;
  try {
    subliminalBlob = await processor.generateSubliminalTrack({
      affirmationBlob: vocalBaseBlob,
      binauralType: "theta",
      binauralVolume: 0.07,
      backgroundSound: "Rain v2.WAV",
      affirmationVolume: 0.07,
      backgroundVolume: 1,
      layers: 1,
      duration: durationMinutes,
      onMixProgress: (mixPct) => {
        onProgress?.(68 + Math.round(mixPct * 0.27));
      },
    });
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] subliminal mix failed:", e);
    return { ok: false, reason: "starter_subliminal_mix_failed" };
  } finally {
    processor.dispose();
  }

  onProgress?.(96);
  const fileName = `${userId}/${Date.now()}_${starterSubliminalName.replace(/[^a-z0-9]/gi, "_")}.mp3`;
  const { error: uploadError } = await supabase.storage.from("subliminal-tracks").upload(fileName, subliminalBlob, {
    contentType: "audio/mpeg",
    upsert: false,
  });

  if (uploadError) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] subliminal upload failed:", uploadError);
    return { ok: false, reason: "starter_subliminal_upload_failed" };
  }

  const { data: publicData } = supabase.storage.from("subliminal-tracks").getPublicUrl(fileName);
  const publicUrl = publicData?.publicUrl;
  if (!publicUrl) {
    return { ok: false, reason: "starter_subliminal_public_url_failed" };
  }

  const { data: dbTrack, error: dbError } = await (supabase as any)
    .from("subliminal_tracks")
    .insert({
      user_id: userId,
      name: starterSubliminalName,
      binaural_beat: "theta",
      binaural_volume: 0.07,
      background_sound: "Rain v2.WAV",
      affirmation_volume: 0.07,
      background_volume: 1,
      layers: 1,
      length: durationMinutes,
      audio_url: publicUrl,
    })
    .select("id")
    .single();

  if (dbError || !dbTrack?.id) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] subliminal db insert failed:", dbError);
    return { ok: false, reason: "starter_subliminal_db_insert_failed" };
  }

  await (supabase as any).from("subliminal_generation_log").insert({
    user_id: userId,
    track_id: dbTrack.id,
    generated_at: new Date().toISOString(),
  });

  onProgress?.(100);
  return { ok: true };
}

export type ProvisionPostPaywallResult = { ran: boolean; skipped: boolean; reason?: string };

/**
 * First-payment creation step (not a repair system). Call only from post-paywall loading screens.
 * Skip when starter_provisioned is true. Otherwise create workspace + affirmations; flag true
 * after affirmation set succeeds.
 */
export async function provisionPostPaywallIfNeeded(options?: {
  quiet?: boolean;
  /** 0–100 milestones while starter content is created (post-paywall UI). */
  onProgress?: (percent: number) => void;
}): Promise<ProvisionPostPaywallResult> {
  const quiet = options?.quiet ?? true;
  const report = (percent: number) => options?.onProgress?.(percent);

  report(8);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id || !session.access_token) {
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
    report(32);
    await ensureStarterWorkspaceFromSlug(userId, seed.boardStarterTemplateSlug);

    report(38);
    const set = await createStarterAffirmationSet(userId, seed.topicDraft, seed.category, seed.locale);

    if (!set?.affirmations.length) {
      return { ran: true, skipped: true, reason: "starter_affirmation_set_failed" };
    }

    report(52);

    await (supabase as any)
      .from("user_plans")
      .update({ starter_provisioned: true })
      .eq("user_id", userId);

    if (seed.usedTrustedLocalDraft) {
      clearSetupDraft();
    }

    report(100);

    if (!quiet) {
      // Callers may show UI; this module stays toast-free.
    }

    return { ran: true, skipped: false };
  } catch (e) {
    if (import.meta.env.DEV) console.error("[postPaywallProvisioning] unexpected:", e);
    return { ran: true, skipped: true, reason: "error" };
  }
}
