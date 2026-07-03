// Mobile-specific conversational flow for subliminal audio
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Mic, Play, Pause, Sparkles, Loader2, Plus, ChevronDown, Square, Trash2, Repeat, MoreHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { dateFnsLocaleForApp, isAppLocale, type AppLocale } from "@/lib/locale";
import type { AffirmationSet } from "@/lib/affirmations-data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTier } from "@/hooks/useUserTier";
import { recordDailyManifestationSignal } from "@/lib/manifestationPowerSignals";
import { getTierLimits, hasActivePaidPlan } from "@/lib/featureGating";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { getLocalizedPremadeSets } from "@/lib/affirmations-data";
import { localizeEdgeErrorMessage } from "@/lib/error-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getSubliminalPlayerState,
  getSubliminalAudioElement,
  clearSubliminalActiveTrackId,
  detachSubliminalPlayback,
  pauseSubliminal,
  playSubliminalUrl,
  setSubliminalLoop,
  subscribeSubliminalPlayer,
} from "@/lib/subliminalPlayer";
import { STARTER_SUBLIMINAL_NAMES } from "@/lib/postPaywallProvisioning";
import { Capacitor } from "@capacitor/core";

const BACKGROUND_SOUND_UNSET = "__unset__";

function shortBinauralLabel(beatValue: string, t: (key: string) => string): string {
  return t(`subliminal.binauralShort.${beatValue}`) ?? beatValue;
}

interface Track {
  id: string;
  name: string;
  binauralBeat: string;
  binauralVolume: number;
  backgroundSound: string;
  affirmationVolume: number;
  backgroundVolume: number;
  layers: number;
  length: number;
  audioUrl: string;
  createdAt: Date;
  isGenerating?: boolean;
  progress?: number;
  fileSizeMB?: number;
}

type SubliminalTrack = Track;

interface MobileStepProps {
  isRecording: boolean;
  audioBlob: Blob | null;
  isPlaying: boolean;
  selectedAffirmationSet: string;
  displayedAffirmations: string[];
  isGeneratingTTS: boolean;
  binauralBeat: string;
  backgroundSound: string;
  affirmationVolume: number[];
  binauralVolume: number[];
  backgroundVolume: number[];
  layerCount: number[];
  trackLength: number[];
  binauralBeats: any[];
  backgroundSounds: any[];
  userBackgroundTracks?: Array<{ id: string; name: string; audio_url: string }>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  startRecording: () => void;
  stopRecording: () => void;
  clearAudio: () => void;
  handleAffirmationSetChange: (value: string) => void;
  generateAffirmationAudio: () => void;
  togglePlayback: () => void;
  setBinauralBeat: (value: string) => void;
  setBackgroundSound: (value: string) => void;
  setAffirmationVolume: (value: number[]) => void;
  setBinauralVolume: (value: number[]) => void;
  setBackgroundVolume: (value: number[]) => void;
  setLayerCount: (value: number[]) => void;
  setTrackLength: (value: number[]) => void;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  playingTrackId: string | null;
  setPlayingTrackId: React.Dispatch<React.SetStateAction<string | null>>;
  flowStep: "list" | "step1" | "step2" | "step3";
  setFlowStep: React.Dispatch<React.SetStateAction<"list" | "step1" | "step2" | "step3">>;
  trackName: string;
  setTrackName: React.Dispatch<React.SetStateAction<string>>;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  generateSubliminalTrack: () => Promise<void>;
  onTrackCreated?: () => Promise<void>;
  onTrackDeleted?: () => Promise<void>;
}

function SubliminalFakeVisualizer({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = canvas;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const bars = 40;
    let phase = 0;
    const smooth = new Array<number>(bars).fill(active ? 0.25 : 0.06);
    let lastT = performance.now();

    const hslaFromVar = (varName: string, alpha: number): string | null => {
      try {
        const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (!raw) return null;
        const parts = raw.split(/\s+/);
        if (parts.length < 3) return null;
        const [h, s, l] = parts;
        return `hsla(${h}, ${s}, ${l}, ${alpha})`;
      } catch {
        return null;
      }
    };

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(50, Math.max(0, now - lastT)); // clamp to reduce jumpiness on tab switch
      lastT = now;
      const dtNorm = dt / 16.67; // ~1 at 60fps

      phase += (active ? 0.045 : 0.015) * dtNorm;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const gap = 3;
      const totalGap = gap * (bars - 1);
      const barW = Math.max(2, (w - totalGap) / bars);
      const topCol = hslaFromVar("--sv-visualizer-top", 0.85) ?? "rgba(80, 80, 80, 0.85)";
      const botCol = hslaFromVar("--sv-visualizer-bottom", 0.35) ?? "rgba(120, 120, 120, 0.35)";
      for (let i = 0; i < bars; i++) {
        // Smooth "breathing" motion (no per-frame random jitter)
        const wave = Math.abs(Math.sin(phase + i * 0.28));
        const target = active ? 0.14 + wave * 0.58 : 0.06;
        const alpha = 1 - Math.pow(0.08, dtNorm); // frame-rate independent smoothing
        smooth[i] = smooth[i] + (target - smooth[i]) * alpha;
        const bh = Math.min(h * 0.92, smooth[i] * h);
        const x = i * (barW + gap);
        const y = h - bh;
        const g = ctx.createLinearGradient(0, y, 0, h);
        g.addColorStop(0, topCol);
        g.addColorStop(1, botCol);
        ctx.fillStyle = g;
        ctx.beginPath();
        if (typeof (ctx as CanvasRenderingContext2D).roundRect === "function") {
          (ctx as CanvasRenderingContext2D).roundRect(x, y, barW, bh, 3);
        } else {
          ctx.rect(x, y, barW, bh);
        }
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active]);

  return (
    <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-border/50 bg-muted/40 dark:border-white/12 dark:bg-transparent">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

type VocalBaseControlBarProps = {
  compact: boolean;
  innerSetupSurface: string;
  buttonShellClass: string;
  vocalShellChrome: string;
  micIdleClass: string;
  vocalPlayOutlineClass: string;
  isRecording: boolean;
  onRecordClick: () => void;
  onTogglePlayback: () => void;
  hasAudio: boolean;
  isPlaying: boolean;
  waveformHeights: number[];
  recordingTime: number;
  formatTime: (seconds: number) => string;
};

/** Record/play left, waveform centered, timer right — all inside the inset card. */
function VocalBaseControlBar({
  compact,
  innerSetupSurface,
  buttonShellClass,
  vocalShellChrome,
  micIdleClass,
  vocalPlayOutlineClass,
  isRecording,
  onRecordClick,
  onTogglePlayback,
  hasAudio,
  isPlaying,
  waveformHeights,
  recordingTime,
  formatTime,
}: VocalBaseControlBarProps) {
  const btnSize = compact ? "h-10 w-10" : "h-12 w-12";
  const iconSize = compact ? "h-4 w-4" : "h-5 w-5";
  const barCount = compact ? 14 : 22;
  const maxBarHeight = compact ? 36 : 44;

  return (
    <div className={cn("w-full rounded-xl", compact ? "p-4" : "p-6", innerSetupSurface)}>
      <div
        className={cn(
          "grid w-full items-center gap-3",
          compact ? "min-h-[4.5rem]" : "min-h-[4rem]",
          "grid-cols-[auto_minmax(0,1fr)_auto]",
        )}
      >
        <div className="flex shrink-0 items-center gap-2.5">
          <div className={cn(buttonShellClass, vocalShellChrome)}>
            <Button
              onClick={onRecordClick}
              size="icon"
              className={cn(btnSize, isRecording ? "bg-red-500 hover:bg-red-600 text-white" : micIdleClass)}
            >
              {isRecording ? <Square className={iconSize} /> : <Mic className={iconSize} />}
            </Button>
          </div>
          <div className={cn(buttonShellClass, vocalShellChrome)}>
            <Button
              onClick={onTogglePlayback}
              size="icon"
              variant="outline"
              disabled={!hasAudio}
              className={cn(btnSize, hasAudio && "text-green-600 hover:text-green-700", vocalPlayOutlineClass)}
            >
              {isPlaying ? <Pause className={iconSize} /> : <Play className={iconSize} />}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-0 items-center justify-center overflow-hidden",
            compact ? "gap-0.5 px-1" : "gap-1 px-2",
          )}
          aria-hidden
        >
          {waveformHeights.slice(0, barCount).map((height, index) => (
            <div
              key={index}
              className={cn(
                "shrink-0 rounded-full bg-primary/60 transition-all duration-150",
                compact ? "w-0.5" : "w-1",
              )}
              style={{ height: `${Math.min(height, maxBarHeight)}px` }}
            />
          ))}
        </div>

        <div
          className={cn(
            "shrink-0 text-right font-medium tabular-nums leading-none text-muted-foreground",
            compact ? "min-w-[3.25rem] text-base" : "min-w-[4rem] text-xl",
          )}
        >
          {formatTime(recordingTime)}
        </div>
      </div>
    </div>
  );
}

export const MobileSubliminalFlow = ({
  isRecording,
  audioBlob,
  isPlaying,
  selectedAffirmationSet,
  displayedAffirmations,
  isGeneratingTTS,
  binauralBeat,
  backgroundSound,
  affirmationVolume,
  binauralVolume,
  backgroundVolume,
  layerCount,
  trackLength,
  binauralBeats,
  backgroundSounds,
  userBackgroundTracks,
  audioRef,
  startRecording,
  stopRecording,
  clearAudio,
  handleAffirmationSetChange,
  generateAffirmationAudio,
  togglePlayback,
  setBinauralBeat,
  setBackgroundSound,
  setAffirmationVolume,
  setBinauralVolume,
  setBackgroundVolume,
  setLayerCount,
  setTrackLength,
  tracks,
  setTracks,
  playingTrackId,
  setPlayingTrackId,
  flowStep,
  setFlowStep,
  trackName,
  setTrackName,
  isGenerating,
  setIsGenerating,
  generateSubliminalTrack,
  onTrackCreated,
  onTrackDeleted,
}: MobileStepProps) => {
  const { t, i18n } = useTranslation(["tools", "common"]);
  const { t: tCommon } = useTranslation("common");
  const appLocale: AppLocale = isAppLocale(i18n.language) ? i18n.language : "en";
  const dateLocale = dateFnsLocaleForApp(appLocale);
  const displayTrackName = (name: string) =>
    STARTER_SUBLIMINAL_NAMES.includes(name) ? t("subliminal.starterSubliminalName") : name;

  const defaultBackgroundSounds = useMemo(
    () => [
      { value: "none", label: t("subliminal.backgroundSounds.none") },
      { value: "City Corner.wav", label: t("subliminal.backgroundSounds.cityCorner") },
      { value: "Fireplace.wav", label: t("subliminal.backgroundSounds.fireplace") },
      { value: "Gold Coins.wav", label: t("subliminal.backgroundSounds.goldCoins") },
      { value: "Nature Park.wav", label: t("subliminal.backgroundSounds.naturePark") },
      { value: "Ocean v2.WAV", label: t("subliminal.backgroundSounds.ocean") },
      { value: "Rain v2.WAV", label: t("subliminal.backgroundSounds.rain") },
    ],
    [i18n.resolvedLanguage, t],
  );

  const safeBackgroundSounds =
    backgroundSounds && Array.isArray(backgroundSounds) && backgroundSounds.length > 0
      ? backgroundSounds
      : defaultBackgroundSounds;
  const navigate = useNavigate();
  const { user, session, isLoading: authLoading } = useAuth();
  const { tier, status, loading: tierLoading } = useUserTier();
  const { theme } = useTheme();
  const planGate = { tier, status };
  const tierLimits = getTierLimits(planGate);
  const isMobile = useIsMobile();

  const isCosmic = theme === "dark";

  const subGhostBtn = cn(
    "border !bg-transparent shadow-none",
    isCosmic
      ? "!text-white border-white/20 hover:!bg-white/10 hover:!text-white"
      : "!text-foreground border-border/60 hover:!bg-muted/50 hover:!text-foreground",
  );

  const subMenuSurface = isCosmic ? "z-50 border border-white/12 bg-[#0f0d14] text-white" : "";

  const flowStepCardClass = isCosmic
    ? cn("rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm", "!bg-transparent !shadow-none")
    : "border border-border/70 bg-card text-card-foreground backdrop-blur-sm shadow-sm";

  const innerSetupSurface = cn(
    "rounded-xl border shadow-sm",
    isCosmic
      ? cn("border border-white/12 bg-transparent text-white backdrop-blur-sm", "!bg-transparent shadow-none")
      : "border-border/60 bg-muted/25",
  );

  const vocalShellChrome = isCosmic ? "bg-transparent" : "bg-background/80 backdrop-blur-sm";

  const vocalInputSelectClass = isCosmic ? "!bg-transparent !border-white/12 !text-white" : "";

  const vocalTabsListClass = isCosmic
    ? theme === "dark" ? "flex w-full h-12 gap-1 p-1 rounded-lg border border-white/12 bg-transparent mb-2" : "flex w-full h-12 gap-1 p-1 rounded-lg border border-zinc-200/70 bg-muted mb-2"
    : "flex w-full h-12 gap-1 p-1 rounded-lg border border-border/50 bg-muted";

  const vocalTabsTriggerClass = isCosmic
    ? theme === "dark" ? cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-white/55", "border border-transparent hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white") : cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-muted-foreground data-[state=active]:shadow-sm", "data-[state=active]:bg-background data-[state=active]:text-foreground")
    : "h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-muted-foreground data-[state=active]:shadow-sm data-[state=active]:bg-background data-[state=active]:text-foreground";

  const micIdleClass = isCosmic
    ? subGhostBtn
    : "bg-card text-card-foreground hover:bg-card/90 border border-border";

  const vocalPlayOutlineClass = isCosmic
    ? subGhostBtn
    : "bg-card border-border hover:bg-card/90";

  const subSliderClass = cn("w-full", theme === "dark" ? cn("[&>span:first-child]:!bg-transparent [&>span:first-child]:border [&>span:first-child]:!border-white/12", "[&>span:first-child_.slider-range-fill]:!bg-white/30 [&>span:first-child_.slider-range-fill]:!shadow-none", "[&>span:last-child]:!bg-transparent [&>span:last-child]:!border-white/40 [&>span:last-child]:!shadow-none") : "");

  const vocalRowActionBtn = isCosmic
    ? subGhostBtn
    : "border border-border bg-card text-card-foreground hover:bg-card/90";

  const innerSetupShell = cn(innerSetupSurface, "p-1.5");
  const innerSetupShellLg = cn(innerSetupSurface, "p-2");
  // Playback is handled by a shared singleton player to prevent duplicate audio instances.
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>(Array(40).fill(8));
  const [allAffirmationSets, setAllAffirmationSets] = useState<AffirmationSet[]>(getLocalizedPremadeSets());
  const [isLooping, setIsLooping] = useState<Record<string, boolean>>({});
  const loopStartTimeRef = useRef<Record<string, number>>({});
  const loopStateRef = useRef<Record<string, boolean>>({}); // Ref to track loop state for onended handler

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [generatingTempId, setGeneratingTempId] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [playerSheetOpen, setPlayerSheetOpen] = useState(false);
  const [sheetTime, setSheetTime] = useState(0);
  const [sheetDuration, setSheetDuration] = useState(0);
  const [miniProgressPct, setMiniProgressPct] = useState(0);

  useEffect(() => {
    if (flowStep !== "list") {
      setPlayerSheetOpen(false);
      /** Keep selection when audio is still playing so the floating bar + list row stay aligned. */
      const s = getSubliminalPlayerState();
      if (!s.isPlaying) {
        setSelectedTrackId(null);
      }
    }
  }, [flowStep]);

  const getCurrentStorageUsed = async (): Promise<number> => {
    if (!user) return 0;
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('subliminal-tracks')
        .list(user.id, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
      if (!listError && files) {
        const totalSizeBytes = files.reduce((sum: number, file: any) => sum + (file.metadata?.size || 0), 0);
        return totalSizeBytes / (1024 * 1024);
      }
    } catch (error) {
      console.warn("Could not calculate current storage:", error);
    }
    return 0;
  };

  // Load affirmation sets from Supabase (SSOT: Affirmations.tsx)
  useEffect(() => {
    const loadAffirmationSets = async () => {
      // Always start with premade sets
      let allSets = [...getLocalizedPremadeSets()];

      if (user) {
        try {
          // Refresh session to ensure auth.uid() works correctly in RLS
          const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !freshSession || !freshSession.access_token) {
            if (import.meta.env.DEV) {
              console.warn('No valid session found, using only premade sets');
            }
          } else {
            // Load user sets from database - RLS will automatically filter by auth.uid() = user_id
            const { data: dbSets, error: dbError } = await supabase
              .from('user_affirmation_sets')
              .select('*')
              .order('created_at', { ascending: false });

            if (!dbError && dbSets && dbSets.length > 0) {
              // Convert database sets to AffirmationSet format
              const userSets: AffirmationSet[] = dbSets.map(dbSet => ({
                id: dbSet.id,
                name: dbSet.name,
                affirmations: dbSet.affirmations as string[],
                images: dbSet.images as any[],
                isPremade: false,
              }));
              allSets = [...getLocalizedPremadeSets(), ...userSets];
            }
          }
        } catch (error) {
          console.error("Error loading from database:", error);
        }
      }

      setAllAffirmationSets(allSets);
    };

    loadAffirmationSets();
  }, [user]);

  const handleCreateNewTrack = () => {
    setTrackName("");
    clearAudio();
    setRecordingTime(0);
    recordingStartTimeRef.current = null;
    wasRecordingRef.current = false;
    setFlowStep("step1");
  };

  // Timer for recording - tracks time while recording, keeps time after recording stops
  const recordingStartTimeRef = useRef<number | null>(null);
  const wasRecordingRef = useRef<boolean>(false);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // If recording just started (transition from false to true), reset timer
    if (isRecording && !wasRecordingRef.current) {
      setRecordingTime(0);
      recordingStartTimeRef.current = Date.now();
    }
    
    wasRecordingRef.current = isRecording;
    
    if (isRecording) {
      interval = setInterval(() => {
        if (recordingStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingTime(elapsed);
        }
      }, 1000);
    }
    // When recording stops, keep the time - don't reset
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Waveform animation
  useEffect(() => {
    let animationInterval: NodeJS.Timeout | null = null;
    if (isRecording || audioBlob) {
      animationInterval = setInterval(() => {
        setWaveformHeights(Array(40).fill(0).map(() => Math.random() * 36 + 8));
      }, 150);
    } else {
      setWaveformHeights(Array(40).fill(8));
    }
    return () => {
      if (animationInterval) clearInterval(animationInterval);
    };
  }, [isRecording, audioBlob]);
  
  // Mobile-specific waveform with fewer blocks (20 instead of 40)
  const mobileWaveformHeights = isMobile 
    ? waveformHeights.slice(0, 20)
    : waveformHeights;

  // Reset timer when audio is cleared (but preserve time when recording just stops)
  const prevAudioBlobRef = useRef<Blob | null>(null);
  useEffect(() => {
    // Only reset if audio was cleared (went from having audio to no audio) and not recording
    if (prevAudioBlobRef.current !== null && audioBlob === null && !isRecording) {
      setRecordingTime(0);
      recordingStartTimeRef.current = null;
      wasRecordingRef.current = false;
    }
    prevAudioBlobRef.current = audioBlob;
  }, [audioBlob, isRecording]);

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Reset timer when starting a new recording
      setRecordingTime(0);
      recordingStartTimeRef.current = null;
      wasRecordingRef.current = false;
      if (audioBlob) {
        clearAudio();
      }
      startRecording();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextFromStep1 = () => {
    if (!trackName.trim() || !audioBlob) return;
    setFlowStep("step2");
  };

  const handleNextFromStep2 = () => {
    setFlowStep("step3");
  };

  const handleGenerateTrack = async () => {
    if (!trackName.trim()) {
      toast.error(t("subliminal.toasts.enterTrackName"));
      return;
    }
    if (!audioBlob) {
      toast.error(t("subliminal.toasts.recordAffirmationsFirst"));
      return;
    }
    if (!backgroundSound || backgroundSound.trim() === "" || backgroundSound === BACKGROUND_SOUND_UNSET) {
      toast.error(t("subliminal.toasts.selectBackgroundSound"));
      return;
    }

    if (authLoading) {
      return;
    }
    if (!user?.id || !session?.access_token) {
      toast.error(t("subliminal.toasts.loginToGenerateTracks"));
      return;
    }
    if (tierLoading) {
      return;
    }
    if (!hasActivePaidPlan({ tier, status })) {
      toast.error(t("subliminal.toasts.loginToGenerateTracks"));
      return;
    }

    const userToUse = user;

    const { data: currentWeeklyCount, error: weeklyCheckError } = await (supabase as any)
      .rpc('get_weekly_generation_count', { p_user_id: userToUse.id });
    if (weeklyCheckError) {
      toast.error(t("subliminal.toasts.weeklyCheckFailed"));
      return;
    }
    if (tierLimits.maxGenerationsPerWeek > 0 && currentWeeklyCount >= tierLimits.maxGenerationsPerWeek) {
      toast.error(t("subliminal.toasts.weeklyLimitReached", {
        current: currentWeeklyCount,
        limit: tierLimits.maxGenerationsPerWeek,
      }));
      return;
    }

    const currentStorageUsedMB = await getCurrentStorageUsed();
    const remainingStorageMB = tierLimits.maxStorageMB - currentStorageUsedMB;
    if (remainingStorageMB <= 0) {
      toast.error(t("subliminal.toasts.fileTooLargeRemaining", {
        size: "0",
        remaining: "0",
      }));
      return;
    }

    const tempId = Date.now().toString();
    const newTrack: Track = {
      id: tempId,
      name: trackName,
      binauralBeat,
      binauralVolume: binauralVolume[0],
      backgroundSound,
      affirmationVolume: affirmationVolume[0],
      backgroundVolume: backgroundVolume[0],
      layers: layerCount[0],
      length: trackLength[0],
      audioUrl: "",
      createdAt: new Date(),
      isGenerating: true,
      progress: 0,
    };

    setTracks([newTrack, ...tracks]);
    setGeneratingTempId(tempId);
    setGeneratingProgress(0);
    setFlowStep("list");
    setIsGenerating(true);

    let interval: ReturnType<typeof setInterval> | null = null;
    let processor: any = null;

    try {
      interval = setInterval(() => {
        setGeneratingProgress((prev) => Math.min(prev + 7, 95));
      }, 400);

      const generationPromise = (async () => {
        let AudioProcessor;
        try {
          const module = await import('@/lib/audioProcessor');
          AudioProcessor = module.AudioProcessor;
        } catch (importError: any) {
          console.error('Failed to import AudioProcessor:', importError);
          if (importError.message?.includes('MIME type') || importError.message?.includes('Failed to fetch')) {
            throw new Error(t("subliminal.toasts.audioProcessorLoadFailed"));
          }
          throw importError;
        }
        processor = new AudioProcessor();
        
        // Get user track URL if it's a user track
        let backgroundSoundUrl: string | undefined;
        if (backgroundSound && backgroundSound.startsWith("user:")) {
          console.log("User track detected:", backgroundSound);
          console.log("Available user tracks:", userBackgroundTracks);
          if (!userBackgroundTracks || userBackgroundTracks.length === 0) {
            throw new Error(t("subliminal.toasts.backgroundTracksNotLoaded"));
          }
          const trackId = backgroundSound.replace("user:", "");
          const userTrack = userBackgroundTracks.find(t => t.id === trackId);
          if (!userTrack) {
            throw new Error(t("subliminal.toasts.userTrackNotFound"));
          }
          if (!userTrack.audio_url) {
            throw new Error(t("subliminal.toasts.userTrackMissingUrl"));
          }
          
          // Extract the file path from the stored URL to create a signed URL
          // Since the bucket is private, we need to use authenticated access
          try {
            const urlParts = userTrack.audio_url.split('/');
            const fileName = urlParts.slice(-2).join('/'); // user_id/filename.wav
            
            // Create a signed URL that works with private buckets
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('background-tracks')
              .createSignedUrl(fileName, 600); // 10 minute expiry
            
            if (signedUrlError || !signedUrlData) {
              console.warn("Failed to create signed URL, trying stored URL:", signedUrlError);
              backgroundSoundUrl = userTrack.audio_url;
            } else {
              backgroundSoundUrl = signedUrlData.signedUrl;
              console.log("Using signed URL for private bucket:", backgroundSoundUrl);
            }
          } catch (urlError) {
            // Fallback to stored URL if signed URL creation fails
            console.warn("Failed to create signed URL, using stored URL:", urlError);
            backgroundSoundUrl = userTrack.audio_url;
          }
          console.log("Using user track URL:", backgroundSoundUrl);
        }
        
        return await processor.generateSubliminalTrack({
          affirmationBlob: audioBlob,
          binauralType: binauralBeat as any,
          binauralVolume: binauralVolume[0],
          backgroundSound: backgroundSound || "",
          backgroundSoundUrl: backgroundSoundUrl,
          affirmationVolume: affirmationVolume[0],
          backgroundVolume: backgroundVolume[0],
          layers: layerCount[0],
          duration: trackLength[0],
        });
      })();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(t("subliminal.toasts.generationTimeout"))), 300000);
      });

      const subliminalBlob = await Promise.race([generationPromise, timeoutPromise]) as Blob;
      setGeneratingProgress(95);

      const { data: { session: uploadSession }, error: uploadSessionError } = await supabase.auth.getSession();
      if (uploadSessionError || !uploadSession?.access_token || uploadSession.user?.id !== userToUse.id) {
        throw new Error(t("subliminal.toasts.sessionExpired"));
      }

      let finalTrack: Track;

      {
        const fileSizeMB = subliminalBlob.size / (1024 * 1024);
        const maxStorageMB = tierLimits.maxStorageMB;
        const postMixStorageUsedMB = await getCurrentStorageUsed();
        const remainingStorageMB = maxStorageMB - postMixStorageUsedMB;
        
        if (fileSizeMB > remainingStorageMB) {
          const errorMsg = t("subliminal.toasts.fileTooLargeRemaining", {
            size: fileSizeMB.toFixed(2),
            remaining: remainingStorageMB.toFixed(1),
          });
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        if (fileSizeMB > maxStorageMB) {
          const errorMsg = t("subliminal.toasts.fileTooLargeMax", {
            size: fileSizeMB.toFixed(2),
            max: maxStorageMB,
          });
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        const warningThreshold = maxStorageMB * 0.8;
        if (fileSizeMB > warningThreshold) {
          toast.warning(t("subliminal.toasts.fileLargeWarning", { size: fileSizeMB.toFixed(2) }));
        }
        
        const fileName = `${userToUse.id}/${Date.now()}_${trackName.replace(/[^a-z0-9]/gi, '_')}.mp3`;
        
        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('subliminal-tracks')
            .upload(fileName, subliminalBlob, { contentType: 'audio/mpeg', upsert: false });

          if (uploadError) {
            const isBucketNotFound = 
              uploadError.message?.includes('Bucket not found') || 
              uploadError.message?.includes('does not exist') ||
              (uploadError as any).statusCode === '404' ||
              (uploadError as any).statusCode === 404;
            
            if (isBucketNotFound) {
              toast.error(t("subliminal.toasts.bucketNotFound"));
              throw new Error(t("subliminal.toasts.bucketNotFound"));
            }
            
            const isBucketSizeLimit = 
              (uploadError as any).statusCode === '413' || 
              (uploadError as any).statusCode === 413;
            
            if (isBucketSizeLimit) {
              const errorMsg = t("subliminal.toasts.bucketSizeLimit", {
                size: fileSizeMB.toFixed(2),
                minutes: trackLength[0],
              });
              toast.error(errorMsg);
              throw new Error(errorMsg);
            }
            
            toast.error(uploadError.message || t("subliminal.toasts.uploadFailed"));
            throw new Error(uploadError.message || t("subliminal.toasts.uploadFailed"));
          }
        } catch (storageError: any) {
          console.error("Storage error:", storageError);
          throw storageError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('subliminal-tracks')
          .getPublicUrl(fileName);

        const sessionUserId = userToUse.id;
        
        const { data: dbTrack, error: dbError } = await (supabase as any)
          .from('subliminal_tracks')
          .insert({
            user_id: sessionUserId,
            name: trackName,
            binaural_beat: binauralBeat,
            binaural_volume: binauralVolume[0],
            background_sound: backgroundSound,
            affirmation_volume: affirmationVolume[0],
            background_volume: backgroundVolume[0],
            layers: layerCount[0],
            length: trackLength[0],
            audio_url: publicUrl,
          })
          .select()
          .single();

        if (dbError) {
          if (dbError.message?.includes('row-level security') || dbError.message?.includes('RLS') || dbError.code === '42501' || dbError.code === 'PGRST301') {
            toast.error(t("subliminal.toasts.permissionDenied"));
            throw dbError;
          }
          throw dbError;
        }

        const { error: logError } = await (supabase as any)
          .from('subliminal_generation_log')
          .insert({
            user_id: sessionUserId,
            track_id: dbTrack.id,
            generated_at: new Date().toISOString(),
          });

        if (logError) {
          console.error("CRITICAL: Failed to log generation:", logError);
        }

        finalTrack = {
          id: dbTrack.id,
          name: dbTrack.name,
          binauralBeat: dbTrack.binaural_beat,
          binauralVolume: dbTrack.binaural_volume != null ? Number(dbTrack.binaural_volume) : 0.07,
          backgroundSound: dbTrack.background_sound,
          affirmationVolume: dbTrack.affirmation_volume,
          backgroundVolume: dbTrack.background_volume,
          layers: dbTrack.layers,
          length: dbTrack.length,
          audioUrl: dbTrack.audio_url,
          createdAt: new Date(dbTrack.created_at),
          isGenerating: false,
          progress: 100,
        };
        
        const { data: dbTracks, error } = await (supabase as any)
          .from('subliminal_tracks')
          .select('*')
          .order('created_at', { ascending: false });

          if (!error && dbTracks) {
            let fileSizes: Map<string, number> = new Map();
            try {
              const { data: files, error: listError } = await supabase.storage
                .from('subliminal-tracks')
                .list(user.id, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

              if (!listError && files) {
                files.forEach((file: any) => {
                  const fileSizeBytes = file.metadata?.size || 0;
                  const fileSizeMB = fileSizeBytes / (1024 * 1024);
                  fileSizes.set(file.name, fileSizeMB);
                });
              }
            } catch (storageError) {
              console.warn("Could not fetch file sizes:", storageError);
            }

            const formattedTracks: Track[] = await Promise.all(
              dbTracks.map(async (track: any) => {
                let fileSizeMB: number | undefined;
                let audioUrl = track.audio_url; // Default to stored URL
                
                try {
                  const url = new URL(track.audio_url);
                  const pathParts = url.pathname.split('/');
                  const bucketIndex = pathParts.findIndex(part => part === 'subliminal-tracks');
                  if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                    const filePath = pathParts.slice(bucketIndex + 1).join('/'); // user_id/filename
                    const fileName = filePath.split('/').pop() || '';
                    fileSizeMB = fileSizes.get(fileName);
                    
                    // Create signed URL for private bucket access (1 hour expiry)
                    try {
                      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                        .from('subliminal-tracks')
                        .createSignedUrl(filePath, 28800); // 8 hour expiry
                      
                      if (!signedUrlError && signedUrlData) {
                        audioUrl = signedUrlData.signedUrl;
                      } else {
                        console.warn("Failed to create signed URL for track, using stored URL:", signedUrlError);
                      }
                    } catch (signedUrlErr) {
                      console.warn("Error creating signed URL for track:", signedUrlErr);
                      // Continue with stored URL as fallback
                    }
                  }
                } catch (urlError) {
                  // URL parsing failed, skip file size and signed URL creation
                  console.warn("Error parsing track URL:", urlError);
                }

                return {
                  id: track.id,
                  name: track.name,
                  binauralBeat: track.binaural_beat,
                  binauralVolume: track.binaural_volume != null ? Number(track.binaural_volume) : 0.07,
                  backgroundSound: track.background_sound,
                  affirmationVolume: track.affirmation_volume,
                  backgroundVolume: track.background_volume,
                  layers: track.layers,
                  length: track.length,
                  audioUrl,
                  createdAt: new Date(track.created_at),
                  isGenerating: false,
                  progress: 100,
                  fileSizeMB,
                };
              })
            );
            setTracks(formattedTracks);
          }
      }

      setTracks(prev => prev.map(t => t.id === tempId ? finalTrack : t));
      toast.success(t("subliminal.toasts.trackGeneratedSaved", { name: trackName }));
      
      if (onTrackCreated) {
        await onTrackCreated();
      }
      setTrackName("");
    } catch (err) {
      console.error('Track generation error:', err);
      setTracks(prev => prev.filter(t => t.id !== tempId));
      const errorMessage =
        err instanceof Error
          ? localizeEdgeErrorMessage(err.message, tCommon)
          : t("subliminal.toasts.generateTrackFailed");
      toast.error(errorMessage);
    } finally {
      if (interval) {
        clearInterval(interval);
      }
      setGeneratingTempId(null);
      setGeneratingProgress(0);
      setIsGenerating(false);
      if (processor) {
        try {
          processor.dispose();
        } catch (disposeError) {
          console.error('Error disposing processor:', disposeError);
        }
      }
      if (Capacitor.isNativePlatform()) {
        console.info("[SubliminalMobile] generate_cleanup", {
          intervalCleared: !!interval,
          processorDisposed: !!processor,
        });
      }
    }
  };

  const toggleTrackPlayback = async (track: Track) => {
    if (!track.audioUrl) return;
    
    const player = getSubliminalPlayerState();
    if (playingTrackId === track.id && player.activeTrackId === track.id && player.isPlaying) {
      pauseSubliminal();
      clearSubliminalActiveTrackId();
      setPlayingTrackId(null);
      // Clear loop tracking when stopping
      delete loopStartTimeRef.current[track.id];
      delete loopStateRef.current[track.id];
      return;
    }

    try {
      const shouldLoop = isLooping[track.id] || false;
      try {
        await playSubliminalUrl(track.audioUrl, {
          loop: shouldLoop,
          activeTrackId: track.id,
        });
        setPlayingTrackId(track.id);
      } catch (playError: any) {
        console.error('Error playing audio:', playError);
        let errorMsg = t("subliminal.toasts.playTrackFailedPrefix");
        if (playError.name === 'NotAllowedError') {
          errorMsg += t("subliminal.toasts.interactFirst");
        } else if (playError.name === 'NotSupportedError') {
          errorMsg += t("refactor.toasts.tryAgain");
        } else {
          errorMsg += playError.message || t("refactor.toasts.tryAgain");
        }
        toast.error(errorMsg);
        clearSubliminalActiveTrackId();
        setPlayingTrackId(null);
        delete loopStartTimeRef.current[track.id];
        delete loopStateRef.current[track.id];
      }
    } catch (error: any) {
      console.error('Error creating audio element:', error);
      toast.error(t("subliminal.toasts.loadTrackFailed"));
      clearSubliminalActiveTrackId();
      setPlayingTrackId(null);
    }
  };

  const toggleLoop = (trackId: string) => {
    const newLoopState = !isLooping[trackId];
    
    setIsLooping(prev => ({
      ...prev,
      [trackId]: newLoopState
    }));
    
    // Update ref for onended handler to access current state
    loopStateRef.current[trackId] = newLoopState;

    // If track is currently playing, apply looping immediately for seamless transition
    if (playingTrackId === trackId) {
      setSubliminalLoop(newLoopState);
    }
    
    // If track is currently playing, update loop tracking
    if (playingTrackId === trackId) {
      // Update loop start time tracking
      if (newLoopState) {
        // Starting to loop - record start time
        loopStartTimeRef.current[trackId] = Date.now();
      } else {
        // Stopping loop - clear tracking
        delete loopStartTimeRef.current[trackId];
      }
    }
  };

  const handleDeleteClick = (trackId: string) => {
    setTrackToDelete(trackId);
    setDeleteConfirmOpen(true);
  };

  const deleteTrack = async () => {
    if (!trackToDelete) return;
    
    try {
      const track = tracks.find(t => t.id === trackToDelete);
      if (!track) {
        setDeleteConfirmOpen(false);
        setTrackToDelete(null);
        return;
      }

      if (
        playingTrackId === trackToDelete ||
        getSubliminalPlayerState().activeTrackId === trackToDelete
      ) {
        detachSubliminalPlayback();
        setPlayingTrackId(null);
      }
      
      if (!user) {
        toast.error(t("subliminal.toasts.loginToDelete"));
        setDeleteConfirmOpen(false);
        setTrackToDelete(null);
        return;
      }

      let storageDeleteSuccess = false;
      try {
        const url = new URL(track.audioUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'subliminal-tracks');
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          
          const { error: storageError } = await supabase.storage
            .from('subliminal-tracks')
            .remove([filePath]);

          if (storageError) {
            const isNotFound = 
              (storageError as any).statusCode === 404 ||
              (storageError as any).statusCode === '404' ||
              storageError.message?.toLowerCase().includes('not found') ||
              storageError.message?.toLowerCase().includes('does not exist');
            
            if (isNotFound) {
              storageDeleteSuccess = true;
            } else {
              throw new Error(t("subliminal.toasts.deleteStorageFailed"));
            }
          } else {
            storageDeleteSuccess = true;
          }
        } else {
          storageDeleteSuccess = true;
        }
      } catch (urlError) {
        storageDeleteSuccess = true;
      }

      if (!storageDeleteSuccess) {
        throw new Error(t("subliminal.toasts.deleteStorageFailed"));
      }

      const { error: dbError } = await (supabase as any)
        .from('subliminal_tracks')
        .delete()
        .eq('id', trackToDelete);

      if (dbError) {
        throw dbError;
      }

      setTracks(prev => prev.filter(t => t.id !== trackToDelete));
      setSelectedTrackId((id) => (id === trackToDelete ? null : id));
      setPlayerSheetOpen(false);

      if (onTrackDeleted) {
        setTimeout(async () => {
          await onTrackDeleted();
        }, 1500);
      }
      
      toast.success(t("subliminal.toasts.trackDeleted"));
      setDeleteConfirmOpen(false);
      setTrackToDelete(null);
    } catch (error) {
      console.error("Error deleting track:", error);
      toast.error(t("subliminal.toasts.deleteTrackFailed"));
      setDeleteConfirmOpen(false);
      setTrackToDelete(null);
    }
  };

  const handleTrackRowPress = (track: Track) => {
    if (track.isGenerating || track.id === generatingTempId || !track.audioUrl) return;
    void recordDailyManifestationSignal("subliminal_listen");
    setSelectedTrackId(track.id);
    void toggleTrackPlayback(track);
  };

  const dismissNowPlaying = () => {
    detachSubliminalPlayback();
    setPlayingTrackId(null);
    setSelectedTrackId(null);
    setPlayerSheetOpen(false);
  };

  // Singleton player survives navigation; `s.url` may be signed while `track.audioUrl` is public — use `activeTrackId`.
  useEffect(() => {
    const apply = () => {
      const s = getSubliminalPlayerState();
      if (!s.activeTrackId) {
        setPlayingTrackId(null);
        setSelectedTrackId(null);
        return;
      }
      const match = tracks.find((tr) => tr.id === s.activeTrackId);
      if (match) {
        setPlayingTrackId(s.activeTrackId);
        setSelectedTrackId(s.activeTrackId);
      } else if (tracks.length > 0) {
        setPlayingTrackId(null);
        setSelectedTrackId(null);
      }
    };
    apply();
    return subscribeSubliminalPlayer(apply);
  }, [tracks, setPlayingTrackId]);

  const selectedTrack = selectedTrackId ? tracks.find((t) => t.id === selectedTrackId) : undefined;

  useEffect(() => {
    const a = getSubliminalAudioElement();
    if (!playerSheetOpen || !a) return;
    const onTime = () => {
      setSheetTime(a.currentTime);
      if (a.duration && !Number.isNaN(a.duration)) setSheetDuration(a.duration);
    };
    const onMeta = () => setSheetDuration(a.duration || 0);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    onTime();
    onMeta();
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
    };
  }, [playerSheetOpen, playingTrackId, selectedTrackId]);

  useEffect(() => {
    const a = getSubliminalAudioElement();
    if (!a || playingTrackId !== selectedTrackId) {
      setMiniProgressPct(0);
      return;
    }
    const upd = () => {
      if (!a.duration || Number.isNaN(a.duration)) setMiniProgressPct(0);
      else setMiniProgressPct(Math.min(100, (a.currentTime / a.duration) * 100));
    };
    upd();
    a.addEventListener("timeupdate", upd);
    a.addEventListener("ended", upd);
    return () => {
      a.removeEventListener("timeupdate", upd);
      a.removeEventListener("ended", upd);
    };
  }, [playingTrackId, selectedTrackId]);

  if (flowStep === "list") {
    return (
      <>
      <div
        className={cn(
          "space-y-4",
          /* Floating mini-player + device safe inset (no extra “tab bar” gap — we’re not Spotify’s bottom tabs) */
          /** Clear the fixed bar (~controls + thin progress); safe area lives inside that bar — don’t pad safe twice. */
          (selectedTrackId || playingTrackId) && "pb-[5.5rem]",
        )}
      >
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="text-xl font-bold">{t("subliminal.yourTracks")}</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "shrink-0 border border-white/20 !bg-transparent !text-white shadow-none",
                  "hover:!bg-white/10 hover:!text-white",
                  theme !== "dark" &&
                    "border-border/60 !text-foreground hover:!bg-muted/50 hover:!text-foreground",
                )}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("subliminal.create")}
                <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn("w-56", subMenuSurface)}>
              <DropdownMenuItem
                onClick={() => {
                  handleCreateNewTrack();
                }}
              >
                {t("subliminal.subliminalTrack")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate("/dashboard/music-composer");
                }}
              >
                {t("subliminal.subliminalBackgrounds")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigate("/dashboard/tap-in");
                }}
              >
                {t("subliminal.pianoTapping")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {tracks.length === 0 ? (
          <Card
            className={cn(
              "overflow-hidden rounded-xl shadow-sm",
              theme === "dark"
                ? cn("border border-white/12 bg-transparent text-white backdrop-blur-sm", "!bg-transparent")
                : theme === "dark" ? "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm" : "border border-zinc-200/75 bg-card/75 backdrop-blur-sm",
            )}
          >
            <CardContent className="py-12 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("subliminal.noTracksYet")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => {
              const trackIsGenerating = track.isGenerating || track.id === generatingTempId;
              const trackProgress =
                track.id === generatingTempId ? generatingProgress : (track.progress ?? 0);
              return (
              <div
                key={track.id}
                className={cn("flex animate-fade-in items-center gap-2 px-3 py-3", cn("overflow-hidden rounded-xl shadow-sm", theme === "dark" ? "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm" : "border border-zinc-200/75 bg-card/75 backdrop-blur-sm", theme === "dark" ? "hover:bg-white/8" : "hover:bg-card/90", "transition-colors"))}
                data-track-id={track.id}
              >
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left disabled:opacity-60"
                  onClick={() => handleTrackRowPress(track)}
                  disabled={trackIsGenerating || !track.audioUrl}
                >
                  <div className="flex items-center gap-2">
                    {playingTrackId === track.id && !trackIsGenerating && (
                      <span className="flex h-4 w-4 items-end justify-center gap-0.5 shrink-0" aria-hidden>
                        <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="w-0.5 h-3 bg-primary rounded-full animate-pulse [animation-delay:120ms]" />
                        <span className="w-0.5 h-1.5 bg-primary rounded-full animate-pulse [animation-delay:240ms]" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{displayTrackName(track.name)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {shortBinauralLabel(track.binauralBeat, t)} · {t("subliminal.durationMin", { minutes: track.length })} ·{" "}
                        {format(track.createdAt, "MMM d, yyyy", { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                  {trackIsGenerating && (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs text-primary">{trackProgress}%</span>
                    </div>
                  )}
                  {trackIsGenerating && <Progress value={trackProgress} className="mt-2 h-1.5" />}
                </button>

                {!trackIsGenerating && track.audioUrl && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground"
                        aria-label={t("subliminal.trackOptions")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={cn("w-48", subMenuSurface)}>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTrackId(track.id);
                          void toggleTrackPlayback(track);
                        }}
                      >
                        {playingTrackId === track.id ? t("subliminal.pause") : t("subliminal.play")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!tier}
                        onClick={() => toggleLoop(track.id)}
                      >
                        {isLooping[track.id] ? t("subliminal.turnOffLoop") : t("subliminal.loopPlayback")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteClick(track.id)}
                      >
                        {t("subliminal.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>

      {selectedTrackId && selectedTrack && !selectedTrack.isGenerating && selectedTrack.id !== generatingTempId && !playerSheetOpen && (
        <>
          {(() => {
            return (
              <>
          <div className={theme === "dark" ? cn("fixed inset-x-0 bottom-0 z-[55] rounded-t-xl border-t border-white/20 bg-[#0f0d14] backdrop-blur-md", "px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom,0px))]", "shadow-[0_-8px_32px_rgba(0,0,0,0.5)] text-white") : cn("fixed inset-x-0 bottom-0 z-[55] rounded-t-xl border-t border-t-zinc-200/70 bg-background/95 backdrop-blur-md", "px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom,0px))]", "shadow-[0_-8px_32px_rgba(0,0,0,0.08)]")}>
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <button
                type="button"
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left transition-colors",
                  theme === "dark" ? "hover:bg-white/8" : "hover:bg-muted/50",
                )}
                onClick={() => setPlayerSheetOpen(true)}
              >
                <div className={theme === "dark" ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-[#0f0d14]" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted"}>
                  <Music className={cn("h-5 w-5", theme === "dark" ? "text-white/55" : "text-muted-foreground")} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{displayTrackName(selectedTrack.name)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {shortBinauralLabel(selectedTrack.binauralBeat, t)} · {t("subliminal.durationMin", { minutes: selectedTrack.length })}
                  </p>
                </div>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 shrink-0",
                  isLooping[selectedTrack.id] &&
                    (theme === "dark"
                      ? "bg-white/10 text-white hover:bg-white/15"
                      : "bg-muted/60 text-primary hover:bg-muted/70")
                )}
                onClick={() => toggleLoop(selectedTrack.id)}
                aria-label={isLooping[selectedTrack.id] ? t("subliminal.turnOffLoop") : t("subliminal.loopPlayback")}
              >
                <Repeat className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => selectedTrack && void toggleTrackPlayback(selectedTrack)}
                aria-label={playingTrackId === selectedTrack.id ? t("subliminal.pause") : t("subliminal.play")}
              >
                {playingTrackId === selectedTrack.id ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground"
                onClick={dismissNowPlaying}
                aria-label={t("subliminal.dismissPlayer")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {playingTrackId === selectedTrack.id && (
              <div
                className={cn(
                  "mx-auto mt-1.5 h-0.5 max-w-lg overflow-hidden rounded-full",
                  theme === "dark" ? "bg-white/15" : "bg-muted",
                )}
              >
                <div
                  className={cn(
                    "h-full transition-[width] duration-300 ease-linear",
                    theme === "dark" ? "bg-white/70" : "bg-primary/70",
                  )}
                  style={{ width: `${miniProgressPct}%` }}
                />
              </div>
            )}
          </div>
              </>
            );
          })()}
        </>
      )}

      {selectedTrackId && selectedTrack && !selectedTrack.isGenerating && selectedTrack.id !== generatingTempId && (
          <Sheet open={playerSheetOpen} onOpenChange={setPlayerSheetOpen}>
            <SheetContent
              side="bottom"
              className={cn(
                "z-[70] h-[88dvh] max-h-[88dvh] rounded-t-2xl border-t p-5 pb-8 pt-6 overflow-y-auto",
                isCosmic && "border-white/12 bg-[#0f0d14] text-white",
              )}
            >
              <SheetHeader className="mb-4 space-y-1 text-left">
                <SheetTitle className="text-lg leading-tight pr-8">{displayTrackName(selectedTrack.name)}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {shortBinauralLabel(selectedTrack.binauralBeat, t)} · {t("subliminal.durationMin", { minutes: selectedTrack.length })} ·{" "}
                  {format(selectedTrack.createdAt, "MMM d, yyyy", { locale: dateLocale })}
                </p>
              </SheetHeader>

              <SubliminalFakeVisualizer active={playingTrackId === selectedTrack.id} />

              <div className="mt-6 space-y-2">
                <Slider
                  value={[sheetDuration ? Math.min(sheetTime, sheetDuration) : 0]}
                  max={sheetDuration > 0 ? sheetDuration : 1}
                  step={0.1}
                  disabled={sheetDuration <= 0 || !selectedTrack.audioUrl}
                  onValueChange={(v) => {
                    const a = getSubliminalAudioElement();
                    if (a && v[0] != null) {
                      a.currentTime = v[0];
                      setSheetTime(v[0]);
                    }
                  }}
                  className={subSliderClass}
                />
                <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{formatTime(Math.floor(sheetTime))}</span>
                  <span>{formatTime(Math.floor(sheetDuration || 0))}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="rounded-full h-14 w-14"
                  onClick={() => void toggleTrackPlayback(selectedTrack)}
                  disabled={!selectedTrack.audioUrl}
                  aria-label={playingTrackId === selectedTrack.id ? t("subliminal.pause") : t("subliminal.play")}
                >
                  {playingTrackId === selectedTrack.id ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant={isLooping[selectedTrack.id] ? "default" : "ghost"}
                  size="sm"
                  disabled={!tier}
                  onClick={() => toggleLoop(selectedTrack.id)}
                  className={cn(
                    isLooping[selectedTrack.id] && "bg-green-600 hover:bg-green-600",
                    !isLooping[selectedTrack.id] && subGhostBtn,
                  )}
                >
                  <Repeat className="mr-1 h-4 w-4" />
                  Loop
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-500/40"
                  onClick={() => handleDeleteClick(selectedTrack.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
      )}

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("subliminal.deleteTrack")}</DialogTitle>
            <DialogDescription>
              {t("subliminal.deleteDescription", {
                name: displayTrackName(tracks.find((tr) => tr.id === trackToDelete)?.name ?? ""),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setTrackToDelete(null);
              }}
            >
              {t("common:cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={deleteTrack}
              className="bg-red-500 hover:bg-red-600"
            >
              {t("subliminal.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    );
  }

  if (flowStep === "step1") {
    return (
      <>
      <Card className={cn("animate-fade-in", flowStepCardClass)}>
        <CardHeader>
          <CardTitle className="text-lg font-bold">{t("subliminal.vocalBase")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("subliminal.nameYourTrack")}</Label>
            <Input
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder={t("subliminal.trackNamePlaceholder")}
              maxLength={60}
              className={cn("text-base", vocalInputSelectClass)}
            />
          </div>

          <div className="space-y-4">
            <Tabs defaultValue="freestyle" className="w-full">
              <TabsList className={vocalTabsListClass}>
                <TabsTrigger value="freestyle" className={cn(vocalTabsTriggerClass, "flex-1")}>
                  {t("subliminal.freestyle")}
                </TabsTrigger>
                <TabsTrigger value="read" className={cn(vocalTabsTriggerClass, "flex-1")}>
                  {t("subliminal.karaoke")}
                </TabsTrigger>
                <TabsTrigger
                  value="generate"
                  className={cn(
                    vocalTabsTriggerClass,
                    "flex flex-[1.5] items-center justify-center gap-1.5",
                  )}
                >
                  <span>{t("subliminal.textToSpeech")}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="freestyle" className="space-y-4">
                <VocalBaseControlBar
                  compact={isMobile}
                  innerSetupSurface={innerSetupSurface}
                  buttonShellClass={isMobile ? innerSetupShell : innerSetupShellLg}
                  vocalShellChrome={vocalShellChrome}
                  micIdleClass={micIdleClass}
                  vocalPlayOutlineClass={vocalPlayOutlineClass}
                  isRecording={isRecording}
                  onRecordClick={handleRecordClick}
                  onTogglePlayback={togglePlayback}
                  hasAudio={!!audioBlob}
                  isPlaying={isPlaying}
                  waveformHeights={waveformHeights}
                  recordingTime={recordingTime}
                  formatTime={formatTime}
                />
              </TabsContent>

              <TabsContent value="read" className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("subliminal.selectAffirmationSet")}</Label>
                  <Select value={selectedAffirmationSet} onValueChange={handleAffirmationSetChange}>
                    <SelectTrigger className={cn(vocalInputSelectClass)}>
                      <SelectValue placeholder={t("subliminal.chooseAffirmationSet")} />
                    </SelectTrigger>
                    <SelectContent className={cn("z-50", subMenuSurface || "bg-background")}>
                      {allAffirmationSets.map((set: AffirmationSet, index: number) => (
                        <SelectItem key={`${set.id}-${index}`} value={set.id}>
                          {set.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {displayedAffirmations.length > 0 && (
                  <>
                    <div
                      className={cn(
                        "max-h-[180px] overflow-y-auto rounded-lg border p-4",
                        isCosmic ? "border-white/12 bg-transparent" : "border-border/60 bg-muted/25",
                      )}
                    >
                      <h3 className="mb-3 text-sm font-semibold text-foreground">{t("subliminal.readAndRecord")}</h3>
                      <div className="space-y-2">
                        {displayedAffirmations.map((affirmation, index) => (
                          <p key={index} className="text-sm leading-relaxed animate-fade-in">
                            {index + 1}. {affirmation}
                          </p>
                        ))}
                      </div>
                    </div>

                    <VocalBaseControlBar
                      compact={isMobile}
                      innerSetupSurface={innerSetupSurface}
                      buttonShellClass={isMobile ? innerSetupShell : innerSetupShellLg}
                      vocalShellChrome={vocalShellChrome}
                      micIdleClass={micIdleClass}
                      vocalPlayOutlineClass={vocalPlayOutlineClass}
                      isRecording={isRecording}
                      onRecordClick={handleRecordClick}
                      onTogglePlayback={togglePlayback}
                      hasAudio={!!audioBlob}
                      isPlaying={isPlaying}
                      waveformHeights={waveformHeights}
                      recordingTime={recordingTime}
                      formatTime={formatTime}
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="generate" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("subliminal.generateVoiceHint")}
                </p>
                <div className="space-y-2">
                  <Label>{t("subliminal.selectAffirmationSet")}</Label>
                  <Select value={selectedAffirmationSet} onValueChange={handleAffirmationSetChange}>
                    <SelectTrigger className={cn(vocalInputSelectClass)}>
                      <SelectValue placeholder={t("subliminal.chooseAffirmationSet")} />
                    </SelectTrigger>
                    <SelectContent className={cn("z-50", subMenuSurface || "bg-background")}>
                      {allAffirmationSets.map((set: AffirmationSet, index: number) => (
                        <SelectItem key={`${set.id}-${index}`} value={set.id}>
                          {set.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {displayedAffirmations.length > 0 && (
                  <>
                    <div
                      className={cn(
                        "rounded-lg border p-3 text-xs text-muted-foreground",
                        isCosmic ? "border-white/12 bg-transparent" : "border-border/60 bg-muted/25",
                      )}
                    >
                      {t("subliminal.willGenerate", { count: displayedAffirmations.length })}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={generateAffirmationAudio}
                        disabled={isGeneratingTTS}
                        className={cn("flex-1", vocalRowActionBtn)}
                      >
                        {isGeneratingTTS ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("subliminal.generating")}
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {t("subliminal.generateAudio")}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={togglePlayback}
                        variant="outline"
                        disabled={!audioBlob}
                        className={cn("flex-1", vocalPlayOutlineClass)}
                      >
                        {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isPlaying ? t("subliminal.pause") : t("subliminal.play")}
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setFlowStep("list")} className={cn("flex-1", subGhostBtn)}>
              {t("common:cancel")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleNextFromStep1}
              disabled={!trackName.trim() || !audioBlob}
              className={cn("flex-1", subGhostBtn)}
            >
              {t("subliminal.next")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {t("subliminal.step1Disclaimer")}
      </p>
      </>
    );
  }

  if (flowStep === "step2") {
    return (
      <Card className={cn("animate-fade-in", flowStepCardClass)}>
        <CardHeader>
          <CardTitle className="text-lg font-bold">{t("subliminal.binauralBeats")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("subliminal.frequencyType")}</Label>
            <Select value={binauralBeat} onValueChange={setBinauralBeat}>
              <SelectTrigger className={cn(vocalInputSelectClass)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={subMenuSurface}>
                {binauralBeats.map(beat => (
                  <SelectItem key={beat.value} value={beat.value}>
                    {beat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {binauralBeat === "theta" && (
              <p className={theme === "dark" ? "text-xs font-semibold text-white" : "text-xs font-semibold text-foreground"}>
                {t("subliminal.thetaRecommended")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {binauralBeats.find(b => b.value === binauralBeat)?.desc}
            </p>
          </div>

          {binauralBeat !== "none" && (
            <p className="text-xs text-muted-foreground italic">
              {t("subliminal.frequenciesNote")}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setFlowStep("step1")} className={cn("flex-1", subGhostBtn)}>
              {t("subliminal.back")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleNextFromStep2} className={cn("flex-1", subGhostBtn)}>
              {t("subliminal.next")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flowStep === "step3") {

    return (
      <Card className={cn("animate-fade-in", flowStepCardClass)}>
        <CardHeader>
          <CardTitle>{t("subliminal.subliminalSettings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label className="text-sm">{t("subliminal.affirmationVolume")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">{Math.round(affirmationVolume[0] * 100)}%</span>
            </div>
            <Slider
              value={affirmationVolume}
              onValueChange={(value) => {
                setAffirmationVolume(value);
                if (audioRef.current) {
                  // Halve the volume: slider 100% = actual 50%
                  audioRef.current.volume = value[0] * 0.5;
                }
              }}
              min={0}
              max={1}
              step={0.01}
              className={subSliderClass}
            />
            <p className={cn("text-[11px] leading-tight", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
              {t("subliminal.voiceNotAudible")}
            </p>
          </div>

          {binauralBeat !== "none" && (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label className="text-sm">{t("subliminal.binauralVolume")}</Label>
                <span className="text-xs text-muted-foreground tabular-nums">{Math.round(binauralVolume[0] * 100)}%</span>
              </div>
              <Slider
                value={binauralVolume}
                onValueChange={setBinauralVolume}
                min={0}
                max={1}
                step={0.05}
                className={subSliderClass}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("subliminal.backgroundVolume", { percent: Math.round(backgroundVolume[0] * 100) })}</Label>
            <Slider
              value={backgroundVolume}
              onValueChange={setBackgroundVolume}
              min={0.3}
              max={1}
              step={0.1}
              className={subSliderClass}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("subliminal.backgroundSound")}</Label>
            <Select
              value={backgroundSound || BACKGROUND_SOUND_UNSET}
              onValueChange={(value) => setBackgroundSound(value === BACKGROUND_SOUND_UNSET ? "" : value)}
            >
              <SelectTrigger className={cn(vocalInputSelectClass)}>
                <SelectValue placeholder={t("subliminal.selectBackgroundSound")} />
              </SelectTrigger>
              <SelectContent className={subMenuSurface}>
                <SelectItem value={BACKGROUND_SOUND_UNSET} disabled className="hidden">
                  {t("subliminal.selectBackgroundSound")}
                </SelectItem>
                {safeBackgroundSounds.map((sound: any) => (
                  <SelectItem 
                    key={sound.value} 
                    value={sound.value}
                  >
                    {sound.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground leading-snug">
              {t("subliminal.createOwnBackground")}{" "}
              <button
                type="button"
                onClick={() => {
                  if (confirm(t("subliminal.openBackgroundsConfirm"))) {
                    navigate("/dashboard/music-composer");
                  }
                }}
                className="text-primary underline hover:text-primary/80"
              >
                {t("subliminal.openSubliminalBackgrounds")}
              </button>
              {t("subliminal.loseProgress")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("subliminal.affirmationLayers", { count: layerCount[0] })}</Label>
            <Slider
              value={layerCount}
              onValueChange={setLayerCount}
              min={1}
              max={7}
              step={1}
              className={subSliderClass}
            />
            <p className={cn("text-[11px] leading-tight", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{t("subliminal.layersRecommended")}</p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("subliminal.trackLength", { minutes: trackLength[0] })}</Label>
            <Slider
              value={trackLength}
              onValueChange={(value) => {
                const maxAllowed = tierLimits.maxAudioLengthMinutes;
                if (value[0] > maxAllowed) {
                  setTrackLength([maxAllowed]);
                  toast.error(t("subliminal.toasts.maxTrackLength", { max: maxAllowed }));
                  return;
                }
                setTrackLength(value);
              }}
              min={1}
              max={15}
              step={1}
              className={cn(subSliderClass, "py-1")}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setFlowStep("step2")} className={cn("flex-1", subGhostBtn)}>
              {t("subliminal.back")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleGenerateTrack} className={cn("flex-1", subGhostBtn)}>
              {t("subliminal.createTrack")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

