import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { ArrowLeft, Piano, Music, Play, Pause, Save, Loader2, Grid3x3, AlertTriangle, Plus, Trash2, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLocalizedPremadeSets, type AffirmationSet } from "@/lib/affirmations-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { cn } from "@/lib/utils";
import { useUserTier } from "@/hooks/useUserTier";
import { hasActivePaidPlan } from "@/lib/featureGating";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PianoKeyboard } from "@/components/PianoKeyboard";
import { MusicNoteParser } from "@/lib/music-note-parser";
import { MusicSynthesizer } from "@/lib/music-synthesizer";
import { useTheme } from "@/contexts/ThemeContext";
import { localizeEdgeErrorMessage } from "@/lib/error-utils";

type Mode = "tracks" | "piano" | "notes";

export interface Note {
  note: string; // e.g., "C4", "D#5"
  duration: number; // in seconds
  startTime: number; // in seconds
}

interface Song {
  id?: string;
  name: string;
  notes: Note[];
  createdAt?: Date;
}

function MusicComposer() {
  const { t, i18n } = useTranslation("tools");
  const { t: tCommon } = useTranslation("common");
  const { theme } = useTheme();
  const isCosmic = theme === "dark";
  const musicPanelClass = cn(
    isCosmic
      ? cn("rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm", "!bg-transparent !shadow-none")
      : "bg-card/50 backdrop-blur-sm border-primary/20",
  );
  const musicMenuSurface = isCosmic ? "z-50 border border-white/12 bg-[#0f0d14] text-white" : "";
  const musicGhostBtn = cn(
    "border !bg-transparent shadow-none",
    isCosmic
      ? "!text-white border-white/20 hover:!bg-white/10 hover:!text-white"
      : "!text-foreground border-border/60 hover:!bg-muted/50 hover:!text-foreground",
  );
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { tier, status } = useUserTier();
  const isFreeplay =
    location.pathname.includes("/tap-in") || location.pathname.includes("/freeplay");
  const hasBackingTracksAccess = hasActivePaidPlan({ tier, status });
  const [mode, setMode] = useState<Mode>(isFreeplay ? "piano" : "tracks");
  const [currentNotes, setCurrentNotes] = useState<Note[]>([]);
  const [notesText, setNotesText] = useState("");
  const [songName, setSongName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedSongs, setSavedSongs] = useState<Song[]>([]);
  const [quantizeEnabled, setQuantizeEnabled] = useState(false);
  const [quantizeGrid, setQuantizeGrid] = useState(0.25); // 1/4 note = 0.25s at 120 BPM
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Default to freeplay mode
  const [savedTracks, setSavedTracks] = useState<Array<{ id: string; name: string; audio_url: string; file_size_mb: number; duration_seconds: number; created_at: string }>>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [sessionType, setSessionType] = useState<"freeplay" | "recording">("freeplay");
  const [selectedAffirmationSet, setSelectedAffirmationSet] = useState<string>("");
  const [affirmationSets, setAffirmationSets] = useState<AffirmationSet[]>([]);
  const [currentAffirmationWords, setCurrentAffirmationWords] = useState<string[]>([]);
  const [currentAffirmationLines, setCurrentAffirmationLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);
  const [newSessionTrackName, setNewSessionTrackName] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const keyPressCountRef = useRef<number>(0);
  
  const synthesizerRef = useRef<MusicSynthesizer | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const isPlayingRef = useRef(false);
  const lastPressTimeRef = useRef<number | null>(null);
  const activeNotesRef = useRef<Map<string, { startTime: number; startTimestamp: number }>>(new Map());

  useEffect(() => {
    const prevTitle = document.title;
    document.title = t("musicComposer.pageTitle");
    return () => {
      document.title = prevTitle;
    };
  }, [t, i18n.resolvedLanguage]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  // Lock mode to piano when on freeplay route
  useEffect(() => {
    if (isFreeplay && mode !== "piano") {
      setMode("piano");
    }
  }, [isFreeplay, mode]);

  // Load affirmation sets
  useEffect(() => {
    const loadAffirmationSets = async () => {
      let allSets = [...getLocalizedPremadeSets()];
      if (user) {
        try {
          const { data: { session: freshSession } } = await supabase.auth.getSession();
          if (freshSession?.access_token) {
            const { data: dbSets } = await (supabase as any)
              .from('user_affirmation_sets')
              .select('*')
              .order('created_at', { ascending: false });
            if (dbSets && dbSets.length > 0) {
              const userSets: AffirmationSet[] = dbSets.map((dbSet: any) => ({
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
          console.error("Error loading affirmation sets:", error);
        }
      }
      setAffirmationSets(allSets);
    };
    loadAffirmationSets();
  }, [user]);

  // Initialize affirmation lines when set is selected
  useEffect(() => {
    if (selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && sessionType === "freeplay") {
      const set = affirmationSets.find(s => s.id === selectedAffirmationSet);
      if (set) {
        // Store lines (one affirmation per line)
        setCurrentAffirmationLines(set.affirmations);
        setCurrentLineIndex(0);
        // Initialize words for first line
        if (set.affirmations.length > 0) {
          const firstLineWords = set.affirmations[0].split(/\s+/);
          setCurrentAffirmationWords(firstLineWords);
        } else {
          setCurrentAffirmationWords([]);
        }
        setHighlightedWordIndex(-1);
        keyPressCountRef.current = 0;
      }
    } else {
      setCurrentAffirmationLines([]);
      setCurrentAffirmationWords([]);
      setCurrentLineIndex(0);
      setHighlightedWordIndex(-1);
      keyPressCountRef.current = 0;
    }
  }, [selectedAffirmationSet, sessionType, affirmationSets]);

  // Load saved tracks
  const loadSavedTracks = async (showError: boolean = false) => {
    if (!user) return;
    setIsLoadingTracks(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_background_tracks')
        .select('id, name, audio_url, file_size_mb, duration_seconds, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Check if table doesn't exist (PGRST205 error)
        if (error.code === 'PGRST205') {
          // Table doesn't exist yet - this is expected if migrations haven't been run
          console.warn('user_background_tracks table does not exist yet. Please run migrations.');
          setSavedTracks([]);
          return;
        }
        console.error('Error loading tracks:', error);
        // Only show error if explicitly requested (e.g., after save/delete)
        if (showError) {
          toast.error(t("musicComposer.toasts.loadTracksFailed"));
        }
        setSavedTracks([]);
      } else if (data) {
        setSavedTracks(data as Array<{ id: string; name: string; audio_url: string; file_size_mb: number; duration_seconds: number; created_at: string }>);
      } else {
        setSavedTracks([]);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      // Only show error if explicitly requested
      if (showError) {
        toast.error(t("musicComposer.toasts.loadTracksFailed"));
      }
      setSavedTracks([]);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  useEffect(() => {
    if (user && mode === 'tracks') {
      // Load tracks asynchronously, don't block mode changes
      loadSavedTracks(false).catch(() => {
        // Silently handle errors - table might not exist yet
        setSavedTracks([]);
      });
    }
  }, [user, mode]);

  // Pre-initialize audio context to prevent burst on first key press
  useEffect(() => {
    if (!synthesizerRef.current) {
      synthesizerRef.current = new MusicSynthesizer();
    }
    // Pre-initialize audio context (but don't resume until user interaction)
    synthesizerRef.current.ensureReady().catch(() => {
      // Ignore errors - audio context will be initialized on first user interaction
    });
  }, []);

  // Delete track
  const handleDeleteTrack = async (trackId: string, trackName: string) => {
    if (!user) return;
    
    if (!confirm(t("musicComposer.deleteConfirm", { name: trackName }))) {
      return;
    }

    try {
      // Get track to find file path
      const track = savedTracks.find(t => t.id === trackId);
      if (!track) return;

      // Extract file path from URL
      const urlParts = track.audio_url.split('/');
      const fileName = urlParts.slice(-2).join('/'); // user_id/filename.wav

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('background-tracks')
        .remove([fileName]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue with DB delete even if storage fails
      }

      // Delete from database
      const { error: dbError } = await (supabase as any)
        .from('user_background_tracks')
        .delete()
        .eq('id', trackId)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('Database delete error:', dbError);
        toast.error(t("musicComposer.toasts.deleteTrackFailed"));
        return;
      }

      toast.success(t("musicComposer.toasts.trackDeleted"));
      loadSavedTracks(true); // Show error if reload fails after delete
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error(t("musicComposer.toasts.deleteTrackFailed"));
    }
  };

  useEffect(() => {
    // Initialize synthesizer
    synthesizerRef.current = new MusicSynthesizer();
    return () => {
      if (synthesizerRef.current) {
        synthesizerRef.current.stop();
      }
      playbackTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      playbackTimeoutRef.current = [];
    };
  }, []);

  // Auto-correct timing function to snap time to grid
  const quantizeTime = (time: number): number => {
    if (!quantizeEnabled) return time;
    return Math.round(time / quantizeGrid) * quantizeGrid;
  };

  const handlePianoNotePlay = (note: string) => {
    if (!synthesizerRef.current) return;
    
    // Fire off note playback immediately without any blocking
    // playNote will handle context initialization if needed
    synthesizerRef.current.playNote(note, 0.5).catch(() => {
      // Ignore errors - note will retry if context initializes
    });
    
    // Update word highlighting for freeplay with affirmations
    if (sessionType === "freeplay" && selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0) {
      keyPressCountRef.current += 1;
      const currentLineWordIndex = Math.min(keyPressCountRef.current - 1, currentAffirmationWords.length - 1);
      setHighlightedWordIndex(currentLineWordIndex);
      
      // Move to next line when all words in current line are highlighted
      if (currentLineWordIndex >= currentAffirmationWords.length - 1) {
        if (currentLineIndex < currentAffirmationLines.length - 1) {
          // Move to next line
          const nextLineIndex = currentLineIndex + 1;
          setCurrentLineIndex(nextLineIndex);
          const nextLineWords = currentAffirmationLines[nextLineIndex].split(/\s+/);
          setCurrentAffirmationWords(nextLineWords);
          setHighlightedWordIndex(-1);
          keyPressCountRef.current = 0;
        } else {
          // Loop back to the beginning
          setCurrentLineIndex(0);
          const firstLineWords = currentAffirmationLines[0].split(/\s+/);
          setCurrentAffirmationWords(firstLineWords);
          setHighlightedWordIndex(-1);
          keyPressCountRef.current = 0;
        }
      }
    }
    
    // Only record if recording mode is enabled
    if (!isRecording) return;
    
    // Record actual timing
    const now = Date.now() / 1000; // Current time in seconds
    let startTime: number;
    
    if (currentNotes.length === 0) {
      // First note starts at 0
      startTime = 0;
      lastPressTimeRef.current = now;
    } else {
      // Calculate time since last press
      const timeSinceLastPress = lastPressTimeRef.current 
        ? now - lastPressTimeRef.current 
        : 0;
      
      // Get the end time of the last note
      const lastNote = currentNotes[currentNotes.length - 1];
      const lastNoteEnd = lastNote.startTime + lastNote.duration;
      
      // New note starts at last note end + actual time since press
      // But ensure it doesn't start before last note ends
      startTime = Math.max(lastNoteEnd, lastNoteEnd + timeSinceLastPress);
      
      // Apply auto-correct timing if enabled
      startTime = quantizeTime(startTime);
      
      lastPressTimeRef.current = now;
    }
    
    // Automatically trim at 1 minute - don't record notes beyond 60 seconds
    if (startTime >= 60) {
      // Don't record this note, but keep recording enabled
      return;
    }
    
    // Add to current notes
    const newNote: Note = {
      note,
      duration: 0.5,
      startTime
    };
    setCurrentNotes([...currentNotes, newNote]);
  };

  const handlePianoNoteStart = async (note: string) => {
    if (!synthesizerRef.current) return;
    await synthesizerRef.current.ensureReady();
    
    // Store start time to detect quick taps
    const perfStartTime = performance.now();
    const timestampStart = Date.now() / 1000;
    activeNotesRef.current.set(note, {
      startTime: 0, // Will be set properly if recording
      startTimestamp: timestampStart,
      startPerformanceTime: perfStartTime // Track for quick tap detection
    } as any);
    
    await synthesizerRef.current.startNote(note);
    
    // Only record if recording mode is enabled
    if (!isRecording) return;
    
    // Record note start time
    const now = Date.now() / 1000;
    let noteStartTime: number;
    
    if (currentNotes.length === 0) {
      noteStartTime = 0;
      lastPressTimeRef.current = now;
    } else {
      const timeSinceLastPress = lastPressTimeRef.current 
        ? now - lastPressTimeRef.current 
        : 0;
      
      const lastNote = currentNotes[currentNotes.length - 1];
      const lastNoteEnd = lastNote.startTime + lastNote.duration;
      noteStartTime = Math.max(lastNoteEnd, lastNoteEnd + timeSinceLastPress);
      noteStartTime = quantizeTime(noteStartTime);
      lastPressTimeRef.current = now;
    }
    
    // Automatically trim at 1 minute - don't record notes beyond 60 seconds
    if (noteStartTime >= 60) {
      // Don't record this note, but keep recording enabled
      return;
    }
    
    // Store note start info for when it stops
    activeNotesRef.current.set(note, {
      startTime: noteStartTime,
      startTimestamp: now,
      startPerformanceTime: perfStartTime
    } as any);
  };

  const handlePianoNoteStop = async (note: string) => {
    if (!synthesizerRef.current) return;
    
    // Check if this was a quick tap (< 100ms) - use playNote instead for smoother sound
    const noteInfo = activeNotesRef.current.get(note);
    const isQuickTap = noteInfo && (noteInfo as any).startPerformanceTime && 
      (performance.now() - (noteInfo as any).startPerformanceTime) < 100;
    
    if (isQuickTap && !isRecording) {
      // For quick taps in freeplay, just stop immediately without release envelope
      // This prevents the blip from startNote/stopNote cycle
      synthesizerRef.current.stopNote(note);
      // Also play a clean one-shot note for better sound
      await synthesizerRef.current.playNote(note, 0.15);
    } else {
      synthesizerRef.current.stopNote(note);
    }
    
    // Only record if recording mode is enabled
    if (!isRecording) return;
    
    const noteInfoForRecording = activeNotesRef.current.get(note);
    if (!noteInfoForRecording) return;
    
    // Calculate duration
    const now = Date.now() / 1000;
    const duration = Math.max(0.1, now - noteInfoForRecording.startTimestamp); // Minimum 0.1s
    
    // Add to current notes
    const newNote: Note = {
      note,
      duration,
      startTime: noteInfoForRecording.startTime
    };
    setCurrentNotes([...currentNotes, newNote]);
    
    // Clear active note
    activeNotesRef.current.delete(note);
  };

  const handleParseNotes = () => {
    try {
      const parser = new MusicNoteParser();
      const parsed = parser.parse(notesText);
      
      // Check 1-minute limit (60 seconds)
      const totalDuration = parsed.length > 0 
        ? parsed[parsed.length - 1].startTime + parsed[parsed.length - 1].duration 
        : 0;
      
      if (totalDuration > 60) {
        // Trim notes to 1 minute
        const trimmed = parsed.filter(note => note.startTime < 60);
        setCurrentNotes(trimmed);
        toast.warning(t("musicComposer.toasts.songTrimmed", { count: trimmed.length }));
      } else {
        setCurrentNotes(parsed);
        toast.success(t("musicComposer.toasts.parsedNotes", { count: parsed.length }));
      }
    } catch (error) {
      toast.error(
        t("musicComposer.toasts.parseFailed", {
          message:
            error instanceof Error
              ? localizeEdgeErrorMessage(error.message, tCommon)
              : t("musicComposer.toasts.unknownError"),
        }),
      );
    }
  };

  const handlePlayNotes = async () => {
    if (currentNotes.length === 0) {
      toast.error(t("musicComposer.toasts.noNotesToPlay"));
      return;
    }

    if (isPlaying) {
      // Stop playback
      if (synthesizerRef.current) {
        synthesizerRef.current.stop();
      }
      // Clear all scheduled timeouts
      playbackTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      playbackTimeoutRef.current = [];
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    setIsPlaying(true);
    isPlayingRef.current = true;
    
    if (!synthesizerRef.current) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    // Ensure audio context is ready
    await synthesizerRef.current.ensureReady();

    // Get audio context for precise scheduling
    const audioContext = synthesizerRef.current?.getAudioContext?.() || null;
    if (!audioContext) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    // Clear any existing timeouts
    playbackTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    playbackTimeoutRef.current = [];
    
    // Use audio context's current time as reference
    const startTime = audioContext.currentTime;
    
    // Schedule all notes using startNote/stopNote for smooth playback (same as live play)
    currentNotes.forEach((note) => {
      const playTime = startTime + note.startTime;
      const stopTime = playTime + note.duration;
      
      // Schedule note start
      const startDelay = Math.max(0, (playTime - audioContext.currentTime) * 1000);
      const startTimeout = setTimeout(async () => {
        if (synthesizerRef.current && isPlayingRef.current) {
          await synthesizerRef.current.startNote(note.note);
        }
      }, startDelay);
      
      // Schedule note stop
      const stopDelay = Math.max(0, (stopTime - audioContext.currentTime) * 1000);
      const stopTimeout = setTimeout(() => {
        if (synthesizerRef.current && isPlayingRef.current) {
          synthesizerRef.current.stopNote(note.note);
        }
      }, stopDelay);
      
      playbackTimeoutRef.current.push(startTimeout, stopTimeout);
    });
    
    // Calculate when playback should end
    const lastNote = currentNotes[currentNotes.length - 1];
    const totalDuration = lastNote.startTime + lastNote.duration;
    const endTimeout = setTimeout(() => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      playbackTimeoutRef.current = [];
    }, totalDuration * 1000);
    
    playbackTimeoutRef.current.push(endTimeout);
  };


  const handleSave = async () => {
    if (!songName.trim()) {
      toast.error(t("musicComposer.toasts.enterSongName"));
      return;
    }

    if (currentNotes.length === 0) {
      toast.error(t("musicComposer.toasts.noNotesToSave"));
      return;
    }

    if (!hasAcceptedDisclaimer) {
      toast.error(t("musicComposer.toasts.confirmOriginal"));
      return;
    }

    if (!user) {
      toast.error(t("musicComposer.toasts.loginToSave"));
      return;
    }

    try {
      // Check 5-track limit
                const { count, error: countError } = await (supabase as any)
                    .from('user_background_tracks')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

      if (countError) {
        console.error('Error checking track count:', countError);
        // Log error but don't block save - let database handle it or user can try again
        console.warn('Could not verify track limit, proceeding with save attempt');
      } else if (count !== null && count >= 5) {
        toast.error(t("musicComposer.toasts.trackLimitReached"));
        return;
      }

      // Automatically trim notes to 1 minute if they exceed the limit
      const inputDuration = currentNotes.length > 0
        ? currentNotes[currentNotes.length - 1].startTime + currentNotes[currentNotes.length - 1].duration
        : 0;
      
      // Filter out invalid notes and trim to 1 minute
      let notesToSave = currentNotes.filter(note => 
        note.startTime >= 0 && 
        note.duration > 0 && 
        !isNaN(note.startTime) && 
        !isNaN(note.duration) &&
        note.startTime < 60 // Trim to 1 minute
      );
      
      if (inputDuration > 60 && notesToSave.length < currentNotes.length) {
        toast.warning(t("musicComposer.toasts.songTrimmed", { count: notesToSave.length }));
      }
      
      if (notesToSave.length === 0) {
        toast.error(t("musicComposer.toasts.noValidNotes"));
        return;
      }

                // Check if track name already exists
                const { data: existingTrack, error: checkError } = await (supabase as any)
                    .from('user_background_tracks')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('name', songName.trim())
                    .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error when no match
                
                if (checkError) {
                  console.warn('Error checking for duplicate track name:', checkError);
                  // Continue anyway - worst case is a duplicate name error from database
                }

      if (existingTrack) {
        toast.error(t("musicComposer.toasts.duplicateName"));
        return;
      }

      toast.loading(t("musicComposer.toasts.generatingAudio"), { id: 'save-track' });

      // Generate audio from notes (using trimmed notes if needed)
      if (!synthesizerRef.current) {
        synthesizerRef.current = new MusicSynthesizer();
      }
      await synthesizerRef.current.ensureReady();
      
      let audioBlob: Blob;
      try {
        console.log('Generating audio from notes:', notesToSave);
        audioBlob = await synthesizerRef.current.generateAudioFromNotes(notesToSave);
        console.log('Audio generated successfully, size:', audioBlob.size);
      } catch (error) {
        console.error('Error generating audio:', error);
        toast.error(
          t("musicComposer.toasts.generateAudioFailed", {
            message:
              error instanceof Error
                ? localizeEdgeErrorMessage(error.message, tCommon)
                : t("musicComposer.toasts.unknownError"),
          }),
          { id: "save-track" },
        );
        return;
      }

      // Calculate duration and file size
      const totalDuration = notesToSave.length > 0 
        ? Math.max(...notesToSave.map(n => n.startTime + n.duration))
        : 0;
      const fileSizeMB = audioBlob.size / (1024 * 1024);

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}_${songName.replace(/[^a-z0-9]/gi, '_')}.wav`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('background-tracks')
        .upload(fileName, audioBlob, {
          contentType: 'audio/wav',
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        const errorMessage = uploadError.message || String(uploadError);
        if (errorMessage.includes('Bucket not found') || errorMessage.includes('not found') || errorMessage.includes('400')) {
          toast.error(t("musicComposer.toasts.bucketNotFound"), { id: 'save-track' });
        } else {
          toast.error(t("musicComposer.toasts.uploadFailed", { message: localizeEdgeErrorMessage(errorMessage, tCommon) }), {
            id: "save-track",
          });
        }
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('background-tracks')
        .getPublicUrl(fileName);

                // Save to database
                const { error: dbError } = await (supabase as any)
                    .from('user_background_tracks')
                    .insert({
                        user_id: user.id,
                        name: songName.trim(),
                        audio_url: urlData.publicUrl,
                        file_size_mb: fileSizeMB,
                        duration_seconds: totalDuration
                    });

      if (dbError) {
        console.error("Database error:", dbError);
        toast.error(t("musicComposer.toasts.saveDbFailed"), { id: 'save-track' });
        // Try to delete uploaded file
        await supabase.storage.from('background-tracks').remove([fileName]);
        return;
      }

      toast.success(t("musicComposer.toasts.trackSaved"), { id: 'save-track' });
      setSongName("");
      setHasAcceptedDisclaimer(false);
      setCurrentNotes([]);
      // Reload tracks if on tracks tab
      if (mode === 'tracks') {
        await loadSavedTracks(true); // Show error if reload fails after save
      }
    } catch (error) {
      console.error("Error saving track:", error);
      toast.error(
        t("musicComposer.toasts.saveFailed", {
          message:
            error instanceof Error
              ? localizeEdgeErrorMessage(error.message, tCommon)
              : t("musicComposer.toasts.unknownError"),
        }),
        { id: "save-track" },
      );
    }
  };

  const handleClear = () => {
    setCurrentNotes([]);
    setNotesText("");
    setIsPlaying(false);
    setIsRecording(false); // Also stop recording when clearing
    lastPressTimeRef.current = null;
    if (synthesizerRef.current) {
      synthesizerRef.current.stop();
    }
  };

  const renderContent = () => {
    if (isMobile) {
      return (
        <div
          className={cn(
            cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"),
            theme === "dark" ? "min-h-screen" : "min-h-screen bg-background",
            "pb-[calc(7rem+env(safe-area-inset-bottom))]",
          )}
          style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
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
          <header className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]")}>
            <div className="container mx-auto px-4 sm:px-6 w-full flex items-center justify-between relative z-10">
              <h1
                className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
                onClick={() => {
                  if (mode === 'tracks') {
                    // On main page: go back to dashboard
                    navigate("/dashboard");
                  } else {
                    // On Piano/Notes sub-page: go back to main page
                    setMode('tracks');
                  }
                }}
              >
                {t("musicComposer.title")}
              </h1>
              <div className="flex items-center gap-2">
              {!isFreeplay && mode !== 'tracks' && (
                <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                  <TabsList className={cn("h-9 w-fit", isCosmic && theme === "dark" ? "flex w-full h-12 gap-1 p-1 rounded-lg border border-white/12 bg-transparent mb-2" : "flex w-full h-12 gap-1 p-1 rounded-lg border border-zinc-200/70 bg-muted mb-2")}>
                    <TabsTrigger value="piano" className={cn("px-3", isCosmic && theme === "dark" ? cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-white/55", "border border-transparent hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white") : cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-muted-foreground data-[state=active]:shadow-sm", "data-[state=active]:bg-background data-[state=active]:text-foreground"))}>
                      <Piano className="h-4 w-4 mr-2" />
                      {t("musicComposer.piano")}
                    </TabsTrigger>
                    <TabsTrigger value="notes" className={cn("px-2", isCosmic && theme === "dark" ? cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-white/55", "border border-transparent hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white") : cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-muted-foreground data-[state=active]:shadow-sm", "data-[state=active]:bg-background data-[state=active]:text-foreground"))}>
                      <Music className="h-4 w-4 mr-1" />
                      {t("musicComposer.notes")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {isMobile && <MobilePWAMenu />}
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
            <div className="py-3 sm:py-4">
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("musicComposer.subtitle")}
              </p>
            </div>
            {mode === 'tracks' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{t("musicComposer.yourTracks")}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("musicComposer.tracksStored", { current: savedTracks.length })}
                    </p>
                  </div>
                  {!isFreeplay ? (
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <span className="inline-block">
                          <Button 
                            onClick={() => {
                              if (!hasBackingTracksAccess) {
                                toast.error(t("musicComposer.toasts.subscribersOnly"));
                                return;
                              }
                              // Music Composer: go straight to piano mode
                              setMode("piano");
                              setIsRecording(false);
                              setCurrentNotes([]);
                              setHasAcceptedDisclaimer(false);
                              setSongName("");
                              setCurrentAffirmationLines([]);
                              setCurrentAffirmationWords([]);
                              setCurrentLineIndex(0);
                              setHighlightedWordIndex(-1);
                              keyPressCountRef.current = 0;
                            }}
                            size="sm"
                            disabled={!hasBackingTracksAccess}
                            className={cn(musicGhostBtn, "disabled:opacity-50 disabled:cursor-not-allowed")}
                          >
                            <span className="flex items-center gap-1">
                              <Plus className="h-4 w-4" />
                              {t("musicComposer.newSession")}
                            </span>
                          </Button>
                        </span>
                      </TooltipTrigger>
                    </Tooltip>
                  ) : (
                    <Button 
                      onClick={() => {
                        setShowNewSessionDialog(true);
                      }}
                      size="sm"
                      className={cn("shrink-0", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      variant="ghost"
                      type="button"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("musicComposer.newSession")}
                    </Button>
                  )}
                </div>

                {isLoadingTracks ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : savedTracks.length === 0 ? (
                  <Card className={musicPanelClass}>
                    <CardContent className="py-12 text-center">
                      <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{t("musicComposer.noTracksYet")}</p>
                      <p className="text-sm text-muted-foreground mt-2">{t("musicComposer.createFirstBackground")}</p>
                      <p className="text-xs text-red-600 mt-3 leading-snug">
                        {t("musicComposer.iphonePianoHint")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {savedTracks.map((track) => (
                      <Card key={track.id} className={cn(musicPanelClass, theme === "dark" ? "hover:bg-white/8" : "hover:bg-card/90", "transition-colors")}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 text-left">
                              <p className="font-semibold">{track.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t("musicComposer.trackMeta", {
                                  minutes: (track.duration_seconds / 60).toFixed(1),
                                  size: track.file_size_mb.toFixed(1),
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(track.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTrack(track.id, track.name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
            <TabsList className="hidden">
              <TabsTrigger value="piano">
                <Piano className="h-4 w-4 mr-2" />
                {t("musicComposer.piano")}
              </TabsTrigger>
              <TabsTrigger value="notes">
                <Music className="h-4 w-4 mr-2" />
                {t("musicComposer.notes")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="piano" className="space-y-4">
              <Card className={cn(musicPanelClass, "overflow-visible")}>
                <CardContent className="pt-4 space-y-3 overflow-visible">
                  <div className="relative overflow-visible">
                    {/* Affirmation Overlay - only for freeplay with affirmations */}
                    {sessionType === "freeplay" && selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0 && (
                      <div className={cn(
                        "absolute right-2 z-30 pointer-events-none",
                        isMobile ? "top-1/2 transform -translate-y-1/2" : "top-1/2 transform -translate-y-1/2"
                      )}>
                        <div className={cn(
                          "backdrop-blur-md bg-background/70 border border-border/50 rounded-lg shadow-lg",
                          isMobile ? "px-4 py-3 min-w-[60px]" : "px-5 py-4 min-w-[80px]"
                        )}>
                          <div 
                            className={cn(
                              "flex justify-center items-start gap-3 font-semibold",
                              isMobile ? "text-xl" : "text-lg"
                            )}
                            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                          >
                            {currentAffirmationWords.map((word, index) => (
                              <span
                                key={index}
                                className={cn(
                                  "transition-all duration-200 inline-block",
                                  index === highlightedWordIndex
                                    ? "text-green-500 font-bold scale-110 drop-shadow-lg"
                                    : "text-foreground/90"
                                )}
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <PianoKeyboard 
                      onNotePlay={handlePianoNotePlay}
                    />
                  </div>
                  
                  {/* Compact Controls Row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Record Mode Toggle */}
                    <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                      <div className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`} />
                      <Label htmlFor="record-toggle" className="text-xs font-medium">
                        {t("musicComposer.record")}
                      </Label>
                      <Switch
                        id="record-toggle"
                        checked={isRecording}
                        onCheckedChange={setIsRecording}
                      />
                    </div>
                    
                    {/* Auto-Correct Timing */}
                    {isRecording && (
                      <>
                        <div className="flex items-center gap-2">
                          <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
                          <Label htmlFor="quantize-toggle" className="text-xs">
                            {t("musicComposer.autoCorrect")}
                          </Label>
                          <Switch
                            id="quantize-toggle"
                            checked={quantizeEnabled}
                            onCheckedChange={setQuantizeEnabled}
                          />
                        </div>
                        
                        {quantizeEnabled && (
                          <Select
                            value={quantizeGrid.toString()}
                            onValueChange={(v) => setQuantizeGrid(parseFloat(v))}
                          >
                            <SelectTrigger id="quantize-grid" className={cn("h-8 text-xs w-[120px]", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={musicMenuSurface}>
                              <SelectItem value="0.125">{t("musicComposer.quantizeFast")}</SelectItem>
                              <SelectItem value="0.25">{t("musicComposer.quantizeMedium")}</SelectItem>
                              <SelectItem value="0.5">{t("musicComposer.quantizeSlow")}</SelectItem>
                              <SelectItem value="1.0">{t("musicComposer.quantizeVerySlow")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </>
                    )}
                    
                    {/* Notes Counter and Max Time - same line */}
                    {isRecording && (
                      <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                        <span>{t("musicComposer.maxOneMin")}</span>
                        <span className="ml-auto">{t("musicComposer.notesCount", { count: currentNotes.length })}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-red-600 leading-snug pt-1">{t("musicComposer.iphonePianoHint")}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card className={musicPanelClass}>
                <CardHeader>
                  <CardTitle>{t("musicComposer.enterMusicNotes")}</CardTitle>
                  <CardDescription>{t("musicComposer.notesFormatHint")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder={t("musicComposer.notesPlaceholder")}
                    rows={6}
                  />
                  <Button onClick={handleParseNotes} className="w-full">
                    {t("musicComposer.parseNotes")}
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {t("musicComposer.notesParsed", { count: currentNotes.length })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
              </>
            )}

          {/* Controls */}
          {/* Only show when not on tracks view and not on freeplay route. Piano: only show when recording or has notes. Notes: always show */}
          {!isFreeplay && mode !== "tracks" && (((mode !== "piano") || isRecording || currentNotes.length > 0)) && (
              <Card className={cn("mt-6", musicPanelClass)}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex gap-1.5 items-center flex-wrap">
                  <Button 
                    onClick={handlePlayNotes} 
                    variant={isPlaying ? "destructive" : "default"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={currentNotes.length === 0}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        {t("musicComposer.stop")}
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        {t("musicComposer.play")}
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleClear} 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    disabled={currentNotes.length === 0 && !isRecording}
                  >
                    {t("musicComposer.clear")}
                  </Button>
                  <Input
                    id="song-name"
                    value={songName}
                    onChange={(e) => setSongName(e.target.value)}
                    placeholder={t("musicComposer.songNamePlaceholder")}
                    className="h-7 text-xs flex-1 min-w-[100px]"
                  />
                  <Button 
                    onClick={handleSave} 
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={!songName.trim() || currentNotes.length === 0 || !hasAcceptedDisclaimer}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {t("musicComposer.save")}
                  </Button>
                </div>
              
                {/* Copyright Confirmation Checkbox */}
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="copyright-confirm"
                    checked={hasAcceptedDisclaimer}
                    onCheckedChange={(checked) => setHasAcceptedDisclaimer(checked === true)}
                    className="mt-0.5"
                  />
                  <Label 
                    htmlFor="copyright-confirm" 
                    className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
                  >
                    {t("musicComposer.confirmOriginal")}
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Copyright Disclaimer - Always show for Notes, only when recording for Piano, never on tracks view */}
          {mode !== "tracks" && (((mode !== "piano") || (mode === "piano" && isRecording))) && (
            <Card className="mt-6 border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      {t("musicComposer.originalMusicOnly")}
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      {t("musicComposer.copyrightDisclaimer")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          </main>
        </div>
      );
    }

    // Desktop layout
    return (
      <div
        className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-8")}
        style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
      >
        {/* Desktop Sidebar - Only on desktop */}
        <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />

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
            <div className={cn("px-4 sm:px-6 w-full flex items-center justify-between", !isMobile ? "" : "container mx-auto")}>
              <h1
                className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
                onClick={() => {
                  if (mode === 'tracks') {
                    // On main page: go back to dashboard
                    navigate("/dashboard");
                  } else {
                    // On Piano/Notes sub-page: go back to main page
                    setMode('tracks');
                  }
                }}
              >
                {t("musicComposer.title")}
              </h1>
              {isMobile && <MobilePWAMenu />}
            </div>
          </header>

          <main className={cn("px-4 sm:px-6 max-w-6xl relative z-10", !isMobile ? "pt-16" : "", !isMobile ? "" : "container mx-auto")}>
            <div className="py-3 sm:py-4">
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("musicComposer.subtitle")}
              </p>
            </div>
            {mode === 'tracks' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{t("musicComposer.yourTracks")}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("musicComposer.tracksStored", { current: savedTracks.length })}
                    </p>
                  </div>
                  {!isFreeplay ? (
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <span className="inline-block">
                          <Button 
                            onClick={() => {
                              if (!hasBackingTracksAccess) {
                                toast.error(t("musicComposer.toasts.subscribersOnly"));
                                return;
                              }
                              // Music Composer: go straight to piano mode
                              setMode("piano");
                              setIsRecording(false);
                              setCurrentNotes([]);
                              setHasAcceptedDisclaimer(false);
                              setSongName("");
                              setCurrentAffirmationLines([]);
                              setCurrentAffirmationWords([]);
                              setCurrentLineIndex(0);
                              setHighlightedWordIndex(-1);
                              keyPressCountRef.current = 0;
                            }}
                            size="sm"
                            disabled={!hasBackingTracksAccess}
                            className={cn(musicGhostBtn, "disabled:opacity-50 disabled:cursor-not-allowed")}
                          >
                            <span className="flex items-center gap-1">
                              <Plus className="h-4 w-4" />
                              {t("musicComposer.newSession")}
                            </span>
                          </Button>
                        </span>
                      </TooltipTrigger>
                    </Tooltip>
                  ) : (
                    <Button 
                      onClick={() => {
                        setShowNewSessionDialog(true);
                      }}
                      size="sm"
                      className={cn("shrink-0", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      variant="ghost"
                      type="button"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("musicComposer.newSession")}
                    </Button>
                  )}
                </div>

                {isLoadingTracks ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : savedTracks.length === 0 ? (
                  <Card className={musicPanelClass}>
                    <CardContent className="py-12 text-center">
                      <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{t("musicComposer.noTracksYet")}</p>
                      <p className="text-sm text-muted-foreground mt-2">{t("musicComposer.createFirstBackground")}</p>
                      <p className="text-xs text-red-600 mt-3 leading-snug">
                        {t("musicComposer.iphonePianoHint")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {savedTracks.map((track) => (
                      <Card key={track.id} className={cn(musicPanelClass, theme === "dark" ? "hover:bg-white/8" : "hover:bg-card/90", "transition-colors")}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 text-left">
                              <p className="font-semibold">{track.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t("musicComposer.trackMeta", {
                                  minutes: (track.duration_seconds / 60).toFixed(1),
                                  size: track.file_size_mb.toFixed(1),
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(track.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTrack(track.id, track.name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : isFreeplay ? (
              // Freeplay route - only show piano, no tabs, no record controls
              <div className="space-y-6">
                {/* Affirmation Selection */}
                <Card className={musicPanelClass}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{t("musicComposer.affirmationSetOptional")}</Label>
                        <Select 
                          value={selectedAffirmationSet || undefined} 
                          onValueChange={(value) => setSelectedAffirmationSet(value === "none" ? "" : value)}
                        >
                          <SelectTrigger className={cn("mt-2", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}>
                            <SelectValue placeholder={t("musicComposer.none")} />
                          </SelectTrigger>
                          <SelectContent className={musicMenuSurface}>
                            <SelectItem value="none">{t("musicComposer.none")}</SelectItem>
                            {affirmationSets.map((set) => (
                              <SelectItem key={set.id} value={set.id}>
                                {set.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Piano Keyboard */}
                <Card className={cn(musicPanelClass, "overflow-visible")}>
                  <CardContent className="pt-4 space-y-3 overflow-visible">
                    <div className="relative overflow-visible">
                      {/* Affirmation Overlay - only for freeplay with affirmations */}
                      {selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0 && (
                        <div className={cn(
                          "absolute right-2 z-30 pointer-events-none",
                          isMobile ? "top-1/2 transform -translate-y-1/2" : "top-1/2 transform -translate-y-1/2"
                        )}>
                          <div className={cn(
                            "backdrop-blur-md bg-background/70 border border-border/50 rounded-lg shadow-lg",
                            isMobile ? "px-4 py-3 min-w-[60px]" : "px-5 py-4 min-w-[80px]"
                          )}>
                            <div 
                              className={cn(
                                "flex justify-center items-start gap-3 font-semibold",
                                isMobile ? "text-xl" : "text-lg"
                              )}
                              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                            >
                              {currentAffirmationWords.map((word, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    "transition-all duration-200 inline-block",
                                    index === highlightedWordIndex
                                      ? "text-green-500 font-bold scale-110 drop-shadow-lg"
                                      : "text-foreground/90"
                                  )}
                                >
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <PianoKeyboard 
                        onNotePlay={handlePianoNotePlay}
                      />
                    </div>
                    <p className="text-xs text-red-600 leading-snug pt-1">{t("musicComposer.iphonePianoHint")}</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
              <TabsList
                className={cn(
                  "grid w-full grid-cols-2 mb-6",
                  isCosmic && theme === "dark" ? "flex w-full h-12 gap-1 p-1 rounded-lg border border-white/12 bg-transparent mb-2" : "flex w-full h-12 gap-1 p-1 rounded-lg border border-zinc-200/70 bg-muted mb-2",
                )}
              >
                <TabsTrigger value="piano" className={isCosmic ? theme === "dark" ? cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-white/55", "border border-transparent hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white") : cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-muted-foreground data-[state=active]:shadow-sm", "data-[state=active]:bg-background data-[state=active]:text-foreground") : undefined}>
                  <Piano className="h-4 w-4 mr-2" />
                  {t("musicComposer.piano")}
                </TabsTrigger>
                <TabsTrigger value="notes" className={isCosmic ? theme === "dark" ? cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-white/55", "border border-transparent hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white") : cn("h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-muted-foreground data-[state=active]:shadow-sm", "data-[state=active]:bg-background data-[state=active]:text-foreground") : undefined}>
                  <Music className="h-4 w-4 mr-2" />
                  {t("musicComposer.notes")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="piano" className="space-y-6">
                <Card className={musicPanelClass}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="relative">
                      {/* Affirmation Overlay - only for freeplay with affirmations */}
                      {sessionType === "freeplay" && selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0 && (
                        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20 pointer-events-none">
                          <div className={cn(
                            "backdrop-blur-md bg-background/70 border border-border/50 rounded-lg px-5 py-4 shadow-lg",
                            "w-auto max-w-[300px]"
                          )}>
                            <div className="flex flex-wrap justify-center gap-3 text-lg">
                              {currentAffirmationWords.map((word, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    "transition-all duration-200",
                                    index === highlightedWordIndex
                                      ? "text-primary font-bold scale-110"
                                      : "text-foreground/80"
                                  )}
                                >
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <PianoKeyboard 
                        onNotePlay={handlePianoNotePlay}
                      />
                    </div>
                    
                    {/* Compact Controls Row */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Record Mode Toggle */}
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`} />
                        <Label htmlFor="record-toggle-desktop" className="text-sm font-medium">
                          {t("musicComposer.recordMode")}
                        </Label>
                        <Switch
                          id="record-toggle-desktop"
                          checked={isRecording}
                          onCheckedChange={setIsRecording}
                        />
                      </div>
                      
                      {/* Auto-Correct Timing */}
                      {isRecording && (
                        <>
                          <div className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="quantize-toggle-desktop" className="text-sm">
                              {t("musicComposer.autoCorrect")}
                            </Label>
                            <Switch
                              id="quantize-toggle-desktop"
                              checked={quantizeEnabled}
                              onCheckedChange={setQuantizeEnabled}
                            />
                          </div>
                          
                          {quantizeEnabled && (
                            <div className="flex items-center gap-2">
                              <Label htmlFor="quantize-grid-desktop" className="text-sm">
                                Speed:
                              </Label>
                              <Select
                                value={quantizeGrid.toString()}
                                onValueChange={(v) => setQuantizeGrid(parseFloat(v))}
                              >
                                <SelectTrigger id="quantize-grid-desktop" className="h-9 w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={musicMenuSurface}>
                                  <SelectItem value="0.125">{t("musicComposer.quantizeFast")}</SelectItem>
                                  <SelectItem value="0.25">{t("musicComposer.quantizeMedium")}</SelectItem>
                                  <SelectItem value="0.5">{t("musicComposer.quantizeSlow")}</SelectItem>
                                  <SelectItem value="1.0">{t("musicComposer.quantizeVerySlow")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Notes Counter and Max Time - same line */}
                      {isRecording && (
                        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                          <span>{t("musicComposer.maxOneMin")}</span>
                          <span className="ml-auto">{t("musicComposer.notesRecorded", { count: currentNotes.length })}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-red-600 leading-snug pt-1">{t("musicComposer.iphonePianoHint")}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-6">
                <Card className={musicPanelClass}>
                <CardHeader>
                  <CardTitle>{t("musicComposer.enterMusicNotes")}</CardTitle>
                    <CardDescription>{t("musicComposer.notesFormatHint")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder={t("musicComposer.notesPlaceholder")}
                      rows={8}
                    />
                    <Button onClick={handleParseNotes}>{t("musicComposer.parseNotes")}</Button>
                    <div className="text-sm text-muted-foreground">
                      {t("musicComposer.notesParsed", { count: currentNotes.length })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
            )}

          {/* Controls */}
          {/* Only show when not on tracks view and not on freeplay route. Piano: only show when recording or has notes. Notes: always show */}
          {!isFreeplay && mode !== "tracks" && (((mode !== "piano") || isRecording || currentNotes.length > 0)) && (
              <Card className={cn("mt-6", musicPanelClass)}>
              <CardContent className="pt-4">
                <div className="flex gap-3 items-center flex-wrap">
                  <Button 
                    onClick={handlePlayNotes} 
                    variant={isPlaying ? "destructive" : "default"}
                    disabled={currentNotes.length === 0}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        {t("musicComposer.stop")}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        {t("musicComposer.play")}
                      </>
                    )}
                  </Button>
                  <Button onClick={handleClear} variant="outline" disabled={currentNotes.length === 0 && !isRecording}>
                    {t("musicComposer.clear")}
                  </Button>
                  
                  {/* Save Section - Only show when recording or has notes */}
                  {(isRecording || currentNotes.length > 0) && (
                    <>
                      <div className="flex-1 min-w-[200px]">
                        <Input
                          id="song-name"
                          value={songName}
                          onChange={(e) => setSongName(e.target.value)}
                          placeholder={t("musicComposer.songNamePlaceholder")}
                          className="h-9"
                        />
                      </div>
                      <Button 
                        onClick={handleSave} 
                        disabled={!songName.trim() || currentNotes.length === 0 || !hasAcceptedDisclaimer}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {t("musicComposer.save")}
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Copyright Confirmation - Only show when recording or has notes */}
                {(isRecording || currentNotes.length > 0) && (
                  <div className="flex items-start gap-2 pt-3 mt-3 border-t">
                    <Checkbox
                      id="copyright-confirm-desktop"
                      checked={hasAcceptedDisclaimer}
                      onCheckedChange={(checked) => setHasAcceptedDisclaimer(checked === true)}
                      className="mt-0.5"
                    />
                    <Label 
                      htmlFor="copyright-confirm-desktop" 
                      className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      {t("musicComposer.confirmOriginal")}
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Copyright Disclaimer - Always show for Notes, only when recording for Piano, never on tracks view or freeplay */}
            {!isFreeplay && mode !== "tracks" && (((mode !== "piano") || (mode === "piano" && isRecording))) && (
              <Card className="mt-6 border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        {t("musicComposer.originalMusicOnly")}
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        {t("musicComposer.copyrightDisclaimer")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
          </div>
        </div>
      </div>
    );
  };

  const handleStartSession = () => {
    if (sessionType === "recording" && !newSessionTrackName.trim()) {
      toast.error(t("musicComposer.toasts.enterTrackName"));
      return;
    }
    
    setSongName(sessionType === "recording" ? newSessionTrackName : "");
    setIsRecording(sessionType === "recording");
    setMode("piano");
    setShowNewSessionDialog(false);
    setCurrentNotes([]);
    setHasAcceptedDisclaimer(false);
    
    // Reset affirmation highlighting
    if (sessionType === "freeplay" && selectedAffirmationSet && selectedAffirmationSet.trim() !== "") {
      const set = affirmationSets.find(s => s.id === selectedAffirmationSet);
      if (set) {
        // Store lines (one affirmation per line)
        setCurrentAffirmationLines(set.affirmations);
        setCurrentLineIndex(0);
        // Initialize words for first line
        if (set.affirmations.length > 0) {
          const firstLineWords = set.affirmations[0].split(/\s+/);
          setCurrentAffirmationWords(firstLineWords);
        } else {
          setCurrentAffirmationWords([]);
        }
        setHighlightedWordIndex(-1);
        keyPressCountRef.current = 0;
      }
    } else {
      setCurrentAffirmationLines([]);
      setCurrentAffirmationWords([]);
      setCurrentLineIndex(0);
      setHighlightedWordIndex(-1);
      keyPressCountRef.current = 0;
    }
  };

  // Check if PWA browser (not standalone) for mobile
  const isPWABrowser = typeof window !== 'undefined' && isMobile &&
    !window.matchMedia('(display-mode: standalone)').matches &&
    !(window.navigator as any).standalone &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <>
      {renderContent()}
      
      {/* {t("musicComposer.newSession")} Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent
          className={cn(
            isCosmic ? "border border-white/12 bg-[#0f0d14] text-white" : undefined,
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("musicComposer.newSession")}</DialogTitle>
            <DialogDescription>
              {t("musicComposer.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Session Type Selection */}
            <div className="space-y-2">
              <Label>{t("musicComposer.sessionType")}</Label>
              <Select value={sessionType} onValueChange={(value: "freeplay" | "recording") => setSessionType(value)}>
                <SelectTrigger className={theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={musicMenuSurface}>
                  <SelectItem value="freeplay">{t("musicComposer.pianoTapping")}</SelectItem>
                  <SelectItem value="recording">{t("musicComposer.recordingSession")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Track Name (only for recording) */}
            {sessionType === "recording" && (
              <div className="space-y-2">
                <Label>{t("musicComposer.trackName")}</Label>
                <Input
                  value={newSessionTrackName}
                  onChange={(e) => setNewSessionTrackName(e.target.value)}
                  placeholder={t("musicComposer.trackNamePlaceholder")}
                />
              </div>
            )}

            {/* Affirmation Set (only for freeplay) */}
            {sessionType === "freeplay" && (
              <div className="space-y-2">
                <Label>{t("musicComposer.affirmationSetOptional")}</Label>
                <Select value={selectedAffirmationSet || undefined} onValueChange={(value) => setSelectedAffirmationSet(value === "none" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("musicComposer.none")} />
                  </SelectTrigger>
                  <SelectContent className={musicMenuSurface}>
                    <SelectItem value="none">{t("musicComposer.none")}</SelectItem>
                    {affirmationSets.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
              {t("musicComposer.cancel")}
            </Button>
            <Button onClick={handleStartSession} disabled={sessionType === "recording" && !newSessionTrackName.trim()}>
              {t("musicComposer.startSession")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MusicComposer;

