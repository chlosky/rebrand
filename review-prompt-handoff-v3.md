# iOS Review Prompt — Handoff v3
**Date:** June 3, 2026  
**App:** Palette Plotting (Capacitor iOS)  
**Purpose:** Review for correctness, edge cases, and potential improvements.

---

## Overview

The iOS App Store review prompt (`InAppReview.requestReview()`) fires on the **Dashboard** after a successful post-paywall provisioning flow. Placement, delay, audience, and on/off state are all controlled from a `feature_flags` database row — no new build required to adjust them.

---

## Architecture

### Flow

1. User completes iOS paywall → `PostPaywallLoading.tsx` provisions content
2. After provisioning succeeds, `PostPaywallLoading` sets a `sessionStorage` marker: `pending_review_prompt_after_post_paywall = "true"`
3. User navigates to `/dashboard`
4. `Dashboard.tsx` mounts → runs the review prompt hook (iOS only, once per mount)
5. Hook reads `feature_flags` row for `review_prompt`
6. Evaluates all guards (enabled, screen, pending marker, duplicate guards, audience)
7. If all pass: waits `delay_ms`, stamps both guards, calls `InAppReview.requestReview()`

### Server config keys (`feature_flags.config` JSONB)

| Key | Type | Default | Effect |
|-----|------|---------|--------|
| `is_enabled` | boolean | `true` | Kill switch |
| `allowed_screen` | string | `"dashboard"` | Which screen hook is active. Currently only `"dashboard"` is wired. |
| `audience` | string | `"trial_only"` | `"trial_only"` = `user_plans.on_trial === true` only. `"all_new"` = all subscribers. |
| `delay_ms` | number | `1200` | Ms to wait after dashboard mount before calling `requestReview()` |
| `require_pending_post_paywall` | boolean | `true` | `true` = only fire if user arrived via the paywall flow this session. `false` = fire on any dashboard visit. |
| `trigger_label` | string | `"dashboard_after_trial_start"` | Label logged with `[review_prompt] requested` for traceability. |

### Duplicate guards (belt + suspenders)

- **localStorage:** `paletteplotting_review_prompt_attempted_post_paywall_v1` — set to `"true"` before calling `requestReview()`. Persists across sessions on the device.
- **DB:** `user_plans.review_prompt_attempted_at` (nullable `TIMESTAMPTZ`) — stamped at the same time. Survives app reinstall / device change.

---

## Files Changed

### `src/pages/Dashboard.tsx` (full file)

```tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Moon, Sun, Check, Zap, CircleHelp, ChevronRight, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEmbodyActivePractices } from "@/hooks/useEmbodyActivePractices";
import confetti from "canvas-confetti";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { InAppReview } from "@capacitor-community/in-app-review";
import { dashboardFeatures } from "@/lib/featuresData";
import { useTheme } from "@/contexts/ThemeContext";
import {
  manifestationMeterBarStyle,
  manifestationChargeCheckpointsFromSignalRows,
  manifestationPowerCalendarDateToday,
  MANIFESTATION_POWER_METER_REFRESH_EVENT,
} from "@/lib/manifestationPowerSignals";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import { DashboardSkyBackground } from "@/components/dashboard/DashboardSkyBackground";
import {
  WelcomeCosmicBackground,
  WELCOME_COSMIC_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { DashboardToolIcon } from "@/components/dashboard/DashboardToolIcon";
import {
  dashboardHomeGreetingSubtitleClass,
  dashboardHomeGreetingTitleClass,
  dashboardHomeInspiredDividerClass,
  dashboardHomeInspiredFooterClass,
  dashboardHomeInspiredLabelClass,
  dashboardHomeManifestationMutedClass,
  dashboardHomeManifestationTitleClass,
  dashboardHomeSectionLabelClass,
  dashboardHomeToolChevronClass,
  dashboardHomeToolDescriptionClass,
  dashboardHomeToolTitleClass,
  dashboardHomeUsesCosmicShell,
  dashboardSectionAccentIconClass,
  dashboardMobileManifestationCardClass,
  dashboardMobileToolCardClass,
  dashboardMobileToolCardInnerClass,
  dashboardMobileToolCardStyle,
  dashboardMobileToolGridClass,
  dashboardMobileManifestationDailyLabelClass,
  dashboardMobileManifestationDividerClass,
  dashboardMobileManifestationFooterClass,
  dashboardMobileManifestationHeadingClass,
  dashboardMobileManifestationMeterTrackClass,
  dashboardMobileToolCardHoverClass,
  dashboardMobileToolTitleClass,
  dailyPracticeCellClass,
  dailyPracticeIconClass,
  dailyPracticeLabelClass,
  dashboardHeaderAvatarFallbackClass,
  dashboardHeaderAvatarShellClass,
  dashboardHeaderAvatarTriggerClass,
  dashboardHeaderIconButtonClass,
  dashboardHeaderPillButtonClass,
  getDashboardMobileSafeAreaInlet,
  getDashboardMobileCardSurface,
  manifestationChargeZapIconClass,
  manifestationMeterBarClass,
  manifestationStatusBadgeClass,
  webDashboardManifestationCardClass,
  webDashboardToolCardClass,
} from "@/lib/dashboardThemeStyles";

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function manifestationChargePercent(checkpoints: number): number {
  return Math.min(100, Math.round((Math.min(checkpoints, 3) / 3) * 100));
}

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isBrowserDesktop = !Capacitor.isNativePlatform() && !isMobile;
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobileDashboard = !isBrowserDesktop;
  const mobileCardSurface = getDashboardMobileCardSurface(theme, isMobileDashboard);
  const { activePractices } = useEmbodyActivePractices();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  
  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (cancelled) return;
          signalNativeSplashReadyToHide();
        }, 75);
      });
    });
    return () => { cancelled = true; };
  }, []);

  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  
  const shouldShowCharacterImage = Capacitor.isNativePlatform();
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [dashboardAppPowerCheckpoints, setDashboardAppPowerCheckpoints] = useState(0);
  const [dailyPracticeActions, setDailyPracticeActions] = useState<Set<string>>(() => new Set());

  const dailyPracticeCount = dailyPracticeActions.size;
  const dailyPracticeStatus =
    dailyPracticeCount >= 2 && dashboardAppPowerCheckpoints >= 2
      ? "Energetic Match"
      : dailyPracticeCount >= 1 && dashboardAppPowerCheckpoints >= 1
        ? "Aligned"
        : "Needs Alignment";

  const trackActivity = async () => {};
  const stats = null;
  const weeklyGoal = 7;
  const trackToolUsage = () => {};
  const hasShownConfetti = useRef(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Dashboard | Palette Plotting";
    return () => { document.title = prevTitle; };
  }, []);

  const refreshManifestationChargeMeter = useCallback(async () => {
    if (!user?.id) return;
    const todayLocal = manifestationPowerCalendarDateToday();
    const powerSignalsRes = await supabase
      .from("manifestation_power_daily_signals")
      .select("signal_kind")
      .eq("user_id", user.id)
      .eq("signal_date", todayLocal);
    const rows = powerSignalsRes.data ?? [];
    setDashboardAppPowerCheckpoints(manifestationChargeCheckpointsFromSignalRows(rows));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void refreshManifestationChargeMeter();
    const onVis = () => { if (document.visibilityState === "visible") void refreshManifestationChargeMeter(); };
    const onSignal = () => void refreshManifestationChargeMeter();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(MANIFESTATION_POWER_METER_REFRESH_EVENT, onSignal);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(MANIFESTATION_POWER_METER_REFRESH_EVENT, onSignal);
    };
  }, [user?.id, refreshManifestationChargeMeter]);

  useEffect(() => {
    if (!user?.id) return;
    const loadDailyPractice = async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const { data } = await supabase
        .from("user_double_progress")
        .select("completed_actions")
        .eq("user_id", user.id)
        .eq("progress_date", today)
        .maybeSingle();
      const actions = Array.isArray(data?.completed_actions) ? (data!.completed_actions as string[]) : [];
      setDailyPracticeActions(new Set(actions));
    };
    void loadDailyPractice();
    const onVis = () => { if (document.visibilityState === "visible") void loadDailyPractice(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user?.id]);

  // --- iOS review prompt (server-controlled via feature_flags.config) ---
  const reviewPromptRanRef = useRef(false);
  useEffect(() => {
    if (!user?.id) return;
    if (reviewPromptRanRef.current) return;
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;

    reviewPromptRanRef.current = true;
    const REVIEW_KEY = "paletteplotting_review_prompt_attempted_post_paywall_v1";

    (async () => {
      try {
        const { data: flag } = await supabase
          .from("feature_flags")
          .select("is_enabled, description, config")
          .eq("feature_name", "review_prompt")
          .maybeSingle();

        const cfg = (flag?.config ?? {}) as Record<string, unknown>;
        const audience = ((cfg.audience as string) ?? (flag?.description as string) ?? "").trim().toLowerCase();
        const allowedScreen = ((cfg.allowed_screen as string) ?? "dashboard").trim().toLowerCase();
        const requirePendingPostPaywall = cfg.require_pending_post_paywall !== false;
        const rawDelayMs = typeof cfg.delay_ms === "number" ? cfg.delay_ms : 1200;
        const delayMs = Math.max(0, Math.min(rawDelayMs, 5000));
        const triggerLabel = (cfg.trigger_label as string) ?? "dashboard_after_trial_start";

        console.info("[review_prompt] config", { enabled: flag?.is_enabled, audience, allowedScreen, delayMs, requirePendingPostPaywall, triggerLabel });

        if (!flag?.is_enabled) { console.info("[review_prompt] skipped: disabled"); return; }
        if (allowedScreen !== "dashboard") { console.info("[review_prompt] skipped: allowed_screen is not dashboard", { allowedScreen }); return; }

        const pendingMarker = sessionStorage.getItem("pending_review_prompt_after_post_paywall") === "true";
        if (requirePendingPostPaywall && !pendingMarker) { console.info("[review_prompt] skipped: no pending post-paywall marker"); return; }

        const alreadyAttemptedLocal = localStorage.getItem(REVIEW_KEY) === "true";
        if (alreadyAttemptedLocal) {
          console.info("[review_prompt] skipped: localStorage already attempted");
          sessionStorage.removeItem("pending_review_prompt_after_post_paywall");
          return;
        }

        const { data: plan } = await supabase
          .from("user_plans")
          .select("on_trial, review_prompt_attempted_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (plan?.review_prompt_attempted_at != null) {
          console.info("[review_prompt] skipped: DB already attempted");
          sessionStorage.removeItem("pending_review_prompt_after_post_paywall");
          return;
        }

        let eligible = false;
        if (audience === "all_new") eligible = true;
        else if (audience === "trial_only") eligible = plan?.on_trial === true;
        console.info("[review_prompt] eligibility", { eligible, audience, onTrial: plan?.on_trial });

        if (!eligible) {
          console.info("[review_prompt] skipped: not eligible for audience", { audience });
          sessionStorage.removeItem("pending_review_prompt_after_post_paywall");
          return;
        }

        await new Promise((r) => setTimeout(r, delayMs));

        localStorage.setItem(REVIEW_KEY, "true");
        const { error: updateErr } = await supabase
          .from("user_plans")
          .update({ review_prompt_attempted_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (updateErr) console.warn("[review_prompt] DB attempt write failed", updateErr);

        console.info("[review_prompt] requested", { triggerLabel, allowedScreen });
        await InAppReview.requestReview();
        sessionStorage.removeItem("pending_review_prompt_after_post_paywall");
      } catch (err) {
        console.warn("[review_prompt] dashboard prompt skipped:", err);
        try { sessionStorage.removeItem("pending_review_prompt_after_post_paywall"); } catch {}
      }
    })();
  }, [user?.id]);

  // Load firstName from sessionStorage to prevent flash on navigation
  useEffect(() => {
    if (user?.id && typeof window !== 'undefined') {
      const cachedFirstName = sessionStorage.getItem(`dashboard_firstName_${user.id}`);
      if (cachedFirstName) setFirstName(cachedFirstName);
    }
  }, [user?.id]);

  const lastFetchedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    if (lastFetchedUserIdRef.current === user.id) return;
    lastFetchedUserIdRef.current = user.id;
    let cancelled = false;
    const fetchUserData = async () => {
      setUserEmail(user.email || "");
      const profileQuery = supabase.from('profiles').select('first_name, username, avatar_url').eq('id', user.id).maybeSingle();
      const prefsQuery = supabase.from('user_preferences').select('selected_character').eq('user_id', user.id).maybeSingle();
      const [{ data: profileData }, { data: preferences }] = await Promise.all([profileQuery, prefsQuery]);
      if (cancelled) return;
      if (profileData) {
        const name = profileData.first_name || "";
        setFirstName(name);
        setUsername(profileData.username || "");
        setAvatarUrl(profileData.avatar_url || "");
        if (typeof window !== 'undefined' && user.id) sessionStorage.setItem(`dashboard_firstName_${user.id}`, name);
      }
      if (preferences?.selected_character) setSelectedCharacter(preferences.selected_character);
    };
    void fetchUserData();
    return () => { cancelled = true; };
  }, [user?.id, user?.email]);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "global" });
    await supabase.auth.signOut({ scope: "local" });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) { toast.error("Error signing out"); return; }
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("subscription_check_")) sessionStorage.removeItem(k);
      }
    } catch {}
    navigate("/", { replace: true });
  };
  
  const handleToolClick = (path: string) => { navigate(path); };

  useEffect(() => {
    if (stats?.tools_used_this_week?.length === weeklyGoal && !hasShownConfetti.current) {
      hasShownConfetti.current = true;
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#8B5CF6', '#EC4899', '#3B82F6'] });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#8B5CF6', '#EC4899', '#3B82F6'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [stats?.tools_used_this_week?.length, weeklyGoal]);

  if (isBrowserDesktop) {
    const chargePct = manifestationChargePercent(dashboardAppPowerCheckpoints);
    const displayName = firstName.trim() || "there";
    const sidebarWidth = sidebarCollapsed ? 64 : 256;
    const cosmicHome = dashboardHomeUsesCosmicShell(theme);

    return (
      <div
        className={cn(
          "relative min-h-screen overflow-x-hidden font-sans antialiased",
          cosmicHome ? "text-white" : "bg-background text-foreground",
        )}
        style={cosmicHome ? { backgroundColor: WELCOME_COSMIC_BASE } : undefined}
      >
        {cosmicHome ? (
          <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
        ) : (
          <DashboardSkyBackground fixedBackground />
        )}
        <DesktopToolSidebar
          variant={cosmicHome ? "web" : "default"}
          appearance={theme}
          onCollapsedChange={setSidebarCollapsed}
          className="!top-0 h-screen"
        />

        <div
          className="relative z-10 flex min-h-screen flex-col overflow-y-auto transition-[margin-left] duration-300 ease-in-out"
          style={{ marginLeft: sidebarWidth }}
        >
          <header
            className={cn(
              "fixed top-0 right-0 z-50 flex h-16 shrink-0 items-center border-b",
              cosmicHome ? "border-white/[0.06] bg-[#0a0812]" : "border-border bg-background",
            )}
            style={{
              top: "var(--app-safe-area-top)",
              left: sidebarWidth,
              transition: "left 300ms ease-in-out",
            }}
          >
            <div className="flex w-full items-center justify-end gap-2 px-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/your-journey/chat")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderPillButtonClass(theme)}
              >
                Talk to Guide
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerUp={(e) => e.currentTarget.blur()}
                    className={dashboardHeaderIconButtonClass(theme)}
                    aria-label="Appearance"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <Moon className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-52 z-50",
                    theme === "dark" ? "border border-white/12 bg-[#0f0d14] text-white" : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("light")}>
                    <span className="h-3 w-3 shrink-0 rounded-full border border-border bg-white shadow-sm" aria-hidden />
                    <span className="flex-1">Light</span>
                    {theme === "light" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-border bg-[hsl(0_0%_12%)] shadow-sm"
                      aria-hidden
                    />
                    <span className="flex-1">Dark</span>
                    {theme === "dark" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={dashboardHeaderAvatarTriggerClass(theme)}
                  >
                    <Avatar className={dashboardHeaderAvatarShellClass(theme)}>
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt={username || userEmail} /> : null}
                      <AvatarFallback className={dashboardHeaderAvatarFallbackClass(theme)}>
                        {username ? username[0].toUpperCase() : userEmail[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-56 z-50",
                    theme === "dark" ? "border border-white/12 bg-[#0f0d14] text-white" : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{username || "User"}</p>
                      <p
                        className={cn(
                          "text-xs leading-none",
                          theme === "dark" ? "text-white/55" : "text-muted-foreground",
                        )}
                      >
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Your Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/report-issue")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderIconButtonClass(theme)}
                aria-label="Help"
              >
                <CircleHelp className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </header>

          <main
            className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6 sm:py-6"
            style={{ paddingTop: "calc(var(--app-safe-area-top) + 4rem + 1.5rem)" }}
          >
            <div className="mb-6 sm:mb-8">
              <h1 className={dashboardHomeGreetingTitleClass(theme)}>
                {timeOfDayGreeting()}, {displayName}.
              </h1>
              <p className={cn("mt-2 sm:mt-3", dashboardHomeGreetingSubtitleClass(theme))}>
                Everything you need to manifest, in one place.
              </p>
            </div>

            <section
              className={cn(
                webDashboardManifestationCardClass(theme, dashboardAppPowerCheckpoints),
                "mb-4 sm:mb-6 p-4 sm:p-6",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className={manifestationChargeZapIconClass(theme)} aria-hidden />
                  <div>
                    <p className={dashboardHomeManifestationTitleClass(theme)}>Manifestation Charge</p>
                    <p className={dashboardHomeManifestationMutedClass(theme)}>{chargePct}% aligned today</p>
                  </div>
                </div>
                <span className={manifestationStatusBadgeClass(theme)}>{dailyPracticeStatus}</span>
              </div>
              <div className={cn("mt-4", dashboardMobileManifestationMeterTrackClass(theme, false))}>
                <div className={manifestationMeterBarClass(theme)} style={manifestationMeterBarStyle(dashboardAppPowerCheckpoints)} />
              </div>
              <div className={dashboardHomeInspiredDividerClass(theme)}>
                <p className={dashboardHomeInspiredLabelClass(theme)}>Inspired Actions</p>
                <div className="mt-2 grid grid-cols-5 gap-2 sm:mt-3 sm:gap-2.5">
                  {activePractices.map((practice) => {
                    const done = dailyPracticeActions.has(practice.key);
                    const Icon = practice.Icon;
                    return (
                      <div key={practice.key} className={dailyPracticeCellClass(theme, done)}>
                        <Icon className={dailyPracticeIconClass(theme, done)} />
                        <p className={dailyPracticeLabelClass(theme, done)}>{practice.shortLabel}</p>
                      </div>
                    );
                  })}
                </div>
                <p className={dashboardHomeInspiredFooterClass(theme)}>
                  Affirm daily & embody the new story for coherence and alignment.
                </p>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <Wrench className={dashboardSectionAccentIconClass(theme)} />
                <h2 className={dashboardHomeSectionLabelClass(theme)}>Your tools</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {dashboardFeatures.map((tool) => (
                  <button
                    key={tool.path}
                    type="button"
                    onClick={() => handleToolClick(tool.path)}
                    className={webDashboardToolCardClass(theme)}
                  >
                    <DashboardToolIcon icon={tool.icon} theme={theme} />
                    <span className="min-w-0 flex-1">
                      <span className={dashboardHomeToolTitleClass(theme)}>{tool.title}</span>
                      <span className={dashboardHomeToolDescriptionClass(theme)}>{tool.description}</span>
                    </span>
                    <ChevronRight className={dashboardHomeToolChevronClass(theme)} />
                  </button>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const showMobileCharacter = shouldShowCharacterImage && !!selectedCharacter && theme === "light";
  const displayName = firstName.trim() || "there";
  const cosmicHome = dashboardHomeUsesCosmicShell(theme);
  const isNativeIosDashboard = Capacitor.getPlatform() === "ios" && isMobileDashboard;
  const mobileSafeAreaInlet = getDashboardMobileSafeAreaInlet(theme, isMobileDashboard);

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden font-sans antialiased",
        cosmicHome ? "text-white" : "bg-background text-foreground",
        showMobileCharacter ? "overflow-x-hidden pb-0" : "pb-20 md:pb-0",
      )}
      style={cosmicHome ? { backgroundColor: WELCOME_COSMIC_BASE } : undefined}
    >
      {!isMobile && (
        <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />
      )}

      {cosmicHome ? (
        <WelcomeCosmicBackground
          className={cn(
            "pointer-events-none fixed z-0",
            isNativeIosDashboard
              ? "left-0 right-0 bottom-0 top-[var(--app-safe-area-top)]"
              : "inset-0",
          )}
        />
      ) : (
        <DashboardSkyBackground fixedBackground={!isMobile} />
      )}

      {showMobileCharacter && selectedCharacter && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[2] pointer-events-none"
          style={{
            height: "40vh",
            backgroundImage: `url(${encodeURI(`/Dash & Cat Background Overlays/${selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)} - Grass.png`)})`,
            backgroundSize: "cover",
            backgroundPosition: "bottom center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {isMobileDashboard ? (
        <div
          className={cn(
            "pointer-events-none fixed top-0 left-0 right-0 z-[45]",
            isNativeIosDashboard && cosmicHome
              ? "bg-[#0a0812]"
              : isNativeIosDashboard
                ? "bg-background"
                : mobileSafeAreaInlet.className,
          )}
          style={{
            height: "var(--app-safe-area-top)",
            ...(isNativeIosDashboard ? {} : mobileSafeAreaInlet.style),
          }}
          aria-hidden
        />
      ) : null}

      <div
        className="relative z-10 md:dark:border-l md:dark:border-border"
        style={!isMobile ? {
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          transition: 'margin-left 300ms ease-in-out'
        } : {}}
      >
        <header
          className={cn(
            "sticky z-50 flex items-center border-b py-3 md:h-16 md:py-0",
            cosmicHome ? "border-white/[0.06] bg-[#0a0812]" : "border-border bg-background",
          )}
          style={{ top: "var(--app-safe-area-top)" }}
        >
          <div className="container mx-auto px-4 sm:px-6 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1
                  className={cn(
                    "cursor-pointer font-sans text-sm font-semibold tracking-tight transition-opacity [-webkit-tap-highlight-color:transparent]",
                    "supports-[hover:hover]:hover:opacity-80",
                    cosmicHome ? "text-white/90" : "text-foreground",
                  )}
                  onClick={() => navigate("/")}
                >
                  Palette Plotting
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2"
                  style={isMobile && !isStandalone ? { marginRight: '0.5rem' } : {}}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/dashboard/your-journey/chat")}
                    onPointerUp={(e) => e.currentTarget.blur()}
                    className={dashboardHeaderPillButtonClass(theme)}
                    aria-label="Talk to Guide"
                  >
                    Talk to Guide
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onPointerUp={(e) => e.currentTarget.blur()}
                        className={dashboardHeaderIconButtonClass(theme)}
                        aria-label="Appearance"
                      >
                        {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" aria-hidden /> : <Moon className="h-4 w-4 shrink-0" aria-hidden />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn("w-52 z-50", theme === "dark" ? "border border-white/12 bg-[#0f0d14] text-white" : "bg-background")}
                      align="end"
                    >
                      <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                      <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                      <DropdownMenuItem className="gap-2" onClick={() => setTheme("light")}>
                        <span className="h-3 w-3 shrink-0 rounded-full border border-border bg-white shadow-sm" aria-hidden />
                        <span className="flex-1">Light</span>
                        {theme === "light" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
                        <span className="h-3 w-3 shrink-0 rounded-full border border-border bg-[hsl(0_0%_12%)] shadow-sm" aria-hidden />
                        <span className="flex-1">Dark</span>
                        {theme === "dark" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onPointerUp={(e) => e.currentTarget.blur()}
                        className={dashboardHeaderAvatarTriggerClass(theme)}
                      >
                        <Avatar className={dashboardHeaderAvatarShellClass(theme)}>
                          {avatarUrl && <AvatarImage src={avatarUrl} alt={username || userEmail} />}
                          <AvatarFallback className={dashboardHeaderAvatarFallbackClass(theme)}>
                            {username ? username[0].toUpperCase() : userEmail[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn("w-56 z-50", theme === "dark" ? "border border-white/12 bg-[#0f0d14] text-white" : "bg-background")}
                      align="end"
                    >
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{username || "User"}</p>
                          <p className={cn("text-xs leading-none", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{userEmail}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        <Settings className="glow-icon-gradient mr-2 h-4 w-4" />
                        <span>Your Account</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="glow-icon-gradient mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/dashboard/report-issue")}
                    onPointerUp={(e) => e.currentTarget.blur()}
                    className={dashboardHeaderIconButtonClass(theme)}
                    aria-label="Help"
                  >
                    <CircleHelp className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  </Button>
                </div>
                {isMobile && (
                  <div className="md:hidden">
                    <MobilePWAMenu />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "container mx-auto px-4 sm:px-6 py-3 sm:py-6 relative z-10",
            showMobileCharacter ? "pb-0" : "pb-24 md:pb-20",
          )}
          style={{ paddingTop: "calc(var(--app-safe-area-top) + 1rem)" }}
        >
          <div className="mb-4 sm:mb-8">
            <h2 className={dashboardHomeGreetingTitleClass(theme)}>
              {timeOfDayGreeting()}, {displayName}.
            </h2>
            <p className={cn("mt-2 sm:mt-3", dashboardHomeGreetingSubtitleClass(theme))}>
              Everything you need to manifest, in one place.
            </p>
          </div>

          <div
            className={cn(dashboardMobileManifestationCardClass(theme, dashboardAppPowerCheckpoints, isMobileDashboard), mobileCardSurface.className)}
            style={mobileCardSurface.style}
          >
            <div className="p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Zap className={manifestationChargeZapIconClass(theme, isMobileDashboard)} aria-hidden />
                  <p className={dashboardMobileManifestationHeadingClass(theme, isMobileDashboard)}>Manifestation Charge</p>
                </div>
                <span className={cn("text-[11px] font-medium whitespace-nowrap px-2 py-0.5 rounded-full border", manifestationStatusBadgeClass(theme, isMobileDashboard))}>
                  {dailyPracticeStatus}
                </span>
              </div>
              <div className={dashboardMobileManifestationMeterTrackClass(theme, isMobileDashboard)}>
                <div className={manifestationMeterBarClass(theme, isMobileDashboard)} style={manifestationMeterBarStyle(dashboardAppPowerCheckpoints)} />
              </div>
              <div className={dashboardMobileManifestationDividerClass(theme, isMobileDashboard)}>
                <p className={dashboardMobileManifestationDailyLabelClass(theme, isMobileDashboard)}>Inspired Actions</p>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {activePractices.map((practice) => {
                    const key = practice.key;
                    const Icon = practice.Icon;
                    const label = practice.shortLabel;
                    const done = dailyPracticeActions.has(key);
                    return (
                      <div key={key} className={cn("rounded-xl border px-1.5 py-2 text-center transition-colors", dailyPracticeCellClass(theme, done, isMobileDashboard))}>
                        <Icon className={dailyPracticeIconClass(theme, done, isMobileDashboard)} />
                        <div className={dailyPracticeLabelClass(theme, done, isMobileDashboard)}>{label}</div>
                      </div>
                    );
                  })}
                </div>
                <p className={dashboardMobileManifestationFooterClass(theme, isMobileDashboard)}>
                  Affirm daily & embody the new story for coherence and alignment.
                </p>
              </div>
            </div>
          </div>

          <div className={dashboardMobileToolGridClass(isMobileDashboard)}>
            {dashboardFeatures.map((tool, index) => (
              <div
                key={tool.path}
                role="button"
                tabIndex={0}
                className={dashboardMobileToolCardClass(theme, isMobileDashboard)}
                style={{ ...mobileCardSurface.style, ...dashboardMobileToolCardStyle(isMobileDashboard), animationDelay: `${index * 0.05}s` }}
                onClick={() => handleToolClick(tool.path)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToolClick(tool.path); } }}
              >
                <div className={dashboardMobileToolCardHoverClass(theme, isMobileDashboard)} style={{ transition: "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                <div className={dashboardMobileToolCardInnerClass(isMobileDashboard)}>
                  <DashboardToolIcon icon={tool.icon} theme={theme} size="sm" isMobileDashboard={isMobileDashboard} />
                  <div className="flex-1 min-w-0 relative z-10 flex items-center">
                    <h3 className={dashboardMobileToolTitleClass(theme, isMobileDashboard)}>{tool.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
```

---

### `src/pages/onboarding/PostPaywallLoading.tsx`
After provisioning succeeds, sets a `sessionStorage` marker so Dashboard knows this visit came from the paywall flow.

```tsx
// Signal dashboard to attempt the review prompt after post-paywall success.
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
  try {
    sessionStorage.setItem("pending_review_prompt_after_post_paywall", "true");
    console.info("[review_prompt] post-paywall marker set for dashboard");
  } catch {}
}

window.setTimeout(() => navigate("/dashboard", { replace: true }), 250);
```

---

## Migrations

### `20260603200000_seed_review_prompt_feature_flag.sql`
```sql
-- Ensure feature_flags table exists (may have been removed from live DB).
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feature_flags' AND policyname = 'Anyone can view feature flags'
  ) THEN
    CREATE POLICY "Anyone can view feature flags"
    ON public.feature_flags FOR SELECT
    USING (true);
  END IF;
END $$;

-- Seed the review-prompt feature flag.
INSERT INTO public.feature_flags (feature_name, is_enabled, description)
VALUES ('review_prompt', false, 'trial_only')
ON CONFLICT (feature_name) DO NOTHING;

-- Nullable timestamp on user_plans — null = never prompted.
ALTER TABLE public.user_plans
ADD COLUMN IF NOT EXISTS review_prompt_attempted_at TIMESTAMPTZ;

-- Include submitter first name in support reports and cases.
ALTER TABLE public.app_support_reports
ADD COLUMN IF NOT EXISTS user_first_name TEXT;

ALTER TABLE public.support_cases
ADD COLUMN IF NOT EXISTS user_first_name TEXT;
```

### `20260604040000_feature_flags_config_column.sql`
```sql
-- Add JSONB config column to feature_flags for structured per-flag settings.
ALTER TABLE public.feature_flags
ADD COLUMN IF NOT EXISTS config JSONB;

-- Set server-controlled review prompt config defaults.
UPDATE public.feature_flags
SET
  is_enabled = false,
  config = '{
    "audience": "trial_only",
    "allowed_screen": "dashboard",
    "trigger_label": "dashboard_after_trial_start",
    "delay_ms": 1200,
    "require_pending_post_paywall": true
  }'::jsonb
WHERE feature_name = 'review_prompt';
```

---

## TypeScript Types (`src/integrations/supabase/types.ts`)
`config: Json | null` added to `feature_flags` Row / Insert / Update shapes.

---

## What Requires a New Build vs. Server-Only Change

| Change | Requires build? |
|--------|----------------|
| Disable the prompt entirely | No — flip `is_enabled = false` |
| Change delay | No — update `delay_ms` in config JSON |
| Switch audience trial_only ↔ all_new | No — update `audience` in config JSON |
| Toggle require_pending_post_paywall | No — update config JSON |
| Add a new screen as a valid hook location | Yes — code must exist on that screen |
| Change `allowed_screen` to a screen already wired | No — update config JSON |

---

## Known Limitations / Questions for Review

1. **Apple suppresses `requestReview()` in TestFlight/sandbox** — the call executes and logs `[review_prompt] requested` but the OS will not show the dialog. Only production App Store builds show it to real users (and Apple rate-limits it further to ~3 times per 365 days per user).
2. **`require_pending_post_paywall: true` means the prompt only fires the session the user came through paywall** — if they close the app and reopen on the dashboard, `sessionStorage` is gone and the prompt won't fire again (unless `review_prompt_attempted_at` is also null, which it won't be after the first attempt). This is intentional to avoid showing it on random dashboard revisits.
3. **`reviewPromptRanRef` prevents double-firing** within the same React session, but does not survive hot-reload in dev.
4. **No fallback if `feature_flags` row is missing** — `flag` will be `null`, `flag?.is_enabled` will be `undefined` (falsy), so the prompt silently skips. Safe but silent.
