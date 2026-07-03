import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Mic, Play, Pause, Music, Brain, Sparkles, ChevronDown, Loader2, Square, Trash2, Plus, Music2, Clock, Settings2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import type { AffirmationSet } from "@/lib/affirmations-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSubliminalFlow } from "./SubliminalAudioMobile";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { useUserTier } from "@/hooks/useUserTier";
import { getTierLimits, hasFeatureAccess } from "@/lib/featureGating";
import { cn } from "@/lib/utils";
import {
  getSubliminalPlayerState,
  clearSubliminalActiveTrackId,
  detachSubliminalPlayback,
  pauseSubliminal,
  playSubliminalUrl,
  subscribeSubliminalPlayer,
} from "@/lib/subliminalPlayer";
import { getLocalizedPremadeSets } from "@/lib/affirmations-data";
import { Capacitor } from "@capacitor/core";
import { useTheme } from "@/contexts/ThemeContext";
import { localizeEdgeErrorMessage } from "@/lib/error-utils";
import { STARTER_SUBLIMINAL_NAMES } from "@/lib/postPaywallProvisioning";

interface SubliminalTrack {
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

function SubliminalAudio() {
  const { t, i18n } = useTranslation("tools");
  const { t: tCommon } = useTranslation("common");
  const displayTrackName = (name: string) =>
    STARTER_SUBLIMINAL_NAMES.includes(name) ? t("subliminal.starterSubliminalName") : name;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const { user, session, isLoading: authLoading } = useAuth();
  const { tier, status } = useUserTier();
  const planGate = { tier, status };
  const tierLimits = getTierLimits(planGate);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [affirmationVolume, setAffirmationVolume] = useState([0.07]); // Subliminal affirmation level (7%)
  const [binauralVolume, setBinauralVolume] = useState([0.07]); // 7% default
  const [backgroundVolume, setBackgroundVolume] = useState([1.0]);
  const [binauralBeat, setBinauralBeat] = useState("theta");
  const [backgroundSound, setBackgroundSound] = useState("");
  const [layerCount, setLayerCount] = useState([1]);
  const [trackLength, setTrackLength] = useState([5]); // in minutes
  const [trackName, setTrackName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Stale-while-revalidate: hydrate the user's tracks from sessionStorage so re-entering
   * the Subliminal Maker within a session shows the list immediately instead of an empty
   * grid that fills in 300–800ms after the round-trip to Supabase + storage.list.
   * Signed URLs in the cache stay valid because sessionStorage clears with the app
   * session, well within the 8h signed-URL expiry written by loadTracks below.
   */
  const subliminalTracksCacheKey = user?.id ? `subliminalTracks_${user.id}` : null;
  const [tracks, setTracks] = useState<SubliminalTrack[]>(() => {
    if (typeof window === "undefined" || !subliminalTracksCacheKey) return [];
    try {
      const raw = sessionStorage.getItem(subliminalTracksCacheKey);
      if (!raw) return [];
      const cached = JSON.parse(raw) as Array<Omit<SubliminalTrack, "createdAt"> & { createdAt: string }>;
      if (!Array.isArray(cached)) return [];
      return cached.map((t) => ({ ...t, createdAt: new Date(t.createdAt) }));
    } catch {
      return [];
    }
  });
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [mobileFlowStep, setMobileFlowStep] = useState<"list" | "step1" | "step2" | "step3">("list");
  // Skip the spinner on re-entry when sessionStorage already has the track list.
  // loadTracks() still runs in the background to revalidate.
  const [isLoadingTracks, setIsLoadingTracks] = useState(() => {
    if (typeof window === "undefined" || !subliminalTracksCacheKey) return true;
    return !sessionStorage.getItem(subliminalTracksCacheKey);
  });
  const [storageUsedMB, setStorageUsedMB] = useState<number>(0);
  const [weeklyGenerations, setWeeklyGenerations] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);
  const [userBackgroundTracks, setUserBackgroundTracks] = useState<Array<{ id: string; name: string; audio_url: string }>>([]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = t("subliminal.pageTitle");
    return () => {
      document.title = prevTitle;
    };
  }, []);

  useEffect(() => {
    if (!authLoading && user === null) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Constrain trackLength to tier limit when tier loads
  useEffect(() => {
    if (tierLimits.maxAudioLengthMinutes && trackLength[0] > tierLimits.maxAudioLengthMinutes) {
      setTrackLength([tierLimits.maxAudioLengthMinutes]);
    }
  }, [tierLimits.maxAudioLengthMinutes, trackLength]);

  // Load tracks from database - requires user to be logged in
  const loadTracks = useCallback(async () => {
    if (!user || !session) {
      console.warn("Cannot load tracks: user not logged in");
      setTracks([]);
      setIsLoadingTracks(false);
      return;
    }

    try {
      // Don't set loading state if we already have tracks - preserve them during reload
      if (tracks.length === 0) {
        setIsLoadingTracks(true);
      }
      
      // Try to get fresh session, but fall back to context session if getUser fails
      // This ensures auth.uid() works in RLS
      const currentSession = session;
      const currentUser = user;

      if (!currentSession || !currentSession.access_token || !currentUser) {
        if (import.meta.env.DEV) {
          console.warn("No valid session found");
        }
        setTracks([]);
        setIsLoadingTracks(false);
        return;
      }
      
      // Load from database - RLS will automatically filter by auth.uid() = user_id
      // Don't filter by user_id manually - let RLS handle it
      // Use 'as any' to bypass TypeScript type checking for tables not in generated types
      const { data: dbTracks, error } = await (supabase as any)
        .from('subliminal_tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading tracks from database:", error);
        // Check for RLS policy errors
        if (error.message?.includes('row-level security') || error.message?.includes('RLS') || error.code === '42501') {
          toast.error(t("subliminal.toasts.permissionDenied"));
        } else if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          toast.error(t("subliminal.toasts.genericError"));
        } else {
          toast.error(t("subliminal.toasts.loadFailed", { message: localizeEdgeErrorMessage(error.message, tCommon) }));
        }
        setTracks([]);
        return;
      }

      if (dbTracks && dbTracks.length > 0) {
        // Get file sizes from storage
        let fileSizes: Map<string, number> = new Map();
        try {
          const { data: files, error: listError } = await supabase.storage
            .from('subliminal-tracks')
            .list(user.id, {
              limit: 1000,
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (!listError && files) {
            files.forEach((file: any) => {
              const fileSizeBytes = file.metadata?.size || 0;
              const fileSizeMB = fileSizeBytes / (1024 * 1024);
              // Store by filename (which matches the path after user_id/)
              fileSizes.set(file.name, fileSizeMB);
            });
          }
        } catch (storageError) {
          console.warn("Could not fetch file sizes:", storageError);
        }

        const formattedTracks: SubliminalTrack[] = await Promise.all(
          dbTracks.map(async (track: any) => {
            // Extract filename from audio_url to match with storage files
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
                
                // Create signed URL for private bucket access (40 minute expiry)
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
              fileSizeMB,
            };
          })
        );
        console.log("Loaded", formattedTracks.length, "tracks from database");
        setTracks(formattedTracks);
        if (typeof window !== "undefined" && user?.id) {
          try {
            sessionStorage.setItem(
              `subliminalTracks_${user.id}`,
              JSON.stringify(
                formattedTracks.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
              ),
            );
          } catch {
            /* sessionStorage may be unavailable in some PWA contexts */
          }
        }
      } else {
        console.log("No tracks found in database");
        setTracks([]);
        if (typeof window !== "undefined" && user?.id) {
          try {
            sessionStorage.setItem(`subliminalTracks_${user.id}`, JSON.stringify([]));
          } catch {
            /* ignore */
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading tracks:", error);
      const errorMessage = localizeEdgeErrorMessage(error?.message, tCommon);
      if (error?.message?.includes('row-level security') || error?.message?.includes('RLS')) {
        toast.error(t("subliminal.toasts.permissionDenied"));
      } else {
        toast.error(t("subliminal.toasts.loadFailed", { message: errorMessage }));
      }
      setTracks([]);
    } finally {
      setIsLoadingTracks(false);
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const loadStorageStats = useCallback(async () => {
    if (!user?.id || authLoading) {
      return;
    }

    try {
      setIsLoadingStats(true);

      let totalStorageMB = 0;
      const persistedTracks = tracksRef.current.filter((track) => !track.isGenerating);
      if (persistedTracks.length > 0) {
        totalStorageMB = persistedTracks.reduce((sum: number, track: SubliminalTrack) => {
          return sum + (track.fileSizeMB || 0);
        }, 0);
      }
      setStorageUsedMB(totalStorageMB);

      const { data: countData, error: logError } = await (supabase as any)
        .rpc('get_weekly_generation_count', { p_user_id: user.id });

      if (logError) {
        console.error("Error loading weekly generation count:", logError);
      } else {
        setWeeklyGenerations(countData || 0);
      }
    } catch (error) {
      console.error("Error loading storage stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (user?.id && !authLoading) {
      void loadStorageStats();
    }
  }, [user?.id, authLoading, loadStorageStats]);

  const [selectedAffirmationSet, setSelectedAffirmationSet] = useState<string>("");
  const [displayedAffirmations, setDisplayedAffirmations] = useState<string[]>([]);
  const [affirmationMode, setAffirmationMode] = useState<"freestyle" | "read" | "generate">("freestyle");
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  // Saved-track playback uses a shared singleton player to prevent duplicate audio instances.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const binauralBeatValues = ["none", "delta", "theta", "alpha", "beta", "gamma"] as const;
  const binauralBeats = useMemo(
    () =>
      binauralBeatValues.map((value) => ({
        value,
        label: t(`subliminal.binauralBeatsOptions.${value}.label`),
        desc: t(`subliminal.binauralBeatsOptions.${value}.desc`),
      })),
    [i18n.resolvedLanguage, t],
  );

  // Load user background tracks
  useEffect(() => {
    const loadUserTracks = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_background_tracks' as any)
          .select('id, name, audio_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading user tracks:', error);
          return;
        }

        if (data && !error) {
          setUserBackgroundTracks((data as unknown as Array<{ id: string; name: string; audio_url: string }>) || []);
        }
      } catch (error) {
        console.error('Error loading user tracks:', error);
      }
    };

    loadUserTracks();
  }, [user]);

  // Background sounds - All from /public/sounds/ folder (value = filename with extension)
  // User tracks are prefixed with "user:" followed by the track ID
  // Use useMemo to prevent recreation on every render
  const backgroundSounds = useMemo(
    () => [
      { value: "none", label: t("subliminal.backgroundSounds.none") },
      { value: "City Corner.wav", label: t("subliminal.backgroundSounds.cityCorner") },
      { value: "Fireplace.wav", label: t("subliminal.backgroundSounds.fireplace") },
      { value: "Gold Coins.wav", label: t("subliminal.backgroundSounds.goldCoins") },
      { value: "Nature Park.wav", label: t("subliminal.backgroundSounds.naturePark") },
      { value: "Ocean v2.WAV", label: t("subliminal.backgroundSounds.ocean") },
      { value: "Rain v2.WAV", label: t("subliminal.backgroundSounds.rain") },
      ...(userBackgroundTracks || []).map((track) => ({
        value: `user:${track.id}`,
        label: t("subliminal.customSound", { name: track.name }),
      })),
    ],
    [userBackgroundTracks, i18n.resolvedLanguage, t],
  );

  // Load user-created affirmation sets from (SSOT: Affirmations.tsx)
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

      // Store for selection (used by both desktop and mobile)
      (window as any).allAffirmationSets = allSets;
    };

    loadAffirmationSets();
  }, [user]);

  // Handle affirmation set selection
  const handleAffirmationSetChange = (setId: string) => {
    setSelectedAffirmationSet(setId);
    const allSets = (window as any).allAffirmationSets || getLocalizedPremadeSets();
    const selected = allSets.find((s: AffirmationSet) => s.id === setId);
    if (selected) {
      setDisplayedAffirmations(selected.affirmations);
    } else {
      setDisplayedAffirmations([]);
    }
  };

  const generateAffirmationAudio = async () => {
    if (!selectedAffirmationSet || displayedAffirmations.length === 0) {
      toast.error(t("subliminal.toasts.selectAffirmationSetFirst"));
      return;
    }

    // Check tier access for TTS feature (premium only)
    if (!hasFeatureAccess(planGate, 'text_to_speech')) {
      toast.error(t("subliminal.toasts.ttsUpgrade"));
      return;
    }

    // Check 480 character limit for TTS (premium feature)
    const totalText = displayedAffirmations.join(' ');
    if (totalText.length > 480) {
      toast.error(t("subliminal.toasts.ttsCharLimit", { length: totalText.length }));
      return;
    }

    setIsGeneratingTTS(true);
    
    try {
      // Removed console.log to reduce console noise
      
      // Get session for authentication
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error(t("subliminal.toasts.loginToGenerate"));
      }

      // Use fetch directly to get error response body
      // This allows us to read the error message even when status is non-2xx
      const supabaseUrl = SUPABASE_URL;
      const supabaseKey = SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-affirmation-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          affirmations: displayedAffirmations,
          voice: 'nova' // Calm, soothing voice for affirmations
        })
      });

      // Parse response body regardless of status
      let responseData: any = null;
      let responseText = '';
      try {
        responseText = await response.text();
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            // Not JSON, that's okay
            console.log('Response is not JSON:', responseText.substring(0, 100));
          }
        }
      } catch (parseError) {
        console.error('Failed to read response:', parseError);
      }

      if (!response.ok) {
        // Extract error message from response - be very careful to avoid circular references
        let errorMsg = t("subliminal.toasts.serverError", { status: response.status });
        
        try {
          if (responseData && typeof responseData === 'object' && responseData !== null) {
            // Safely check for error property
            const errorProp = Object.prototype.hasOwnProperty.call(responseData, 'error') 
              ? responseData.error 
              : null;
            const messageProp = Object.prototype.hasOwnProperty.call(responseData, 'message')
              ? responseData.message
              : null;
            
            if (typeof errorProp === 'string' && errorProp.length < 500) {
              errorMsg = errorProp;
            } else if (typeof messageProp === 'string' && messageProp.length < 500) {
              errorMsg = messageProp;
            }
          } else if (typeof responseText === 'string' && responseText.length < 500 && responseText.length > 0) {
            // If response is plain text, use it (but limit length)
            errorMsg = responseText.substring(0, 500);
          }
        } catch (e) {
          // If accessing properties causes issues, use default message
          // Don't log as it might cause more issues
        }
        
        // Create error with simple string message
        const errorString = String(errorMsg);
        throw new Error(errorString);
      }

      // Handle function-level errors (returned in data.error)
      if (responseData && typeof responseData === 'object' && responseData.error) {
        let errorText = 'Unknown error';
        try {
          if (typeof responseData.error === 'string') {
            errorText = responseData.error;
          } else if (responseData.error && typeof responseData.error === 'object' && typeof responseData.error.message === 'string') {
            errorText = responseData.error.message;
          }
        } catch (e) {
          console.error('Error extracting error text:', e);
        }
        console.error('Function returned error:', errorText);
        throw new Error(String(errorText));
      }

      if (responseData?.audioContent) {
        // Convert base64 to blob efficiently
        try {
          const binaryString = atob(responseData.audioContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          setAudioBlob(blob);
          toast.success(t("subliminal.toasts.voiceGenerated"));
        } catch (conversionError) {
          console.error('Error converting base64 to blob:', conversionError);
          throw new Error(t("subliminal.toasts.processAudioFailed"));
        }
      } else {
        throw new Error(t("subliminal.toasts.noAudioContent"));
      }
      
      setIsGeneratingTTS(false);
    } catch (err: unknown) {
      // Safely extract error message to avoid stack overflow
      // Don't access error.message directly as it might have circular references
      let errorMessage = t("subliminal.toasts.generateAudioFailed");
      
      try {
        // Try to get error message safely
        if (err instanceof Error) {
          const msg = err.message;
          if (msg && typeof msg === 'string' && msg.length < 1000) {
            errorMessage = msg;
          }
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
      } catch (e) {
        // If anything goes wrong, use default message
        // Don't try to log the error as it might cause more issues
      }
      
      console.error('TTS error message:', errorMessage);
      toast.error(localizeEdgeErrorMessage(errorMessage, tCommon));
      setIsGeneratingTTS(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine best MIME type for recording
      let mimeType = 'audio/webm';
      const options: MediaRecorderOptions = {};
      
      // Check for supported MIME types
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }
      
      options.mimeType = mimeType;
      // Record in chunks for better reliability
      options.audioBitsPerSecond = 128000;

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch {
        // Android WebView often rejects explicit mimeType; fall back to platform default.
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          toast.error(t("subliminal.toasts.recordingNoData"));
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        const blobType =
          (mediaRecorderRef.current?.mimeType && mediaRecorderRef.current.mimeType.length > 0)
            ? mediaRecorderRef.current.mimeType
            : mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
        
        if (audioBlob.size === 0) {
          toast.error(t("subliminal.toasts.recordingEmpty"));
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        toast.success(t("subliminal.toasts.recordingSaved"));
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        toast.error(t("subliminal.toasts.recordingError"));
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      // Start recording with timeslice for better reliability
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      toast.success(t("subliminal.toasts.recordingStarted"));
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      let errorMsg = t("subliminal.toasts.micAccessPrefix");
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg += Capacitor.isNativePlatform()
          ? t("subliminal.toasts.micAndroidSettings")
          : t("subliminal.toasts.micBrowserSettings");
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg += t("subliminal.toasts.noMicrophone");
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg += t("subliminal.toasts.micInUse");
      } else {
        errorMsg += error.message || t("subliminal.toasts.micCheckSettings");
      }
      
      toast.error(errorMsg);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success(t("subliminal.toasts.recordingStopped"));
    }
  };


  const togglePlayback = async () => {
    if (!audioBlob) {
      toast.error(t("subliminal.toasts.noAudioToPlay"));
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      // On mobile, also clean up DOM audio element
      if (isMobile) {
        const domAudio = document.getElementById('mobile-audio-playback') as HTMLAudioElement;
        if (domAudio) {
          domAudio.pause();
          domAudio.onerror = null;
          domAudio.src = '';
        }
      }
      audioRef.current = null;
      // Clean up object URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setIsPlaying(false);
    } else {
      try {
        // Clean up previous audio if it exists
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }

        // Validate blob
        if (audioBlob.size === 0) {
          toast.error(t("subliminal.toasts.audioEmpty"));
          return;
        }

        // Ensure blob type is set correctly for playback
        // On mobile, preserve the original type from recording (iOS uses audio/mp4, Android uses audio/webm)
        let blobToUse = audioBlob;
        if (!audioBlob.type || audioBlob.type === 'application/octet-stream') {
          // Try to detect format - mobile devices may use different formats
          // iOS Safari typically uses audio/mp4, Android uses audio/webm
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const defaultType = isIOS ? 'audio/mp4' : 'audio/webm';
          blobToUse = new Blob([audioBlob], { type: defaultType });
          console.log('[Mobile Playback] Using default type:', defaultType, 'for device:', navigator.userAgent);
        } else {
          // Removed verbose logging
        }
        
        // Validate blob size
        if (blobToUse.size === 0) {
          toast.error(t("subliminal.toasts.audioEmpty"));
          return;
        }
        
        const audioUrl = URL.createObjectURL(blobToUse);
        audioUrlRef.current = audioUrl;
        
        // On mobile, use a DOM audio element for better compatibility
        let audio: HTMLAudioElement;
        if (isMobile) {
          // Create or get existing audio element in DOM for mobile
          let audioElement = document.getElementById('mobile-audio-playback') as HTMLAudioElement;
          if (!audioElement) {
            audioElement = document.createElement('audio');
            audioElement.id = 'mobile-audio-playback';
            audioElement.style.display = 'none';
            audioElement.setAttribute('playsinline', 'true');
            audioElement.setAttribute('webkit-playsinline', 'true');
            document.body.appendChild(audioElement);
          }
          audioElement.src = audioUrl;
          // Halve the volume: slider 100% = actual 50%
          audioElement.volume = affirmationVolume[0] * 0.5;
          audioElement.preload = 'auto';
          audio = audioElement;
          audioRef.current = audio;
        } else {
          // Desktop: use Audio API
          audio = new Audio(audioUrl);
          audioRef.current = audio;
          // Halve the volume: slider 100% = actual 50%
          audio.volume = affirmationVolume[0] * 0.5;
          audio.preload = 'auto';
        }
        
        // Set crossOrigin for external URLs (if needed)
        if (audioUrl.startsWith('http')) {
          audio.crossOrigin = 'anonymous';
        }
        
        // Set up event handlers before attempting to play
        audio.onended = () => {
          setIsPlaying(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          // On mobile, clean up DOM audio element
          if (isMobile) {
            const domAudio = document.getElementById('mobile-audio-playback') as HTMLAudioElement;
            if (domAudio) {
              domAudio.onerror = null;
              domAudio.src = '';
            }
          }
          audioRef.current = null;
        };
        
        audio.onerror = (e) => {
          console.error('Audio playback error:', e, audio.error);
          const errorMsg = audio.error 
            ? t("subliminal.toasts.audioError", { code: audio.error.code, message: audio.error.message })
            : t("subliminal.toasts.audioUnsupported");
          toast.error(errorMsg);
          setIsPlaying(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          // On mobile, clean up DOM audio element
          if (isMobile) {
            const domAudio = document.getElementById('mobile-audio-playback') as HTMLAudioElement;
            if (domAudio) {
              domAudio.onerror = null;
              domAudio.src = '';
            }
          }
          audioRef.current = null;
        };

        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
          const onCanPlay = () => {
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('loadeddata', onLoadedData);
            audio.removeEventListener('error', onError);
            resolve(undefined);
          };
          
          const onCanPlayThrough = () => {
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('loadeddata', onLoadedData);
            audio.removeEventListener('error', onError);
            resolve(undefined);
          };
          
          const onLoadedData = () => {
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('loadeddata', onLoadedData);
            audio.removeEventListener('error', onError);
            resolve(undefined);
          };
          
          const onError = () => {
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('canplaythrough', onCanPlayThrough);
            audio.removeEventListener('loadeddata', onLoadedData);
            audio.removeEventListener('error', onError);
            reject(new Error('Audio failed to load'));
          };
          
          // Check if already ready
          if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
            resolve(undefined);
          } else {
            audio.addEventListener('canplay', onCanPlay);
            audio.addEventListener('canplaythrough', onCanPlayThrough);
            audio.addEventListener('loadeddata', onLoadedData);
            audio.addEventListener('error', onError);
            
            // Timeout after 30 seconds (increased for large files)
            setTimeout(() => {
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('canplaythrough', onCanPlayThrough);
              audio.removeEventListener('loadeddata', onLoadedData);
              audio.removeEventListener('error', onError);
              if (audio.readyState >= 2) {
                resolve(undefined);
              } else {
                reject(new Error('Audio loading timeout - file may be too large or network is slow'));
              }
            }, 30000);
          }
        });
        
        // Now attempt to play - mobile browsers require user interaction
        try {
          // On mobile, ensure audio can play by setting volume and checking readyState
          // Mobile devices (especially iOS) need more time to load
          if (audio.readyState < 2) {
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                // On mobile, sometimes readyState doesn't update but audio can still play
                // Removed verbose logging
                resolve(undefined);
              }, 2000); // Increased timeout for mobile
              
              const onCanPlay = () => {
                clearTimeout(timeout);
                audio.removeEventListener('canplay', onCanPlay);
                audio.removeEventListener('loadeddata', onLoadedData);
                audio.removeEventListener('error', onError);
                // Removed verbose logging
                resolve(undefined);
              };
              
              const onLoadedData = () => {
                clearTimeout(timeout);
                audio.removeEventListener('canplay', onCanPlay);
                audio.removeEventListener('loadeddata', onLoadedData);
                audio.removeEventListener('error', onError);
                // Removed verbose logging
                resolve(undefined);
              };
              
              const onError = () => {
                clearTimeout(timeout);
                audio.removeEventListener('canplay', onCanPlay);
                audio.removeEventListener('loadeddata', onLoadedData);
                audio.removeEventListener('error', onError);
                reject(new Error('Audio failed to load'));
              };
              
              audio.addEventListener('canplay', onCanPlay);
              audio.addEventListener('loadeddata', onLoadedData);
              audio.addEventListener('error', onError);
            });
          }
          
          // Mobile browsers require user interaction - the button click should provide this
          // Removed verbose logging
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
          setIsPlaying(true);
          // Removed verbose logging
          toast.success(t("subliminal.toasts.playingAudio"));
        } catch (playError: any) {
          console.error('[Mobile Playback] Play error:', playError);
          throw playError; // Re-throw to be caught by outer catch
        }
      } catch (error: any) {
        console.error('[Mobile Playback] Error playing audio:', error, 'Error name:', error.name, 'Error code:', error.code);
        let errorMsg = t("subliminal.toasts.playFailedPrefix");
        
        if (error.name === 'NotAllowedError' || error.code === 0) {
          errorMsg += t("subliminal.toasts.tapPlayAgain");
        } else if (error.name === 'NotSupportedError' || error.code === 4) {
          errorMsg += t("refactor.toasts.tryAgain");
        } else if (error.message?.includes('timeout')) {
          errorMsg += t("subliminal.toasts.loadTimeout");
        } else if (error.message?.includes('load')) {
          errorMsg += t("subliminal.toasts.audioLoadFailed");
        } else {
          errorMsg += error.message || t("subliminal.toasts.tapAgain");
        }
        
        // Log additional info for debugging on mobile
        if (isMobile) {
          // Removed verbose logging
        }
        
        toast.error(errorMsg);
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current = null;
        }
        // On mobile, clean up DOM audio element
        if (isMobile) {
          const domAudio = document.getElementById('mobile-audio-playback') as HTMLAudioElement;
          if (domAudio) {
            domAudio.pause();
            domAudio.src = '';
          }
        }
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      }
    }
  };

  const toggleTrackPlayback = async (track: SubliminalTrack) => {
    // If this track is already playing, stop it
    const player = getSubliminalPlayerState();
    if (
      playingTrackId === track.id &&
      player.activeTrackId === track.id &&
      player.isPlaying
    ) {
      pauseSubliminal();
      clearSubliminalActiveTrackId();
      setPlayingTrackId(null);
      return;
    }

    try {
      // Extract file path from stored URL to create signed URL (bucket is private)
      let playbackUrl = track.audioUrl;
      
      try {
        const url = new URL(track.audioUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'subliminal-tracks');
        
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          // Extract file path: user_id/filename
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          
          // Create signed URL for private bucket access
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('subliminal-tracks')
            .createSignedUrl(filePath, 28800); // 8 hour expiry
          
          if (signedUrlError || !signedUrlData) {
            console.warn("Failed to create signed URL, trying stored URL:", signedUrlError);
            // Fallback to stored URL (might work if bucket was made public)
            playbackUrl = track.audioUrl;
          } else {
            playbackUrl = signedUrlData.signedUrl;
          }
        }
      } catch (urlError) {
        // URL parsing failed, use stored URL as fallback
        console.warn("Failed to parse track URL, using stored URL:", urlError);
        playbackUrl = track.audioUrl;
      }

      // Play the new track
      try {
        await playSubliminalUrl(playbackUrl, { activeTrackId: track.id });
        setPlayingTrackId(track.id);
        toast.success(t("subliminal.toasts.playingTrack", { name: displayTrackName(track.name) }));
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
      }
    } catch (error: any) {
      console.error('Error playing track:', error);
      toast.error(error.message || t("subliminal.toasts.playTrackFailed"));
      clearSubliminalActiveTrackId();
      setPlayingTrackId(null);
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
      
      // User must be logged in to delete tracks
      if (!user) {
        toast.error(t("subliminal.toasts.loginToDelete"));
        setDeleteConfirmOpen(false);
        setTrackToDelete(null);
        return;
      }

      // Delete from storage first, then database
      // Extract file path from URL
      let storageDeleteSuccess = false;
      try {
        const url = new URL(track.audioUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'subliminal-tracks');
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          
          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from('subliminal-tracks')
            .remove([filePath]);

          if (storageError) {
            // Check if it's a 404 (file not found) - treat as success
            const isNotFound = 
              storageError.statusCode === 404 ||
              storageError.statusCode === '404' ||
              storageError.message?.toLowerCase().includes('not found') ||
              storageError.message?.toLowerCase().includes('does not exist');
            
            if (isNotFound) {
              // File already removed or doesn't exist - that's fine, continue with DB deletion
              console.log("Storage file not found (404) - treating as success");
              storageDeleteSuccess = true;
            } else {
              // Other error (permission, network, etc.) - don't delete DB row
              console.error("Error deleting from storage:", storageError);
              throw new Error(t("subliminal.toasts.deleteStorageFailed"));
            }
          } else {
            storageDeleteSuccess = true;
          }
        } else {
          // URL doesn't match expected format - skip storage deletion but continue
          console.log("Track URL is not a storage URL, skipping storage deletion");
          storageDeleteSuccess = true;
        }
      } catch (urlError) {
        // URL parsing error - skip storage deletion but continue
        console.log("Track URL is not a storage URL, skipping storage deletion");
        storageDeleteSuccess = true;
      }

      // Only delete from database if storage deletion succeeded (or was 404)
      if (!storageDeleteSuccess) {
        throw new Error(t("subliminal.toasts.deleteStorageFailed"));
      }

      // Delete from database
      // Use 'as any' to bypass TypeScript type checking for tables not in generated types
      const { error: dbError } = await (supabase as any)
        .from('subliminal_tracks')
        .delete()
        .eq('id', trackToDelete);

      if (dbError) {
        throw dbError;
      }

      // Reload tracks from database (this will update storage stats automatically via useEffect)
      await loadTracks();
      
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

  useEffect(() => {
    return subscribeSubliminalPlayer((s) => {
      if (s.activeTrackId) {
        setPlayingTrackId(s.activeTrackId);
      } else {
        setPlayingTrackId(null);
      }
    });
  }, []);

  const clearAudio = () => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Clean up object URL
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioBlob(null);
    setIsPlaying(false);
  };

  const generateSubliminalTrack = async () => {
    if (!audioBlob) {
      toast.error(t("subliminal.toasts.recordAffirmationsFirst"));
      return;
    }
    if (!trackName.trim()) {
      toast.error(t("subliminal.toasts.enterTrackName"));
      return;
    }
    if (!backgroundSound || backgroundSound.trim() === "") {
      toast.error(t("subliminal.toasts.selectBackgroundSound"));
      return;
    }

    setIsGenerating(true);

    let processor: any = null;
    try {
      // Import audio processor
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
      // Since the bucket is private, we need to create a signed URL
      let backgroundSoundUrl: string | undefined;
      if (backgroundSound.startsWith("user:")) {
        const trackId = backgroundSound.replace("user:", "");
        const userTrack = userBackgroundTracks.find(t => t.id === trackId);
        if (userTrack && userTrack.audio_url) {
          // Extract file path from stored URL to create signed URL
          try {
            const urlParts = userTrack.audio_url.split('/');
            const fileName = urlParts.slice(-2).join('/'); // user_id/filename.wav
            
            // Create a signed URL for private bucket access
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('background-tracks')
              .createSignedUrl(fileName, 600); // 10 minute expiry
            
            if (signedUrlError || !signedUrlData) {
              console.warn("Failed to create signed URL, using stored URL:", signedUrlError);
              backgroundSoundUrl = userTrack.audio_url;
            } else {
              backgroundSoundUrl = signedUrlData.signedUrl;
            }
          } catch (urlError) {
            console.warn("Failed to create signed URL, using stored URL:", urlError);
            backgroundSoundUrl = userTrack.audio_url;
          }
        }
      }

      // Generate the subliminal track first (before checking auth)
      const subliminalBlob = await processor.generateSubliminalTrack({
        affirmationBlob: audioBlob,
        binauralType: binauralBeat as any,
        binauralVolume: binauralVolume[0],
        backgroundSound: backgroundSound,
        backgroundSoundUrl: backgroundSoundUrl,
        affirmationVolume: affirmationVolume[0],
        backgroundVolume: backgroundVolume[0],
        layers: layerCount[0],
        duration: trackLength[0],
      });

      // User must be logged in to generate tracks
      if (!user) {
        toast.error(t("subliminal.toasts.loginToGenerateTrack"));
        if (processor) {
          processor.dispose();
        }
        setIsGenerating(false);
        return;
      }

      // Get fresh user from session to ensure auth.uid() matches
      // Try getSession first (more reliable), then getUser as fallback
      let currentUser = user;
      let currentSession = session;
      
      try {
        // Try getSession first - it's more reliable for checking current session
        const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && sessionData && sessionData.access_token) {
          currentSession = sessionData;
          currentUser = sessionData.user;
          if (import.meta.env.DEV) {
            console.log("Session retrieved via getSession()");
          }
        } else {
          // Fall back to getUser
          const { data: { user: freshUser, session: freshSession }, error: authError } = await supabase.auth.getUser();
          if (!authError && freshUser && freshSession && freshSession.access_token) {
            currentUser = freshUser;
            currentSession = freshSession;
            if (import.meta.env.DEV) {
              console.log("Session retrieved via getUser()");
            }
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("Could not refresh session, using context session:", error);
        }
        // Continue with context session if available
      }
      
      if (!currentUser || !currentSession || !currentSession.access_token) {
        toast.error(t("subliminal.toasts.sessionExpired"));
        if (processor) {
          processor.dispose();
        }
        setIsGenerating(false);
        return;
      }

      let newTrack: SubliminalTrack;

      // Save to cloud - user is authenticated
      // Refresh session to ensure token is valid for RLS
      // IMPORTANT: refreshSession updates the session in localStorage automatically
      // The Supabase client will use this refreshed session for subsequent requests
      let refreshedSession = currentSession;
      try {
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession(currentSession);
        if (refreshError) {
          if (import.meta.env.DEV) {
            console.warn("Session refresh warning:", refreshError);
          }
          // Continue with current session if refresh fails
        } else if (newSession && newSession.access_token) {
          refreshedSession = newSession;
          if (import.meta.env.DEV) {
            console.log("Session refreshed successfully");
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("Session refresh failed, using current session:", error);
        }
      }
      
      const userToUse = refreshedSession?.user || currentUser;
      
      // Check weekly generation limit before proceeding using database function
      const { data: currentWeeklyCount, error: weeklyCheckError } = await (supabase as any)
        .rpc('get_weekly_generation_count', { p_user_id: userToUse.id });

      if (weeklyCheckError) {
        console.error("Error checking weekly limit:", weeklyCheckError);
        toast.error(t("subliminal.toasts.weeklyCheckFailed"));
        if (processor) {
          processor.dispose();
        }
        setIsGenerating(false);
        return;
      }
      
      if (currentWeeklyCount >= tierLimits.maxGenerationsPerWeek) {
        toast.error(t("subliminal.toasts.weeklyLimitReached", {
          current: currentWeeklyCount,
          limit: tierLimits.maxGenerationsPerWeek,
        }));
        if (processor) {
          processor.dispose();
        }
        setIsGenerating(false);
        return;
      }
      
      // Check file size before uploading (using remaining storage, not total limit)
      const fileSizeMB = subliminalBlob.size / (1024 * 1024);
      const maxStorageMB = tierLimits.maxStorageMB;
      
      // Get current storage used to calculate remaining
      const currentStorageUsedMB = storageUsedMB; // Use the state value we already have
      const remainingStorageMB = maxStorageMB - currentStorageUsedMB;
      
      console.log(`Generated audio file size: ${fileSizeMB.toFixed(2)} MB`);
      console.log(`${t("subliminal.storage")} ${currentStorageUsedMB.toFixed(1)}/${maxStorageMB} MB used, ${remainingStorageMB.toFixed(1)} MB remaining`);
      
      // Check if file fits in remaining storage
      if (fileSizeMB > remainingStorageMB) {
        toast.error(t("subliminal.toasts.fileTooLargeRemaining", {
          size: fileSizeMB.toFixed(2),
          remaining: remainingStorageMB.toFixed(1),
        }));
        if (processor) {
          processor.dispose();
        }
        setIsGenerating(false);
        return;
      }
      
      // Also check against total limit as a safety measure (shouldn't happen if remaining check works)
      if (fileSizeMB > maxStorageMB) {
        toast.error(t("subliminal.toasts.fileTooLargeMax", {
          size: fileSizeMB.toFixed(2),
          max: maxStorageMB,
        }));
        if (processor) {
          processor.dispose();
        }
        setIsGenerating(false);
        return;
      }
      
      // Warn at 80% of tier limit
      const warningThreshold = maxStorageMB * 0.8;
      if (fileSizeMB > warningThreshold) {
        toast.warning(t("subliminal.toasts.fileLargeWarning", { size: fileSizeMB.toFixed(2) }));
      }
      
      // Save to database and storage if logged in
      const fileName = `${userToUse.id}/${Date.now()}_${trackName.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('subliminal-tracks')
          .upload(fileName, subliminalBlob, {
            contentType: 'audio/mpeg',
            upsert: false
          });

        if (uploadError) {
          console.error("Storage upload error details:", {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            code: uploadError.code,
            error: uploadError
          });
          
          // Check if bucket doesn't exist - be specific to avoid false positives
          const isBucketNotFound = 
            uploadError.message?.includes('Bucket not found') || 
            uploadError.message?.includes('does not exist') ||
            uploadError.statusCode === '404' ||
            uploadError.statusCode === 404 ||
            (uploadError.message?.toLowerCase().includes('bucket') && uploadError.message?.toLowerCase().includes('not found'));
          
          if (isBucketNotFound) {
            toast.error(t("subliminal.toasts.bucketNotFound"));
            console.error("Bucket error:", uploadError);
            setIsGenerating(false);
            if (processor) {
              processor.dispose();
            }
            return;
          }
          // Check for RLS policy errors
          if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS') || uploadError.code === '42501' || uploadError.code === 'PGRST301') {
            const errorMsg = "Storage permission denied.";
            console.error("Storage error:", uploadError);
            toast.error(t("subliminal.toasts.storagePermissionDenied"));
            setIsGenerating(false);
            if (processor) {
              processor.dispose();
            }
            return;
          }
          // Check for Storage bucket file size limit (413 status code)
          const isBucketSizeLimit = 
            uploadError.statusCode === '413' || 
            uploadError.statusCode === 413 ||
            uploadError.message?.toLowerCase().includes('exceeded the maximum allowed size') ||
            uploadError.message?.toLowerCase().includes('maximum allowed size');
          
          if (isBucketSizeLimit) {
            console.error("file size limit:", uploadError);
            toast.error(t("subliminal.toasts.bucketSizeLimit", {
              size: fileSizeMB.toFixed(2),
              minutes: trackLength[0],
            }));
            setIsGenerating(false);
            if (processor) {
              processor.dispose();
            }
            return;
          }
          
          // Check for other file size limit errors (tier-based)
          if (uploadError.message?.includes('exceeded') || uploadError.message?.includes('max') || uploadError.message?.includes('limit') || uploadError.message?.includes('size')) {
            const currentStorageUsedMB = storageUsedMB;
            const remainingStorageMB = tierLimits.maxStorageMB - currentStorageUsedMB;
            console.error("Tier storage limit error:", uploadError);
            toast.error(t("subliminal.toasts.tierStorageLimit", {
              size: fileSizeMB.toFixed(2),
              remaining: remainingStorageMB.toFixed(1),
              minutes: trackLength[0],
            }));
            setIsGenerating(false);
            if (processor) {
              processor.dispose();
            }
            return;
          }
          // Generic error - show the actual error message
          console.error("Storage upload failed:", uploadError);
          toast.error(uploadError.message || t("subliminal.toasts.uploadFailed"));
          setIsGenerating(false);
          if (processor) {
            processor.dispose();
          }
          return;
        }
      } catch (storageError: any) {
        console.error("Storage error:", storageError);
        // Check if bucket doesn't exist - be specific to avoid false positives
        const isBucketNotFound = 
          storageError.message?.includes('Bucket not found') || 
          storageError.message?.includes('does not exist') ||
          storageError.statusCode === '404' ||
          storageError.statusCode === 404 ||
          (storageError.message?.toLowerCase().includes('bucket') && storageError.message?.toLowerCase().includes('not found'));
        
        if (isBucketNotFound) {
          toast.error(t("subliminal.toasts.bucketNotFound"));
          setIsGenerating(false);
          if (processor) {
            processor.dispose();
          }
          return;
        }
        throw storageError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('subliminal-tracks')
        .getPublicUrl(fileName);

      // Save to database - ensure session is valid and matches auth.uid()
      // Use 'as any' to bypass TypeScript type checking for tables not in generated types
      
      // Use the refreshed session or current session - this ensures the Supabase client has the current session
      // The session token is automatically used by the client for RLS checks
      const activeSession = refreshedSession || currentSession;
      const activeUser = refreshedSession?.user || currentUser;
      
      if (!activeUser || !activeSession || !activeSession.access_token) {
        if (import.meta.env.DEV) {
          console.error("Failed to get valid session");
        }
        toast.error(t("subliminal.toasts.loginAgain"));
        if (processor) {
          processor.dispose();
        }
        setIsGenerating(false);
        return;
      }
      
      // Use the active session user ID - this MUST match what auth.uid() returns in RLS policy
      const sessionUserId = activeUser.id;
      
      // Test what auth.uid() returns by calling a database function
      // This will help us verify the session is being used correctly
      try {
        const { data: authUidResult, error: authUidError } = await supabase.rpc('test_auth_uid');
        if (authUidError) {
          if (import.meta.env.DEV) {
            console.warn("Could not test auth.uid() - function may not exist:", authUidError);
          }
        } else {
          if (import.meta.env.DEV) {
            console.log("auth.uid() verification successful");
          }
          if (authUidResult !== sessionUserId) {
            if (import.meta.env.DEV) {
              console.error("MISMATCH: auth.uid() returns", authUidResult, "but we're inserting", sessionUserId);
            }
            toast.error(t("subliminal.toasts.sessionMismatch"));
            if (processor) {
              processor.dispose();
            }
            setIsGenerating(false);
            return;
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("Could not test auth.uid() - function may not exist:", error);
        }
        // Continue anyway - the function might not exist yet
      }
      
      const { data: dbTrack, error: dbError } = await (supabase as any)
        .from('subliminal_tracks')
        .insert({
          user_id: sessionUserId, // This MUST match auth.uid() for RLS to pass
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
        if (import.meta.env.DEV) {
          console.error("Database insert error:", dbError);
          console.error("Error code:", dbError.code);
          console.error("Error message:", dbError.message);
          console.error("Error details:", dbError.details);
          console.error("Error hint:", dbError.hint);
          console.error("Session user ID used:", sessionUserId);
          console.error("Active session:", activeSession?.user?.id);
        }
        
        // Check if it's an RLS policy error
        if (dbError.message?.includes('row-level security') || dbError.message?.includes('RLS') || dbError.code === '42501' || dbError.code === 'PGRST301') {
          const errorMsg = `The user_id (${sessionUserId}) doesn't match auth.uid(). Please ensure you're logged in and try again.`;
          console.error(errorMsg);
          toast.error(t("subliminal.toasts.permissionDenied"));
          if (processor) {
            processor.dispose();
          }
          setIsGenerating(false);
          return;
        } else {
          if (processor) {
            processor.dispose();
          }
          throw dbError;
        }
      }

      // Log successful generation (even if track is later deleted, this persists)
      // This MUST succeed for weekly tracking to work correctly
      const { error: logError } = await (supabase as any)
        .from('subliminal_generation_log')
        .insert({
          user_id: sessionUserId,
          track_id: dbTrack.id,
          generated_at: new Date().toISOString(),
        });

      if (logError) {
        console.error("CRITICAL: Failed to log generation - weekly count will be incorrect:", logError);
        // Don't block track creation, but log the error prominently
      }

      // Use the file size we already calculated earlier
      newTrack = {
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
        fileSizeMB,
      };

      // Add track to state immediately (optimistic update)
      setTracks([newTrack, ...tracks]);
      setIsGenerating(false);
      toast.success(t("subliminal.toasts.trackGenerated", { name: trackName }));
      setTrackName("");
      
      // Reload tracks in background to ensure sync (don't await - let it happen async)
      // This will update file sizes and ensure everything is in sync without blocking UI
      setTimeout(() => {
        loadTracks().catch(err => {
          console.warn("Background track reload failed:", err);
          // Don't show error to user - we already have the track in state
        });
      }, 500); // Small delay to let the UI update first
      
      // Refresh storage stats (storage calculation) and weekly count (from generation log)
      setTimeout(async () => {
        await loadStorageStats();
      }, 1000); // 1 second delay to allow storage to update

      // Clean up processor
      if (processor) {
        processor.dispose();
      }
    } catch (error) {
      console.error('Error generating track:', error);
      setIsGenerating(false);
      // Clean up processor in case of error
      if (processor) {
        try {
          processor.dispose();
        } catch (disposeError) {
          // Ignore dispose errors
        }
      }
      toast.error(
        error instanceof Error
          ? localizeEdgeErrorMessage(error.message, tCommon)
          : t("subliminal.toasts.generateTrackFailed"),
      );
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [showSubliminalLimits, setShowSubliminalLimits] = useState(false);

  // Desktop: Same layout as mobile with sidebar
  return (
    <div
      className={cn(
        cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"),
        theme === "dark" ? "min-h-screen" : "min-h-screen bg-background",
        isMobile ? "min-h-[100dvh] flex flex-col" : "min-h-screen pb-20",
      )}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className={cn(isMobile ? "flex-1 flex flex-col min-h-0" : "min-h-screen")}
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

        <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
          <div className={cn("px-4 sm:px-6 w-full flex items-center justify-between", !isMobile ? "" : "container mx-auto")}>
          <h1 className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"} onClick={() => navigate("/dashboard")}>
            {t("subliminal.title")}
          </h1>
          {isMobile && <MobilePWAMenu />}
        </div>
      </header>

      <main className={cn(
        "px-4 sm:px-6 max-w-6xl",
        isMobile ? "pb-4" : "pb-20",
        !isMobile ? "pt-16" : "",
        !isMobile ? "" : "container mx-auto",
        isMobile && "flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
      )}>
        <div className="py-2 sm:py-3">
          <div className={cn("text-sm mb-2 flex items-start gap-1", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
            <p className="flex-1 min-w-0 leading-snug pr-1">
              {t("subliminal.subtitle")}
            </p>
            <button
              type="button"
              className={cn("shrink-0 -mt-0.5 p-1.5 rounded-md transition-colors", theme === "dark" ? "text-white/55 hover:text-white hover:bg-white/[0.06]" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}
              aria-label={showSubliminalLimits ? t("subliminal.hideLimits") : t("subliminal.showLimits")}
              aria-expanded={showSubliminalLimits}
              onClick={() => setShowSubliminalLimits((v) => !v)}
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>

          {showSubliminalLimits && (
            <div className="flex gap-3 mb-3">
              <div className={cn(theme === "dark" ? cn("border border-white/12 bg-transparent text-white backdrop-blur-sm", "rounded-lg") : "bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg", "flex-1 px-3 py-2 min-w-0")}>
                {isLoadingStats ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{t("subliminal.loading")}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className={cn("text-xs whitespace-nowrap", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                      {t("subliminal.storage")}
                    </span>
                    <span className="text-sm font-semibold whitespace-nowrap flex-shrink-0">
                      {(storageUsedMB / 1000).toFixed(1)}/{(tierLimits.maxStorageMB / 1000).toFixed(1)} GB
                    </span>
                  </div>
                )}
              </div>

              <div className={cn(theme === "dark" ? cn("border border-white/12 bg-transparent text-white backdrop-blur-sm", "rounded-lg") : "bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg", "flex-1 px-3 py-2 min-w-0")}>
                {isLoadingStats ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{t("subliminal.loading")}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className={cn("text-xs whitespace-nowrap", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                      {t("subliminal.weeklyCreations")}
                    </span>
                    <span className="text-sm font-semibold whitespace-nowrap flex-shrink-0">
                      {weeklyGenerations}/{tierLimits.maxGenerationsPerWeek}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile & Desktop: Use same flow-based UI */}
          <MobileSubliminalFlow
            isRecording={isRecording}
            audioBlob={audioBlob}
            isPlaying={isPlaying}
            selectedAffirmationSet={selectedAffirmationSet}
            displayedAffirmations={displayedAffirmations}
            isGeneratingTTS={isGeneratingTTS}
            binauralBeat={binauralBeat}
            backgroundSound={backgroundSound}
            affirmationVolume={affirmationVolume}
            binauralVolume={binauralVolume}
            backgroundVolume={backgroundVolume}
            layerCount={layerCount}
            trackLength={trackLength}
            binauralBeats={binauralBeats}
            backgroundSounds={backgroundSounds}
            userBackgroundTracks={userBackgroundTracks}
            audioRef={audioRef}
            startRecording={startRecording}
            stopRecording={stopRecording}
            clearAudio={clearAudio}
            handleAffirmationSetChange={handleAffirmationSetChange}
            generateAffirmationAudio={generateAffirmationAudio}
            togglePlayback={togglePlayback}
            setBinauralBeat={setBinauralBeat}
            setBackgroundSound={setBackgroundSound}
            setAffirmationVolume={setAffirmationVolume}
            setBinauralVolume={setBinauralVolume}
            setBackgroundVolume={setBackgroundVolume}
            setLayerCount={setLayerCount}
            setTrackLength={setTrackLength}
            tracks={tracks}
            setTracks={setTracks}
            playingTrackId={playingTrackId}
            setPlayingTrackId={setPlayingTrackId}
            flowStep={mobileFlowStep}
            setFlowStep={setMobileFlowStep}
            trackName={trackName}
            setTrackName={setTrackName}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            generateSubliminalTrack={generateSubliminalTrack}
            onTrackCreated={async () => {
              await loadTracks();
              await loadStorageStats();
            }}
            onTrackDeleted={async () => {
              await loadTracks();
              await loadStorageStats();
            }}
          />

        {/* Generated Tracks History - Now handled in MobileSubliminalFlow for both mobile and desktop */}
      </main>


      {/* Delete Confirmation Dialog */}
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
        </div>
      </div>
    </div>
  );
};

// Export default component
export default SubliminalAudio;

