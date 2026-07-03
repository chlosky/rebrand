import { useTranslation } from "react-i18next";
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Download, Save, Eye, Trash2, Plus, ChevronDown, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { useUserTier } from "@/hooks/useUserTier";
import { hasFeatureAccess, getTierLimits } from "@/lib/featureGating";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { extractRequestId, logErrorWithRequestId, isConnectionError, formatErrorMessage, localizeEdgeErrorMessage } from "@/lib/error-utils";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { recordDailyManifestationSignal } from "@/lib/manifestationPowerSignals";
import { resolveAppLocale, type AppLocale } from "@/lib/locale";

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** WebView (Android) ignores programmatic <a download>; use Filesystem + Share on all native. */
async function saveBlobViaWebOrNativeShare(blob: Blob, fileName: string): Promise<void> {
  const safeName = fileName.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 180) || "download";

  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({
      url: written.uri,
      title: safeName,
    });
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

type AnalysisMode = "eliminate" | "integrate" | null;

interface Assumption {
  id: string;
  text: string;
  subAssumptions?: Assumption[];
}

interface BeliefAnalysis {
  belief: string;
  mode: AnalysisMode;
  assumptions: Assumption[];
}

interface SavedRefactor {
  id: string;
  title: string | null;
  belief: string;
  analysis: BeliefAnalysis;
  created_at: string;
}

const RefactorContent = () => {
  const { t, i18n } = useTranslation("tools");
  const { t: tCommon } = useTranslation("common");
  const apiLocale: AppLocale = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const beliefListCardClass = cn(
    "overflow-hidden rounded-xl shadow-sm animate-fade-in transition-colors",
    theme === "dark"
      ? cn("border border-white/12 bg-transparent text-white backdrop-blur-sm", "!bg-transparent hover:bg-white/8")
      : cn(theme === "dark" ? "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm" : "border border-zinc-200/75 bg-card/75 backdrop-blur-sm", theme === "dark" ? "hover:bg-white/8" : "hover:bg-card/90"),
  );
  const beliefGhostBtnClass = cn(
    "border !bg-transparent shadow-none",
    theme === "dark"
      ? "!text-white border-white/20 hover:!bg-white/10 hover:!text-white"
      : "!text-foreground border-border/60 hover:!bg-muted/50 hover:!text-foreground",
  );
  const { tier, status } = useUserTier();
  const planGate = { tier, status };
  const tierLimits = getTierLimits(planGate);
  const [title, setTitle] = useState("");
  const [belief, setBelief] = useState("");
  const [mode, setMode] = useState<AnalysisMode | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [weeklyGenerations, setWeeklyGenerations] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showBeliefLimits, setShowBeliefLimits] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = t("refactor.pageTitle");
    return () => {
      document.title = prevTitle;
    };
  }, []);
  
  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);
  
  // Check tier access for belief refactoring features
  const canUseIntegration = hasFeatureAccess(planGate, 'belief_integration'); // Plus tier required
  const canUseElimination = hasFeatureAccess(planGate, 'belief_elimination'); // Premium tier required
  const [analysis, setAnalysis] = useState<BeliefAnalysis | null>(null);
  const visualizationRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedRefactors, setSavedRefactors] = useState<SavedRefactor[]>([]);

  const analyzeBelief = async () => {
    if (!belief.trim()) {
      toast.error(t("refactor.toasts.enterBelief"));
      return;
    }

    if (!mode) {
      toast.error(t("refactor.toasts.selectMode"));
      return;
    }

    // Check tier access
    if (mode === 'eliminate' && !canUseElimination) {
      toast.error(t("refactor.toasts.eliminationSubscribers"));
      return;
    }
    
    if (mode === 'integrate' && !canUseIntegration) {
      toast.error(t("refactor.toasts.integrationSubscribers"));
      return;
    }

    // Check weekly generation limit if rate limiting is enabled for this tier
    // REQUIRED for monetization - must block if limit is reached
    if (user && tierLimits.beliefRefactorRateLimit !== null) {
      try {
        const supabaseClient = supabase as any;
        const { data: currentWeeklyCount, error: weeklyCheckError } = await supabaseClient
          .rpc('get_weekly_belief_refactor_count', { p_user_id: user.id });

        if (weeklyCheckError) {
          console.error("Error checking weekly limit:", weeklyCheckError);
          toast.error(t("refactor.toasts.weeklyCheckFailed"));
          return;
        }

        if (currentWeeklyCount >= tierLimits.beliefRefactorRateLimit) {
          toast.error(t("refactor.toasts.weeklyLimitReached", {
            current: currentWeeklyCount,
            limit: tierLimits.beliefRefactorRateLimit,
          }));
          return;
        }
      } catch (error) {
        console.error("Error checking weekly limit:", error);
        toast.error(t("refactor.toasts.weeklyCheckFailed"));
        return;
      }
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      // CLIENT-SIDE MODERATION CHECK: REQUIRED - Use to evaluate against custom guardrails
      // This catches dynamic language, synonyms, and context that keyword matching misses
      // If this check fails or is unavailable, we MUST NOT proceed - this is a hard requirement
      try {
        const { data: moderationData, error: moderationError } = await supabase.functions.invoke("check-content-moderation", {
          body: { 
            text: belief.trim()
          },
        });

        if (moderationError) {
          console.error("Moderation check error:", moderationError);
          // HARD REQUIREMENT: If moderation check fails, block the request
          setError(t("refactor.toasts.moderationUnavailableDetail"));
          toast.error(t("refactor.toasts.moderationUnavailable"));
          setIsAnalyzing(false);
          return;
        }

        // Check if content was flagged
        if (moderationData?.flagged || !moderationData?.safe) {
          setError(t("refactor.toasts.statementNotSupported"));
          toast.error(t("refactor.toasts.statementNotSupported"));
          setIsAnalyzing(false);
          return;
        }

        // If we get here, moderation check passed - proceed
      } catch (moderationError: any) {
        // HARD REQUIREMENT: Any error in moderation check blocks the request
        console.error("Moderation check error:", moderationError);
        setError(t("refactor.toasts.moderationFailedDetail"));
        toast.error(t("refactor.toasts.moderationFailed"));
        setIsAnalyzing(false);
        return;
      }

      // If moderation passes, proceed with belief refactoring
      // Retry logic for cold start issues (max 2 attempts)
      let data = null;
      let supabaseError = null;
      const maxAttempts = 2;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await supabase.functions.invoke("refactor-belief", {
        body: { 
          belief: belief.trim(),
          mode: mode,
          locale: apiLocale,
        },
      });
        
        data = result.data;
        supabaseError = result.error;
        
        // If successful, break out of retry loop
        if (!supabaseError) {
          break;
        }
        
        // If this was the last attempt, don't retry
        if (attempt === maxAttempts) {
          break;
        }
        
        // Check if this is a guardrail rejection (400 error) - DON'T RETRY these
        if (supabaseError.message?.includes("non-2xx status code")) {
          // This is a 400 from backend = guardrail rejection, don't retry
          break;
        }
        
        // Only retry on actual cold start/timeout errors
        const isColdStartError = supabaseError.message?.includes("FunctionsHttpError") || 
                                  supabaseError.message?.includes("timeout");
        
        if (isColdStartError) {
          console.log(`Attempt ${attempt} failed (likely cold start), retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          break;
        }
      }

      // Check if user is blocked (403 error)
      if (data?.blocked) {
        const errorMsg = data.error || t("refactor.toasts.blockedDefault");
        setError(errorMsg);
        toast.error(
          <div>
            {errorMsg}
            <br />
            <a href="/terms" className="underline mt-2 inline-block">{t("refactor.viewTerms")}</a>
          </div>,
          { duration: 10000 }
        );
        setIsAnalyzing(false);
        return;
      }

      // Check if this is a guardrail rejection (400 error)
      // Backend returns 400 ONLY for guardrail violations
      if (supabaseError?.message?.includes("error code")) {
        setError(t("refactor.toasts.statementNotSupported"));
        toast.error(t("refactor.toasts.statementNotSupported"));
        setIsAnalyzing(false);
        return;
      }

      if (supabaseError) {
        logErrorWithRequestId(supabaseError, "Function error");
        
        // Other errors (not guardrail violations)
        let errorMsg;
        if (supabaseError.message?.includes("Function not found") || supabaseError.message?.includes("404")) {
          errorMsg = t("refactor.toasts.genericError");
        } else if (supabaseError.message?.includes("Failed to send")) {
          errorMsg = t("refactor.toasts.genericError");
        } else if (isConnectionError(supabaseError)) {
          errorMsg = formatErrorMessage(supabaseError, t("refactor.toasts.connectionError"));
        } else {
          // Don't surface raw edge-function / HTTP errors to users ("non-2xx status code", etc.).
          // Keep details in console via logErrorWithRequestId; show a friendly message with Request ID.
          errorMsg = formatErrorMessage(
            supabaseError,
            t("refactor.toasts.tryAgain"),
          );
        }
        
        setError(errorMsg);
        toast.error(errorMsg);
        setIsAnalyzing(false);
        return;
      }

      if (!data) {
        throw new Error(t("refactor.toasts.noAnalysisData"));
      }

      // Log successful generation to generation log IMMEDIATELY after analysis
      // CRITICAL: This counts as a generation regardless of whether user saves or not
      // Weekly rate limiting is based on GENERATIONS, not saves
      // Do this BEFORE setting analysis to ensure it happens
      let generationLogId: string | null = null;
      if (user) {
        try {
          if (import.meta.env.DEV) {
            console.log("[Generation Log] Attempting to insert generation log for user:", user.id);
          }
          
          const { data: logData, error: logError } = await supabase
            .from('belief_refactor_generation_log')
            .insert({
              user_id: user.id,
              entry_id: null, // Will be set when/if user saves (doesn't affect count)
              generated_at: new Date().toISOString(),
            })
            .select('id')
            .single();
          
          if (logError) {
            if (import.meta.env.DEV) {
              console.error("[Generation Log] Insert error:", logError);
              console.error("[Generation Log] Error details:", JSON.stringify(logError, null, 2));
            }
            toast.error(t("refactor.toasts.logFailed"));
          } else if (logData?.id) {
            generationLogId = logData.id;
            if (import.meta.env.DEV) {
              console.log("[Generation Log] Successfully logged generation with ID:", generationLogId);
            }
            // Refresh stats immediately
            await loadWeeklyStats();
          } else {
            if (import.meta.env.DEV) {
              console.error("[Generation Log] Insert returned no data");
            }
          }
        } catch (logErr) {
          if (import.meta.env.DEV) {
            console.error("[Generation Log] Exception:", logErr);
          }
          toast.error(t("refactor.toasts.logFailed"));
        }
      }

      // Now set the analysis (triggers re-render)
      setAnalysis(data);
      
      // Store the generation log ID for use when saving
      if (generationLogId) {
        // Store in a data attribute on the visualization for later reference
        sessionStorage.setItem('currentGenerationLogId', generationLogId);
      }
      
      toast.success(t("refactor.toasts.analyzedSuccess"));
    } catch (error: any) {
      console.error("Error analyzing belief:", error);
      console.error("Error stack:", error?.stack);
      const errorMessage = localizeEdgeErrorMessage(
        error?.message || t("refactor.toasts.analyzeFailed"),
        tCommon,
      );
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };


  // Visualization is now handled directly in the render - no need for buildVisualization

  const exportAsPNG = async () => {
    if (!visualizationRef.current) return;

    try {
      toast.message(t("refactor.toasts.preparingDownload"));
      const canvas = await html2canvas(visualizationRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      } as any);

      const blob: Blob | null = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 1);
      });
      if (!blob) {
        throw new Error(t("refactor.toasts.exportPngFailed"));
      }

      const fileName = title.trim()
        ? `${title.trim().replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "") || "belief-work"}.png`
        : `belief-work-${Date.now()}.png`;

      await saveBlobViaWebOrNativeShare(blob, fileName);

      toast.success(t("refactor.toasts.exportedPng"));
    } catch (error) {
      console.error("Error exporting PNG:", error);
      toast.error(t("refactor.toasts.exportPngFailed"));
    }
  };


  const loadSavedRefactors = async () => {
    if (!user) {
      // User must be logged in
      setSavedRefactors([]);
      return;
    }

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        if (import.meta.env.DEV) {
          console.warn('No valid session found, cannot load saved refactors');
        }
        setSavedRefactors([]);
        return;
      }

      // Load from database - RLS will automatically filter by auth.uid() = user_id
      // Don't filter by user_id manually - let RLS handle it for security
      const { data: dbEntries, error: dbError } = await (supabase as any)
        .from('belief_refactor_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        // Check if it's an RLS policy error
        if (dbError.message?.includes('row-level security') || dbError.message?.includes('RLS') || dbError.code === '42501' || dbError.code === 'PGRST301') {
          console.error('RLS Policy Violation:', {
            code: dbError.code,
            message: dbError.message,
            contextUserId: user.id,
          });
          toast.error(t("refactor.toasts.permissionDenied"));
        } else {
          console.error("Error loading from database:", dbError);
          toast.error(t("refactor.toasts.loadFailed"));
        }
        setSavedRefactors([]);
        return;
      }

      if (dbEntries && dbEntries.length > 0) {
        // Convert database entries to SavedRefactor format
        const entries: SavedRefactor[] = dbEntries.map(entry => ({
          id: entry.id,
          title: entry.title || null,
          belief: entry.belief,
          analysis: entry.analysis as BeliefAnalysis,
          created_at: entry.created_at,
        }));
        setSavedRefactors(entries);
      } else {
        setSavedRefactors([]);
      }
    } catch (error) {
      console.error("Error loading saved refactors:", error);
      toast.error(t("refactor.toasts.loadFailed"));
      setSavedRefactors([]);
    }
  };

  // Load weekly generation stats
  const loadWeeklyStats = useCallback(async () => {
    if (!user) {
      setWeeklyGenerations(0);
      setIsLoadingStats(false);
      return;
    }

    try {
      setIsLoadingStats(true);
      
      // Calculate weekly generations from generation log using database function
      const { data: countData, error: logError } = await (supabase as any)
        .rpc('get_weekly_belief_refactor_count', { p_user_id: user.id });

      if (logError) {
        console.error("Error loading weekly generation count:", logError);
        setWeeklyGenerations(0);
      } else {
        setWeeklyGenerations(countData || 0);
      }
    } catch (error) {
      console.error("Error loading weekly stats:", error);
      setWeeklyGenerations(0);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    loadSavedRefactors();
    if (user) {
      loadWeeklyStats();
    }
  }, [user, loadWeeklyStats]);

  const saveToTimeline = async () => {
    if (!analysis) return;

    if (!user) {
      toast.error(t("refactor.toasts.loginToSave"));
      return;
    }

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        throw new Error(t("refactor.toasts.noSession"));
      }

      const sessionUserId = freshSession.user.id;
      const entryId = crypto.randomUUID();

      // Save to database - use session user ID to match auth.uid() for RLS
      // Ensure analysis is properly serialized as JSONB
      // Validate required fields
      if (!analysis.belief || !analysis.mode || !Array.isArray(analysis.assumptions)) {
        console.error("Invalid analysis object:", analysis);
        toast.error(t("refactor.toasts.invalidAnalysis"));
        return;
      }

      // Ensure analysis is a clean JSON-serializable object
      const cleanAnalysis: BeliefAnalysis = {
        belief: analysis.belief,
        mode: analysis.mode,
        assumptions: analysis.assumptions.map((a: Assumption) => ({
          id: a.id,
          text: a.text,
          subAssumptions: a.subAssumptions ? a.subAssumptions.map((sa: Assumption) => ({
            id: sa.id,
            text: sa.text,
            subAssumptions: sa.subAssumptions || undefined,
          })) : undefined,
        })),
      };

      // Let database handle id and created_at defaults, but we can set id if needed for logging
      const insertData: any = {
        user_id: sessionUserId, // Use session user ID to match auth.uid()
        belief: cleanAnalysis.belief,
        analysis: cleanAnalysis, // Clean, serializable JSONB object
      };

      // Only add optional fields if they have values
      if (title.trim()) {
        insertData.title = title.trim();
      }
      
      // Set id explicitly so we can reference it in the generation log
      insertData.id = entryId;

      console.log("Attempting to save belief refactor:", {
        entryId,
        sessionUserId,
        hasTitle: !!title.trim(),
        beliefLength: cleanAnalysis.belief.length,
        analysisMode: cleanAnalysis.mode,
        assumptionsCount: cleanAnalysis.assumptions.length,
        insertDataKeys: Object.keys(insertData),
      });

      const { data: insertData_result, error: dbError } = await (supabase as any)
        .from('belief_refactor_entries')
        .insert(insertData)
        .select();

      if (dbError) {
        console.error("Database save error details:", {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          sessionUserId,
          contextUserId: user.id,
          fullError: dbError,
        });
        
        // Check if it's an RLS policy error
        if (dbError.message?.includes('row-level security') || dbError.message?.includes('RLS') || dbError.code === '42501' || dbError.code === 'PGRST301') {
          toast.error(t("refactor.toasts.permissionDenied"));
        } else if (dbError.code === '23502') {
          // Not null violation
          toast.error(t("refactor.toasts.missingField"));
        } else if (dbError.code === '23505') {
          // Unique violation
          toast.error(t("refactor.toasts.entryExists"));
        } else if (dbError.code === '42P01') {
          // Table doesn't exist
          toast.error(t("refactor.toasts.tableNotFound"));
          console.error("CRITICAL: belief_refactor_entries table does not exist. Migration may not have been run.");
        } else if (dbError.code === 'PGRST116') {
          // Schema not found
          toast.error(t("refactor.toasts.schemaError"));
        } else {
          toast.error(t("refactor.toasts.saveFailed", {
            message: dbError.message || dbError.code || t("refactor.toasts.genericError"),
          }));
        }
        return;
      }

      console.log("Successfully saved belief refactor entry:", insertData_result);

      // Update the generation log entry with the saved entry_id (for reference only)
      // IMPORTANT: This does NOT create a new generation log entry
      // The generation was already counted when the analysis was performed
      // We're just linking the existing log entry to the saved entry for reference
      const savedEntryId = insertData_result?.[0]?.id || entryId;
      if (savedEntryId) {
        // First try to use the stored generation log ID from the current session
        const storedLogId = sessionStorage.getItem('currentGenerationLogId');
        
        if (storedLogId) {
          // Use the stored ID directly - more reliable
          const { error: updateError } = await supabase
            .from('belief_refactor_generation_log')
            .update({ entry_id: savedEntryId })
            .eq('id', storedLogId);
          
          if (updateError) {
            console.error("Error updating generation log with entry_id:", updateError);
          } else {
            // Clear the stored ID after successful linking
            sessionStorage.removeItem('currentGenerationLogId');
          }
        } else {
          // Fallback: Find the most recent log entry for this user without an entry_id
          // This is just for linking purposes - it does NOT affect the generation count
          const { data: logEntries, error: findError } = await supabase
            .from('belief_refactor_generation_log')
            .select('id')
            .eq('user_id', sessionUserId)
            .is('entry_id', null)
            .order('generated_at', { ascending: false })
            .limit(1)
            .single();
          
          if (!findError && logEntries?.id) {
            // Update the found entry with entry_id (for reference only)
            const { error: updateError } = await supabase
              .from('belief_refactor_generation_log')
              .update({ entry_id: savedEntryId })
              .eq('id', logEntries.id);
            
            if (updateError) {
              console.error("Error updating generation log with entry_id:", updateError);
              // Don't block save if this fails - this is just for linking, not counting
            }
          }
        }
      }
      
      await loadSavedRefactors();
      // Weekly stats should already be up to date from when generation was logged
      // No need to refresh here since saving doesn't create a new generation
      toast.success(t("refactor.toasts.saved"));
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || t("refactor.toasts.saveGenericFailed"));
    }
  };

  const loadRefactor = (savedRefactor: SavedRefactor) => {
    setAnalysis(savedRefactor.analysis);
    setBelief(savedRefactor.analysis.belief);
    setTitle(savedRefactor.title || "");
    setMode(savedRefactor.analysis.mode);
    setShowCreateForm(false);
  };

  const deleteRefactor = async (id: string) => {
    if (!user) {
      toast.error(t("refactor.toasts.loginToDelete"));
      return;
    }

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        throw new Error(t("refactor.toasts.noSession"));
      }

      // Delete from database - RLS will ensure user can only delete their own entries
      // Don't filter by user_id manually - let RLS handle it
      const { error: dbError } = await (supabase as any)
        .from('belief_refactor_entries')
        .delete()
        .eq('id', id);

      if (dbError) {
        // Check if it's an RLS policy error
        if (dbError.message?.includes('row-level security') || dbError.message?.includes('RLS') || dbError.code === '42501' || dbError.code === 'PGRST301') {
          console.error('RLS Policy Violation:', {
            code: dbError.code,
            message: dbError.message,
            contextUserId: user.id,
          });
          toast.error(t("refactor.toasts.permissionDenied"));
        } else {
          console.error("Database delete error:", dbError);
          toast.error(t("refactor.toasts.deleteFailed"));
        }
        return;
      }
      
      await loadSavedRefactors();
      // Note: Weekly generations count doesn't change on delete (it's cumulative)
      toast.success(t("refactor.toasts.deleted"));
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error(error.message ? localizeEdgeErrorMessage(error.message, tCommon) : t("refactor.toasts.deleteFailed"));
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setBelief("");
    setTitle("");
    setMode(null);
    setShowCreateForm(false);
    setError(null);
  };

  const handleCreateNew = () => {
    setShowCreateForm(true);
    setAnalysis(null);
    setBelief("");
    setTitle("");
    setMode(null);
    setError(null);
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  // Check if PWA browser (not standalone) for mobile
  const isPWABrowser = typeof window !== 'undefined' && isMobile &&
    !window.matchMedia('(display-mode: standalone)').matches &&
    !(window.navigator as any).standalone &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {/* Desktop Sidebar - Only on desktop */}
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}
      
      {/* Main Content - Offset for sidebar on desktop */}
      <div 
        className="min-h-screen"
        style={!isMobile ? {
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          transition: 'margin-left 300ms ease-in-out'
        } : {}}
      >
      {/* Safe area background - fixed at top */}
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}
      {/* Header */}
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
        <div className={cn("px-4 sm:px-6 w-full flex items-center justify-between", !isMobile ? "" : "container mx-auto")}>
          <h1 
            className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
            onClick={() => {
              if (analysis) {
                // On decision tree page: go back to main list
                setAnalysis(null);
                setBelief("");
                setTitle("");
                setMode(null);
                setError(null);
              } else {
                // On main list page: go back to dashboard
                navigate("/dashboard");
              }
            }}
          >
            {t("refactor.title")}
          </h1>
          {isMobile && <MobilePWAMenu />}
        </div>
      </header>

      <main className={cn("px-4 sm:px-6 max-w-6xl pb-24 md:pb-8 overflow-x-hidden relative z-10", !isMobile ? "pt-16" : "", !isMobile ? "" : "container mx-auto")}>
        <div className="py-3 sm:py-4">
          <div className={cn("text-sm mb-4 flex items-start gap-1", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
            <p className="flex-1 min-w-0 leading-snug pr-1">
              {t("refactor.subtitle")}
            </p>
            {tierLimits.beliefRefactorRateLimit !== null ? (
              <button
                type="button"
                className={cn("shrink-0 -mt-0.5 p-1.5 rounded-md transition-colors", theme === "dark" ? "text-white/55 hover:text-white hover:bg-white/[0.06]" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}
                aria-label={showBeliefLimits ? t("refactor.hideWeeklyLimit") : t("refactor.showWeeklyLimit")}
                aria-expanded={showBeliefLimits}
                onClick={() => setShowBeliefLimits((v) => !v)}
              >
                <Settings2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {showBeliefLimits && tierLimits.beliefRefactorRateLimit !== null && (
            <div className="flex gap-3 mb-4">
              <div className={cn(theme === "dark" ? cn("border border-white/12 bg-transparent text-white backdrop-blur-sm", "rounded-lg") : "bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg", "flex-1 px-3 py-2 min-w-0")}>
                {isLoadingStats ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>{t("affirmations.loading")}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className={cn("text-xs whitespace-nowrap", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                      {t("refactor.weeklyGenerations")}
                    </span>
                    <span className="text-sm font-semibold whitespace-nowrap flex-shrink-0">
                      {weeklyGenerations}/{tierLimits.beliefRefactorRateLimit}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!analysis ? (
          !showCreateForm ? (
            // Saved Beliefs List View (Default)
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {t("refactor.yourBeliefs", { count: savedRefactors.length })}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCreateNew}
                  size="sm"
                  className={cn("shrink-0", beliefGhostBtnClass)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("refactor.createNew")}
                </Button>
              </div>
              
              {savedRefactors.length === 0 ? (
                <Card className={beliefListCardClass}>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {t("refactor.noSavedBeliefs")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                savedRefactors.map((saved) => (
                  <Collapsible key={saved.id}>
                    <Card className={beliefListCardClass}>
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 text-left">
                              <p className="font-semibold">{saved.title || saved.belief}</p>
                              <p className="text-xs text-muted-foreground">
                                {saved.analysis.mode === "eliminate" ? t("refactor.eliminate") : t("refactor.integrate")} • {format(new Date(saved.created_at), "MM/dd/yyyy")}
                              </p>
                          </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="px-4 pb-4 pt-0">
                          <div className="border-t pt-3 space-y-3">
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p><strong>{t("refactor.beliefLabel")}</strong> {saved.belief}</p>
                              <p><strong>{t("refactor.typeLabel")}</strong> {saved.analysis.mode === "eliminate" ? t("refactor.eliminate") : t("refactor.integrate")}</p>
                              <p><strong>{t("refactor.dateCreatedLabel")}</strong> {format(new Date(saved.created_at), "MM/dd/yyyy")}</p>
                            </div>
                            <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                                size="sm"
                                className={cn("flex-1", beliefGhostBtnClass)}
                            onClick={() => {
                              void recordDailyManifestationSignal("belief_view");
                              loadRefactor(saved);
                            }}
                          >
                                <Eye className="mr-2 h-3 w-3" aria-hidden />
                            {t("refactor.view")}
                          </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                            onClick={() => deleteRefactor(saved.id)}
                            aria-label={t("affirmations.delete")}
                            className="text-red-500 border-red-500/50 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 transition-all duration-200"
                          >
                                <Trash2 className="h-3 w-3" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                      </CollapsibleContent>
                  </Card>
                  </Collapsible>
                ))
              )}
            </div>
          ) : (
            // Create Form View
            <div className="space-y-4">
              <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "border-primary/20") : "border-primary/20"}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("refactor.enterYourBelief")}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                      {t("refactor.cancel")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Input
                      placeholder={t("refactor.titlePlaceholder")}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isAnalyzing}
                      maxLength={20}
                      className={cn(
                        "w-full",
                        theme === "dark" && "!bg-[#0f0d14] !text-white border-white/12 placeholder:text-white/50",
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea
                      placeholder={mode === "eliminate"
                        ? t("refactor.beliefPlaceholderEliminate")
                        : t("refactor.beliefPlaceholderIntegrate")}
                      value={belief}
                      onChange={(e) => setBelief(e.target.value)}
                      className={cn(
                        "min-h-[80px]",
                        theme === "dark" && "!bg-[#0f0d14] !text-white border-white/12 placeholder:text-white/50",
                      )}
                      disabled={isAnalyzing}
                      maxLength={250}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {t("refactor.charactersCount", { count: belief.length })}
                    </div>
                  </div>
                  
                  {/* Mode Toggle */}
                  <div className="flex gap-2">
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <span className="flex-1">
                    <Button
                      variant={mode === "eliminate" ? "default" : "outline"}
                      onClick={() => setMode("eliminate")}
                      className={cn(
                        "w-full",
                        theme === "dark" &&
                          mode !== "eliminate" &&
                          "!bg-[#0f0d14] border-white/12 text-white hover:!bg-white/10 hover:!text-white",
                      )}
                      disabled={!canUseElimination}
                    >
                            <span className="flex items-center gap-1.5">{t("refactor.eliminate")}</span>
                    </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("refactor.eliminateTooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <span className="flex-1">
                    <Button
                      variant={mode === "integrate" ? "default" : "outline"}
                      onClick={() => setMode("integrate")}
                      className={cn(
                        "w-full",
                        theme === "dark" &&
                          mode !== "integrate" &&
                          "!bg-[#0f0d14] border-white/12 text-white hover:!bg-white/10 hover:!text-white",
                      )}
                      disabled={!canUseIntegration}
                    >
                            <span className="flex items-center gap-1.5">{t("refactor.integrate")}</span>
                    </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("refactor.integrateTooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <Button
                    onClick={analyzeBelief}
                    disabled={isAnalyzing || !belief.trim() || !mode || (mode === 'eliminate' && !canUseElimination) || (mode === 'integrate' && !canUseIntegration)}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("refactor.analyzing")}
                      </>
                    ) : (
                      t("refactor.analyzeBelief")
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <p className="text-xs text-muted-foreground text-left px-4">
                {t("refactor.disclaimer")}
              </p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "!shadow-none") : "bg-card border border-border"}>
              <CardHeader>
                <div className="flex flex-col items-center gap-4">
                  <CardTitle className="text-center w-full leading-normal pb-1">
                    {analysis.mode === "eliminate" ? t("refactor.eliminateBelief") : t("refactor.integrateBelief")}
                  </CardTitle>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAsPNG}
                      className={cn("flex items-center gap-2", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      {t("refactor.png")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveToTimeline}
                      aria-label={t("refactor.save")}
                      className={cn("flex items-center gap-2", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                    >
                      <Save className="h-4 w-4" aria-hidden />
                      {t("refactor.save")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analysis ? (
                  <div
                    ref={visualizationRef}
                    data-refactor-viz
                    className={theme === "dark" ? "w-full min-h-[600px] border border-zinc-300 rounded-lg bg-white p-4 sm:p-8 overflow-auto" : "w-full min-h-[600px] border rounded-lg bg-card p-4 sm:p-8 overflow-auto"}
                    style={{ position: 'relative' }}
                  >
                    {/* Decision Tree Container */}
                    <div className="flex flex-col items-center" style={{ minHeight: '500px' }}>
                      {/* Root Node - Belief */}
                      <div className="mb-6 relative">
                        <div className="bg-black border-2 border-black text-white px-6 py-4 rounded-lg shadow-lg min-w-[200px] max-w-[300px] text-center">
                          <div className="font-bold text-base mb-1">{t("refactor.beliefNode")}</div>
                          <div className="text-sm leading-tight mb-2">{analysis.belief}</div>
                          <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-600">
                            {t("refactor.modeLabel")} {analysis.mode === "eliminate" ? t("refactor.modeEliminate") : t("refactor.modeIntegrate")}
                          </div>
                        </div>
                      </div>

                      {/* Connection Line from Root to Assumptions */}
                      {analysis.assumptions.length > 0 && (
                        <div className={cn("w-0.5 h-8 mb-2", theme === "dark" ? "bg-zinc-800" : "bg-border")}></div>
                      )}

                      {/* Assumptions Level - Horizontal Layout */}
                      {analysis.assumptions.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 items-start w-full">
                          {analysis.assumptions.map((assumption, index) => {
                            const hasSubAssumptions = assumption.subAssumptions && assumption.subAssumptions.length > 0;
                            return (
                              <div key={assumption.id} className="flex flex-col items-center flex-1 min-w-[200px] max-w-[280px]">
                                {/* Connection Line to Assumption */}
                                <div className={cn("w-0.5 h-6 mb-2", theme === "dark" ? "bg-zinc-800" : "bg-border")}></div>

                                <div className={theme === "dark" ? "bg-zinc-200 border-2 border-zinc-300 rounded-lg px-4 py-3 shadow-md w-full text-center relative text-zinc-900" : "bg-secondary border-2 border-border rounded-lg px-4 py-3 shadow-md w-full text-center relative"}>
                                  <div className="font-semibold text-xs mb-1">
                                    {t("refactor.assumption", { number: index + 1 })}
                                  </div>
                                  <div className="text-xs leading-tight">
                                    {assumption.text}
                                  </div>
                                </div>

                                {/* Sub-Assumptions */}
                                {hasSubAssumptions && (
                                  <>
                                    {/* Connection Line to Sub-Assumptions */}
                                    <div className={cn("w-0.5 h-6 my-2", theme === "dark" ? "bg-zinc-800" : "bg-border")}></div>
                                    
                                    {/* Sub-Assumptions Container - Horizontal */}
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-4 items-start w-full">
                                      {assumption.subAssumptions.map((subAssumption, subIndex) => (
                                        <div key={subAssumption.id} className="flex flex-col items-center flex-1 min-w-[140px]">
                                          {/* Connection Line to Sub-Assumption */}
                                          <div className={cn("w-0.5 h-4 mb-1", theme === "dark" ? "bg-zinc-800" : "bg-border")}></div>
                                          <div className={theme === "dark" ? "bg-white border-2 border-black rounded px-3 py-2 shadow-sm w-full text-center text-zinc-900" : "bg-card border border-border rounded px-3 py-2 shadow-sm w-full text-center"}>
                                            <div className="text-xs leading-tight">
                                              {subAssumption.text}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[600px] border rounded-lg bg-muted/20 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      {t("refactor.visualizationPlaceholder")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      </div>
    </div>
  );
};

const Refactor = () => {
  return <RefactorContent />;
};

export default Refactor;

