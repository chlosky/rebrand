import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";
import { buildOnboardingAttributionPatch } from "@/lib/attribution";

const RECORDED_KEY = "pp_web_onboarding_session_recorded_v1";
const CLIENT_VISIT_KEY = "pp_web_onboarding_client_visit_v1";

let recordStartPromise: Promise<void> | null = null;

function createClientVisitId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* insecure context (e.g. http://LAN-IP) — fall through */
  }
  return `pp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getOrCreateClientVisitId(): string {
  try {
    const existing = sessionStorage.getItem(CLIENT_VISIT_KEY);
    if (existing) return existing;
    const id = createClientVisitId();
    sessionStorage.setItem(CLIENT_VISIT_KEY, id);
    return id;
  } catch {
    return createClientVisitId();
  }
}

export type WebOnboardingSessionInsert = {
  client_visit_id: string;
  entry_path?: string;
  page_path?: string | null;
  referrer?: string | null;
  is_mobile_viewport?: boolean | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  is_paid?: boolean | null;
  from_tiktok?: boolean | null;
  ttclid?: string | null;
  make_my_board_cta_clicked?: boolean;
  user_agent?: string | null;
};

export async function insertWebOnboardingSession(row: WebOnboardingSessionInsert) {
  return supabase.from("web_onboarding_sessions").insert(row);
}

/**
 * Fire once per tab when a browser user lands on web onboarding welcome.
 * Tracks both the web visit table and canonical onboarding_sessions.
 */
export function recordWebOnboardingSessionStart(opts?: {
  isMobileViewport?: boolean;
  entryPath?: string;
}): void {
  if (Capacitor.isNativePlatform()) return;

  try {
    if (sessionStorage.getItem(RECORDED_KEY) === "1") return;
  } catch {
    /* ignore */
  }

  const attribution = readMarketingAttribution();
  const pagePath =
    typeof window !== "undefined" ? window.location.pathname || "/" : null;
  const referrer =
    typeof document !== "undefined" && document.referrer ? document.referrer : null;
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent || null : null;

  const clientVisitId = getOrCreateClientVisitId();
  const webOnboardingAnswers = {
    schema_version: 1,
    client_visit_id: clientVisitId,
    entry_path: opts?.entryPath ?? "/onboarding/welcome",
    page_path: pagePath,
    referrer,
    is_mobile_viewport: opts?.isMobileViewport ?? null,
    utm_source: attribution?.utmSource ?? null,
    utm_medium: attribution?.utmMedium ?? null,
    utm_campaign: attribution?.utmCampaign ?? null,
    utm_content: attribution?.utmContent ?? null,
    utm_term: attribution?.utmTerm ?? null,
    is_paid: attribution?.isPaid ?? null,
    from_tiktok: attribution?.isFromTikTok ?? null,
    ttclid: attribution?.ttclid ?? null,
    user_agent: userAgent,
    recorded_at: new Date().toISOString(),
  };

  recordStartPromise = (async () => {
    const creds = await ensureOnboardingSessionCreds();

    const { error: canonicalError } = await supabase.functions.invoke("update-onboarding-session", {
      body: {
        sessionId: creds.sessionId,
        resumeToken: creds.resumeToken,
        patch: {
          ...buildOnboardingAttributionPatch(),
          onboarding_answers: {
            web_onboarding_v1: webOnboardingAnswers,
          },
        },
      },
    });
    if (canonicalError) throw canonicalError;

    const { error } = await insertWebOnboardingSession({
      client_visit_id: clientVisitId,
      entry_path: opts?.entryPath ?? "/onboarding/welcome",
      page_path: pagePath,
      referrer,
      is_mobile_viewport: opts?.isMobileViewport ?? null,
      utm_source: attribution?.utmSource ?? null,
      utm_medium: attribution?.utmMedium ?? null,
      utm_campaign: attribution?.utmCampaign ?? null,
      utm_content: attribution?.utmContent ?? null,
      utm_term: attribution?.utmTerm ?? null,
      is_paid: attribution?.isPaid ?? null,
      from_tiktok: attribution?.isFromTikTok ?? null,
      ttclid: attribution?.ttclid ?? null,
      user_agent: userAgent,
    });
    if (error) {
      console.warn("[web_onboarding] session insert:", error.message);
      return;
    }

    try {
      sessionStorage.setItem(RECORDED_KEY, "1");
    } catch {
      /* ignore */
    }
  })().catch((err: unknown) => {
      console.warn(
        "[web_onboarding] session tracking:",
        err instanceof Error ? err.message : String(err),
      );
    });

  void recordStartPromise;
}

/** Link this tab's web onboarding visit to the auth user (for TikTok Events API match). */
export async function linkWebOnboardingSessionToUser(userId: string): Promise<void> {
  if (Capacitor.isNativePlatform()) return;
  if (!userId) return;

  let clientVisitId: string | null = null;
  try {
    clientVisitId = sessionStorage.getItem(CLIENT_VISIT_KEY);
  } catch {
    /* ignore */
  }
  if (!clientVisitId) return;

  const { error } = await supabase.rpc("link_web_onboarding_session_user", {
    p_client_visit_id: clientVisitId,
    p_user_id: userId,
  });
  if (error) {
    console.warn("[web_onboarding] link user:", error.message);
  }
}

export function readWebOnboardingClientVisitId(): string | null {
  try {
    return sessionStorage.getItem(CLIENT_VISIT_KEY);
  } catch {
    return null;
  }
}

export function markWebOnboardingMakeMyBoardCtaClicked(): void {
  if (Capacitor.isNativePlatform()) return;

  const clientVisitId = getOrCreateClientVisitId();

  void (async () => {
    const creds = await ensureOnboardingSessionCreds();

    if (recordStartPromise) {
      try {
        await recordStartPromise;
      } catch {
        /* mark RPC upserts the row if insert never landed */
      }
    }

    const { error } = await supabase.rpc("mark_web_onboarding_make_my_board_cta_clicked", {
      p_client_visit_id: clientVisitId,
    });
    if (error) {
      console.warn("[web_onboarding] make_my_board_cta_clicked:", error.message);
    }

    const { error: canonicalError } = await supabase.functions.invoke("update-onboarding-session", {
      body: {
        sessionId: creds.sessionId,
        resumeToken: creds.resumeToken,
        patch: {
          onboarding_answers: {
            web_onboarding_cta_v1: {
              schema_version: 1,
              client_visit_id: clientVisitId,
              make_my_board_cta_clicked: true,
              make_my_board_cta_clicked_at: new Date().toISOString(),
            },
          },
        },
      },
    });
    if (canonicalError) {
      console.warn("[web_onboarding] canonical cta click:", canonicalError.message);
    }
  })();
}