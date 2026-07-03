import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";

type OnboardingSessionStorage = {
  sessionId: string;
  resumeToken: string;
  createdAt?: number; // Timestamp when session was created
};

export type OnboardingSession = {
  id: string;
  status: string;
  email: string | null;
  first_name: string | null;
  username: string | null;
  email_consent: boolean | null;
  sms_consent: boolean | null;
  app_notifications_consent?: boolean | null;
  character_id: string | null;
  /** App shell (`light` | `dark`) persisted as a typed column, not onboarding_answers JSON. */
  shell_appearance?: string | null;
  /** Merged JSON: legacy keys + `setup_journey_v1` (full setup path answers) for personalization. */
  onboarding_answers: Record<string, unknown>;
  selected_tier: string | null;
  billing: string | null;
  stripe_checkout_session_id: string | null;
  stripe_customer_email: string | null;
  paid_at: string | null;
  user_id: string | null;
};

export function useOnboardingSession() {
  const [stored, setStored] = useLocalStorage<OnboardingSessionStorage | null>("onboarding_session", null);
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const clearOnboardingSession = useCallback(() => {
    setStored(null);
    setSession(null);
  }, [setStored]);

  const ensureSession = useCallback(async () => {
    if (stored?.sessionId && stored?.resumeToken) {
      // Check if session is expired (7 days for production)
      const sessionAge = Date.now() - (stored.createdAt || 0);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (stored.createdAt && sessionAge > maxAge) {
        console.log('Session expired, creating new one');
        setStored(null);
        // Continue to create new session below
      } else {
        return stored;
      }
    }

    setIsBootstrapping(true);
    try {
      const next = await ensureOnboardingSessionCreds();
      setStored(next);
      return next;
    } finally {
      setIsBootstrapping(false);
    }
  }, [setStored, stored]);

  const refreshSession = useCallback(
    async (override?: OnboardingSessionStorage) => {
      const creds = override || stored || (await ensureSession());
      if (!creds?.sessionId || !creds?.resumeToken) return;

      const { data, error } = await supabase.functions.invoke("get-onboarding-session", {
        body: { sessionId: creds.sessionId, resumeToken: creds.resumeToken },
      });
      if (error) throw error;
      if (data?.session) {
        const session = data.session as OnboardingSession;
        
        // If session is claimed (has user_id), clear it - user should be logged in
        if (session.user_id) {
          console.log('Session already claimed, clearing local storage');
          clearOnboardingSession();
          return;
        }
        
        setSession(session);
      }
    },
    [ensureSession, stored, clearOnboardingSession],
  );

  const updateSession = useCallback(
    async (patch: Record<string, unknown>) => {
      const creds = stored || (await ensureSession());
      if (!creds?.sessionId || !creds?.resumeToken) return;

      const { data, error } = await supabase.functions.invoke("update-onboarding-session", {
        body: { sessionId: creds.sessionId, resumeToken: creds.resumeToken, patch },
      });
      if (error) throw error;
      if (data?.session) setSession(data.session as OnboardingSession);
      return data?.session as OnboardingSession | undefined;
    },
    [ensureSession, stored],
  );

  useEffect(() => {
    if (stored?.sessionId && stored?.resumeToken) return;
    try {
      const raw = sessionStorage.getItem("onboarding_session");
      if (!raw) return;
      const parsed = JSON.parse(raw) as OnboardingSessionStorage;
      if (parsed?.sessionId && parsed?.resumeToken) {
        setStored(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [stored?.sessionId, stored?.resumeToken, setStored]);

  useEffect(() => {
    // Try to hydrate if we already have credentials
    if (stored?.sessionId && stored?.resumeToken) {
      refreshSession().catch(() => {
        // If session no longer exists, clear and let user restart
        clearOnboardingSession();
      });
    }
  }, [stored?.sessionId, stored?.resumeToken, refreshSession, clearOnboardingSession]);

  return {
    stored,
    session,
    isBootstrapping,
    ensureSession,
    refreshSession,
    updateSession,
    clearOnboardingSession,
  };
}

