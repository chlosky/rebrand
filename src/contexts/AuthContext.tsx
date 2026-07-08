import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { unregisterPushNotifications } from "@/services/pushNotifications";
import {
  oneSignalLogin,
  oneSignalLogout,
  readDeviceTimeZone,
  syncRoutineOneSignalTags,
  syncOneSignalUserLanguage,
} from "@/services/oneSignal";
import { Capacitor } from "@capacitor/core";
import {
  detectInitialAppLocale,
  isAppLocale,
  readStoredPreferredLocale,
  writeStoredPreferredLocale,
  type AppLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";
import { TikTokEvents } from "@/plugins/tikTokEvents";
import { setAppsFlyerCustomerUserId } from "@/lib/appsFlyer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}


export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const maxRetries = 3;
    
    // (3) Safety timeout — if auth check takes too long, stop loading anyway (NativeSplashGate
    // can still hold the native layer longer; backup splash tear-down is ~8s).
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth check timeout - stopping loading state");
        setIsLoading(false);
      }
    }, 3000); // 3 second max for auth check (longer for PWA)


    // Function to get session with retry logic (for PWA standalone mode)
    const getSessionWithRetry = async (attempt: number = 0): Promise<void> => {
      if (!isMounted) return;

      try {
        // Check if localStorage is available (can be an issue in some PWA contexts)
        if (typeof window !== 'undefined' && !window.localStorage) {
          console.warn("localStorage not available, proceeding without session");
          if (isMounted) {
            setIsLoading(false);
            clearTimeout(safetyTimeout);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error("Error getting session:", error);
          // Retry if we haven't exceeded max retries
          if (attempt < maxRetries) {
            setTimeout(() => getSessionWithRetry(attempt + 1), 500 * (attempt + 1));
            return;
          }
          // After max retries, stop loading anyway
          setIsLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      } catch (error) {
        console.error("Error getting session (catch):", error);
        if (!isMounted) return;
        
        // Retry if we haven't exceeded max retries
        if (attempt < maxRetries) {
          setTimeout(() => getSessionWithRetry(attempt + 1), 500 * (attempt + 1));
          return;
        }
        
        // After max retries, stop loading anyway
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    // Get initial session with retry logic
    getSessionWithRetry();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      setIsLoading(false);
      clearTimeout(safetyTimeout);
      // Token refresh must not replace the user object — tool pages key off `user` and
      // would re-run full data loads (spinners on Chat, Journey, etc.) on every refresh.
      if (event === "TOKEN_REFRESHED") {
        if (session) setSession(session);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        void setAppsFlyerCustomerUserId(session.user.id);
      }

      if (Capacitor.getPlatform() === "android") {
        if (event === "SIGNED_OUT") {
          void TikTokEvents.logout().catch(() => {});
        } else if (
          session?.user &&
          (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED")
        ) {
          const meta = session.user.user_metadata as Record<string, unknown> | undefined;
          const firstName = typeof meta?.first_name === "string" ? meta.first_name : "";
          const username = typeof meta?.username === "string" ? meta.username : "";
          void TikTokEvents.identify({
            externalId: session.user.id,
            email: session.user.email ?? undefined,
            externalUserName: firstName || username || undefined,
          }).catch(() => {});
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const localeHydratedForUserRef = useRef<string | null>(null);

  // Logged-in users: explicit welcome/settings locale (localStorage) wins over stale account rows.
  useEffect(() => {
    if (!user?.id) {
      localeHydratedForUserRef.current = null;
      return;
    }
    if (localeHydratedForUserRef.current === user.id) return;
    localeHydratedForUserRef.current = user.id;

    void (async () => {
      const stored = readStoredPreferredLocale();
      if (stored) {
        await setAppLocale(stored);
        await Promise.all([
          supabase.from("user_preferences").upsert(
            { user_id: user.id, preferred_locale: stored },
            { onConflict: "user_id" },
          ),
          supabase.from("profiles").upsert(
            { id: user.id, preferred_locale: stored },
            { onConflict: "id" },
          ),
        ]);
        return;
      }

      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("preferred_locale")
        .eq("user_id", user.id)
        .maybeSingle();
      const fromPrefs = prefs?.preferred_locale;
      if (fromPrefs && isAppLocale(fromPrefs)) {
        writeStoredPreferredLocale(fromPrefs);
        await setAppLocale(fromPrefs);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_locale")
        .eq("id", user.id)
        .maybeSingle();
      const fromProfile = profile?.preferred_locale;
      if (fromProfile && isAppLocale(fromProfile)) {
        writeStoredPreferredLocale(fromProfile);
        await setAppLocale(fromProfile);
      }
    })();
  }, [user?.id]);

  // Initialize push notifications when user logs in (native app only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Skip on web/PWA
    }

    if (user?.id) {
      // Tie OneSignal user identity to Supabase UUID and refresh routine notification tags.
      void oneSignalLogin(user.id)
        .then(async () => {
          const [prefsRes, profileRes] = await Promise.all([
            (supabase as any)
              .from("user_preferences")
              .select(
                "routine_intensity, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
              )
              .eq("user_id", user.id)
              .maybeSingle(),
            (supabase as any)
              .from("profiles")
              .select(
                "routine_intensity, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
              )
              .eq("id", user.id)
              .maybeSingle(),
          ]);

          const prefs = prefsRes.data as {
            routine_intensity?: string | null;
            app_notifications_enabled?: boolean | null;
            notification_permission_status?: string | null;
            routine_notification_times?: unknown;
            timezone?: string | null;
            preferred_locale?: string | null;
          } | null;
          const profile = profileRes.data as typeof prefs;

          const notificationsEnabled =
            prefs?.app_notifications_enabled ?? profile?.app_notifications_enabled ?? false;
          if (!notificationsEnabled) return;

          const intensityRaw = prefs?.routine_intensity ?? profile?.routine_intensity;
          const intensity =
            intensityRaw === "light" || intensityRaw === "consistent" || intensityRaw === "locked_in"
              ? intensityRaw
              : "consistent";

          const timesRaw = prefs?.routine_notification_times ?? profile?.routine_notification_times;
          const alertTimes = Array.isArray(timesRaw)
            ? timesRaw.filter((t: unknown): t is string => typeof t === "string")
            : [];

          const permissionRaw =
            prefs?.notification_permission_status ?? profile?.notification_permission_status;

          const storedTz = prefs?.timezone ?? profile?.timezone;
          const timezone =
            typeof storedTz === "string" && storedTz.trim() ? storedTz.trim() : readDeviceTimeZone();

          const localeRaw = prefs?.preferred_locale ?? profile?.preferred_locale;
          const preferredLocale: AppLocale | undefined =
            localeRaw && isAppLocale(localeRaw) ? localeRaw : detectInitialAppLocale();

          await syncOneSignalUserLanguage(preferredLocale);

          await syncRoutineOneSignalTags({
            intensity,
            notificationsEnabled: true,
            permissionStatus:
              permissionRaw === "granted" || permissionRaw === "denied" || permissionRaw === "skipped"
                ? permissionRaw
                : "skipped",
            alertTimes,
            timezone,
            preferredLocale,
          });
        })
        .catch((error) => {
          console.error("[AuthContext] Failed to OneSignal.login or tag sync:", error);
        });
      return;
    }

    if (!user && !isLoading) {
      // User logged out - unregister push notifications
      oneSignalLogout().catch((error) => {
        console.error("[AuthContext] Failed to OneSignal.logout:", error);
      });
      unregisterPushNotifications().catch((error) => {
        console.error('[AuthContext] Failed to unregister push notifications:', error);
      });
    }
  }, [user, isLoading]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};



















