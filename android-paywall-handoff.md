# Android paywall — full code handoff

Branch: Mobile-app
versionCode: 244
Files: 22

Android paywall path: setup Email / EmailCollection / AndroidPaywall →
runAndroidPaywallFlow → RevenueCat presentPaywall →
/onboarding/android-post-paywall → androidPostPurchaseEntitlementGate → dashboard.

Includes post-paywall loading (2.8s cap) and shared provisionPostPaywallIfNeeded.

---

## src/App.tsx (Android paywall routes excerpt)

```tsx
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import AndroidPaywall from "./pages/onboarding/AndroidPaywall";
import AndroidPostPaywallLoading from "./pages/onboarding/AndroidPostPaywallLoading";
const WebResubscribeRedirect = () => <Navigate to="/onboarding/web-paywall" replace />;
const IsNativePaywallOr = ({ FallbackComponent }: { FallbackComponent: React.ComponentType }) => {
  if (isAndroidPaywallContext()) return <AndroidPaywall />;
const LegacyOnboardingPricingRedirect = () => {
  if (isAndroidPaywallContext()) return <Navigate to="/onboarding/android-paywall" replace />;
              <Route path="/resubscribe" element={<IsNativePaywallOr FallbackComponent={WebResubscribeRedirect} />} />
              <Route path="/onboarding/android-paywall" element={<AndroidPaywall />} />
              <Route path="/onboarding/android-post-paywall" element={<AndroidPostPaywallLoading />} />
              <Route path="/onboarding/pricing" element={<LegacyOnboardingPricingRedirect />} />
```

## src/components/IosAppHeader.tsx

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type IosAppHeaderProps = {
  /** When true, show Sign out instead of Login and return to welcome after signing out. */
  signOutInsteadOfLogin?: boolean;
};

/**
 * Header for iOS app screens (secure checkout, sign-in) that matches the Privacy Policy header.
 * Palette Plotting title links back to the welcome page; Login button links to sign-in.
 */
export const IosAppHeader = ({ signOutInsteadOfLogin = false }: IosAppHeaderProps) => {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/onboarding/welcome", { replace: true });
    } catch (e) {
      console.error("Sign out failed:", e);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 bg-background z-40"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-primary/10 bg-background"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/onboarding/welcome")}
              className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-foreground hover:opacity-80 transition-opacity cursor-pointer"
            >
              Palette Plotting
            </button>
            {signOutInsteadOfLogin ? (
              <Button
                variant="outline"
                className="border-foreground/20 hover:bg-primary/10 h-8 px-3 text-sm"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-foreground/20 hover:bg-primary/10 h-8 px-3 text-sm"
                onClick={() => navigate("/login")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        </div>
      </header>
      <div style={{ height: "calc(64px + env(safe-area-inset-top, 0px))" }} />
    </>
  );
};
```

## src/components/ProtectedRoute.tsx

```tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SUBSCRIPTION_CACHE_KEY = "subscription_check";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(() => {
    if ((window as any).__subscriptionConfirmed) {
      (window as any).__subscriptionConfirmed = false;
      return true;
    }
    try {
      const uid = user?.id;
      if (!uid) return null;
      const raw = sessionStorage.getItem(`${SUBSCRIPTION_CACHE_KEY}_${uid}`);
      if (!raw) return null;
      const { ts, active } = JSON.parse(raw) as { ts: number; active: boolean };
      if (Date.now() - ts > CACHE_TTL_MS) return null;
      return active;
    } catch {
      return null;
    }
  });

  const onboardingRoutes = [
    '/onboarding/welcome',
    '/onboarding/four-steps',
    '/onboarding/demo',
    '/onboarding/email',
    '/onboarding/double',
    '/onboarding/questions',
    '/onboarding/setup',
    '/onboarding/ios-paywall',
    '/onboarding/android-paywall',
    '/onboarding/web-paywall',
    '/onboarding/android-post-paywall',
    '/onboarding/post-paywall',
    '/payment-processing',
    '/activate',
    '/verify-email',
    '/resubscribe',
  ];

  const isOnboardingRoute = onboardingRoutes.some(route => location.pathname.startsWith(route));

  // Auth redirect removed — dashboard is always the target after payment.
  // Login routing is handled by the login page / route config itself.

  // Subscription check: at most once per 24h (cached in sessionStorage). No loading UI — hold with null until done.
  useEffect(() => {
    if (isLoading || !user || isOnboardingRoute) {
      if (isOnboardingRoute) {
        setHasActiveSubscription(true);
      }
      return;
    }

    const cacheKey = `${SUBSCRIPTION_CACHE_KEY}_${user.id}`;

    const readCache = (): { active: boolean } | null => {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (!raw) return null;
        const { ts, active } = JSON.parse(raw) as { ts: number; active: boolean };
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        return { active };
      } catch {
        return null;
      }
    };

    const writeCache = (active: boolean) => {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), active }));
      } catch {}
    };

    const cached = readCache();
    if (cached !== null) {
      setHasActiveSubscription(cached.active);
      if (!cached.active) {
        navigate('/resubscribe', { replace: true });
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data: userPlan, error } = await supabase
          .from('user_plans')
          .select('status, tier, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          navigate('/resubscribe', { replace: true });
          return;
        }

        const plan = userPlan as { status?: string; current_period_end?: string } | null;
        const active = !!(
          plan &&
          plan.status === 'active' &&
          (!plan.current_period_end || new Date(plan.current_period_end) > new Date())
        );

        writeCache(active);
        setHasActiveSubscription(active);
        if (!active) {
          navigate('/resubscribe', { replace: true });
        }
      } catch {
        if (!cancelled) navigate('/resubscribe', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoading, isOnboardingRoute, navigate]);

  // Always render children — subscription check redirects in background if needed.
  // Never return null (white screen). The useEffect will redirect to /resubscribe
  // if the DB check comes back definitively inactive (native paywall or web app-download redirect).
  return <>{children}</>;
};
```

## src/components/ui/button.tsx

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

## src/contexts/AuthContext.tsx

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { unregisterPushNotifications } from "@/services/pushNotifications";
import {
  bootstrapRevenueCat,
  hasRevenueCatEntitlement,
  refreshAppleRevenueCatPlanOnServer,
} from "@/services/revenueCat";
import { bootstrapRevenueCatWeb, isRevenueCatWebConfigured } from "@/services/revenueCatWeb";
import { Capacitor } from "@capacitor/core";

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

/** (6) Stagger native IAP work after first paint (ms). */
const NATIVE_RC_BOOTSTRAP_MS = 450;
const NATIVE_RC_ENTITLEMENT_MS = 600;
/** Apple/RevenueCat–billed users: refresh user_plans from RC API (web + native). */
const APPLE_RC_SERVER_SYNC_MS = 750;

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Initialize push notifications when user logs in (native app only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Skip on web/PWA
    }

    if (!user && !isLoading) {
      // User logged out - unregister push notifications
      unregisterPushNotifications().catch((error) => {
        console.error('[AuthContext] Failed to unregister push notifications:', error);
      });
    }
  }, [user, isLoading]);

  // (6) RevenueCat: native Capacitor SDK; web purchases-js (same app user id = Supabase UUID).
  useEffect(() => {
    if (isLoading) return;

    const id = window.setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        void bootstrapRevenueCat(user?.id ?? null);
      } else if (isRevenueCatWebConfigured()) {
        void bootstrapRevenueCatWeb(user?.id ?? null);
      }
    }, NATIVE_RC_BOOTSTRAP_MS);
    return () => clearTimeout(id);
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (!user || isLoading) return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    const id = window.setTimeout(() => {
      const checkEntitlement = async () => {
        const hasPro = await hasRevenueCatEntitlement("Palette Plotting Pro");
        if (cancelled) return;
        if (hasPro) {
          console.info("[RevenueCat] Active entitlement found: Palette Plotting Pro");
        }
      };
      void checkEntitlement();
    }, NATIVE_RC_ENTITLEMENT_MS);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [user?.id, isLoading]);

  // Apple / RevenueCat–billed accounts: keep user_plans (e.g. current_period_end) in sync via RC REST API.
  // Runs on web/PWA and native; gates on user_plans inside the helper (not Capacitor).
  useEffect(() => {
    if (!user || isLoading) return;

    const id = window.setTimeout(() => {
      void refreshAppleRevenueCatPlanOnServer("session_start");
    }, APPLE_RC_SERVER_SYNC_MS);

    return () => clearTimeout(id);
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (!user || isLoading) return;

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void refreshAppleRevenueCatPlanOnServer("background");
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user?.id, isLoading]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## src/debugLog.ts

```typescript
/**
 * Debug session f4efe6: optional local ingest + persistence (dev only).
 *
 * Never POST to loopback in production builds: Chrome shows "Access other apps and services
 * on this device" for https origins hitting 127.0.0.1 (Local Network Access).
 */
const INGEST_URL = 'http://127.0.0.1:7242/ingest/ec790500-f9a6-4150-b33b-d4ac4517adfd';
const LOG_KEY = 'debug_f4efe6_log';

function isDevDebugIngestEnabled(): boolean {
  return import.meta.env.DEV === true;
}

export function debugLog(payload: {
  sessionId?: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: number;
  hypothesisId?: string;
}) {
  if (!isDevDebugIngestEnabled()) return;

  const line = JSON.stringify({
    ...payload,
    timestamp: payload.timestamp ?? Date.now(),
    sessionId: payload.sessionId ?? 'f4efe6',
  });
  fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f4efe6' },
    body: line,
  }).catch(() => {});
  try {
    const cur = typeof localStorage !== 'undefined' ? localStorage.getItem(LOG_KEY) ?? '' : '';
    localStorage.setItem(LOG_KEY, cur ? `${cur}\n${line}` : line);
  } catch {
    // ignore
  }
}

/** Call from Safari Web Inspector or in-app "Copy debug log" button */
export function getDebugLog(): string {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(LOG_KEY) ?? '' : '';
}

if (typeof window !== 'undefined') {
  (window as unknown as { getDebugLog?: () => string }).getDebugLog = getDebugLog;
}
```

## src/integrations/supabase/client.ts

```typescript
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Capacitor } from '@capacitor/core';

export const SUPABASE_URL = "https://hyckwyjznishkjijrhcw.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y2t3eWp6bmlzaGtqaWpyaGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjA3ODcsImV4cCI6MjA3NjAzNjc4N30.YILKDI3tYbXPJ-TdQWD2_QMqHHkubErNXQ5MG_aeUOY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## src/lib/androidPostPurchaseEntitlementGate.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { debugLog } from "@/debugLog";
import { syncRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCat";

const STORAGE_KEY = "sv_android_post_paywall_gate_v1";

export type AndroidPaywallLatch = {
  userId: string | null;
  entitlementSynced: boolean;
};

export type AndroidPostPurchaseGateResult =
  | { status: "skipped" }
  | { status: "verified" }
  /** Play purchase succeeded but Google/RevenueCat entitlement sync is not confirmed yet. */
  | { status: "delayed"; reason: string };

let entitlementSyncOutcome: Promise<AndroidPostPurchaseGateResult> | null = null;

export function armAndroidPostPurchaseEntitlementLatch(
  userId: string | null
): void {
  try {
    const payload: AndroidPaywallLatch = { userId, entitlementSynced: false };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearAndroidPostPurchaseEntitlementLatch(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readLatch(): AndroidPaywallLatch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<AndroidPaywallLatch>;
    if (typeof p.entitlementSynced !== "boolean") return null;
    if (!Object.prototype.hasOwnProperty.call(p, "userId")) return null;
    return { userId: p.userId ?? null, entitlementSynced: p.entitlementSynced };
  } catch {
    return null;
  }
}

export function getAndroidPostPurchaseLatchUserId(): string | null {
  return readLatch()?.userId ?? null;
}

/** Optimistic dashboard access when Google Play → RevenueCat sync is still in flight. */
export function markAndroidSubscriptionConfirmed(userId: string | null): void {
  applyAndroidSubscriptionSessionMarkers(userId);
}

function applyAndroidSubscriptionSessionMarkers(userId: string | null): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith("subscription_check_")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    if (userId) {
      sessionStorage.setItem(
        `subscription_check_${userId}`,
        JSON.stringify({ ts: Date.now(), active: true })
      );
    }
  } catch {
    /* ignore */
  }
  (
    window as unknown as { __subscriptionConfirmed?: boolean }
  ).__subscriptionConfirmed = true;
}

/**
 * Background RevenueCat/server sync after optimistic dashboard handoff.
 * Does not block UI or bounce the user back to paywall.
 */
export function retryAndroidPostPurchaseEntitlementSyncInBackground(
  attempts = 6
): void {
  void (async () => {
    const start = performance.now();
    try {
      const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries(attempts);
      const syncMs = Math.round(performance.now() - start);
      debugLog({
        location: "androidPostPurchaseEntitlementGate.ts:backgroundRetry",
        message: ok
          ? "Background entitlement sync succeeded"
          : "Background entitlement sync still unverified",
        data: { ok, syncMs, attempts },
        hypothesisId: "ANDROID-GATE",
      });
      console.info("[android-post-paywall] background entitlement sync", { ok, syncMs, attempts });
    } catch (e) {
      console.warn("[android-post-paywall] background entitlement sync error:", e);
    }
  })();
}

/**
 * Android-only post-purchase entitlement sync. Mirrors the iOS gate but uses
 * its own storage key and platform check. Shares no code with the iOS gate.
 *
 * After a successful Play purchase, sync failure is reported as `delayed` — not
 * a hard failure — because entitlement can lag behind the purchase receipt.
 */
export async function runAndroidPostPurchaseGateIfNeeded(): Promise<AndroidPostPurchaseGateResult> {
  const latch = readLatch();
  if (!latch || latch.entitlementSynced) return { status: "skipped" };

  const isNativeAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  if (!isNativeAndroid) {
    clearAndroidPostPurchaseEntitlementLatch();
    return { status: "skipped" };
  }

  if (entitlementSyncOutcome) return entitlementSyncOutcome;

  const userId = latch.userId;

  entitlementSyncOutcome = (async (): Promise<AndroidPostPurchaseGateResult> => {
    try {
      const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries();
      if (!ok) {
        debugLog({
          location: "androidPostPurchaseEntitlementGate.ts:syncDelayed",
          message:
            "syncRevenueCatEntitlementAfterPurchaseWithRetries unverified after Google Play purchase — treating as delayed",
          hypothesisId: "ANDROID-GATE",
        });
        return {
          status: "delayed",
          reason: "revenuecat_sync_retries_exhausted",
        };
      }
      applyAndroidSubscriptionSessionMarkers(userId);
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            userId,
            entitlementSynced: true,
          } satisfies AndroidPaywallLatch)
        );
      } catch {
        /* ignore */
      }
      return { status: "verified" };
    } catch (e) {
      console.error("[androidPostPurchaseEntitlementGate]", e);
      return {
        status: "delayed",
        reason: e instanceof Error ? e.message : "sync_threw",
      };
    }
  })().finally(() => {
    entitlementSyncOutcome = null;
  });

  return entitlementSyncOutcome;
}
```

## src/lib/isAndroidPaywallContext.ts

```typescript
import { Capacitor } from "@capacitor/core";

/**
 * True when we should show the Android paywall route (native Android app only).
 * Completely separate from the iOS paywall context — no shared logic.
 */
export function isAndroidPaywallContext(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}
```

## src/lib/postPaywallProvisioning.ts

```typescript
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { clearSetupDraft, readSetupDraft, type SetupDraft } from "@/lib/setupDraft";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import { getSupportCategoryLabel } from "@/lib/affirmations-data";

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

export const STARTER_AFFIRMATION_SET_NAME = "Your starter path";
export const STARTER_SUBLIMINAL_NAME = "Starter subliminal";
const LEGACY_STARTER_SUBLIMINAL_NAME = "Starter subliminal (TTS)";

function setupPathRowToDraft(row: Record<string, unknown>): SetupDraft {
  const spec = row.conditional_specificity;
  return {
    firstName: typeof row.first_name === "string" ? row.first_name : undefined,
    email: typeof row.email === "string" ? row.email : undefined,
    desireCategory: typeof row.desire_category === "string" ? row.desire_category : undefined,
    // "desire text" is no longer used; ignore stored values if present.
    currentFriction: typeof row.current_friction === "string" ? row.current_friction : undefined,
    desiredIdentity: typeof row.desired_identity === "string" ? row.desired_identity : undefined,
    toolPreferences: Array.isArray(row.tool_preferences) ? (row.tool_preferences as string[]) : undefined,
    conditionalSpecificity:
      spec && typeof spec === "object" && spec !== null ? (spec as Record<string, unknown>) : undefined,
  };
}

async function loadDraftForProvisioning(userId: string): Promise<SetupDraft> {
  const local = readSetupDraft();
  const { data } = await (supabase as any).from("user_setup_path").select("*").eq("user_id", userId).maybeSingle();
  const fromDb = data ? setupPathRowToDraft(data as Record<string, unknown>) : {};
  return { ...fromDb, ...local };
}

async function isPostPaywallProvisioned(userId: string): Promise<boolean> {
  const { data } = await (supabase as any)
    .from("user_setup_path")
    .select("post_paywall_provisioned_at")
    .eq("user_id", userId)
    .maybeSingle();
  return !!(data && data.post_paywall_provisioned_at);
}

async function markPostPaywallProvisioned(userId: string): Promise<void> {
  const iso = new Date().toISOString();
  const { data: existing } = await (supabase as any)
    .from("user_setup_path")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.user_id) {
    const { error } = await (supabase as any)
      .from("user_setup_path")
      .update({ post_paywall_provisioned_at: iso })
      .eq("user_id", userId);
    if (error && import.meta.env.DEV) {
      console.warn("[postPaywallProvisioning] post_paywall_provisioned_at update failed:", error);
    }
    return;
  }

  const { error: insErr } = await (supabase as any).from("user_setup_path").insert({
    user_id: userId,
    tool_preferences: [],
    conditional_specificity: {},
    post_paywall_provisioned_at: iso,
  });
  if (insErr && import.meta.env.DEV) {
    console.warn("[postPaywallProvisioning] user_setup_path insert for provision flag failed:", insErr);
  }
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
  const combined = `${displayCategory} — ${answer}`.trim();
  return combined.length > 50 ? combined.slice(0, 50) : combined;
}

function clipAffirmationsForTts(affirmations: string[], maxChars: number): string[] {
  const joined = affirmations.map((a) => a.trim()).filter(Boolean);
  if (joined.length === 0) return ["I am moving forward with calm confidence."];
  let total = joined.join(" ").length;
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

async function findStarterAffirmationSet(userId: string): Promise<{ id: string; affirmations: string[] } | null> {
  const { data, error } = await (supabase as any)
    .from("user_affirmation_sets")
    .select("id, affirmations")
    .eq("user_id", userId)
    .eq("name", STARTER_AFFIRMATION_SET_NAME)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  const affirmations = Array.isArray(data.affirmations) ? (data.affirmations as string[]) : [];
  return { id: data.id, affirmations };
}

async function createStarterAffirmationSet(
  userId: string,
  draft: SetupDraft,
  category: string
): Promise<{ id: string; affirmations: string[] } | null> {
  const topic = buildAffirmationTopic(draft);
  const { data, error } = await supabase.functions.invoke("generate-affirmations", {
    body: { topic, category },
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
    name: STARTER_AFFIRMATION_SET_NAME,
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

async function ensureStarterSubliminalTrack(userId: string, accessToken: string, affirmations: string[]): Promise<void> {
  const { data: existing } = await (supabase as any)
    .from("subliminal_tracks")
    .select("id")
    .eq("user_id", userId)
    .in("name", [STARTER_SUBLIMINAL_NAME, LEGACY_STARTER_SUBLIMINAL_NAME])
    .limit(1)
    .maybeSingle();

  if (existing?.id) return;

  // Use the same flow as the app's Subliminal Maker:
  // 1) Generate a "vocal base" affirmation MP3 via `generate-affirmation-audio`
  // 2) Run the client-side `AudioProcessor.generateSubliminalTrack` mixdown so the stored specs match the real audio.
  const vocalBaseBlob = await fetchVocalBaseMp3Blob(accessToken, affirmations);
  if (!vocalBaseBlob) return;

  const { AudioProcessor } = await import("@/lib/audioProcessor");
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
      duration: 5,
    });
  } finally {
    processor.dispose();
  }

  const fileName = `${userId}/${Date.now()}_${STARTER_SUBLIMINAL_NAME.replace(/[^a-z0-9]/gi, "_")}.mp3`;
  const { error: uploadError } = await supabase.storage.from("subliminal-tracks").upload(fileName, subliminalBlob, {
    contentType: "audio/mpeg",
    upsert: false,
  });

  if (uploadError) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] subliminal upload failed:", uploadError);
    return;
  }

  const { data: publicData } = supabase.storage.from("subliminal-tracks").getPublicUrl(fileName);
  const publicUrl = publicData?.publicUrl;

  const { data: dbTrack, error: dbError } = await (supabase as any)
    .from("subliminal_tracks")
    .insert({
      user_id: userId,
      name: STARTER_SUBLIMINAL_NAME,
      binaural_beat: "theta",
      binaural_volume: 0.07,
      background_sound: "Rain v2.WAV",
      affirmation_volume: 0.07,
      background_volume: 1,
      layers: 1,
      length: 5,
      audio_url: publicUrl,
    })
    .select("id")
    .single();

  if (dbError || !dbTrack?.id) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] subliminal db insert failed:", dbError);
    return;
  }

  await (supabase as any).from("subliminal_generation_log").insert({
    user_id: userId,
    track_id: dbTrack.id,
    generated_at: new Date().toISOString(),
  });
}

export type ProvisionPostPaywallResult = { ran: boolean; skipped: boolean; reason?: string };

/**
 * One idempotent pass after a successful subscription: creates AI affirmations
 * and a TTS-backed starter subliminal track from the setup draft. Safe to call
 * multiple times. Belief eliminations are intentionally NOT generated here —
 * those are user-driven from the Refactor tool. See the module-level note.
 */
export async function provisionPostPaywallIfNeeded(options?: { quiet?: boolean }): Promise<ProvisionPostPaywallResult> {
  const quiet = options?.quiet ?? true;

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id || !session.access_token) {
    return { ran: false, skipped: true, reason: "no_session" };
  }

  const userId = session.user.id;
  const accessToken = session.access_token;

  const { data: planRow } = await (supabase as any)
    .from("user_plans")
    .select("starter_provisioned")
    .eq("user_id", userId)
    .maybeSingle();

  if (planRow?.starter_provisioned) {
    return { ran: false, skipped: true, reason: "already_provisioned" };
  }

  const draft = await loadDraftForProvisioning(userId);
  const category = mapDesireSetupKeyToWeeklyCategory(draft.desireCategory);

  try {
    let set = await findStarterAffirmationSet(userId);
    if (!set) {
      set = await createStarterAffirmationSet(userId, draft, category);
    }

    if (!set) {
      return { ran: false, skipped: true, reason: "starter_affirmation_set_failed" };
    }

    if (set.affirmations.length > 0) {
      await ensureStarterSubliminalTrack(userId, accessToken, set.affirmations);
    }

    await markPostPaywallProvisioned(userId);

    await (supabase as any)
      .from("user_plans")
      .update({ starter_provisioned: true })
      .eq("user_id", userId);

    // Persist embody picks from setup draft before clearing localStorage (otherwise hook falls back to defaults).
    const embodySlugs = mapOnboardingEmbodyKeysToAppSlugs(draft.embodyDailyPractices);
    if (embodySlugs) {
      const { error: embodyPrefErr } = await supabase
        .from("user_preferences")
        .upsert({ user_id: userId, embody_active_practices: embodySlugs }, { onConflict: "user_id" });
      if (embodyPrefErr && import.meta.env.DEV) {
        console.warn("[postPaywallProvisioning] embody_active_practices upsert failed:", embodyPrefErr.message);
      }
    }

    clearSetupDraft();

    if (!quiet) {
      // Callers may show UI; this module stays toast-free.
    }

    return { ran: true, skipped: false };
  } catch (e) {
    if (import.meta.env.DEV) console.error("[postPaywallProvisioning] unexpected:", e);
    return { ran: false, skipped: true, reason: "error" };
  }
}
```

## src/lib/runAndroidPaywallFlow.ts

```typescript
import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import {
  presentRevenueCatPaywall,
  getLastPaywallError,
  setLastPaywallErrorMessage,
} from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { armAndroidPostPurchaseEntitlementLatch } from "@/lib/androidPostPurchaseEntitlementGate";

export type AndroidPaywallFlowOutcome =
  | "success"
  | "present_failed"
  | "error"
  | "skipped";

let presentationInFlight = false;

export function resetAndroidPaywallPresentationFlightLock() {
  presentationInFlight = false;
}

const PAYWALL_PRESENT_TIMEOUT_MS = 120_000;

/**
 * Presents RevenueCat paywall on Android. After a purchase/restored result, routes to
 * `/onboarding/android-post-paywall` where entitlement sync + provisioning runs.
 *
 * Android-only. Does not touch iOS code or paths.
 */
export async function runAndroidPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
  bypassPresentationLock?: boolean;
}): Promise<AndroidPaywallFlowOutcome> {
  const canNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  if (!canNative) {
    debugLog({
      location: "runAndroidPaywallFlow.ts:skipped",
      message: "Flow skipped — not native Android",
      data: {
        platform: Capacitor.getPlatform(),
        isNativePlatform: Capacitor.isNativePlatform(),
      },
      hypothesisId: "ANDROID-PAY",
    });
    return "skipped";
  }

  const useLock = !options.bypassPresentationLock;

  if (useLock && presentationInFlight) {
    setLastPaywallErrorMessage(
      "A subscription screen may still be opening. Wait a few seconds, then try again. If nothing changes, force-quit the app and reopen."
    );
    toast.error(
      "Subscription is already opening — wait a few seconds, then try again.",
      { duration: 8000 }
    );
    return "present_failed";
  }
  if (useLock) {
    presentationInFlight = true;
  }

  try {
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = window.setTimeout(() => {
        setLastPaywallErrorMessage(
          "Opening subscriptions timed out. Force-quit the app, reopen, and tap Continue again."
        );
        resolve(false);
      }, PAYWALL_PRESENT_TIMEOUT_MS);
    });

    const presentPromise = presentRevenueCatPaywall(options.userId).finally(
      () => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      }
    );

    const result = await Promise.race([presentPromise, timeoutPromise]);

    if (!result) {
      toast.error(
        getLastPaywallError() || "Subscription not completed.",
        { duration: 8000 }
      );
      return "present_failed";
    }

    armAndroidPostPurchaseEntitlementLatch(options.userId);
    options.navigate("/onboarding/android-post-paywall", { replace: true });
    return "success";
  } catch (err) {
    debugLog({
      location: "runAndroidPaywallFlow.ts:catch",
      message: "Exception during Android paywall flow",
      data: {
        err: String((err as Error)?.message ?? err),
        stack: (err as Error)?.stack?.slice(0, 800) ?? null,
        lastPaywallError: getLastPaywallError(),
      },
      hypothesisId: "ANDROID-PAY",
    });
    toast.error("Could not open subscription options.", { duration: 8000 });
    return "error";
  } finally {
    if (useLock) {
      presentationInFlight = false;
    }
  }
}
```

## src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## src/pages/Activate.tsx

```tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";

/**
 * Platform-aware paywall fallback so a non-iOS web user doesn't get stranded on
 * `/onboarding/ios-paywall`, which would toast "Subscriptions are only available
 * in the iOS app." and offer no path forward.
 */
function paywallRouteForCurrentPlatform(): string {
  if (isIosPaywallContext()) return "/onboarding/ios-paywall";
  if (isAndroidPaywallContext()) return "/onboarding/android-paywall";
  return "/onboarding/web-paywall";
}

type RemoteOnboardingSession = {
  id: string;
  status: string;
  email: string | null;
  first_name: string | null;
  username: string | null;
  email_consent: boolean | null;
  sms_consent: boolean | null;
  onboarding_answers?: Record<string, unknown> | null;
  selected_tier: string | null;
  billing: string | null;
  stripe_customer_email: string | null;
  stripe_checkout_session_id: string | null;
  paid_at: string | null;
  user_id: string | null;
};

export default function Activate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const sid = searchParams.get("sid") || "";
  const token = searchParams.get("token") || "";

  const [remoteSession, setRemoteSession] = useState<RemoteOnboardingSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [accountCreated, setAccountCreated] = useState(false);

  // Calculate isPaid based on remoteSession status
  const isPaid = useMemo(() => {
    return remoteSession?.status === "paid" || remoteSession?.status === "active";
  }, [remoteSession?.status]);

  // Check if account was already created by webhook
  useEffect(() => {
    if (remoteSession?.user_id || user) {
      // Account already exists - show success and redirect
      setAccountCreated(true);
      toast.success("Account created! Check your email to set your password.");
      // Don't auto-redirect - user needs to set password first
      // They'll be redirected to login when they try to access dashboard
    }
  }, [remoteSession?.user_id, user, navigate]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!sid || !token) {
        setIsLoadingSession(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("get-onboarding-session", {
          body: { sessionId: sid, resumeToken: token },
        });
        if (error) throw error;
        if (!data?.session) throw new Error("Missing session");
        if (!isMounted) return;

        const s = data.session as RemoteOnboardingSession;
        setRemoteSession(s);
      } catch (e: any) {
        console.error("Failed to load onboarding session:", e);
        toast.error("Unable to load activation session. Please restart onboarding.");
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid, token]);

  // Redirect to payment processing if payment not confirmed by webhook
  useEffect(() => {
    if (!sid || !token) return;
    if (!remoteSession) return;
    if (remoteSession.status === "paid" || remoteSession.status === "active") return;

    // Payment not confirmed by webhook yet - redirect to processing page
    navigate(`/payment-processing?sid=${encodeURIComponent(sid)}&token=${encodeURIComponent(token)}`, { replace: true });
  }, [remoteSession, sid, token, navigate]);

  // Poll for account creation when payment is confirmed but account not created yet
  useEffect(() => {
    // Only poll if payment is confirmed but account not created yet
    if (!isPaid) return;
    if (accountCreated || remoteSession?.user_id || user) return;
    if (!sid || !token) return;

    let pollInterval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    const pollForAccount = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-onboarding-session", {
          body: { sessionId: sid, resumeToken: token },
      });

        if (error) throw error;
        if (!data?.session) return;

        const session = data.session as RemoteOnboardingSession;
        
        // Account created by webhook!
        if (session.user_id) {
          setRemoteSession(session);
          setAccountCreated(true);
          toast.success("Account created! Check your email to set your password.");
          clearInterval(pollInterval);
          clearTimeout(timeout);
          // Don't auto-redirect - user needs to set password first
          // They'll be redirected to login when they try to access dashboard
        }
      } catch (e) {
        console.error("Error polling for account:", e);
        // Don't show error - just keep polling silently
      }
    };

    // Poll every 2 seconds
    pollInterval = setInterval(pollForAccount, 2000);
    
    // Stop after 30 seconds
    timeout = setTimeout(() => {
      clearInterval(pollInterval);
      toast.error("Account creation is taking longer than expected. Please check your email or contact support.");
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isPaid, accountCreated, remoteSession?.user_id, user, sid, token, navigate]);

  const title = "Activate your plan";
  const subtitle = remoteSession?.selected_tier
    ? `You chose the ${remoteSession.selected_tier} plan (${remoteSession.billing || "monthly"}).`
    : "Complete setup to activate your subscription.";

  // Don't show title/subtitle when account is created
  const showTitle = !(accountCreated || remoteSession?.user_id || user);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {showTitle && (
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        )}

        {isLoadingSession ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !sid || !token ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Missing activation info. Please restart onboarding.</p>
            <Button onClick={() => navigate("/onboarding/welcome")}>Restart</Button>
          </div>
        ) : !isPaid ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Payment not confirmed. Please ensure your payment was successful.</p>
            <Button onClick={() => navigate(paywallRouteForCurrentPlatform())}>Go to subscriptions</Button>
          </div>
        ) : accountCreated || remoteSession?.user_id || user ? (
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Account created successfully!</h1>
              <p className="text-sm text-muted-foreground">
                Check your email to set your password. Once you've set your password, you can sign in to access your account.
              </p>
            </div>
            <Button onClick={() => navigate("/login", { replace: true })}>
              Go to Sign In
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Waiting for account creation...</p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
```

## src/pages/PaymentProcessing.tsx

```tsx
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";

/**
 * Platform-aware paywall fallback so a non-iOS web user doesn't get stranded on
 * `/onboarding/ios-paywall`, which toasts "Subscriptions are only available in
 * the iOS app." and offers no path forward.
 */
function paywallRouteForCurrentPlatform(): string {
  if (isIosPaywallContext()) return "/onboarding/ios-paywall";
  if (isAndroidPaywallContext()) return "/onboarding/android-paywall";
  return "/onboarding/web-paywall";
}

export default function PaymentProcessing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sid = searchParams.get("sid") || "";
  const token = searchParams.get("token") || "";

  /**
   * Use a ref instead of state so incrementing attempts doesn't tear down and
   * re-create the polling loop. Previously `attempts` was in the effect's dep
   * array, which meant every increment cancelled the running interval and
   * started a new one — and on top of that, `setInterval` and an inline
   * `setTimeout(setAttempts(...))` were both running, doubling the request
   * rate against `get-onboarding-session`.
   */
  const attemptsRef = useRef(0);
  const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max wait

  useEffect(() => {
    if (!sid || !token) {
      toast.error("Missing payment information. Please restart onboarding.");
      const t = window.setTimeout(
        () => navigate(paywallRouteForCurrentPlatform()),
        2000,
      );
      return () => window.clearTimeout(t);
    }

    let active = true;
    // window.setInterval / setTimeout return numbers in browsers; using the
    // browser variants explicitly so types don't drift to Node's Timeout.
    let interval: number | null = null;
    let finishTimer: number | null = null;

    const finishWithError = (msg: string) => {
      toast.error(msg);
      if (interval != null) {
        window.clearInterval(interval);
        interval = null;
      }
      finishTimer = window.setTimeout(
        () => navigate(paywallRouteForCurrentPlatform()),
        3000,
      );
    };

    const checkPaymentStatus = async () => {
      if (!active) return;
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-onboarding-session",
          { body: { sessionId: sid, resumeToken: token } },
        );
        if (!active) return;

        if (error) {
          console.error("Error checking payment status:", error);
          if (attemptsRef.current >= maxAttempts) {
            finishWithError(
              "Payment verification is taking longer than expected. Please contact support.",
            );
            return;
          }
          attemptsRef.current += 1;
          return;
        }

        const session = data?.session;
        if (session?.status === "paid" || session?.status === "active") {
          navigate(
            `/activate?sid=${encodeURIComponent(sid)}&token=${encodeURIComponent(token)}`,
            { replace: true },
          );
          return;
        }

        if (attemptsRef.current >= maxAttempts) {
          finishWithError(
            "Payment verification is taking longer than expected. Please contact support.",
          );
          return;
        }
        attemptsRef.current += 1;
      } catch (e) {
        if (!active) return;
        console.error("Error checking payment status:", e);
        if (attemptsRef.current >= maxAttempts) {
          finishWithError("Unable to verify payment. Please contact support.");
          return;
        }
        attemptsRef.current += 1;
      }
    };

    void checkPaymentStatus();
    interval = window.setInterval(checkPaymentStatus, 2000);

    return () => {
      active = false;
      if (interval != null) window.clearInterval(interval);
      if (finishTimer != null) window.clearTimeout(finishTimer);
    };
  }, [sid, token, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h1 className="text-2xl font-bold tracking-tight">Processing Payment</h1>
        <p className="text-sm text-muted-foreground">
          Please wait while we confirm your payment. This usually takes a few seconds.
        </p>
      </div>
    </div>
  );
}
```

## src/pages/onboarding/AndroidPaywall.tsx

```tsx
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { IosAppHeader } from "@/components/IosAppHeader";

const TERMS_URL = "https://paletteplot.com/terms";
const PRIVACY_URL = "https://paletteplot.com/privacy";

/**
 * Native Android subscription paywall. Uses RevenueCat paywall UI to present
 * Google Play subscriptions. Completely separate from the iOS paywall.
 */
const AndroidPaywall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackDetail, setFallbackDetail] = useState<string | null>(null);
  const [paywallOpening, setPaywallOpening] = useState(false);

  const isNativeAndroid = isAndroidPaywallContext();

  useEffect(() => {
    debugLog({
      location: "AndroidPaywall.tsx:mount",
      message: "AndroidPaywall mounted",
      data: {
        pathname: location.pathname,
        isNativeAndroid,
      },
      hypothesisId: "ANDROID-PAY",
    });
  }, [location.pathname, isNativeAndroid]);

  const runPaywallFlow = useCallback(async () => {
    if (!isNativeAndroid) {
      toast.error("Subscriptions are only available in the Android app.", {
        duration: 6000,
      });
      setFallbackDetail("Subscriptions are only available in the Android app.");
      setShowFallback(true);
      return;
    }

    setFallbackDetail(null);
    setPaywallOpening(true);

    try {
      let uid = user?.id ?? null;
      if (!uid) {
        const { data, error } = await supabase.auth.getUser();
        uid = data.user?.id ?? null;
        if (error || !uid) {
          toast.error("Sign in again, then open subscription.", {
            duration: 8000,
          });
          setFallbackDetail(
            "No active session. Sign out, sign in, then tap Continue."
          );
          setShowFallback(true);
          return;
        }
      }

      const outcome = await runAndroidPaywallFlowAfterSignup({
        userId: uid,
        navigate,
        bypassPresentationLock: true,
      });
      const lastErr = getLastPaywallError();

      if (outcome === "success") return;

      if (outcome === "skipped") {
        toast.error("Open subscription from the app after sign up.", {
          duration: 6000,
        });
        setFallbackDetail(
          "Use Continue on the sign-up screen, or open Account from Settings."
        );
        setShowFallback(true);
        return;
      }
      setFallbackDetail(lastErr || "Something went wrong.");
      setShowFallback(true);
    } catch (e) {
      debugLog({
        location: "AndroidPaywall.tsx:runPaywallFlow:catch",
        message: "Unexpected error in AndroidPaywall paywall handler",
        data: {
          err: String((e as Error)?.message ?? e),
          stack: (e as Error)?.stack?.slice(0, 500) ?? null,
        },
        hypothesisId: "ANDROID-PAY",
      });
      toast.error("Something went wrong.", { duration: 8000 });
      setFallbackDetail(String((e as Error)?.message ?? e));
      setShowFallback(true);
    } finally {
      setPaywallOpening(false);
    }
  }, [isNativeAndroid, navigate, user?.id]);

  const handleContinue = () => {
    void runPaywallFlow();
  };

  useEffect(() => {
    if (!isNativeAndroid) {
      navigate("/onboarding/welcome", { replace: true });
    }
  }, [isNativeAndroid, navigate]);

  const paywallFooter = (
    <div className="mt-8 grid grid-cols-2 items-start gap-x-1 gap-y-2 border-t border-zinc-100 pt-6 text-[11px] text-zinc-600 sm:text-xs">
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(TERMS_URL, "_blank", "noopener,noreferrer")}
        >
          Terms / EULA
        </button>
      </div>
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(PRIVACY_URL, "_blank", "noopener,noreferrer")}
        >
          Privacy
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-foreground">
      <IosAppHeader signOutInsteadOfLogin={!!user} />

      <div
        className="mx-auto flex max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
        style={{
          minHeight: "calc(100vh - 64px - env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="relative flex-1 rounded-3xl bg-white px-5 pb-8 pt-4 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/onboarding/welcome", { replace: true })}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 touch-manipulation"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2} />
          </button>

          <div className="pointer-events-none flex justify-center pt-2 opacity-[0.18]">
            <svg
              width="120"
              height="28"
              viewBox="0 0 120 28"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 8 L14 14 L20 14 L15 18 L17 24 L12 20 L7 24 L9 18 L4 14 L10 14 Z"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="44"
                cy="12"
                r="6"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M72 6 L74 10 L78 10 L75 13 L76 17 L72 15 L68 17 L69 13 L66 10 L70 10 Z"
                fill="#B8860B"
                opacity="0.35"
              />
              <circle cx="96" cy="10" r="1.2" fill="#B8860B" />
              <circle cx="104" cy="16" r="1" fill="#B8860B" />
              <circle cx="88" cy="18" r="0.8" fill="#B8860B" />
            </svg>
          </div>

          <div className="px-1 pt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Unlock Your Manifestation Stack Today.
            </h1>
            <p className="mt-3 text-xs text-zinc-500">
              Tap Continue to confirm your plan.
            </p>
          </div>

          {!showFallback ? (
            <>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? "Opening…" : "Continue"}
              </Button>
              {paywallFooter}
            </>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-left">
                <h2 className="text-base font-semibold text-zinc-900">
                  We couldn&apos;t finish that step
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Tap Try again, or go back to sign up and tap Continue.
                </p>
                {fallbackDetail ? (
                  <p
                    className="mt-2 text-xs text-zinc-500 break-words"
                    data-testid="paywall-error"
                  >
                    {fallbackDetail}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? "Opening…" : "Try again"}
              </Button>
              {paywallFooter}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AndroidPaywall;
```

## src/pages/onboarding/AndroidPostPaywallLoading.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { WelcomeCosmicBackground } from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import {
  clearAndroidPostPurchaseEntitlementLatch,
  getAndroidPostPurchaseLatchUserId,
  markAndroidSubscriptionConfirmed,
  retryAndroidPostPurchaseEntitlementSyncInBackground,
  runAndroidPostPurchaseGateIfNeeded,
  type AndroidPostPurchaseGateResult,
} from "@/lib/androidPostPurchaseEntitlementGate";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";

/** Visible post-paywall cap — avoids sitting at ~92% while Play/RC sync retries. */
const ANDROID_POST_PAYWALL_SCREEN_MAX_MS = 2800;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(Math.round(value), 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-xl font-semibold tabular-nums text-white">{pct}%</div>
      </div>
    </div>
  );
}

type ExitReason = "gate_verified" | "verification_delayed" | "screen_cap";

/**
 * Android-only post-paywall loading screen. Runs the Android entitlement gate,
 * then routes to the dashboard — with a hard visible cap so Play/RC sync cannot
 * park the user at ~92% indefinitely. Provisioning continues in background.
 *
 * Purchase failures are handled before this screen. If the user reaches here,
 * treat entitlement sync failure as delayed verification — never bounce back to paywall.
 *
 * Completely separate from the iOS PostPaywallLoading.
 */
export default function AndroidPostPaywallLoading() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(8);
  const [phase, setPhase] = useState<"provisioning" | "finishing">("provisioning");
  const runningRef = useRef(false);

  const subtitle = useMemo(() => {
    if (phase === "finishing") return "Almost there — finishing your dashboard.";
    return "Setting up your practice from everything you shared.";
  }, [phase]);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    let alive = true;
    let tickId: number | null = null;
    let capTimerId: number | null = null;
    const mountTs = performance.now();
    const exitedRef = { current: false };
    const gateResultRef = { current: null as AndroidPostPurchaseGateResult | null };

    const startProgressTo100 = () => {
      const startProgress = 8;
      const progressStart = performance.now();
      if (tickId != null) window.clearInterval(tickId);
      tickId = window.setInterval(() => {
        const elapsed = performance.now() - progressStart;
        const t = Math.min(1, elapsed / ANDROID_POST_PAYWALL_SCREEN_MAX_MS);
        const next = startProgress + (100 - startProgress) * t;
        setProgress(next >= 100 ? 100 : next);
        if (t >= 1 && tickId != null) {
          window.clearInterval(tickId);
          tickId = null;
        }
      }, 50);
    };

    const finishToDashboard = (reason: ExitReason) => {
      if (!alive || exitedRef.current) return;
      exitedRef.current = true;
      if (tickId != null) window.clearInterval(tickId);
      if (capTimerId != null) window.clearTimeout(capTimerId);

      const totalMs = Math.round(performance.now() - mountTs);
      const userId = getAndroidPostPurchaseLatchUserId();
      markAndroidSubscriptionConfirmed(userId);
      clearAndroidPostPurchaseEntitlementLatch();

      setPhase("finishing");
      setProgress(100);

      debugLog({
        location: "AndroidPostPaywallLoading.tsx:exit",
        message: "Android post-paywall navigating to dashboard",
        data: {
          reason,
          gate: gateResultRef.current,
          totalMs,
          lastPaywallError: getLastPaywallError(),
        },
        hypothesisId: "ANDROID-GATE",
      });
      console.info("[android-post-paywall] exit to dashboard", {
        reason,
        gate: gateResultRef.current,
        totalMs,
      });

      if (reason === "verification_delayed" || reason === "screen_cap") {
        retryAndroidPostPurchaseEntitlementSyncInBackground();
      }

      void (async () => {
        const provisionStart = performance.now();
        try {
          await provisionPostPaywallIfNeeded({ quiet: true });
          const provisionMs = Math.round(performance.now() - provisionStart);
          debugLog({
            location: "AndroidPostPaywallLoading.tsx:provisionBackground",
            message: "Background provisionPostPaywallIfNeeded finished",
            data: { provisionMs, totalMsSinceMount: Math.round(performance.now() - mountTs) },
            hypothesisId: "ANDROID-GATE",
          });
          console.info("[android-post-paywall] background provisioning done", { provisionMs });
        } catch (e) {
          console.error("[android-post-paywall] background provisioning failed:", e);
        }
      })();

      window.setTimeout(() => navigate("/dashboard", { replace: true }), 250);
    };

    startProgressTo100();

    const gateStart = performance.now();
    void runAndroidPostPurchaseGateIfNeeded()
      .then((gate) => {
        if (!alive) return;

        const gateMs = Math.round(performance.now() - gateStart);
        gateResultRef.current = gate;

        debugLog({
          location: "AndroidPostPaywallLoading.tsx:gateSettled",
          message: "runAndroidPostPurchaseGateIfNeeded settled",
          data: { gate, gateMs },
          hypothesisId: "ANDROID-GATE",
        });
        console.info("[android-post-paywall] gate settled", { gate, gateMs });

        if (gate.status === "delayed") {
          console.warn(
            "[android-post-paywall] entitlement verification delayed after purchase",
            gate
          );
          finishToDashboard("verification_delayed");
          return;
        }

        finishToDashboard("gate_verified");
      })
      .catch((e) => {
        console.warn("[android-post-paywall] gate threw — treating as delayed verification:", e);
        gateResultRef.current = {
          status: "delayed",
          reason: e instanceof Error ? e.message : "gate_threw",
        };
        finishToDashboard("verification_delayed");
      });

    capTimerId = window.setTimeout(() => {
      if (!alive || exitedRef.current) return;
      finishToDashboard("screen_cap");
    }, ANDROID_POST_PAYWALL_SCREEN_MAX_MS);

    return () => {
      alive = false;
      if (tickId != null) window.clearInterval(tickId);
      if (capTimerId != null) window.clearTimeout(capTimerId);
    };
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden font-sans text-white antialiased">
      <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md space-y-6">
          <SetupHeadingBlock title="Your path is ready" subtitle={subtitle} />

          <div className="flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
            <ProgressRing value={progress} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="text-sm font-medium text-white/90">Building your dashboard…</div>
              <div className={cn("flex items-center gap-2", SETUP_MUTED_TEXT_CLASS)}>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/60" />
                <span>Personalizing tools from your setup.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## src/pages/onboarding/EmailCollection.tsx

```tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";
import { ONBOARDING_ROUTES } from "@/lib/onboardingFlow";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";

const EmailCollection = () => {
  const navigate = useNavigate();
  const { ensureSession, updateSession } = useOnboardingSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [appNotificationsConsent, setAppNotificationsConsent] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(false);
  const [smsMarketingConsent, setSmsMarketingConsent] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  /** Native iOS (RevenueCat UI path): paywall failed after signup — Try again on this screen. */
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);

  // Refs for debouncing
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear localStorage on mount to ensure fresh start
  useEffect(() => {
    localStorage.removeItem('onboarding_answers');
    localStorage.removeItem('selectedCharacter');
    localStorage.removeItem('selected_plan');
    localStorage.removeItem('onboarding_data');
  }, []);

  // Real-time email validation (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    // Reset error if email is empty or invalid format
    if (!email || !email.includes("@")) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }

    // Set checking state
    setIsCheckingEmail(true);
    setEmailError(null);

    // Debounce check by 500ms
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: emailExists, error: checkError } = await supabase
          .rpc('check_email_exists', { check_email: email.trim() });

        if (checkError) {
          console.error("Error checking email:", checkError);
          setEmailError(null); // Don't show error on check failure
        } else if (emailExists) {
          setEmailError("This email is already registered. Please sign in instead.");
        } else {
          setEmailError(null);
        }
      } catch (e) {
        console.error("Error checking email:", e);
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [email]);

  // Real-time username validation (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    // Reset error if username is empty
    if (!username.trim()) {
      setUsernameError(null);
      setIsCheckingUsername(false);
      return;
    }

    // Set checking state
    setIsCheckingUsername(true);
    setUsernameError(null);

    // Debounce check by 500ms
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: usernameExists, error: checkError } = await supabase
          .rpc('check_username_exists', { check_username: username.trim() });

        if (checkError) {
          console.error("Error checking username:", checkError);
          setUsernameError(null); // Don't show error on check failure
        } else if (usernameExists) {
          setUsernameError("This username is already taken. Please choose another.");
        } else {
          setUsernameError(null);
        }
      } catch (e) {
        console.error("Error checking username:", e);
        setUsernameError(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [username]);

  // Password validation
  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError(null);
  }, [password, confirmPassword]);

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      if (isAndroidPaywallContext()) {
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") { setPaywallNeedsRetry(false); return; }
        setPaywallNeedsRetry(true);
        return;
      }

      const outcome = await runIosPaywallFlowAfterSignup({
        userId: uid,
        navigate,
      });
      if (outcome === "success") {
        setPaywallNeedsRetry(false);
        return;
      }
      if (outcome === "skipped") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      setPaywallNeedsRetry(true);
    } finally {
      setIsRetryingPaywall(false);
    }
  };

  const handleContinue = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Please enter a password with at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!firstName.trim()) {
      toast.error("Please enter your first name");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    // Check for errors from real-time validation
    if (emailError) {
      toast.error(emailError);
      if (emailError.includes("already registered")) {
        navigate("/login");
      }
      return;
    }

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            username: username.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw new Error(
            "Account created, but sign-in is blocked. Please verify your email, then sign in."
          );
        }
      }

      const uid = signUpData.user?.id ?? null;

      const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
      if (isNativeIos) {
        // Save session data in background — don't block the paywall
        ensureSession().then(() => updateSession({
          email: email.trim(),
          first_name: firstName.trim(),
          username: username.trim() || null,
          app_notifications_consent: appNotificationsConsent,
          email_consent: emailMarketingConsent,
          sms_consent: smsMarketingConsent,
        })).catch(() => {});

        let useRcUi = true;
        try {
          useRcUi = await shouldUseRevenueCatPaywallUi();
        } catch {
          useRcUi = false;
        }

        // Older iOS: dedicated paywall screen (Monthly / Annual + StoreKit). Same route as resubscribe.
        if (!useRcUi) {
          setPaywallNeedsRetry(false);
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }

        setPaywallNeedsRetry(false);
        const outcome = await runIosPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }

      // Non-iOS: save session data before navigating
      await ensureSession();
      await updateSession({
        email: email.trim(),
        first_name: firstName.trim(),
        username: username.trim() || null,
        app_notifications_consent: appNotificationsConsent,
        email_consent: emailMarketingConsent,
        sms_consent: smsMarketingConsent,
      });

      if (isAndroidPaywallContext()) {
        ensureSession()
          .then(() => updateSession({
            email: email.trim(),
            first_name: firstName.trim(),
            username: username.trim() || null,
            app_notifications_consent: appNotificationsConsent,
            email_consent: emailMarketingConsent,
            sms_consent: smsMarketingConsent,
          }))
          .catch(() => {});

        setPaywallNeedsRetry(false);
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          setPaywallNeedsRetry(true);
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      const outcome = await runWebPaywallFlowAfterSignup({ userId: uid, navigate });
      if (outcome === "skipped") {
        toast.error("Could not open subscription options. Try again in a moment.");
      }
    } catch (e: unknown) {
      console.error("Error saving email:", e);
      const message = e instanceof Error ? e.message : "Failed to save. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formReady =
    email &&
    email.includes("@") &&
    password &&
    confirmPassword &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptedTerms &&
    firstName.trim() &&
    username.trim() &&
    !isSubmitting &&
    !emailError &&
    !passwordError &&
    !usernameError &&
    !isCheckingEmail &&
    !isCheckingUsername;

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry ? !isRetryingPaywall : formReady;
  const footerContinueText = paywallNeedsRetry ? "Try again" : "Continue";

  return (
    <OnboardingLayout
      currentPage={7}
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
    >
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Let's Get Started
          </h1>
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-left">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 rounded-xl ${emailError ? "border-destructive" : ""}`}
              autoComplete="email"
              autoFocus
            />
            {isCheckingEmail && (
              <p className="text-xs text-muted-foreground">Checking availability...</p>
            )}
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="firstName" className="text-left">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 rounded-xl"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="username" className="text-left">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`h-10 rounded-xl ${usernameError ? "border-destructive" : ""}`}
                autoComplete="username"
              />
              {isCheckingUsername && (
                <p className="text-xs text-muted-foreground">Checking...</p>
              )}
              {usernameError && (
                <p className="text-xs text-destructive">{usernameError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="password" className="text-left">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-10 rounded-xl ${passwordError ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="confirmPassword" className="text-left">
                Confirm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-10 rounded-xl ${passwordError ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
            </div>
          </div>
          {passwordError && (
            <p className="text-xs text-destructive">{passwordError}</p>
          )}

          <div className="space-y-2.5 pt-2">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                I accept the{" "}
                <button
                  type="button"
                  onClick={() => navigate("/terms")}
                  className="text-foreground font-medium hover:underline"
                >
                  Terms of Service
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={() => navigate("/privacy")}
                  className="text-foreground font-medium hover:underline"
                >
                  Privacy Policy
                </button>
                .
              </Label>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="app-notifications"
                checked={appNotificationsConsent}
                onCheckedChange={(checked) => setAppNotificationsConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="app-notifications"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                I consent to app notifications (optional). New tools, promotions and app news. Opt out in Settings → Notification preferences.
              </Label>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="email"
                checked={emailMarketingConsent}
                onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="email"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                I consent to email marketing communications (optional, separate from transactional emails minimally required). Opt out in settings.
              </Label>
            </div>

            <div className="flex items-start gap-2.5 hidden">
              <Checkbox
                id="sms"
                checked={smsMarketingConsent}
                onCheckedChange={(checked) => setSmsMarketingConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="sms"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                I consent to SMS marketing communications (optional). Opt out in settings. Message and data rates may apply.
              </Label>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default EmailCollection;
```

## src/pages/onboarding/setup/Email.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SETUP_FIELD_CLASS,
  SETUP_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
} from "@/lib/onboardingSetupTheme";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { toast } from "sonner";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";

export default function SetupEmail() {
  const navigate = useNavigate();
  const { ensureSession, updateSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft(), []);
  const [email, setEmail] = useState(initial.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(
    initial.emailMarketingConsent === true,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  /** RevenueCat paywall failed after signup — same retry pattern as legacy `EmailCollection`. */
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);
  const emailCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setPasswordError(null);
  }, [password]);

  useEffect(() => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    if (!email || !email.includes("@")) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }
    setIsCheckingEmail(true);
    setEmailError(null);
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: emailExists, error: checkError } = await supabase.rpc("check_email_exists", {
          check_email: email.trim(),
        });
        if (checkError) {
          setEmailError(null);
        } else if (emailExists) {
          setEmailError("This email is already registered. Sign in instead.");
        } else {
          setEmailError(null);
        }
      } catch {
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);
    return () => {
      if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    };
  }, [email]);

  const normalizedEmail = email.trim().toLowerCase();
  const firstName = (readSetupDraft().firstName ?? "").trim();
  const usernameForAuth = normalizedEmail;

  const formValid =
    normalizedEmail.length > 3 &&
    normalizedEmail.includes("@") &&
    password.length >= 8 &&
    acceptedTerms &&
    firstName.length > 0 &&
    !emailError &&
    !passwordError &&
    !isCheckingEmail;

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (isAndroidPaywallContext()) {
        const outcome = await runAndroidPaywallFlowAfterSignup({
          userId: userData.user?.id ?? null,
          navigate,
        });
        if (outcome === "success") {
          setPaywallNeedsRetry(false);
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      const outcome = await runIosPaywallFlowAfterSignup({
        userId: userData.user?.id ?? null,
        navigate,
      });
      if (outcome === "success") {
        setPaywallNeedsRetry(false);
        return;
      }
      if (outcome === "skipped") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      setPaywallNeedsRetry(true);
    } finally {
      setIsRetryingPaywall(false);
    }
  };

  const handleContinue = async () => {
    if (!normalizedEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!firstName) {
      toast.error("We need your first name from earlier in setup.");
      navigate("/onboarding/setup/name");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Please enter a password with at least 8 characters");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }
    if (emailError) {
      toast.error(emailError);
      if (emailError.includes("already registered")) navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            username: usernameForAuth,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          throw new Error(
            "Account created, but sign-in is blocked. Verify your email, then sign in.",
          );
        }
      }

      const draftSnapshot = readSetupDraft();
      const sessionPatch: Record<string, unknown> = {
        email: normalizedEmail,
        first_name: firstName,
        username: usernameForAuth,
        email_consent: emailMarketingConsent,
        sms_consent: false,
      };
      if (typeof draftSnapshot.appNotificationsConsent === "boolean") {
        sessionPatch.app_notifications_consent = draftSnapshot.appNotificationsConsent;
      }

      const uid = signUpData.user?.id ?? null;
      const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

      if (isNativeIos) {
        ensureSession()
          .then(() => updateSession(sessionPatch))
          .then(() =>
            writeSetupDraft({
              email: normalizedEmail,
              emailMarketingConsent,
            }),
          )
          .catch(() => {});

        let useRcUi = true;
        try {
          useRcUi = await shouldUseRevenueCatPaywallUi();
        } catch {
          useRcUi = false;
        }

        if (!useRcUi) {
          setPaywallNeedsRetry(false);
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }

        setPaywallNeedsRetry(false);
        const outcome = await runIosPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }

      await ensureSession();
      await updateSession(sessionPatch);

      writeSetupDraft({
        email: normalizedEmail,
        emailMarketingConsent,
      });

      if (isAndroidPaywallContext()) {
        setPaywallNeedsRetry(false);
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      const outcome = await runWebPaywallFlowAfterSignup({ userId: uid, navigate });
      if (outcome === "skipped") {
        toast.error("Could not open subscription options. Try again in a moment.");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong. Try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry
    ? !isRetryingPaywall
    : formValid && !isSubmitting;
  const footerContinueText = paywallNeedsRetry ? "Try again" : "Continue";

  return (
    <OnboardingLayout
      currentPage={12}
      nativeFormPage
      setupCosmicPage
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
    >
      <div className="relative z-[1] mx-auto w-full max-w-md space-y-6 text-white">
        <SetupHeadingBlock
          centered
          title="Save your path"
          subtitle="Create your account to lock in your path. All of your progress is saved to this email."
          titleClassName="!text-white"
          subtitleClassName="!text-white/55"
        />

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="setup-email" className={`${SETUP_LABEL_CLASS} !text-white/70`}>
            Email
          </Label>
          <Input
            id="setup-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            inputMode="email"
            className={`${SETUP_FIELD_CLASS} !bg-white/95 !text-zinc-900 placeholder:!text-zinc-400 [color-scheme:light] ${emailError ? "border-destructive" : ""}`}
            style={{
              color: "#18181b",
              WebkitTextFillColor: "#18181b",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
            }}
          />
          {isCheckingEmail ? (
            <p className={SETUP_MUTED_TEXT_CLASS}>Checking availability…</p>
          ) : null}
          {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
        </div>

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="setup-password" className={SETUP_LABEL_CLASS}>
            Password
          </Label>
          <div className="relative">
            <Input
              id="setup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              autoComplete="new-password"
              className={`${SETUP_FIELD_CLASS} pr-11 ${passwordError ? "border-destructive" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-12 w-11 rounded-2xl text-zinc-500 hover:text-zinc-800"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          {passwordError ? <p className="text-xs text-destructive pt-1">{passwordError}</p> : null}
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="setup-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label
              htmlFor="setup-terms"
              className="text-xs text-white/55 leading-tight cursor-pointer"
            >
              I accept the{" "}
              <button
                type="button"
                onClick={() => navigate("/terms")}
                className="font-medium text-white/90 hover:underline"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => navigate("/privacy")}
                className="font-medium text-white/90 hover:underline"
              >
                Privacy Policy
              </button>
              .
            </Label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="setup-email-marketing"
              checked={emailMarketingConsent}
              onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label
              htmlFor="setup-email-marketing"
              className="text-xs text-white/55 leading-snug cursor-pointer"
            >
              Send me manifestation tips and updates. By checking this box, you consent to marketing
              communications. You can opt out anytime.
            </Label>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
```

## src/services/revenueCat.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { LOG_LEVEL, Purchases } from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";
import { debugLog } from "@/debugLog";
import {
  getIosMajorVersionForNative,
  shouldUseRevenueCatPaywallUi,
  IOS_REVENUECAT_UI_MIN_MAJOR,
} from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";

/** Compat StoreKit path only; ignored when RevenueCat paywall UI is shown. */
export type PresentPaywallOptions = {
  billingPeriod?: BillingPeriod;
};

let hasConfigured = false;
let configuredAppUserId: string | null = null;

/** Last reason presentRevenueCatPaywall returned false (for debugging UI). */
let lastPaywallError: string | null = null;

export function getLastPaywallError(): string | null {
  return lastPaywallError;
}

/** UI / flow helpers when RevenueCat is not invoked (e.g. global in-flight guard). */
export function setLastPaywallErrorMessage(message: string) {
  lastPaywallError = message;
}

// #region agent log (dev-only: loopback ingest triggers Chrome "apps on device" prompt on production HTTPS)
function agentLogF33356(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  if (import.meta.env.DEV !== true) return;

  const payload = {
    sessionId: "f33356",
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };
  fetch("http://127.0.0.1:7242/ingest/ec790500-f9a6-4150-b33b-d4ac4517adfd", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f33356" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  try {
    const line = JSON.stringify(payload);
    const cur = typeof localStorage !== "undefined" ? localStorage.getItem("debug_f33356_log") ?? "" : "";
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("debug_f33356_log", cur ? `${cur}\n${line}` : line);
    }
  } catch {
    // ignore
  }
}
// #endregion

const getRevenueCatApiKey = () => {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;
  }
  if (platform === "android") {
    return import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined;
  }
  return undefined;
};

export const bootstrapRevenueCat = async (appUserId?: string | null) => {
  if (!Capacitor.isNativePlatform()) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn("[RevenueCat] Missing platform API key. Skipping setup.");
    return;
  }

  try {
    if (!hasConfigured) {
      await Purchases.setLogLevel({
        level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO,
      });

      await Purchases.configure({
        apiKey,
        appUserID: appUserId ?? undefined,
      });

      hasConfigured = true;
      configuredAppUserId = appUserId ?? null;
      return;
    }

    const nextUserId = appUserId ?? null;
    if (nextUserId === configuredAppUserId) return;

    if (nextUserId) {
      await Purchases.logIn({ appUserID: nextUserId });
      configuredAppUserId = nextUserId;
      return;
    }

    await Purchases.logOut();
    configuredAppUserId = null;
  } catch (error) {
    console.error("[RevenueCat] Bootstrap failed:", error);
  }
};

export const hasRevenueCatEntitlement = async (entitlementId: string) => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[entitlementId] !== "undefined";
  } catch (error) {
    console.error("[RevenueCat] Failed to fetch customer info:", error);
    return false;
  }
};

export const presentRevenueCatPaywall = async (
  appUserId?: string | null,
  paywallOptions?: PresentPaywallOptions
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  const platform = Capacitor.getPlatform();
  const apiKey = getRevenueCatApiKey();
  const hasApiKey = !!apiKey;
  const compatBilling: BillingPeriod = paywallOptions?.billingPeriod ?? "monthly";
  debugLog({
    location: "revenueCat.ts:presentPaywall",
    message: "presentRevenueCatPaywall entry",
    data: {
      platform,
      isNative: Capacitor.isNativePlatform(),
      hasApiKey,
      compatBillingRequested: compatBilling,
    },
    hypothesisId: "H3",
  });

  if (!hasApiKey) {
    lastPaywallError = "No RevenueCat API key configured.";
    console.warn("[RevenueCat] No API key; skipping presentPaywall to avoid native crash.");
    return false;
  }

  lastPaywallError = null;
  try {
    const userId = appUserId ?? configuredAppUserId ?? undefined;
    await bootstrapRevenueCat(userId ?? null);

    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) {
      lastPaywallError = "RevenueCat could not be configured.";
      debugLog({
        location: "revenueCat.ts:presentPaywall",
        message: "RevenueCat not configured",
        data: { lastPaywallError },
        hypothesisId: "H3",
      });
      return false;
    }

    const iosMajor = await getIosMajorVersionForNative();
    const useRcUi = await shouldUseRevenueCatPaywallUi();
    /** Same floor as Manage billing (25): never RevenueCat SwiftUI paywall on unknown or below that major. */
    const iosHardBlockRcUi =
      platform === "ios" && (iosMajor == null || iosMajor < IOS_REVENUECAT_UI_MIN_MAJOR);
    // #region agent log
    agentLogF33356(
      "revenueCat.ts:presentPaywall:branch",
      "iOS paywall path",
      {
        iosMajor,
        useRcUi,
        iosHardBlockRcUi,
        rcUiMinMajor: IOS_REVENUECAT_UI_MIN_MAJOR,
        platform,
      },
      "H1"
    );
    // #endregion

    if (platform === "ios" && (!useRcUi || iosHardBlockRcUi)) {
      const { purchasePremiumViaNativeStoreKit } = await import("@/lib/nativeIosPremiumPurchase");
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compat",
        "StoreKit direct (skip RevenueCat UI)",
        { plan: compatBilling },
        "H1"
      );
      // #endregion
      const outcome = await purchasePremiumViaNativeStoreKit(compatBilling);
      if (outcome.success) {
        lastPaywallError = null;
        // #region agent log
        agentLogF33356("revenueCat.ts:presentPaywall:compatResult", "compat purchase ok", {}, "H4");
        // #endregion
        return true;
      }
      const rawErr = outcome.error ?? "";
      lastPaywallError =
        rawErr === "cancelled"
          ? "Cancelled"
          : rawErr || "Purchase was not completed.";
      const fallbackToRcUi =
        rawErr.includes("Billing not supported") || rawErr.includes("Could not check billing");
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compatResult",
        "compat purchase failed",
        { lastPaywallError, rawErr, fallbackToRcUi },
        "H4"
      );
      // #endregion
      if (!fallbackToRcUi) {
        return false;
      }
      if (iosHardBlockRcUi) {
        lastPaywallError =
          lastPaywallError ?? "Billing unavailable; RevenueCat paywall UI is not used on this iOS version.";
        return false;
      }
      lastPaywallError = null;
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compatToRcFallback",
        "NativePurchases billing blocked; falling back to RevenueCat paywall UI",
        {},
        "H6"
      );
      // #endregion
    }

    try {
      await Purchases.getOfferings();
    } catch (offeringsErr) {
      const msg = (offeringsErr as Error)?.message ?? String(offeringsErr);
      lastPaywallError = msg.includes("offerings") || msg.includes("Offering")
        ? "No offerings in RevenueCat. Add a default offering and paywall in the dashboard."
        : msg;
      debugLog({
        location: "revenueCat.ts:presentPaywall",
        message: "getOfferings failed",
        data: { lastPaywallError, raw: msg },
        hypothesisId: "H3",
      });
      console.error("[RevenueCat] getOfferings failed:", offeringsErr);
      return false;
    }

    await new Promise((r) => setTimeout(r, 150));

    // #region agent log
    agentLogF33356("revenueCat.ts:presentPaywall:beforeRcUi", "calling RevenueCatUI.presentPaywall", {}, "H2");
    // #endregion
    const { RevenueCatUI, PAYWALL_RESULT } = await import("@revenuecat/purchases-capacitor-ui");
    const { result } = await RevenueCatUI.presentPaywall({
      offering: { identifier: "Production Offering" },
    } as import("@revenuecat/purchases-capacitor-ui").PresentPaywallOptions);
    const resultStr = String(result);
    const failReason =
      result === PAYWALL_RESULT.NOT_PRESENTED
        ? "Not presented"
        : result === PAYWALL_RESULT.ERROR
          ? "Paywall error"
          : result === PAYWALL_RESULT.CANCELLED
            ? "Cancelled"
            : result !== PAYWALL_RESULT.PURCHASED && result !== PAYWALL_RESULT.RESTORED
              ? `Unknown result: ${resultStr}`
              : null;
    if (failReason) lastPaywallError = failReason;
    debugLog({
      location: "revenueCat.ts:presentResult",
      message: "presentPaywall result",
      data: { result: resultStr, failReason, lastPaywallError: lastPaywallError ?? undefined },
      hypothesisId: "H2",
    });

    switch (result) {
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      case PAYWALL_RESULT.CANCELLED:
        lastPaywallError = result === PAYWALL_RESULT.ERROR ? "Paywall error" : result === PAYWALL_RESULT.CANCELLED ? "Cancelled" : "Not presented";
        return false;
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        lastPaywallError = null;
        return true;
      default:
        lastPaywallError = "Unknown result";
        return false;
    }
  } catch (error) {
    const errMsg = String((error as Error)?.message ?? error);
    lastPaywallError = errMsg;
    debugLog({ location: "revenueCat.ts:presentCatch", message: "presentRevenueCatPaywall catch", data: { err: String((error as Error)?.message ?? error) }, hypothesisId: "H2" });
    console.error("[RevenueCat] Failed to present paywall:", error);
    return false;
  }
};

/** Onboarding prefs to send so backend can write to user_preferences, profiles, and user_plans (iOS path). */
interface OnboardingPrefsPayload {
  selected_character?: string | null;
  first_name?: string | null;
  username?: string | null;
  phone?: string | null;
  app_notifications_enabled?: boolean | null;
  texts_enabled?: boolean | null;
  email_marketing?: boolean | null;
  preferred_send_window?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
  embody_active_practices?: string[] | null;
}

/** Gather onboarding prefs from localStorage + optional onboarding session (for iOS so backend can write user_preferences/profiles). */
async function gatherOnboardingPrefs(): Promise<OnboardingPrefsPayload | null> {
  const validCharacters = ["river", "sage", "rose", "oliver"];
  const selectedFromStorage = typeof localStorage !== "undefined" ? localStorage.getItem("selectedCharacter") : null;
  const selected_character =
    selectedFromStorage && validCharacters.includes(selectedFromStorage.toLowerCase())
      ? selectedFromStorage.toLowerCase()
      : null;

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
    const storedRaw = typeof localStorage !== "undefined" ? localStorage.getItem("onboarding_session") : null;
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
  const char = (session?.character_id ?? selected_character)?.toLowerCase();
  if (char && validCharacters.includes(char)) prefs.selected_character = char;

  if (session?.first_name != null) prefs.first_name = session.first_name;
  if (session?.username != null) prefs.username = session.username;
  if (session?.phone != null) prefs.phone = session.phone;
  if (session?.app_notifications_consent != null) prefs.app_notifications_enabled = session.app_notifications_consent;
  if (session?.email_consent != null) prefs.email_marketing = session.email_consent;
  if (session?.sms_consent != null) prefs.texts_enabled = session.sms_consent;
  if (session?.onboarding_answers != null) prefs.onboarding_answers = session.onboarding_answers;
  prefs.preferred_send_window = "both";

  // Embody daily practices (exactly five), captured during setup flow.
  try {
    const rawDraft = typeof localStorage !== "undefined" ? localStorage.getItem("sv_setup_draft_v1") : null;
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft) as { embodyDailyPractices?: unknown };
      const { mapOnboardingEmbodyKeysToAppSlugs } = await import("@/lib/embodyPracticesCatalog");
      const slugs = mapOnboardingEmbodyKeysToAppSlugs(parsed?.embodyDailyPractices);
      if (slugs) prefs.embody_active_practices = slugs;
    }
  } catch {
    // ignore
  }

  if (Object.keys(prefs).length === 0) return null;
  return prefs;
}

const APPLE_REVENUECAT_BILLING_SYNC_THROTTLE_MS = 6 * 60 * 60 * 1000;
const appleRcBillingSyncStorageKey = (userId: string) => `apple_rc_billing_sync_${userId}`;

function isAppleOrRevenueCatBilledPlan(row: {
  last_payment_source?: string | null;
  stripe_customer_id?: string | null;
} | null): boolean {
  if (!row) return false;
  const cid = row.stripe_customer_id ?? "";
  return (
    row.last_payment_source === "apple" ||
    cid.startsWith("apple:") ||
    cid.startsWith("revenuecat:")
  );
}

/**
 * For users billed via Apple / RevenueCat, refresh user_plans (e.g. current_period_end) via the
 * sync-revenuecat-entitlement Edge Function. Safe on web/PWA and native; no-op for Stripe-only users.
 */
export async function refreshAppleRevenueCatPlanOnServer(
  mode: "session_start" | "background" = "session_start",
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  const uid = session.user.id;

  const { data: plan, error } = await supabase
    .from("user_plans")
    .select("last_payment_source, stripe_customer_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (error || !isAppleOrRevenueCatBilledPlan(plan)) return;

  if (mode === "background") {
    const raw = sessionStorage.getItem(appleRcBillingSyncStorageKey(uid));
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!Number.isNaN(ts) && Date.now() - ts < APPLE_REVENUECAT_BILLING_SYNC_THROTTLE_MS) return;
    }
  }

  try {
    const { error: invokeErr } = await supabase.functions.invoke("sync-revenuecat-entitlement", { method: "POST" });
    if (invokeErr) {
      console.warn("[Billing] RevenueCat server sync:", invokeErr.message);
      return;
    }
    try {
      sessionStorage.setItem(appleRcBillingSyncStorageKey(uid), String(Date.now()));
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.warn("[Billing] RevenueCat server sync failed:", e);
  }
}

/**
 * Push StoreKit state to RevenueCat, then sync `user_plans` via `sync-revenuecat-entitlement`.
 * Use after Capgo NativePurchases purchase/restore or RC paywall purchase so the edge function sees an up-to-date subscriber.
 */
export const syncRevenueCatEntitlementToBackend = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  const plat = Capacitor.getPlatform();
  if (plat !== "ios" && plat !== "android") return false;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn("[RevenueCat] Backend sync skipped: no session.");
      return false;
    }

    await bootstrapRevenueCat(session.user.id);

    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) {
      console.warn("[RevenueCat] Not configured; cannot sync entitlement to backend.");
      return false;
    }

    try {
      await Purchases.syncPurchases();
    } catch (e) {
      console.warn("[RevenueCat] syncPurchases failed (continuing with edge sync):", e);
    }

    const onboarding_prefs = await gatherOnboardingPrefs();
    const body: Record<string, unknown> = {};
    if (onboarding_prefs && Object.keys(onboarding_prefs).length > 0) {
      body.onboarding_prefs = onboarding_prefs;
    }
    const { error, data } = await supabase.functions.invoke("sync-revenuecat-entitlement", {
      method: "POST",
      body,
    });

    const payload = data as {
      success?: boolean;
      active?: boolean;
      downgraded?: boolean;
      preservedExisting?: boolean;
      preservedStripeBilling?: boolean;
      error?: string;
    } | null;

    const syncOk =
      !error &&
      !payload?.downgraded &&
      (payload?.preservedExisting === true ||
        payload?.preservedStripeBilling === true ||
        (payload?.success === true && payload?.active === true));

    debugLog({
      location: "revenueCat.ts:syncToBackend",
      message: syncOk ? "sync ok" : "sync failed",
      data: {
        invokeError: error?.message ?? null,
        dataBody: data ?? null,
      },
      hypothesisId: "H5",
    });

    if (!syncOk) {
      const errMsg = payload?.error || error?.message || String(error ?? "Sync rejected");
      console.error("[RevenueCat] Backend entitlement sync failed:", error || payload?.error, "data:", data);
      return false;
    }

    return true;
  } catch (error) {
    const errMsg = String((error as Error)?.message ?? error);
    debugLog({
      location: "revenueCat.ts:syncToBackend",
      message: "sync exception",
      data: { err: errMsg },
      hypothesisId: "H5",
    });
    console.error("[RevenueCat] Entitlement sync exception:", error);
    return false;
  }
};

const POST_PURCHASE_ENTITLEMENT_INITIAL_DELAY_MS = 500;
const POST_PURCHASE_ENTITLEMENT_RETRY_DELAY_MS = 500;

/** Short settle delay, then repeated `syncRevenueCatEntitlementToBackend` (post–StoreKit / RC paywall). */
export async function syncRevenueCatEntitlementAfterPurchaseWithRetries(attempts = 4): Promise<boolean> {
  await new Promise((r) => setTimeout(r, POST_PURCHASE_ENTITLEMENT_INITIAL_DELAY_MS));
  for (let i = 0; i < attempts; i += 1) {
    if (await syncRevenueCatEntitlementToBackend()) return true;
    await new Promise((r) => setTimeout(r, POST_PURCHASE_ENTITLEMENT_RETRY_DELAY_MS));
  }
  return false;
}
```

## supabase/functions/_shared/revenueCatSecretEnv.ts

```typescript
/**
 * RevenueCat REST API secret (`sk_...`) for Edge Functions.
 * Standard Supabase secret name: `REVENUECAT_SECRET_KEY`.
 * Also accepts `revenuecat_secret_key` for projects that created the secret under that name.
 */
export function getRevenueCatServerSecretKey(): string | undefined {
  const primary = Deno.env.get("REVENUECAT_SECRET_KEY")?.trim();
  if (primary) return primary;
  return Deno.env.get("revenuecat_secret_key")?.trim();
}
```

## supabase/functions/_shared/revenuecatUserPlansSync.ts

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

type SupabaseServiceClient = ReturnType<typeof createClient>;

export const REVENUECAT_ENTITLEMENT_ID = "Palette Plotting Pro";
export const REVENUECAT_API = "https://api.revenuecat.com/v1/subscribers";

/** Parse user_plans.current_period_end → ms, or NaN. */
function parsePeriodEndMs(value: string | null | undefined): number {
  if (value == null || String(value).trim() === "") return NaN;
  const t = new Date(String(value)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * RC entitlement expiry for max() comparison. Empty expires_date ⇒ still subscribed (treat as +∞).
 */
function revenueCatEntitlementExpiresEndMs(entitlement: RevenueCatEntitlement): number {
  if (entitlement.expires_date == null || String(entitlement.expires_date).trim() === "") {
    return Number.POSITIVE_INFINITY;
  }
  const t = new Date(String(entitlement.expires_date)).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

export interface RevenueCatEntitlement {
  expires_date?: string | null;
  product_identifier?: string;
  purchase_date?: string;
  /** Trial / intro / normal — RevenueCat REST (often lowercase). */
  period_type?: string | null;
}

export interface RevenueCatSubscriptionEntry {
  period_type?: string | null;
  expires_date?: string | null;
  /** e.g. APP_STORE, PLAY_STORE — RevenueCat REST subscriber.subscriptions[productId].store */
  store?: string | null;
  store_transaction_id?: string | null;
  original_store_transaction_id?: string | null;
}

export interface RevenueCatSubscriberResponse {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscriptionEntry>;
  };
}

function normPeriodType(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/** Initial profile → user_plans copy only when this column on user_plans is not set yet (later RC syncs do not replace). */
function userPlansIdentityUnset(v: unknown): boolean {
  return v == null || (typeof v === "string" && v.trim() === "");
}

/** Sticky signal from RC snapshot: any subscription row or entitlement shows trial period type. */
export function revenueCatIndicatesHadTrialFromSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (ent && normPeriodType(ent.period_type) === "trial") return true;

  const subs = subscriber?.subscriptions;
  if (!subs || typeof subs !== "object") return false;
  for (const key of Object.keys(subs)) {
    const entry = subs[key];
    if (!entry || typeof entry !== "object") continue;
    if (normPeriodType(entry.period_type) === "trial") return true;
  }
  return false;
}

function subscriptionExpiresMs(entry: RevenueCatSubscriptionEntry): number {
  const raw = entry.expires_date;
  if (raw == null || raw === "") return NaN;
  const t = new Date(String(raw)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * True if the Palette Plotting entitlement is active and RC reports the current period is a free trial
 * (entitlement.period_type or the linked subscription row).
 */
export function revenueCatOnTrialNow(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  nowMs: number,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (!ent) return false;
  const entActive =
    ent.expires_date == null || ent.expires_date === "" || new Date(String(ent.expires_date)).getTime() > nowMs;
  if (!entActive) return false;

  if (normPeriodType(ent.period_type) === "trial") return true;

  const pid = ent.product_identifier;
  if (pid && subscriber?.subscriptions?.[pid]) {
    const sub = subscriber.subscriptions[pid]!;
    const subMs = subscriptionExpiresMs(sub);
    const subActive = Number.isNaN(subMs) || subMs > nowMs;
    if (subActive && normPeriodType(sub.period_type) === "trial") return true;
  }

  return false;
}

/** Webhook event fields (uppercase TRIAL in docs) — trial start or conversion off trial still counts as ever had trial. */
export function webhookEventImpliesHadTrial(event: Record<string, unknown>): boolean {
  if (normPeriodType(event.period_type) === "trial") return true;
  if (event.is_trial_conversion === true) return true;
  return false;
}

function normalizedRevenueCatStore(store: unknown): string {
  return String(store ?? "").trim().toUpperCase().replace(/-/g, "_");
}

function isAppleStoreFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "APP_STORE" || s === "MAC_APP_STORE";
}

/**
 * Apple transaction id for user_plans.apple_customer_id from GET /subscribers (subscription row for entitlement product).
 * Prefers original_store_transaction_id when present (stable across renewals), else store_transaction_id.
 */
export function appleCustomerIdFromRevenueCatSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): string | null {
  if (!subscriber) return null;
  const ent = subscriber.entitlements?.[entitlementId];
  const pid = ent?.product_identifier?.trim();
  if (!pid) return null;
  const sub = subscriber.subscriptions?.[pid] as RevenueCatSubscriptionEntry | undefined;
  if (!sub || typeof sub !== "object") return null;
  if (!isAppleStoreFromRcStore(sub.store)) return null;
  const orig = sub.original_store_transaction_id?.trim();
  if (orig) return orig;
  const cur = sub.store_transaction_id?.trim();
  if (cur) return cur;
  return null;
}

/** Webhook payload may include transaction ids when store is App Store. */
function appleCustomerIdFromWebhookEvent(event: Record<string, unknown>): string | null {
  if (!isAppleStoreFromRcStore(event.store)) return null;
  const o = event.original_transaction_id;
  const t = event.transaction_id;
  if (typeof o === "string" && o.trim()) return o.trim();
  if (typeof t === "string" && t.trim()) return t.trim();
  const st = event.store_transaction_id;
  if (typeof st === "string" && st.trim()) return st.trim();
  return null;
}

export async function fetchRevenueCatSubscriber(
  secretKey: string,
  appUserId: string,
): Promise<{ ok: true; data: RevenueCatSubscriberResponse } | { ok: false; status: number; body: string }> {
  const encodedId = encodeURIComponent(appUserId);
  const rcRes = await fetch(`${REVENUECAT_API}/${encodedId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!rcRes.ok) {
    const body = await rcRes.text();
    return { ok: false, status: rcRes.status, body };
  }
  const data = (await rcRes.json()) as RevenueCatSubscriberResponse;
  return { ok: true, data };
}

export type RevenueCatSyncResult =
  /** `preservedStripe`: after sync, row uses real Stripe `cus_`/`sub_` + `last_payment_source: stripe` (latest expiry vs RC favored Stripe identity). */
  | { ok: true; active: true; preservedStripe: true }
  | { ok: true; active: true; preservedStripe?: false }
  | { ok: true; active: false; preservedExistingPlan: true }
  | { ok: true; active: false; downgraded?: boolean }
  | { ok: false; error: string };

/**
 * Applies RevenueCat subscriber payload to user_plans (same fields as client sync-revenuecat-entitlement).
 * Active entitlement: compares Stripe `current_period_end` vs RC entitlement end; **latest expiry wins** for
 * `current_period_end` and for billing identity: sets `stripe_customer_id`, `stripe_subscription_id`, and
 * `last_payment_source` together (Stripe `cus_`/`sub_` vs RC placeholders) so rows stay consistent.
 * Does not read or write `stripe_customer_id_official` — documentation-only (Stripe checkout).
 * When entitlement is inactive: if DB still shows active with a future current_period_end, leaves row unchanged.
 * Otherwise marks canceled, keeping last period end when possible.
 */
export async function syncUserPlansFromRevenueCatPayload(
  supabase: SupabaseServiceClient,
  appUserId: string,
  rcData: RevenueCatSubscriberResponse,
  opts: { webhookEvent?: Record<string, unknown> },
): Promise<RevenueCatSyncResult> {
  const now = new Date();
  const nowMs = now.getTime();
  const entitlement = rcData.subscriber?.entitlements?.[REVENUECAT_ENTITLEMENT_ID];
  const isActive =
    !!entitlement &&
    (entitlement.expires_date == null ||
      entitlement.expires_date === "" ||
      new Date(entitlement.expires_date) > now);

  const { data: existingBeforeRc } = await supabase
    .from("user_plans")
    .select(
      "last_payment_source, stripe_customer_id, stripe_subscription_id, status, current_period_end, had_trial, on_trial",
    )
    .eq("user_id", appUserId)
    .maybeSingle();

  const appleCustomerId =
    appleCustomerIdFromRevenueCatSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID) ??
    (opts.webhookEvent ? appleCustomerIdFromWebhookEvent(opts.webhookEvent) : null);

  if (!isActive) {
    if (!existingBeforeRc) {
      return { ok: true, active: false };
    }
    const rowForPreserve = existingBeforeRc as {
      status?: string | null;
      current_period_end?: string | null;
    };
    const periodEndMsForPreserve = rowForPreserve.current_period_end
      ? new Date(rowForPreserve.current_period_end).getTime()
      : NaN;
    const hasFuturePeriodInDb =
      !Number.isNaN(periodEndMsForPreserve) && periodEndMsForPreserve > nowMs;
    const isActiveStatusInDb = rowForPreserve.status === "active";
    if (isActiveStatusInDb && hasFuturePeriodInDb) {
      console.error(
        "[revenuecatUserPlansSync] RC inactive but user_plans active with future period; leaving row unchanged",
      );
      return { ok: true, active: false, preservedExistingPlan: true };
    }

    const hadTrial = Boolean((existingBeforeRc as { had_trial?: boolean | null }).had_trial);
    let periodEndToKeep: string | null = null;
    const rawExp = entitlement?.expires_date;
    if (rawExp != null && String(rawExp).trim() !== "") {
      const d = new Date(String(rawExp));
      if (Number.isFinite(d.getTime())) periodEndToKeep = d.toISOString();
    }
    if (!periodEndToKeep) {
      const existingEnd = (existingBeforeRc as { current_period_end?: string | null }).current_period_end;
      if (existingEnd) periodEndToKeep = existingEnd;
    }
    // Do not set tier to "basic" — keep monthly/annual for reactivation UX. Keep last period end instead of null.
    const prevLps = (existingBeforeRc as { last_payment_source?: string | null }).last_payment_source;
    const lastPaymentSource =
      prevLps === "stripe" || prevLps === "apple" ? prevLps : "apple";
    const { error: downErr } = await supabase
      .from("user_plans")
      .update({
        status: "canceled",
        last_payment_source: lastPaymentSource,
        ...(periodEndToKeep != null ? { current_period_end: periodEndToKeep } : {}),
        ...(appleCustomerId != null ? { apple_customer_id: appleCustomerId } : {}),
        updated_at: now.toISOString(),
        had_trial: hadTrial,
        on_trial: false,
      })
      .eq("user_id", appUserId);
    if (downErr) {
      console.error("[revenuecatUserPlansSync] downgrade error:", downErr);
      return { ok: false, error: downErr.message };
    }
    return { ok: true, active: false, downgraded: true };
  }

  const productId = (entitlement!.product_identifier ?? "").toLowerCase();
  const billing = productId.includes("annual")
    ? "annual"
    : productId.includes("weekly")
      ? "weekly"
      : "monthly";

  const dbEndMs = parsePeriodEndMs(
    (existingBeforeRc as { current_period_end?: string | null } | null)?.current_period_end,
  );
  const rcEndRaw = revenueCatEntitlementExpiresEndMs(entitlement!);
  const stripeComparable = Number.isFinite(dbEndMs) ? dbEndMs : Number.NEGATIVE_INFINITY;
  const rcComparable = rcEndRaw === Number.POSITIVE_INFINITY
    ? Number.POSITIVE_INFINITY
    : (Number.isFinite(rcEndRaw) ? rcEndRaw : Number.NEGATIVE_INFINITY);

  const mergedEndMs = Math.max(stripeComparable, rcComparable);
  const finalPeriodEndIso =
    mergedEndMs === Number.POSITIVE_INFINITY || !Number.isFinite(mergedEndMs)
      ? null
      : new Date(mergedEndMs).toISOString();

  const ex = existingBeforeRc as {
    last_payment_source?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  } | null;
  /** Both required to keep a coherent Stripe row (portal + webhooks resolve by `sub_`). */
  const hasFullStripeIds =
    !!ex?.stripe_customer_id?.trim().startsWith("cus_") &&
    !!ex?.stripe_subscription_id?.trim().startsWith("sub_");

  /** Apple/RC placeholders win when RC expiry is later, or we lack real Stripe ids to compare. */
  let billingIsApple: boolean;
  if (!hasFullStripeIds) {
    billingIsApple = true;
  } else if (rcComparable > stripeComparable) {
    billingIsApple = true;
  } else if (stripeComparable > rcComparable) {
    billingIsApple = false;
  } else {
    // Tie: prefer existing Stripe-backed row when `last_payment_source` is already stripe
    billingIsApple = ex?.last_payment_source !== "stripe";
  }

  const rcHadTrialSnapshot = revenueCatIndicatesHadTrialFromSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID);
  const eventHintHadTrial = opts.webhookEvent ? webhookEventImpliesHadTrial(opts.webhookEvent) : false;
  const hadTrialMerged =
    Boolean((existingBeforeRc as { had_trial?: boolean | null } | null)?.had_trial) ||
    rcHadTrialSnapshot ||
    eventHintHadTrial;

  const onTrialNow = revenueCatOnTrialNow(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID, nowMs);

  let userEmail: string | null = null;
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(appUserId);
    userEmail = authData.user?.email ?? null;
  } catch {
    /* non-fatal */
  }

  // Billing columns on upsert (omit stripe_customer_id_official — documentation column only).
  const planData: Record<string, unknown> = {
    user_id: appUserId,
    tier: "premium",
    billing_period: billing,
    status: "active",
    current_period_end: finalPeriodEndIso,
    updated_at: now.toISOString(),
    had_trial: hadTrialMerged,
    on_trial: onTrialNow,
  };
  if (billingIsApple) {
    planData.stripe_customer_id = `revenuecat:${appUserId}`;
    planData.stripe_subscription_id = `rc_${appUserId}`;
    planData.last_payment_source = "apple";
  } else {
    planData.stripe_customer_id = ex!.stripe_customer_id;
    planData.stripe_subscription_id = ex!.stripe_subscription_id ?? null;
    planData.last_payment_source = "stripe";
  }
  if (appleCustomerId != null) planData.apple_customer_id = appleCustomerId;

  const { error: planError } = await supabase.from("user_plans").upsert(planData, {
    onConflict: "user_id",
  });
  if (planError) {
    console.error("[revenuecatUserPlansSync] upsert error:", planError);
    return { ok: false, error: planError.message };
  }

  try {
    const [{ data: planRow }, { data: prof }] = await Promise.all([
      supabase
        .from("user_plans")
        .select("first_name, username, phone, email")
        .eq("user_id", appUserId)
        .maybeSingle(),
      supabase.from("profiles").select("first_name, username, phone, email").eq("id", appUserId).maybeSingle(),
    ]);
    const identityPatch: Record<string, unknown> = {};
    if (planRow && prof) {
      if (userPlansIdentityUnset(planRow.first_name) && prof.first_name != null && String(prof.first_name).trim() !== "") {
        identityPatch.first_name = prof.first_name;
      }
      if (userPlansIdentityUnset(planRow.username) && prof.username != null && String(prof.username).trim() !== "") {
        identityPatch.username = prof.username;
      }
      if (userPlansIdentityUnset(planRow.phone) && prof.phone != null && String(prof.phone).trim() !== "") {
        identityPatch.phone = prof.phone;
      }
      if (userPlansIdentityUnset(planRow.email) && prof.email != null && String(prof.email).trim() !== "") {
        identityPatch.email = prof.email;
      }
    }
    if (Object.keys(identityPatch).length > 0) {
      const { error: idErr } = await supabase.from("user_plans").update(identityPatch).eq("user_id", appUserId);
      if (idErr) console.warn("[revenuecatUserPlansSync] profile mirror to user_plans failed (non-fatal):", idErr);
    }
  } catch (e) {
    console.warn("[revenuecatUserPlansSync] profile mirror to user_plans exception (non-fatal):", e);
  }

  const preservedStripe = !billingIsApple;
  return { ok: true, active: true, preservedStripe };
}
```

## supabase/functions/sync-revenuecat-entitlement/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  fetchRevenueCatSubscriber,
  syncUserPlansFromRevenueCatPayload,
} from "../_shared/revenuecatUserPlansSync.ts";
import { getRevenueCatServerSecretKey } from "../_shared/revenueCatSecretEnv.ts";

function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  if (!(error instanceof Error)) return defaultMessage;
  const message = error.message.toLowerCase();
  if (
    message.includes("relation") ||
    message.includes("column") ||
    message.includes("rls") ||
    message.includes("permission")
  ) {
    return "Permission denied. Please ensure you're logged in.";
  }
  return defaultMessage;
}

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

/** Optional payload from iOS client: onboarding choices to write to user_preferences, profiles, and user_plans. */
interface OnboardingPrefs {
  selected_character?: string | null;
  first_name?: string | null;
  username?: string | null;
  phone?: string | null;
  app_notifications_enabled?: boolean | null;
  texts_enabled?: boolean | null;
  email_marketing?: boolean | null;
  preferred_send_window?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
  embody_active_practices?: string[] | null;
}

const VALID_CHARACTERS = ["river", "sage", "rose", "oliver"] as const;

function applyOnboardingPrefs(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  prefs: OnboardingPrefs
): Promise<void> {
  const prefsKeys = Object.keys(prefs) as (keyof OnboardingPrefs)[];
  if (prefsKeys.length === 0) return Promise.resolve();

  const profileUpdates: Record<string, unknown> = {};
  if (prefs.first_name !== undefined) profileUpdates.first_name = prefs.first_name;
  if (prefs.username !== undefined) profileUpdates.username = prefs.username;
  if (prefs.onboarding_answers !== undefined) profileUpdates.onboarding_answers = prefs.onboarding_answers;

  const prefUpdates: Record<string, unknown> = {
    user_id: userId,
  };
  if (prefs.selected_character !== undefined) {
    const c = String(prefs.selected_character || "").toLowerCase();
    prefUpdates.selected_character = VALID_CHARACTERS.includes(c as typeof VALID_CHARACTERS[number])
      ? c
      : null;
  }
  if (prefs.app_notifications_enabled !== undefined) prefUpdates.app_notifications_enabled = prefs.app_notifications_enabled;
  if (prefs.texts_enabled !== undefined) prefUpdates.texts_enabled = prefs.texts_enabled;
  if (prefs.email_marketing !== undefined) prefUpdates.email_marketing = prefs.email_marketing;
  if (prefs.preferred_send_window !== undefined) {
    const w = prefs.preferred_send_window;
    prefUpdates.preferred_send_window = w === "morning" || w === "evening" || w === "both" ? w : "both";
  }
  if (prefs.embody_active_practices !== undefined) {
    prefUpdates.embody_active_practices = Array.isArray(prefs.embody_active_practices) ? prefs.embody_active_practices : null;
  }

  return (async () => {
    if (Object.keys(profileUpdates).length > 0) {
      try {
        await supabase.from("profiles").upsert(
          { id: userId, ...profileUpdates },
          { onConflict: "id" }
        );
      } catch (e) {
        console.warn("Non-fatal: failed to upsert profiles from onboarding_prefs:", e);
      }
    }
    if (Object.keys(prefUpdates).length > 1) {
      try {
        await supabase.from("user_preferences").upsert(prefUpdates, { onConflict: "user_id" });
      } catch (e) {
        console.warn("Non-fatal: failed to upsert user_preferences from onboarding_prefs:", e);
      }
    }
    if (prefs.selected_character && VALID_CHARACTERS.includes(prefs.selected_character as typeof VALID_CHARACTERS[number])) {
      try {
        await supabase.from("character_selection_log").insert({
          user_id: userId,
          selected_character: prefs.selected_character,
          previous_character: null,
          source: "ios_onboarding_activation",
        });
      } catch (e) {
        console.warn("Non-fatal: failed to insert character_selection_log:", e);
      }
    }
  })();
}

serve(async (req) => {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "*";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: { ...corsHeaders, "Content-Length": "0" } });
  }

  try {
    const secretKey = getRevenueCatServerSecretKey();
    if (!secretKey || !secretKey.startsWith("sk_")) {
      return new Response(
        JSON.stringify({ error: "RevenueCat secret key not configured" }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    let body: { onboarding_prefs?: OnboardingPrefs } = {};
    try {
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        body = JSON.parse(raw) as { onboarding_prefs?: OnboardingPrefs };
      }
    } catch {
      // no body or invalid JSON – do not break payment path
    }

    const appUserId = user.id;
    const rc = await fetchRevenueCatSubscriber(secretKey, appUserId);
    if (!rc.ok) {
      console.error("[sync-revenuecat-entitlement] RevenueCat API error:", rc.status, rc.body);
      return new Response(
        JSON.stringify({ error: "Could not verify subscription" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await syncUserPlansFromRevenueCatPayload(supabase, appUserId, rc.data, {});

    if (!result.ok) {
      throw new Error(result.error);
    }

    if (result.preservedStripe) {
      console.log(
        "[sync-revenuecat-entitlement] Sync applied; Stripe cus_/sub_ identity kept (latest expiry vs RC).",
      );
      return new Response(
        JSON.stringify({
          success: true,
          active: true,
          preservedStripeBilling: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if ("preservedExistingPlan" in result && result.preservedExistingPlan) {
      console.error(
        "[sync-revenuecat-entitlement] RC reports inactive entitlement but DB plan active with future period; left unchanged",
      );
      return new Response(
        JSON.stringify({
          success: false,
          active: false,
          preservedExisting: true,
          error:
            "Subscription sync did not show an active entitlement; your existing plan with a future period was left unchanged.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!result.active) {
      return new Response(
        JSON.stringify({
          success: true,
          active: false,
          downgraded: result.downgraded === true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body?.onboarding_prefs && typeof body.onboarding_prefs === "object") {
      try {
        await applyOnboardingPrefs(supabase, user.id, body.onboarding_prefs);
      } catch (e) {
        console.warn("[sync-revenuecat-entitlement] onboarding_prefs apply failed (non-fatal):", e);
      }
    }

    return new Response(JSON.stringify({ success: true, active: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync-revenuecat-entitlement:", error);
    const errorOrigin = req.headers.get("origin") || req.headers.get("referer") || "*";
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      {
        status: 500,
        headers: { ...getCorsHeaders(errorOrigin), "Content-Type": "application/json" },
      }
    );
  }
});
```
