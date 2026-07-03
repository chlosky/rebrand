/**
 * Affirm & Script (v2 viewer) — typewriter + autoscroll (onboarding-style).
 *
 * Routed at `/dashboard/affirmation-viewer/:setId` (same URL as legacy v1; v1 component kept in repo, unlinked).
 * Shell matches `Affirmations.tsx`; typewriter box matches onboarding `AffirmationRead`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { OnboardingTypewriter } from "@/components/onboarding/OnboardingTypewriter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { AffirmationSet, getLocalizedPremadeSets } from "@/lib/affirmations-data";
import { Loader2, RotateCcw, Settings } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/** Local library paths for v2 when a set has no `images` (premade sets). */
const DEMO_ROTATION_IMAGES = [
  "/affirmationimagelibrary/Home/Cozy Living Room.webp",
  "/affirmationimagelibrary/Home/City Life.webp",
  "/affirmationimagelibrary/Education/Graduation.webp",
  "/affirmationimagelibrary/Home/Green Apt.webp",
] as const;

/** Default typewriter speed (ms per character) when the user has no saved setting. */
const DEFAULT_SCRIPTING_MS = 60;

/** Crossfade duration — opacity animates only while `crossfade` is active. */
const IMAGE_CROSSFADE_MS = 700;

const IMAGE_BG_OPACITY = 0.45;

/** 1×1 transparent GIF — keeps both img slots mounted without a broken-image flash. */
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

type BgSlot = 0 | 1;
type CrossfadeState = { from: BgSlot; to: BgSlot; phase: "pre" | "active" } | null;

/** Gentler open on each Start / loop restart (typewriter remounts via playToken). */
const SCRIPTING_INTRO_CHAR_COUNT = 15;
const SCRIPTING_INTRO_SLOW_FACTOR = 1.38;

export type AffirmationVisualizerV2Props = {
  /** Optional embed: skip URL `setId` fetch when provided. */
  affirmationSet?: AffirmationSet;
};

const V2_SETTINGS_VERSION = 2 as const;
type V2CachedSettings = {
  v: typeof V2_SETTINGS_VERSION;
  scriptingMs?: number;
  imageRhythmSec?: number;
  showLoopCounter?: boolean;
  autoplayImages?: boolean;
  loopText?: boolean;
};

export default function AffirmationVisualizerV2({ affirmationSet: affirmationSetProp }: AffirmationVisualizerV2Props) {
  const { t } = useTranslation(["tools", "dashboard"]);
  const navigate = useNavigate();
  const { setId } = useParams<{ setId: string }>();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isCosmic = theme === "dark";
  const viewerCardClass = cn(
    theme === "dark" ? "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm" : "border border-zinc-200/75 bg-card/75 backdrop-blur-sm",
    theme === "dark" ? "hover:bg-white/8" : "hover:bg-card/90",
    isCosmic && "!bg-transparent",
  );
  const { user } = useAuth();

  const [resolvedSet, setResolvedSet] = useState<AffirmationSet | null>(() =>
    affirmationSetProp ?? null,
  );
  const [isLoading, setIsLoading] = useState(() => {
    if (affirmationSetProp) return false;
    return Boolean(setId);
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const settingsStorageKey = `affirmation-visualizer-v2:settings:${user?.id ?? "anon"}`;
  const readCachedSettings = (key = settingsStorageKey): V2CachedSettings | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<V2CachedSettings> | null;
      if (!parsed || (parsed.v !== 1 && parsed.v !== V2_SETTINGS_VERSION)) return null;
      return parsed as V2CachedSettings;
    } catch {
      return null;
    }
  };

  const applyCachedSettings = (cached: V2CachedSettings | null) => {
    if (!cached) return;
    if (typeof cached.scriptingMs === "number") setScriptingMs([cached.scriptingMs]);
    if (typeof cached.imageRhythmSec === "number") setImageRhythmSec([cached.imageRhythmSec]);
    if (typeof cached.showLoopCounter === "boolean") setShowLoopCounter(cached.showLoopCounter);
    if (typeof cached.autoplayImages === "boolean") setAutoplayImages(cached.autoplayImages);
    if (typeof cached.loopText === "boolean") setLoopText(cached.loopText);
  };

  const [scriptingMs, setScriptingMs] = useState(() => {
    const cached = readCachedSettings();
    const value = typeof cached?.scriptingMs === "number" ? cached.scriptingMs : DEFAULT_SCRIPTING_MS;
    return [value] as number[];
  });
  const [imageRhythmSec, setImageRhythmSec] = useState(() => {
    const cached = readCachedSettings();
    const value = typeof cached?.imageRhythmSec === "number" ? cached.imageRhythmSec : 2;
    return [value] as number[];
  });
  const [autoplayImages, setAutoplayImages] = useState(() => {
    const cached = readCachedSettings();
    return Boolean(cached?.autoplayImages);
  });
  const [loopText, setLoopText] = useState(() => {
    const cached = readCachedSettings();
    return Boolean(cached?.loopText);
  });
  const [showLoopCounter, setShowLoopCounter] = useState(() => {
    const cached = readCachedSettings();
    return Boolean(cached?.showLoopCounter);
  });
  const [loopCount, setLoopCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [playToken, setPlayToken] = useState(0);
  const [viewerSettingsOpen, setViewerSettingsOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [imageIndex, setImageIndex] = useState(0);
  /** Two permanent img slots — src only ever updates on the hidden slot before a fade. */
  const [slotUrls, setSlotUrls] = useState<[string, string]>(["", ""]);
  const [activeSlot, setActiveSlot] = useState<BgSlot>(0);
  const [crossfade, setCrossfade] = useState<CrossfadeState>(null);
  const activeSlotRef = useRef<BgSlot>(0);
  const lastShownUrlRef = useRef("");
  const crossfadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swapGenRef = useRef(0);
  const loopPendingRef = useRef(false);
  const unmountedRef = useRef(false);

  useEffect(() => {
    if (affirmationSetProp) {
      setResolvedSet(affirmationSetProp);
      setIsLoading(false);
      return;
    }

    if (!setId) {
      setResolvedSet(getLocalizedPremadeSets()[0]!);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setResolvedSet(null);

      const premade = getLocalizedPremadeSets().find((s) => s.id === setId);
      if (premade) {
        if (!cancelled) {
          setResolvedSet(premade);
          setIsLoading(false);
        }
        return;
      }

      try {
        const {
          data: { session: freshSession },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !freshSession?.access_token) {
          if (!cancelled) {
            setResolvedSet(null);
            setIsLoading(false);
          }
          return;
        }

        const { data: dbSet, error: dbError } = await (supabase as any)
          .from("user_affirmation_sets")
          .select("*")
          .eq("id", setId)
          .maybeSingle();

        if (dbError) {
          console.error("Error loading affirmation set:", dbError);
        }

        if (cancelled) return;

        if (!dbSet) {
          setResolvedSet(null);
        } else {
          setResolvedSet({
            id: dbSet.id as string,
            name: dbSet.name as string,
            affirmations: (dbSet.affirmations as string[]) ?? [],
            images: dbSet.images as AffirmationSet["images"],
            isPremade: false,
            category: dbSet.category || undefined,
          });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setResolvedSet(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setId, affirmationSetProp]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      swapGenRef.current += 1;
      if (crossfadeTimerRef.current) {
        clearTimeout(crossfadeTimerRef.current);
        crossfadeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    applyCachedSettings(readCachedSettings(settingsStorageKey));
  }, [settingsStorageKey]);

  useEffect(() => {
    try {
      const payload: V2CachedSettings = {
        v: V2_SETTINGS_VERSION,
        scriptingMs: scriptingMs[0],
        imageRhythmSec: imageRhythmSec[0],
        showLoopCounter,
        autoplayImages,
        loopText,
      };
      localStorage.setItem(settingsStorageKey, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [autoplayImages, imageRhythmSec, loopText, scriptingMs, showLoopCounter, settingsStorageKey]);

  const imageUrls = useMemo(() => {
    if (!resolvedSet) return [] as string[];
    const fromSet = resolvedSet.images?.map((i) => i.url).filter(Boolean) as string[] | undefined;
    if (fromSet && fromSet.length > 0) return fromSet;
    return [...DEMO_ROTATION_IMAGES];
  }, [resolvedSet]);

  const imageUrlsKey = useMemo(() => imageUrls.join("\u0000"), [imageUrls]);

  const slotOpacity = useCallback(
    (slot: BgSlot): number => {
      if (!crossfade) {
        return slot === activeSlot ? IMAGE_BG_OPACITY : 0;
      }
      if (crossfade.phase === "pre") {
        if (slot === crossfade.to) return 0;
        if (slot === crossfade.from) return IMAGE_BG_OPACITY;
        return 0;
      }
      if (slot === crossfade.to) return IMAGE_BG_OPACITY;
      if (slot === crossfade.from) return 0;
      return 0;
    },
    [activeSlot, crossfade],
  );

  useEffect(() => {
    swapGenRef.current += 1;
    if (crossfadeTimerRef.current) {
      clearTimeout(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }
    setImageIndex(0);
    setLoopCount(0);
    setPlayToken((t) => t + 1);
    const first = imageUrls[0] ?? "";
    lastShownUrlRef.current = first;
    activeSlotRef.current = 0;
    setActiveSlot(0);
    setSlotUrls([first, ""]);
    setCrossfade(null);
  }, [resolvedSet?.id, imageUrlsKey]);

  useEffect(() => {
    imageUrls.forEach((url) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    });
  }, [imageUrls]);

  const fullScript = useMemo(() => {
    if (!resolvedSet) return "";
    return resolvedSet.affirmations.filter((a) => a.trim().length > 0).join("\n\n");
  }, [resolvedSet]);

  const msPerChar = scriptingMs[0];
  const imageEveryMs = Math.round((imageRhythmSec[0] ?? 5) * 1000);

  const speedMsForProgress = useCallback(
    (revealedSoFar: number) =>
      revealedSoFar < SCRIPTING_INTRO_CHAR_COUNT
        ? Math.round(msPerChar * SCRIPTING_INTRO_SLOW_FACTOR)
        : msPerChar,
    [msPerChar],
  );

  const easeFollowScroll = useCallback((revealedCount: number) => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    if (maxScroll <= 0) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.scrollTop = maxScroll;
      return;
    }

    let alpha: number;
    if (revealedCount < 220) alpha = 0.06;
    else if (revealedCount < 480) alpha = 0.2;
    else alpha = 0.44;

    const target = maxScroll;
    const dist = target - el.scrollTop;
    if (Math.abs(dist) < 0.55) {
      el.scrollTop = target;
      return;
    }
    el.scrollTop += dist * alpha;
  }, []);

  useEffect(() => {
    if (!autoplayImages || imageUrls.length === 0) return;
    const id = window.setInterval(() => {
      setImageIndex((i) => (i + 1) % imageUrls.length);
    }, Math.max(IMAGE_CROSSFADE_MS + 100, imageEveryMs));
    return () => window.clearInterval(id);
  }, [autoplayImages, imageEveryMs, imageUrls.length]);

  useEffect(() => {
    if (!autoplayImages || imageUrls.length === 0) return;

    const url = imageUrls[imageIndex % imageUrls.length]!;
    if (!url || url === lastShownUrlRef.current) return;

    const gen = ++swapGenRef.current;
    if (crossfadeTimerRef.current) {
      clearTimeout(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }

    const outgoing = activeSlotRef.current;
    const incoming = (1 - outgoing) as BgSlot;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finishSwap = (nextActive: BgSlot) => {
      activeSlotRef.current = nextActive;
      lastShownUrlRef.current = url;
      setActiveSlot(nextActive);
      setCrossfade(null);
    };

    const startCrossfade = () => {
      if (unmountedRef.current || swapGenRef.current !== gen) return;

      if (reducedMotion) {
        finishSwap(incoming);
        return;
      }

      setCrossfade({ from: outgoing, to: incoming, phase: "pre" });
      requestAnimationFrame(() => {
        if (unmountedRef.current || swapGenRef.current !== gen) return;
        requestAnimationFrame(() => {
          if (unmountedRef.current || swapGenRef.current !== gen) return;
          setCrossfade({ from: outgoing, to: incoming, phase: "active" });
        });
      });
      crossfadeTimerRef.current = setTimeout(() => {
        if (unmountedRef.current || swapGenRef.current !== gen) return;
        finishSwap(incoming);
        crossfadeTimerRef.current = null;
      }, IMAGE_CROSSFADE_MS);
    };

    const img = new Image();
    img.decoding = "async";
    const whenReady = () => {
      if (unmountedRef.current || swapGenRef.current !== gen) return;
      setSlotUrls((prev) => {
        const next: [string, string] = [...prev];
        next[incoming] = url;
        return next;
      });
      startCrossfade();
    };
    img.onload = whenReady;
    img.onerror = whenReady;
    img.src = url;
    if (img.complete) whenReady();

    return () => {
      swapGenRef.current += 1;
      if (crossfadeTimerRef.current) {
        clearTimeout(crossfadeTimerRef.current);
        crossfadeTimerRef.current = null;
      }
    };
  }, [autoplayImages, imageIndex, imageUrls]);

  const restartScript = useCallback((fromLoop = false) => {
    if (fromLoop) {
      setLoopCount((c) => c + 1);
    } else {
      setLoopCount(0);
    }
    setHasStarted(true);
    setPlayToken((t) => t + 1);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const handleTypewriterStep = useCallback(
    (revealedCount: number) => {
      easeFollowScroll(revealedCount);
      if (!loopText) return;
      if (!hasStarted) return;
      if (loopPendingRef.current) return;
      const total = fullScript.length;
      if (total <= 0) return;
      if (revealedCount < total) return;

      loopPendingRef.current = true;
      window.setTimeout(() => {
        loopPendingRef.current = false;
        if (unmountedRef.current) return;
        if (!loopText) return;
        restartScript(true);
      }, 650);
    },
    [easeFollowScroll, fullScript.length, hasStarted, loopText, restartScript],
  );

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const isNative = Capacitor.isNativePlatform();
  const isStandalone =
    (typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true)) ||
    isNative;

  const headerSubtitle = isLoading
    ? t("tools:affirmationVisualizer.loading")
    : resolvedSet?.name ?? (setId ? t("tools:affirmationVisualizer.setNotFound") : getLocalizedPremadeSets()[0]!.name);

  const readerPanelWhiteFill = theme === "light";

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className="min-h-screen"
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}

        <header
          className={cn(
            cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"),
            isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0",
          )}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
          <div className={cn("px-4 sm:px-6 w-full flex items-center justify-between gap-3", !isMobile ? "" : "container mx-auto")}>
            <div className="min-w-0">
              <h1
                className={cn(theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity", "truncate")}
                onClick={() => navigate("/dashboard/affirmations-builder")}
              >
                {t("tools:affirmationVisualizer.title")}
              </h1>
              <p className={cn("text-[11px] truncate", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{headerSubtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-9 shrink-0", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                onClick={() => restartScript(false)}
                disabled={!resolvedSet || isLoading}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                {t("tools:affirmationVisualizer.start")}
              </Button>
              {isMobile && <MobilePWAMenu />}
            </div>
          </div>
        </header>

        <main
          className={cn(
            "px-4 sm:px-6 max-w-6xl pb-24 md:pb-8 relative z-10",
            !isMobile ? "pt-16" : "",
            !isMobile ? "" : "container mx-auto",
          )}
        >
          {isLoading ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("tools:affirmationVisualizer.loadingSet")}</p>
            </div>
          ) : !resolvedSet ? (
            <Card className={cn("mx-auto mt-8 max-w-md p-8 text-center", theme === "dark" ? "border border-white/20" : "border border-zinc-300/90", theme === "dark" ? "bg-transparent backdrop-blur-sm text-white" : "bg-white backdrop-blur-sm")}>
              <p className="text-muted-foreground mb-4">{t("tools:affirmationVisualizer.notFound")}</p>
              <Button onClick={() => navigate("/dashboard/affirmations-builder")}>{t("tools:affirmationVisualizer.backToAffirmScript")}</Button>
            </Card>
          ) : (
            <>
              <p className={cn("text-sm py-3 sm:py-4", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{t("tools:affirmationVisualizer.subtitle")}</p>

              <div
                className={cn(
                  "relative h-[min(62vh,calc(100dvh-11.75rem))] w-full shrink-0 overflow-hidden rounded-2xl border border-border/60 md:h-[min(68vh,calc(100dvh-9.5rem))]",
                  readerPanelWhiteFill
                    ? "bg-white"
                    : isCosmic
                      ? "border-white/12 bg-transparent backdrop-blur-sm"
                      : "bg-card/85 backdrop-blur-sm",
                )}
              >
                {autoplayImages && imageUrls.length > 0 ? (
                  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden [contain:strict] [transform:translateZ(0)]">
                    {([0, 1] as const).map((slot) => (
                      <img
                        key={slot}
                        src={slotUrls[slot] || TRANSPARENT_PIXEL}
                        alt=""
                        decoding="async"
                        draggable={false}
                        className={cn(
                          "absolute inset-0 h-full w-full object-cover [backface-visibility:hidden]",
                          crossfade !== null && "transition-opacity ease-in-out",
                        )}
                        style={{
                          opacity: slotOpacity(slot),
                          transitionDuration:
                            crossfade !== null ? `${IMAGE_CROSSFADE_MS}ms` : undefined,
                        }}
                      />
                    ))}
                    <div
                      className={cn(
                        "absolute inset-0",
                        readerPanelWhiteFill
                          ? "bg-white/92"
                          : "bg-background/82 dark:bg-background/86",
                      )}
                    />
                  </div>
                ) : null}

                {showLoopCounter && hasStarted ? (
                  <div
                    className={cn(
                      "pointer-events-none absolute bottom-3 right-3 z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                      isCosmic
                        ? "border-white/30 bg-transparent text-white shadow-none"
                        : "border-border/70 bg-background/90 text-foreground shadow-sm",
                    )}
                    aria-live="polite"
                    aria-label={loopCount === 1 ? t("tools:affirmationVisualizer.loopedAriaOne") : t("tools:affirmationVisualizer.loopedAriaMany", { count: loopCount })}
                    title={t("tools:affirmationVisualizer.loopsTitle", { count: loopCount })}
                  >
                    {loopCount}
                  </div>
                ) : null}

                <div
                  ref={scrollRef}
                  className="relative z-10 h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-2 py-4 [-webkit-overflow-scrolling:touch]"
                >
                  {!hasStarted ? (
                    <p className="px-3 sm:px-5 py-5 sm:py-6 text-base sm:text-lg leading-[1.7] text-muted-foreground">
                      {t("tools:affirmationVisualizer.tapStartBefore")} <span className="font-medium text-foreground">{t("tools:affirmationVisualizer.start")}</span> {t("tools:affirmationVisualizer.tapStartAfter")}
                    </p>
                  ) : fullScript.length > 0 ? (
                    <OnboardingTypewriter
                      key={`${resolvedSet.id}-${playToken}`}
                      text={fullScript}
                      speedMs={speedMsForProgress}
                      onAfterRevealStep={handleTypewriterStep}
                      contentClassName={cn(
                        "!min-h-0 whitespace-pre-wrap px-3 sm:px-5 py-5 sm:py-6 pb-28 pt-3 text-base sm:text-lg font-semibold leading-[1.7] text-foreground max-w-none",
                        autoplayImages && imageUrls.length > 0 && "drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]",
                      )}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("tools:affirmationVisualizer.noAffirmations")}</p>
                  )}
                </div>
              </div>

              <Collapsible open={viewerSettingsOpen} onOpenChange={setViewerSettingsOpen}>
                <Card className={cn("mt-3 overflow-hidden rounded-xl shadow-sm transition-colors", viewerCardClass)}>
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-3 sm:px-4",
                      viewerSettingsOpen &&
                        (isCosmic ? "border-b border-white/12" : "border-b border-border/50"),
                    )}
                  >
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold leading-tight text-foreground">{t("tools:affirmationVisualizer.settings")}</p>
                      <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                        {t("tools:affirmationVisualizer.settingsSubtitle")}
                      </p>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-10 w-10 shrink-0 text-muted-foreground shadow-none outline-none transition-none select-none",
                          "!bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent focus-visible:!bg-transparent",
                          "focus-visible:!ring-0 focus-visible:!ring-offset-0",
                          "data-[state=open]:!bg-transparent data-[state=closed]:!bg-transparent",
                          "[-webkit-tap-highlight-color:transparent]",
                        )}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                        aria-expanded={viewerSettingsOpen}
                        aria-label={viewerSettingsOpen ? t("tools:affirmationVisualizer.collapseSettings") : t("tools:affirmationVisualizer.expandSettings")}
                      >
                        <Settings
                          className={cn(
                            "h-5 w-5 transition-transform duration-200",
                            viewerSettingsOpen && "rotate-90 text-foreground",
                          )}
                          aria-hidden
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="grid gap-4 p-4 pt-4 sm:p-5 sm:pt-5 sm:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="v2-autoplay-img" className="text-sm font-medium">
                            {t("tools:affirmationVisualizer.autoplayImages")}
                          </Label>
                          <Switch
                            id="v2-autoplay-img"
                            checked={autoplayImages}
                            onCheckedChange={setAutoplayImages}
                            className={theme === "dark" ? cn("border-2 border-white/12 !bg-transparent", "data-[state=checked]:!border-white/30 data-[state=checked]:!bg-white/10", "data-[state=unchecked]:!bg-transparent", "[&>span]:!bg-white/90 [&>span]:shadow-none") : ""}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="v2-loop-text" className="text-sm font-medium">
                            {t("tools:affirmationVisualizer.loopText")}
                          </Label>
                          <Switch
                            id="v2-loop-text"
                            checked={loopText}
                            onCheckedChange={setLoopText}
                            className={theme === "dark" ? cn("border-2 border-white/12 !bg-transparent", "data-[state=checked]:!border-white/30 data-[state=checked]:!bg-white/10", "data-[state=unchecked]:!bg-transparent", "[&>span]:!bg-white/90 [&>span]:shadow-none") : ""}
                          />
                        </div>
                        <p className={cn("text-xs leading-snug", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                          {t("tools:affirmationVisualizer.loopTextHint")}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="v2-loop-counter" className="text-sm font-medium">
                            {t("tools:affirmationVisualizer.loopCounter")}
                          </Label>
                          <Switch
                            id="v2-loop-counter"
                            checked={showLoopCounter}
                            onCheckedChange={setShowLoopCounter}
                            className={theme === "dark" ? cn("border-2 border-white/12 !bg-transparent", "data-[state=checked]:!border-white/30 data-[state=checked]:!bg-white/10", "data-[state=unchecked]:!bg-transparent", "[&>span]:!bg-white/90 [&>span]:shadow-none") : ""}
                          />
                        </div>
                        <p className={cn("text-xs leading-snug", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                          {t("tools:affirmationVisualizer.loopCounterHint")}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-sm font-medium">{t("tools:affirmationVisualizer.imageRhythm")}</Label>
                            <span className={cn("text-xs tabular-nums", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                              {t("tools:affirmationVisualizer.seconds", { seconds: imageRhythmSec[0]?.toFixed(1) })}
                            </span>
                          </div>
                          <Slider
                            min={0.5}
                            max={14}
                            step={0.25}
                            value={imageRhythmSec}
                            onValueChange={setImageRhythmSec}
                            disabled={!autoplayImages || imageUrls.length < 2}
                            className={theme === "dark" ? cn("[&>span:first-child]:!bg-transparent [&>span:first-child]:border [&>span:first-child]:!border-white/12", "[&>span:first-child_.slider-range-fill]:!bg-white/30 [&>span:first-child_.slider-range-fill]:!shadow-none", "[&>span:last-child]:!bg-transparent [&>span:last-child]:!border-white/40 [&>span:last-child]:!shadow-none") : ""}
                          />
                          <p className={cn("text-[11px]", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                            {t("tools:affirmationVisualizer.imageRhythmHint")}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-sm font-medium">{t("tools:affirmationVisualizer.scriptingSpeed")}</Label>
                            <span className={cn("text-xs tabular-nums", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                              {t("tools:affirmationVisualizer.msPerChar", { ms: msPerChar })}
                            </span>
                          </div>
                          <Slider
                            min={8}
                            max={100}
                            step={1}
                            value={scriptingMs}
                            onValueChange={setScriptingMs}
                            className={theme === "dark" ? cn("[&>span:first-child]:!bg-transparent [&>span:first-child]:border [&>span:first-child]:!border-white/12", "[&>span:first-child_.slider-range-fill]:!bg-white/30 [&>span:first-child_.slider-range-fill]:!shadow-none", "[&>span:last-child]:!bg-transparent [&>span:last-child]:!border-white/40 [&>span:last-child]:!shadow-none") : ""}
                          />
                          <p className={cn("text-[11px]", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                            {t("tools:affirmationVisualizer.scriptingSpeedHint")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
