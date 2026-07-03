import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useEmbodyActivePractices } from "@/hooks/useEmbodyActivePractices";
import {
  EMBODY_PRACTICE_CONFIRM_I18N_KEY,
  EMBODY_PRACTICE_SHORT_I18N_KEY,
  getEmbodyPractice,
  isEmbodyPracticeKey,
} from "@/lib/embodyPracticesCatalog";
import { Settings, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { TIER_LIMITS } from "@/lib/featureGating";
import { Capacitor } from "@capacitor/core";
import { TRANSPARENT_VIDEO_POSTER } from "@/lib/nativeVideoPoster";
import { dispatchInspiredActionHistoryRefresh } from "@/lib/inspiredActionHistory";
import { useTheme } from "@/contexts/ThemeContext";

function dailyPracticePercentFromCompletedCount(count: number, total: number): number {
  const t = Math.max(1, total);
  const c = Math.min(Math.max(count, 0), t);
  return Math.round((c / t) * 100);
}

// Character definitions
const characters = [
  {
    id: "river",
    name: "River",
    headshot: "/headshots/river-headshot-2.png",
    characterId: "girl-1",
    themes: ["Transitions", "Career"],
    bubbleColor: "#4AC7FF",
  },
  {
    id: "sage",
    name: "Sage",
    headshot: "/headshots/sage-headshot.png",
    characterId: "girl-2",
    themes: ["Finance", "Identity"],
    bubbleColor: "#8fbf76",
  },
  {
    id: "rose",
    name: "Rose",
    headshot: "/headshots/rose-headshot.png",
    characterId: "girl-3",
    themes: ["Love", "Self Concept"],
    bubbleColor: "#FFB6C1",
  },
  {
    id: "oliver",
    name: "Oliver",
    headshot: "/headshots/oliver-headshot.png",
    characterId: "boy-1",
    themes: ["Self Image", "Fitness"],
    bubbleColor: "#FFC107",
  }
];

// Get the Monday of the week for a given date
// Use noon to avoid timezone boundary issues when converting to PT
const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(12, 0, 0, 0); // Use noon to avoid timezone shifts
  return monday;
};

// Get today's date in user's local timezone (day resets at 12:00 AM local time)
const getTodayLocal = (date?: Date): string => {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Your Double page - video playback with sequence and smooth crossfade transitions
const YourDouble: React.FC = () => {
  const { t } = useTranslation("tools");
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { activePractices } = useEmbodyActivePractices();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);
  
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    Capacitor.isNativePlatform();
  
  // Simple dual video setup for seamless transitions (one visible, one preloading)
  const videoRef1 = useRef<HTMLVideoElement | null>(null);
  const videoRef2 = useRef<HTMLVideoElement | null>(null);
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1);
  const nextVideoPreloadRef = useRef<string | null>(null); // Track what's preloaded in the hidden video
  const [video1Opacity, setVideo1Opacity] = useState(1);
  const [video2Opacity, setVideo2Opacity] = useState(0);
  const isCrossfadingRef = useRef(false);
  const greetingPlayedRef = useRef(false); // Track if greeting has been played this session
  type Phase = "greeting" | "action";
  const [phase, setPhase] = useState<Phase>("greeting");
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const [showBlackCover, setShowBlackCover] = useState(false);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const isSavingRef = useRef(false); // Track if we're currently saving to prevent reload from overwriting
  const [showDialog, setShowDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [powerProgress, setPowerProgress] = useState(0);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  // Stale-while-revalidate cache so re-entering Embody starts the greeting
  // video immediately on a known character instead of waiting for a fresh
  // `user_preferences.selected_character` round-trip. loadCharacter() still
  // runs in the background to revalidate.
  const characterCacheKey = user?.id ? `yourDoubleCharacter_${user.id}` : null;
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(() => {
    if (typeof window === "undefined" || !characterCacheKey) return null;
    try {
      const cached = sessionStorage.getItem(characterCacheKey);
      if (cached && characters.find((c) => c.id === cached)) return cached;
    } catch {
      /* ignore */
    }
    return null;
  });
  const [characterLoaded, setCharacterLoaded] = useState(() => {
    if (typeof window === "undefined" || !characterCacheKey) return false;
    try {
      const cached = sessionStorage.getItem(characterCacheKey);
      return Boolean(cached && characters.find((c) => c.id === cached));
    } catch {
      return false;
    }
  });

  const actionQuestions = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of activePractices) {
      m[p.key] = t(EMBODY_PRACTICE_CONFIRM_I18N_KEY[p.key]);
    }
    return m;
  }, [activePractices, t]);

  // Get character ID from selected character
  const getCharacterId = (characterId: string): string => {
    const character = characters.find(c => c.id === characterId);
    return character?.characterId || "";
  };

  // Simplified video path helper
  const getVideoPath = (videoName: string): string => {
    if (!characterLoaded || !selectedCharacter) return "";
    // "Connect" is shared across characters (single file under `public/videos`).
    if (videoName === "Connect") return "/videos/Connect.mp4";
    const charId = getCharacterId(selectedCharacter);
    return `/videos/${charId}/${videoName}.mp4`;
  };

  const getClipFileName = (clipKey: string): string => {
    if (clipKey === "greeting") return "Greeting";
    if (isEmbodyPracticeKey(clipKey)) return getEmbodyPractice(clipKey).videoFileName;
    return "Greeting";
  };

  // Get the active and hidden video refs
  const getActiveVideo = useCallback(() => {
    return activeVideo === 1 ? videoRef1.current : videoRef2.current;
  }, [activeVideo]);

  const getHiddenVideo = useCallback(() => {
    return activeVideo === 1 ? videoRef2.current : videoRef1.current;
  }, [activeVideo]);

  // Preload next video into the hidden video element
  const preloadNextVideo = useCallback(
    (clipKey: "greeting" | string) => {
      const hiddenVideo = getHiddenVideo();
      if (!hiddenVideo || !characterLoaded || !selectedCharacter) return;

      const fileName = getClipFileName(clipKey);

      const src = getVideoPath(fileName);
      if (!src) return;

      // Only preload if it's not already preloaded
      if (nextVideoPreloadRef.current === clipKey) return;

      nextVideoPreloadRef.current = clipKey;
      hiddenVideo.src = src;
      hiddenVideo.load();

      // Android WebView shows a large native play overlay when play() fires without a gesture;
      // load() alone is enough to buffer for readyState before swap.
      // iOS: play() on the hidden element makes swaps seamless — restore build-183 behavior.
      if (!isAndroidNative) {
        const playWhenReady = () => {
          hiddenVideo.removeEventListener("canplay", playWhenReady);
          hiddenVideo.play().catch(() => {});
        };
        if (hiddenVideo.readyState >= 2) {
          hiddenVideo.play().catch(() => {});
        } else {
          hiddenVideo.addEventListener("canplay", playWhenReady);
        }
      }
    },
    [characterLoaded, selectedCharacter, getHiddenVideo]
  );

  // Load and play a video clip - switches to preloaded video if available
  const loadAndPlay = useCallback(
    (clipKey: "greeting" | string, usePreloaded: boolean = true) => {
      if (!characterLoaded || !selectedCharacter) return;

      const fileName = getClipFileName(clipKey);

      const src = getVideoPath(fileName);
      if (!src) return;

      const activeVideoEl = getActiveVideo();
      const hiddenVideo = getHiddenVideo();
      if (!activeVideoEl || !hiddenVideo) return;

      // If the next video is already preloaded in the hidden element, switch instantly
      if (usePreloaded && nextVideoPreloadRef.current === clipKey && hiddenVideo.readyState >= 2) {
        // Make sure hidden video is playing
        if (hiddenVideo.paused) {
          hiddenVideo.play().catch(() => {});
        }
        
        if (isAndroidNative) setShowBlackCover(true);

        // Instantly switch: hide current, show preloaded
        activeVideoEl.pause();
        activeVideoEl.currentTime = 0;
        
        // Swap which video is active
        const newActive = activeVideo === 1 ? 2 : 1;
        if (isAndroidNative) {
          if (newActive === 1) { setVideo1Opacity(1); setVideo2Opacity(0); }
          else { setVideo2Opacity(1); setVideo1Opacity(0); }
        }
        setActiveVideo(newActive);
        nextVideoPreloadRef.current = null;
        
        if (isAndroidNative) requestAnimationFrame(() => setShowBlackCover(false));
        
        return;
      }

      // Non-preloaded: load into active video element (src changes in-place).
      // Android WebView clears the frame on src change — cover it with black.
      if (isAndroidNative) setShowBlackCover(true);

      activeVideoEl.src = src;
      activeVideoEl.load();

      const play = () => {
        void activeVideoEl.play().catch((err) => {
          console.error("[YourDouble] play() failed", err);
        });
      };

      const hideBlackCover = () => {
        if (isAndroidNative) setShowBlackCover(false);
      };

      if (isAndroidNative) {
        // Android: call play() eagerly (same synchronous turn as user gesture) so WebView
        // doesn't block playback; canplay covers slow networks; hide cover when ready.
        play();
        if (activeVideoEl.readyState >= 2) {
          hideBlackCover();
        } else {
          const handleCanPlay = () => {
            activeVideoEl.removeEventListener("canplay", handleCanPlay);
            play();
            hideBlackCover();
          };
          activeVideoEl.addEventListener("canplay", handleCanPlay);
        }
      } else {
        // iOS / web: original build-183 behavior — play only once ready.
        if (activeVideoEl.readyState >= 2) {
          play();
        } else {
          const handleCanPlay = () => {
            activeVideoEl.removeEventListener("canplay", handleCanPlay);
            play();
          };
          activeVideoEl.addEventListener("canplay", handleCanPlay);
        }
      }
    },
    [characterLoaded, selectedCharacter, getActiveVideo, getHiddenVideo, isAndroidNative]
  );

  // Initialize greeting once character is loaded - only play once per page open
  useEffect(() => {
    if (!characterLoaded || !selectedCharacter) return;
    
    // Only play greeting once when component first loads
    if (greetingPlayedRef.current) return;

    // Start at greeting - only on first load
    setPhase("greeting");
    setVideo1Opacity(1);
    setVideo2Opacity(0);
    isCrossfadingRef.current = false;
    greetingPlayedRef.current = true; // Mark as played
    loadAndPlay("greeting");
  }, [characterLoaded, selectedCharacter, loadAndPlay]);

  // Preload greeting video when action video is near the end (for smooth crossfade)
  useEffect(() => {
    const activeVideoEl = getActiveVideo();
    if (!activeVideoEl || phase !== "action") return;

    const handleTimeUpdate = () => {
      if (!activeVideoEl.duration || !activeVideoEl.currentTime) return;
      
      const progress = activeVideoEl.currentTime / activeVideoEl.duration;
      
      // Preload greeting video when 80% through action video (prepare for crossfade)
      if (progress > 0.8 && nextVideoPreloadRef.current !== "greeting") {
        preloadNextVideo("greeting");
      }
    };

    activeVideoEl.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      activeVideoEl.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [phase, getActiveVideo, preloadNextVideo]);

  // Crossfade from current video to greeting
  const crossfadeToGreeting = useCallback(() => {
    if (isCrossfadingRef.current) return; // Prevent multiple crossfades
    isCrossfadingRef.current = true;

    const currentVideo = getActiveVideo();
    const hiddenVideo = getHiddenVideo();
    if (!currentVideo || !hiddenVideo) {
      isCrossfadingRef.current = false;
      return;
    }

    // Load greeting into hidden video if not already preloaded
    const greetingSrc = getVideoPath("Greeting");
    if (!greetingSrc) {
      isCrossfadingRef.current = false;
      return;
    }
    
    // If greeting is already preloaded in hidden video, use it
    // But don't play it - just show the first frame (frozen)
    if (nextVideoPreloadRef.current === "greeting" && hiddenVideo.src === greetingSrc) {
      // Don't play - just show first frame
      hiddenVideo.currentTime = 0;
      hiddenVideo.pause();
    } else {
      // Load greeting into hidden video
      hiddenVideo.src = greetingSrc;
      hiddenVideo.load();
      
      // Don't auto-play - just load and show first frame
      const showFirstFrame = () => {
        hiddenVideo.removeEventListener("loadeddata", showFirstFrame);
        hiddenVideo.currentTime = 0;
        hiddenVideo.pause();
      };
      
      if (hiddenVideo.readyState >= 2) {
        hiddenVideo.currentTime = 0;
        hiddenVideo.pause();
        } else {
        hiddenVideo.addEventListener("loadeddata", showFirstFrame);
      }
    }

    // Perform crossfade: fade out current, fade in greeting
    const crossfadeDuration = 500; // 500ms crossfade
    const startTime = Date.now();
    const currentActive = activeVideo; // Capture current active video

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / crossfadeDuration, 1);
      
      // Ease in-out for smooth transition
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        if (currentActive === 1) {
        // Fade out video 1, fade in video 2
        setVideo1Opacity(1 - eased);
        setVideo2Opacity(eased);
        } else {
        // Fade out video 2, fade in video 1
        setVideo2Opacity(1 - eased);
        setVideo1Opacity(eased);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Crossfade complete - swap active video
        const newActive = currentActive === 1 ? 2 : 1;
        setActiveVideo(newActive);
        currentVideo.pause();
        currentVideo.currentTime = 0;
        nextVideoPreloadRef.current = null;
        setPhase("greeting");
        isCrossfadingRef.current = false;
        
        // Ensure greeting video is paused at first frame (frozen)
        // Only one greeting video per page open - show frozen frame after crossfade
        const greetingVideo = newActive === 1 ? videoRef1.current : videoRef2.current;
        if (greetingVideo) {
          greetingVideo.currentTime = 0;
          greetingVideo.pause();
        }
      }
    };

    requestAnimationFrame(animate);
  }, [activeVideo, getActiveVideo, getHiddenVideo, getVideoPath, characterLoaded, selectedCharacter]);

  /**
   * Android WebView (and most mobile browsers) pause `<video>` when the app
   * is backgrounded; on resume the video sits on a frozen frame and won't
   * recover without the user leaving the page and coming back.
   *
   * Capture whether the active video was actively playing at the moment the
   * page lost visibility, then on resume / app foreground try to `.play()`
   * again. If autoplay is blocked, arm a one-shot pointer fallback so the
   * next tap recovers playback. Greeting freeze-frames (video ended naturally)
   * are explicitly skipped so we don't replay the greeting unnecessarily.
   *
   * Same recovery pattern as `DashboardSkyBackground.tsx`.
   */
  useEffect(() => {
    if (!characterLoaded || !selectedCharacter) return;

    let cancelled = false;
    let removeAppListener: (() => void) | null = null;
    let pendingTouchFallback: (() => void) | null = null;
    let wasPlayingBeforeHide = false;

    const armOneShotTouchFallback = () => {
      if (cancelled || pendingTouchFallback) return;
      const onceTouch = () => {
        pendingTouchFallback = null;
        const v = getActiveVideo();
        if (cancelled || !v || !v.paused) return;
        v.muted = true;
        v.play().catch(() => {});
      };
      document.addEventListener("pointerdown", onceTouch, { once: true, passive: true });
      document.addEventListener("touchstart", onceTouch, { once: true, passive: true });
      pendingTouchFallback = () => {
        document.removeEventListener("pointerdown", onceTouch);
        document.removeEventListener("touchstart", onceTouch);
        pendingTouchFallback = null;
      };
    };

    const tryResumePlayback = () => {
      if (cancelled || !wasPlayingBeforeHide) return;
      const v = getActiveVideo();
      if (!v || !v.paused) return;
      // Skip if the video ended naturally (e.g., greeting/action freeze frame).
      if (v.duration > 0 && v.currentTime >= v.duration - 0.5) return;
      v.muted = true;
      v.play().catch(() => armOneShotTouchFallback());
    };

    const onVis = () => {
      if (document.visibilityState === "hidden") {
        const v = getActiveVideo();
        wasPlayingBeforeHide = !!(
          v &&
          !v.paused &&
          v.readyState >= 2 &&
          v.duration > 0 &&
          v.currentTime < v.duration - 0.5
        );
      } else {
        tryResumePlayback();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    if (Capacitor.isNativePlatform()) {
      void import("@capacitor/app").then(({ App }) => {
        if (cancelled) return;
        void App.addListener("resume", tryResumePlayback).then((handle) => {
          if (cancelled) {
            void handle.remove();
            return;
          }
          removeAppListener = () => void handle.remove();
        });
      });
    }

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      if (removeAppListener) removeAppListener();
      if (pendingTouchFallback) pendingTouchFallback();
    };
  }, [characterLoaded, selectedCharacter, getActiveVideo]);

  // Handle video ended event as a simple state machine
  const handleVideoEnded = useCallback(() => {
    const activeVideoEl = getActiveVideo();
    if (!activeVideoEl) return;

    if (phase === "greeting") {
      // Greeting ends → pause it (freeze frame)
      activeVideoEl.pause();
      return;
    }

    if (phase === "action") {
      // After an action clip, crossfade to greeting
      crossfadeToGreeting();
    }
  }, [phase, crossfadeToGreeting, getActiveVideo]);

  // Handle action button click - open confirmation dialog
  const handleActionClick = (action: string) => {
    // Check if action already completed today (in PT timezone)
    if (completedActions.has(action)) {
      return; // Don't allow clicking completed actions
    }
    
    // Always allow clicks - no video state blocking
    setPendingAction(action);
    setShowDialog(true);
  };

  // Load daily power progress from database (cloud-first)
  // Note: This function also syncs completed actions to action history
  const loadDailyProgress = useCallback(async () => {
    // Don't reload if we're currently saving
    if (isSavingRef.current) {
      console.log("Skipping loadDailyProgress - save in progress");
      return;
    }
    
    const todayDate = getTodayLocal(); // Use local timezone
    console.log("Loading daily progress for date:", todayDate);
    
    if (!user) {
      // User must be logged in
      setPowerProgress(0);
      setCompletedActions(new Set());
      return;
    }

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        if (import.meta.env.DEV) {
          console.warn('No valid session found, cannot load progress');
        }
        setPowerProgress(0);
        setCompletedActions(new Set());
        return;
      }

      // Load from database - RLS will automatically filter by auth.uid() = user_id
      // Don't filter by user_id manually - let RLS handle it for security
      const { data, error } = await supabase
        .from('user_double_progress')
        .select('*')
        .eq('progress_date', todayDate)
        .maybeSingle();

      if (error) {
        // Check if it's an RLS policy error
        if (error.message?.includes('row-level security') || error.message?.includes('RLS') || error.code === '42501' || error.code === 'PGRST301') {
          console.error('RLS Policy Violation: Please ensure you are logged in and try again.');
          toast({
            title: t('double.embody.toast.permissionDenied'),
            description: t('double.embody.toast.permissionDeniedDesc'),
            variant: 'destructive',
          });
        }
        throw error;
      }

      if (data) {
        console.log("Loaded progress from database:", data);
        const loadedActions = new Set((data.completed_actions as string[]) || []);
        setCompletedActions(loadedActions);
        if (loadedActions.size > 0) {
          setPowerProgress(dailyPracticePercentFromCompletedCount(loadedActions.size, activePractices.length));
        } else {
          // Legacy stored % values from older versions.
          setPowerProgress(Math.min(Math.max(data.progress ?? 0, 0), 100));
        }
        console.log("Loaded completed actions:", Array.from(loadedActions));
        // Note: Sync to history happens in useEffect after state is set
      } else {
        // No data for today, initialize
        console.log("No progress data for today, initializing to 0");
        setPowerProgress(0);
        setCompletedActions(new Set());
      }

    } catch (error) {
      console.error("Error loading progress from database:", error);
      toast({
        title: t('double.embody.toast.error'),
        description: t('double.embody.toast.loadProgressFailed'),
        variant: 'destructive',
      });
      setPowerProgress(0);
      setCompletedActions(new Set());
    }
  }, [user]);

  // Save daily power progress to database (cloud-first)
  const saveDailyProgress = useCallback(async (progress: number, completedActionsSet: Set<string>) => {
    if (!user) {
      console.error("Cannot save progress: user not logged in");
      toast({
        title: t('double.embody.toast.authRequired'),
        description: t('double.embody.toast.mustBeLoggedInProgress'),
        variant: 'destructive',
      });
      return;
    }

    const todayDate = getTodayLocal(); // Use local timezone

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        throw new Error(t('double.embody.toast.noSession'));
      }

      const sessionUserId = freshSession.user.id;
      if (sessionUserId !== user.id) {
        if (import.meta.env.DEV) {
          console.warn('User ID mismatch:', { contextUserId: user.id, sessionUserId });
        }
      }

      // Use session user ID to match auth.uid() for RLS
      // Specify conflict resolution for unique constraint (user_id, progress_date)
      const { data, error } = await supabase.from('user_double_progress').upsert({
        user_id: sessionUserId, // Use session user ID to match auth.uid()
        progress_date: todayDate,
        progress,
        completed_actions: Array.from(completedActionsSet),
      }, {
        onConflict: 'user_id,progress_date' // Handle unique constraint conflict
      }).select();
      
      if (error) {
        // Handle duplicate key error (shouldn't happen with proper upsert, but handle gracefully)
        if (error.code === '23505') {
          console.log("Duplicate key detected (race condition), attempting update instead");
          // Try update instead
          const { data: updateData, error: updateError } = await supabase
            .from('user_double_progress')
            .update({
              progress,
              completed_actions: Array.from(completedActionsSet),
            })
            .eq('user_id', sessionUserId)
            .eq('progress_date', todayDate)
            .select();
          
          if (updateError) {
            console.error("Error updating progress after duplicate key:", updateError);
            toast({
              title: t('double.embody.toast.error'),
              description: t('double.embody.toast.saveProgressFailed'),
              variant: 'destructive',
            });
            throw updateError;
          }
          
          console.log("Progress updated successfully after duplicate key:", updateData);
          return; // Success, exit early
        }
        
        // Check if it's an RLS policy error
        if (error.message?.includes('row-level security') || error.message?.includes('RLS') || error.code === '42501' || error.code === 'PGRST301') {
          console.error('RLS Policy Violation:', {
            code: error.code,
            message: error.message,
            sessionUserId,
            contextUserId: user.id,
          });
          toast({
            title: t('double.embody.toast.permissionDenied'),
            description: t('double.embody.toast.permissionDeniedDesc'),
            variant: 'destructive',
          });
          throw error;
        }
        console.error("Error saving progress to database:", error);
        toast({
          title: t('double.embody.toast.error'),
          description: t('double.embody.toast.saveProgressFailed'),
          variant: 'destructive',
        });
        throw error;
      }
      
      console.log("Progress saved successfully:", data);
    } catch (error) {
      console.error("Error saving progress to database:", error);
      throw error;
    }
  }, [user]);

  // Save action to history - requires user to be logged in
  const saveActionToHistory = useCallback(async (action: string) => {
    if (!user) {
      console.error("Cannot save action: user not logged in");
      toast({
        title: t('double.embody.toast.authRequired'),
        description: t('double.embody.toast.mustBeLoggedInActions'),
        variant: 'destructive',
      });
      return;
    }

    const todayDate = getTodayLocal(); // Use local timezone
    console.log("Saving action to history:", action, "for date:", todayDate);

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        throw new Error(t('double.embody.toast.noSession'));
      }

      const sessionUserId = freshSession.user.id;

      // Load existing history for today - RLS will automatically filter by auth.uid() = user_id
      const { data: existing } = await supabase
        .from('user_double_action_history')
        .select('actions')
        .eq('action_date', todayDate)
        .maybeSingle();

      const existingActions = (existing?.actions as string[]) || [];
      console.log("Existing actions for", todayDate, ":", existingActions);
      
      if (!existingActions.includes(action)) {
        const updatedActions = [...existingActions, action];
        
        // Use upsert with onConflict to handle unique constraint
        // Use session user ID to match auth.uid() for RLS
        const { data, error } = await supabase
          .from('user_double_action_history')
          .upsert({
            user_id: sessionUserId, // Use session user ID to match auth.uid()
            action_date: todayDate,
            actions: updatedActions,
          }, {
            onConflict: 'user_id,action_date' // Specify conflict resolution columns
          })
          .select();
        
        if (error) {
          // Handle duplicate key error gracefully (might happen in race conditions)
          if (error.code === '23505') {
            console.log("Duplicate key detected (race condition), reloading existing data");
            // Reload and try again - RLS will automatically filter by auth.uid() = user_id
            const { data: reloaded } = await supabase
              .from('user_double_action_history')
              .select('actions')
              .eq('action_date', todayDate)
              .maybeSingle();
            
            const reloadedActions = (reloaded?.actions as string[]) || [];
            if (!reloadedActions.includes(action)) {
              const finalActions = [...reloadedActions, action];
              const { error: retryError } = await supabase
                .from('user_double_action_history')
                .upsert({
                  user_id: sessionUserId, // Use session user ID to match auth.uid()
                  action_date: todayDate,
                  actions: finalActions,
                }, {
                  onConflict: 'user_id,action_date'
                });
              
              if (retryError) {
                console.error("Error saving action history after retry:", retryError);
                toast({
                  title: t('double.embody.toast.error'),
                  description: t('double.embody.toast.saveActionFailed'),
                  variant: 'destructive',
                });
                throw retryError;
              }
            }
          } else {
            // Check if it's an RLS policy error
            if (error.message?.includes('row-level security') || error.message?.includes('RLS') || error.code === '42501' || error.code === 'PGRST301') {
              console.error('RLS Policy Violation:', error);
              toast({
                title: t('double.embody.toast.permissionDenied'),
                description: t('double.embody.toast.permissionDeniedDesc'),
                variant: 'destructive',
              });
            } else {
              console.error("Error saving action history to database:", error);
              toast({
                title: t('double.embody.toast.error'),
                description: t('double.embody.toast.saveActionFailed'),
                variant: 'destructive',
              });
            }
            throw error;
          }
        } else {
          console.log("Action history saved successfully:", data, "Date:", todayDate);
          dispatchInspiredActionHistoryRefresh();
        }
      } else {
        console.log("Action already exists in history, skipping save");
      }
    } catch (error) {
      console.error("Error saving action to database:", error);
      toast({
        title: t('double.embody.toast.error'),
        description: t('double.embody.toast.saveActionFailed'),
        variant: 'destructive',
      });
      throw error;
    }
  }, [user, t]);

  // Load action history - requires user to be logged in
  const loadActionHistory = useCallback(async (): Promise<Record<string, string[]>> => {
    if (!user) {
      // User must be logged in
      return {};
    }

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        if (import.meta.env.DEV) {
          console.warn('No valid session found, cannot load action history');
        }
        return {};
      }

      // Load from database - RLS will automatically filter by auth.uid() = user_id
      // Don't filter by user_id manually - let RLS handle it for security
      const { data, error } = await supabase
        .from('user_double_action_history')
        .select('action_date, actions')
        .order('action_date', { ascending: false });

      if (error) {
        // Check if it's an RLS policy error
        if (error.message?.includes('row-level security') || error.message?.includes('RLS') || error.code === '42501' || error.code === 'PGRST301') {
          console.error('RLS Policy Violation: Please ensure you are logged in and try again.');
        }
        throw error;
      }

      if (data && data.length > 0) {
        const history: Record<string, string[]> = {};
        data.forEach(entry => {
          history[entry.action_date] = (entry.actions as string[]) || [];
        });

        return history;
      } else {
        return {};
      }
    } catch (error) {
      console.error("Error loading action history from database:", error);
      toast({
        title: t('double.embody.toast.error'),
        description: t('double.embody.toast.loadHistoryFailed'),
        variant: 'destructive',
      });
      return {};
    }
  }, [user]);

  // Handle dialog confirmation (Yes)
  const handleConfirm = async () => {
    if (!pendingAction) return;
    
    const actionToProcess = pendingAction;
    
    // Close dialog first for immediate feedback
    setShowDialog(false);
    setPendingAction(null);
    
    // Check if action already completed today
    if (!completedActions.has(actionToProcess)) {
      const newCompletedActions = new Set(completedActions);
      newCompletedActions.add(actionToProcess);
      const newProgress = dailyPracticePercentFromCompletedCount(newCompletedActions.size, activePractices.length);
      
      // Update state immediately for UI responsiveness
      setPowerProgress(newProgress);
      setCompletedActions(newCompletedActions);
      
      // Play action video IMMEDIATELY (don't wait for save)
      setPhase("action");
      loadAndPlay(actionToProcess as any); // "clean", "drink-water", etc.
      
      // Save to database in the background (don't block video)
      isSavingRef.current = true;
      
      // Save asynchronously without blocking
      Promise.all([
        saveDailyProgress(newProgress, newCompletedActions),
        saveActionToHistory(actionToProcess)
      ]).then(async () => {
        // Sync all completed actions to history
        await syncCompletedActionsToHistory();
        console.log("Action saved successfully:", actionToProcess, "Progress:", newProgress, "Date:", getTodayLocal());
        
      }).catch((error) => {
        console.error("Error saving action:", error);
        toast({
          title: t('double.embody.toast.error'),
          description: t('double.embody.toast.saveActionFailed'),
          variant: 'destructive',
        });
        // Revert state on error
        setPowerProgress(powerProgress);
        setCompletedActions(completedActions);
      }).finally(() => {
        setTimeout(() => {
          isSavingRef.current = false;
          void syncCompletedActionsToHistory();
        }, 100);
      });
    } else {
      // Action already completed, but still play video if needed
      setPhase("action");
      loadAndPlay(actionToProcess as any);
    }
  };

  // Handle dialog cancellation (No)
  const handleCancel = () => {
    setShowDialog(false);
    setPendingAction(null);
  };

  // Load character selection from database (always query database after signup)
  const loadCharacter = useCallback(async () => {
    if (user) {
      try {
        // Refresh session to ensure auth.uid() works correctly in RLS
        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !freshSession || !freshSession.access_token) {
          if (import.meta.env.DEV) {
            console.warn('No valid session found, cannot load character');
          }
          setCharacterLoaded(true);
          return;
        }

        // Load from user_preferences table - RLS will automatically filter by auth.uid() = user_id
        // Always query database (no localStorage after signup) with cache-busting to prevent PWA browser caching
        const { data, error } = await supabase
          .from('user_preferences')
          .select('selected_character')
          .eq('user_id', freshSession.user.id)
          .maybeSingle();

        console.log('[Character Load] Database query result:', { data, error });

        if (!error && data?.selected_character) {
          const charId = data.selected_character;
          console.log('[Character Load] Found character in DB:', charId);
          if (characters.find(c => c.id === charId)) {
            console.log('[Character Load] Setting character to:', charId);
            setSelectedCharacter(charId);
            if (typeof window !== "undefined" && user?.id) {
              try {
                sessionStorage.setItem(`yourDoubleCharacter_${user.id}`, charId);
              } catch {
                /* ignore */
              }
            }
          } else {
            console.warn('[Character Load] Invalid character ID from DB:', charId);
          }
        }
        setCharacterLoaded(true);
      } catch (e) {
        console.error('Error loading character from database:', e);
        setCharacterLoaded(true);
      }
    } else {
      // User not logged in - ProtectedRoute should redirect
      setCharacterLoaded(true);
    }
  }, [user]);


  // Sync completed actions to action history - ensures calendar shows all completed actions
  const syncCompletedActionsToHistory = useCallback(async () => {
    if (!user || completedActions.size === 0) return;
    
    const todayDate = getTodayLocal();
    const existingHistory = await loadActionHistory();
    const todayActions = existingHistory[todayDate] || [];
    
    // Find missing actions
    const missingActions = Array.from(completedActions).filter(action => !todayActions.includes(action));
    
    if (missingActions.length > 0) {
      console.log("[SYNC] Syncing", missingActions.length, "missing actions to history:", missingActions);
      // Save all missing actions in a single upsert to avoid race conditions
      const allActions = [...todayActions, ...missingActions];
      
      try {
        // Refresh session to ensure auth.uid() works correctly in RLS
        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !freshSession || !freshSession.access_token) {
          if (import.meta.env.DEV) {
            console.warn('[SYNC] No valid session found, skipping sync');
          }
          return;
        }

        const { error: syncError } = await supabase
          .from('user_double_action_history')
          .upsert({
            user_id: freshSession.user.id, // Use session user ID to match auth.uid()
            action_date: todayDate,
            actions: allActions,
          }, {
            onConflict: 'user_id,action_date'
          });
        
        if (syncError) {
          if (syncError.code === '23505') {
            // Duplicate key - ignore, it's already there
            console.log("[SYNC] Duplicate key (already synced), ignoring");
          } else {
            console.error("[SYNC] Error syncing actions:", syncError);
          }
        } else {
          console.log("[SYNC] History updated for:", todayDate);
          dispatchInspiredActionHistoryRefresh();
        }
      } catch (error) {
        console.error("[SYNC] Error in sync:", error);
      }
    }
  }, [user, completedActions, loadActionHistory]);

  // Sync completed actions to history whenever completedActions changes
  useEffect(() => {
    if (user && completedActions.size > 0) {
      void syncCompletedActionsToHistory();
    }
  }, [completedActions, user, syncCompletedActionsToHistory]);



  // Load character on mount
  useEffect(() => {
    const isDoubleRoute = location.pathname === '/double' || location.pathname === '/dashboard/double';
    if (!isDoubleRoute) return;
    if (user !== undefined && !isSavingRef.current) { // Only load when user state is determined and not saving
      loadCharacter();
      loadDailyProgress();
    }
  }, [user, location.pathname, loadDailyProgress, loadCharacter]); // Reload when user changes


  // Basic SEO for this route
  useEffect(() => {
    const prevTitle = document.title;
    document.title = t('double.embody.pageTitle');

    const ensureMeta = (name: string, content: string) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    ensureMeta("description", t('double.embody.metaDescription'));

    // Canonical
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/double";

    return () => {
      document.title = prevTitle;
    };
  }, [t]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-24 md:pb-8")}
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

        <div className="relative z-10">
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
        <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
          <div className="flex items-center justify-between">
            <h1 className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"} onClick={() => navigate("/dashboard")}>
              {t('double.embody.title')}
            </h1>
            <div className="flex items-center gap-2">
            {/* Settings, Chat, and Tracking Buttons */}
              <div 
                className="flex gap-2"
                style={isMobile && !isStandalone ? { marginRight: '0.5rem' } : {}}
              >
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => navigate('/activity-tracking')}
                title={t('double.embody.dailyPracticeTracking')}
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => navigate('/choose-double')}
                title={t('double.embody.changeCharacter')}
              >
                <Settings className="h-5 w-5" />
              </Button>
              </div>
              {isMobile && <MobilePWAMenu />}
            </div>
          </div>
        </div>
      </header>

      <main className={cn("px-4 sm:px-6 max-w-6xl", !isMobile ? "pt-16" : "", !isMobile ? "" : "container mx-auto")}>
        <div className="py-3 sm:py-4">
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('double.embody.subtitle')}
          </p>
        </div>

        {/* Video and buttons container - flex on desktop */}
        <div className={cn(
          "mb-4",
          isMobile ? "" : "flex items-start gap-4"
        )}>
          {/* Black box - main display area */}
          <div 
            ref={videoContainerRef}
            className={cn(
            `relative rounded-lg overflow-hidden ${isAndroidNative ? 'bg-black' : 'bg-transparent'}`,
            isMobile ? "w-full mx-auto" : "w-1/2"
          )} style={{ 
            aspectRatio: '9/16',
            maxHeight: isStandalone ? '68vh' : (isMobile ? '68vh' : '75vh'),
            minHeight: '50vh'
          }}>
            {/* Video 1 - visible when activeVideo === 1 */}
            <video
              ref={videoRef1}
              {...(isAndroidNative ? { poster: TRANSPARENT_VIDEO_POSTER, preload: "auto", controls: false, controlsList: "nodownload noremoteplayback nofullscreen", disablePictureInPicture: true, disableRemotePlayback: true } : {})}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ 
                opacity: video1Opacity,
                transition: 'none',
                pointerEvents: activeVideo === 1 ? 'auto' : 'none',
                visibility: video1Opacity > 0 ? 'visible' : 'hidden',
                zIndex: activeVideo === 1 ? 2 : 1
              }}
              muted
              playsInline
              onEnded={handleVideoEnded}
            />
            
            {/* Video 2 - visible when activeVideo === 2 */}
            <video
              ref={videoRef2}
              {...(isAndroidNative ? { poster: TRANSPARENT_VIDEO_POSTER, preload: "auto", controls: false, controlsList: "nodownload noremoteplayback nofullscreen", disablePictureInPicture: true, disableRemotePlayback: true } : {})}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ 
                opacity: video2Opacity,
                transition: 'none',
                pointerEvents: activeVideo === 2 ? 'auto' : 'none',
                visibility: video2Opacity > 0 ? 'visible' : 'hidden',
                zIndex: activeVideo === 2 ? 2 : 1
              }}
              muted
              playsInline
              onEnded={handleVideoEnded}
            />

            {/* Android only: black cover masks the frame-clear gap during video src changes */}
            {isAndroidNative && (
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{
                  zIndex: 3,
                  opacity: showBlackCover ? 1 : 0,
                  transition: showBlackCover ? 'none' : 'opacity 200ms ease-out',
                }}
              />
            )}
            
            {/* Action buttons overlay - show after greeting, positioned near bottom */}
            {/* Action buttons overlay - always visible, positioned near bottom - Mobile only */}
            {isMobile && (
              <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 pointer-events-none z-10">
                {/* Power Progress Bar — hidden on Embody for now (shown on dashboard / Your Journey) */}
                <div className="hidden flex flex-col items-center px-2">
                  <div className="mb-1 text-xs text-white/80 text-center whitespace-nowrap">
                    {t('double.embody.dailyPower', { percent: powerProgress })}
                  </div>
                  <div className="w-[280px] sm:w-[320px]">
                    <Progress 
                      value={powerProgress} 
                      className="h-2 w-full bg-white/20 [&>div]:bg-white" 
                    />
                  </div>
                </div>
                
                {/* Action Buttons — 5×2 grid on mobile for ten practices */}
                <div className="grid grid-cols-5 gap-2 px-2 w-full max-w-[min(100%,360px)] pointer-events-auto">
                  {activePractices.map((practice) => {
                    const done = completedActions.has(practice.key);
                    const Icon = practice.Icon;
                    return (
                      <Button
                        key={practice.key}
                        disabled={done}
                        className={cn(
                          "h-[9vh] w-full aspect-square max-h-[52px] max-w-[52px] min-h-10 min-w-10 mx-auto flex flex-col items-center justify-center gap-0.5 p-0.5",
                          cn("rounded-xl backdrop-blur-sm shadow-lg pointer-events-auto disabled:cursor-not-allowed", theme === "dark" ? cn("border border-white/12 bg-transparent text-white", done ? "opacity-60" : "hover:bg-white/[0.06]") : cn("rounded-xl backdrop-blur-sm border border-muted-foreground/30 shadow-lg pointer-events-auto disabled:cursor-not-allowed", done ? "bg-card/60 hover:bg-card/60 opacity-60" : "bg-card text-card-foreground hover:bg-card/90")),
                        )}
                        onClick={() => handleActionClick(practice.key)}
                      >
                        <Icon className={cn("h-[40%] w-[40%]", theme === "dark" ? (done ? "text-white/45" : "text-white") : (done ? "text-muted-foreground" : "text-card-foreground"))} />
                        <span
                          className={cn(
                            "text-[7px] leading-tight text-center px-0.5",
                            theme === "dark" ? (done ? "text-white/45" : "text-white") : (done ? "text-muted-foreground" : "text-card-foreground"),
                          )}
                        >
                          {t(EMBODY_PRACTICE_SHORT_I18N_KEY[practice.key])}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Desktop: Buttons and Manifestation Charge on the right */}
          {!isMobile && (
            <div 
              ref={buttonsContainerRef}
              className="flex flex-col gap-4 flex-1 items-start justify-start"
              style={{
                height: isStandalone ? '68vh' : '75vh',
                minHeight: '50vh'
              }}
            >
              <div className="w-full max-w-md flex flex-col gap-4 h-full justify-between">
              {/* Power Progress Bar — hidden on Embody for now (shown on dashboard / Your Journey) */}
              <Card className={cn("hidden w-full", theme === "dark" ? cn("rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm", "flex flex-row items-center justify-start gap-3 px-4") : "w-full rounded-xl backdrop-blur-sm border border-muted-foreground/30 shadow-lg flex flex-row items-center justify-start gap-3 px-4 bg-card")} style={{ height: "calc(5rem + 0.2in)" }}>
                <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                  <div className={cn("text-sm font-medium", theme === "dark" ? "text-white" : "text-card-foreground")}>
                    {t('double.embody.dailyPower', { percent: powerProgress })}
                  </div>
                  <div className="w-full">
                    <Progress 
                      value={powerProgress} 
                      className="h-1.5 w-full" 
                    />
                  </div>
                </div>
              </Card>
              
              {/* Action Buttons - Stacked vertically, wider */}
              <div className="flex flex-col gap-3 flex-1 justify-start">
                {activePractices.map((practice) => {
                  const done = completedActions.has(practice.key);
                  const Icon = practice.Icon;
                  return (
                    <Button
                      key={practice.key}
                      disabled={done}
                      className={cn(
                        "w-full h-14 flex flex-row items-center justify-start gap-3 px-4",
                        cn("rounded-xl backdrop-blur-sm shadow-lg pointer-events-auto disabled:cursor-not-allowed", theme === "dark" ? cn("border border-white/12 bg-transparent text-white", done ? "opacity-60" : "hover:bg-white/[0.06]") : cn("rounded-xl backdrop-blur-sm border border-muted-foreground/30 shadow-lg pointer-events-auto disabled:cursor-not-allowed", done ? "bg-card/60 hover:bg-card/60 opacity-60" : "bg-card text-card-foreground hover:bg-card/90")),
                      )}
                      onClick={() => handleActionClick(practice.key)}
                    >
                      <Icon className={cn("h-5 w-5", theme === "dark" ? (done ? "text-white/45" : "text-white") : (done ? "text-muted-foreground" : "text-card-foreground"))} />
                      <span className={cn("text-sm font-medium", theme === "dark" ? (done ? "text-white/45" : "text-white") : (done ? "text-muted-foreground" : "text-card-foreground"))}>
                        {t(EMBODY_PRACTICE_SHORT_I18N_KEY[practice.key])}
                      </span>
                    </Button>
                  );
                })}
              </div>
              </div>
            </div>
          )}
        </div>
      </main>


      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[200px] w-[200px]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base">{t('double.embody.confirmAction')}</DialogTitle>
            <DialogDescription className="text-sm">
              {pendingAction ? actionQuestions[pendingAction] ?? "" : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2 justify-center">
            <Button
              onClick={handleConfirm}
              className="flex-1"
            >
              {t('double.embody.yes')}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              {t('double.embody.no')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
};

export default YourDouble;
