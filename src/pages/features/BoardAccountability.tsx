import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  ListChecks,
  LayoutGrid,
  Loader2,
  ScanSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { BoardAccountabilityFlow } from "@/components/boards/BoardAccountabilityFlow";
import { BoardActionKitTray } from "@/components/boards/BoardActionKitTray";
import { BoardGuideChatPanel } from "@/components/boards/BoardCompanionPanel";
import { usePlottingPro } from "@/hooks/usePlottingPro";
import {
  createBoardReminder,
  fetchUserWorkspaces,
  fetchWorkspaceWithBoards,
  loadDefaultWorkspace,
} from "@/lib/boards/api";
import {
  finalizeAccountabilityMap,
  normalizeAccountabilityMap,
  reminderToIso,
  scrubMapTitles,
  stripSmsText,
  type AccountabilityMap,
} from "@/lib/boards/accountabilityMap";
import type { BoardWorkspaceWithBoards } from "@/lib/boards/types";
import { downloadAccountabilityIcalFile } from "@/lib/boards/ical";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackReminderAnalytics } from "@/lib/marketingConversionTrack";
import { cn } from "@/lib/utils";
import "@/styles/board-editor.css";

export type { AccountabilityMap } from "@/lib/boards/accountabilityMap";

function storageKey(workspaceId: string) {
  return `board-accountability-map:${workspaceId}`;
}

const ACTIVE_WORKSPACE_KEY = "board-workspace-id";

const DAILY_SMS_LIMIT = 5;

function normalizeToE164(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 6 && digits.length <= 15) return `+${digits}`;
  return null;
}

function actionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === "object") {
    const record = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length) return parts.join(" ");
  }
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export default function BoardAccountability() {
  const { user } = useAuth();
  const { hasPro, loading: proLoading } = usePlottingPro();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspaceParam = searchParams.get("workspace");
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<BoardWorkspaceWithBoards | null>(null);
  const [map, setMap] = useState<AccountabilityMap | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState<string | null>(null);
  const [showReanalyzeDialog, setShowReanalyzeDialog] = useState(false);
  const [showNeedsContent, setShowNeedsContent] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [exportingIcal, setExportingIcal] = useState(false);
  const [smsRemindersEnabled, setSmsRemindersEnabled] = useState(false);
  const [smsPhoneConfigured, setSmsPhoneConfigured] = useState(false);
  const [smsConsentOk, setSmsConsentOk] = useState(false);
  const [showSmsConsentDialog, setShowSmsConsentDialog] = useState(false);
  const [smsConsentChecked, setSmsConsentChecked] = useState(false);
  const [smsPhoneInput, setSmsPhoneInput] = useState("");
  const [pendingFinalizeAfterSms, setPendingFinalizeAfterSms] = useState(false);

  const planBoard = useMemo(
    () => workspace?.boards.find((b) => b.role === "plan") ?? workspace?.boards[0] ?? null,
    [workspace],
  );

  const activeWorkspaceId = workspaceParam ?? workspace?.id ?? null;
  const visionBoardsHref = activeWorkspaceId
    ? `/dashboard/boards?workspace=${activeWorkspaceId}`
    : "/dashboard/boards";

  const persistMap = useCallback(
    (next: AccountabilityMap) => {
      const scrubbed = scrubMapTitles(next);
      setMap(scrubbed);
      if (workspace) {
        sessionStorage.setItem(storageKey(workspace.id), JSON.stringify(scrubbed));
      }
    },
    [workspace],
  );

  const loadWorkspace = useCallback(async () => {
    if (!user?.id || proLoading) return;
    setLoading(true);
    try {
      let workspaces = await fetchUserWorkspaces(user.id);
      if (workspaces.length === 0 && hasPro) {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        workspaces = await fetchUserWorkspaces(user.id);
      }

      const remembered =
        !workspaceParam && isMobile ? sessionStorage.getItem(ACTIVE_WORKSPACE_KEY) : null;

      let full: BoardWorkspaceWithBoards | null = null;
      if (workspaceParam) {
        full = await fetchWorkspaceWithBoards(workspaceParam);
      } else if (remembered) {
        full = await fetchWorkspaceWithBoards(remembered);
      } else if (workspaces.length > 0) {
        full = await loadDefaultWorkspace(user.id);
      }
      if (!full) {
        if (!hasPro) {
          navigate("/resubscribe", { replace: true });
          return;
        }
        navigate("/workspace?tab=projects", { replace: true });
        return;
      }
      sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, full.id);
      setWorkspace(full);

      let nextMap: AccountabilityMap | null = null;
      const cached = sessionStorage.getItem(storageKey(full.id));
      if (cached) {
        try {
          const parsed: unknown = JSON.parse(cached);
          nextMap = normalizeAccountabilityMap(parsed);
        } catch {
          /* ignore */
        }
      }
      setMap(nextMap);
    } catch {
      toast.error("Could not load your boards");
    } finally {
      setLoading(false);
    }
  }, [hasPro, isMobile, navigate, proLoading, user?.id, workspaceParam]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!isMobile || workspaceParam || !workspace?.id) return;
    navigate(`/dashboard/boards/accountability?workspace=${workspace.id}`, { replace: true });
  }, [isMobile, navigate, workspace?.id, workspaceParam]);

  useEffect(() => {
    document.title = "Action | Palette Plotting";
  }, []);

  const runAnalyze = async (skipConfirm = false) => {
    if (!workspace) return;
    if (map?.focuses?.length && !skipConfirm && !map.finalized) {
      setShowReanalyzeDialog(true);
      return;
    }
    setAnalyzing(true);
    setAnalyzePhase("Reading your workspace…");
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      const session =
        refreshData.session ?? (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        toast.error("Session expired — sign out and sign in again, then retry Analyze.");
        return;
      }

      window.setTimeout(() => setAnalyzePhase("Finding focus areas and actions…"), 800);
      window.setTimeout(() => setAnalyzePhase("Drafting your action map…"), 1600);

      const { data, error } = await supabase.functions.invoke("board-accountability-map", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { workspace_id: workspace.id },
      });
      if (error) throw error;

      if (data?.status === "needs_more_content") {
        setShowNeedsContent(true);
        return;
      }

      const normalized = normalizeAccountabilityMap(data);
      if (!normalized) {
        setShowNeedsContent(true);
        return;
      }
      persistMap(normalized);
      toast.dismiss();
      toast.success("Action map drafted — review and edit before finalizing", { duration: 1500 });
    } catch (error: unknown) {
      const status =
        error && typeof error === "object" && "context" in error
          ? (error as { context?: { status?: number } }).context?.status
          : undefined;
      if (status === 401) {
        toast.error("Session expired — sign out and sign in again, then retry Analyze.");
      } else if (status === 403) {
        toast.error("Plotting Pro is required to analyze your boards.");
      } else {
        toast.error("Couldn't analyze your boards. Try again in a moment.");
      }
    } finally {
      setAnalyzing(false);
      setAnalyzePhase(null);
    }
  };

  const scheduleAllReminders = async (finalizedMap: AccountabilityMap) => {
    if (!planBoard || !user?.id || !finalizedMap.reminders.length) return;

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const smsConsentOk =
      prefs?.sms_reminders_enabled === true &&
      prefs?.sms_reminder_consent_at != null &&
      prefs?.sms_reminder_opted_out_at == null;

    const hasSmsReminders = finalizedMap.reminders.some((r) => r.reminder_type === "sms");
    if (hasSmsReminders) {
      if (!prefs?.phone_number_e164?.trim()) {
        setPendingFinalizeAfterSms(true);
        setShowSmsConsentDialog(true);
        throw new Error("Add a phone number for text reminders.");
      }
      if (!smsConsentOk) {
        setPendingFinalizeAfterSms(true);
        setShowSmsConsentDialog(true);
        throw new Error("Turn on text reminders to use this channel.");
      }
      const smsInPlan = finalizedMap.reminders.filter((r) => r.reminder_type === "sms").length;
      if (smsInPlan > DAILY_SMS_LIMIT) {
        throw new Error("You can set up to 5 text reminders. Use email or calendar for the rest.");
      }
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { error: deleteErr } = await supabase
      .from("board_reminders")
      .delete()
      .eq("board_id", planBoard.id)
      .eq("user_id", user.id)
      .eq("source", "ai_extracted")
      .eq("status", "scheduled")
      .filter("metadata->>source_page", "eq", "action");
    if (deleteErr) throw deleteErr;

    for (const r of finalizedMap.reminders) {
      const reminderType = r.reminder_type ?? r.channels[0] ?? "email";
      if (reminderType === "calendar") continue;
      const channels = [reminderType];

      const body = [
        r.goal_title ? `Focus: ${r.goal_title}` : null,
        r.plan_title ? `Plan: ${r.plan_title}` : null,
        `Cadence: ${r.cadence}`,
      ]
        .filter(Boolean)
        .join(" · ");

      const smsContent =
        reminderType === "sms"
          ? stripSmsText(r.sms_text ?? r.title).slice(0, 70)
          : undefined;

      await createBoardReminder({
        board_id: planBoard.id,
        user_id: user.id,
        title: r.title,
        body,
        remind_at: reminderToIso(r),
        timezone: tz,
        channels,
        source: "ai_extracted",
        fabric_object_id: null,
        metadata: {
          source_page: "action",
          reminder_type: reminderType,
          action_id: r.action_id,
          action_title: r.title,
          focus_id: r.focus_id,
          focus_title: r.goal_title,
          plan_id: r.plan_id,
          plan_title: r.plan_title,
          cadence: r.cadence,
          day_of_month: r.day_of_month ?? null,
          day_of_week: r.day_of_week ?? null,
          remind_time: r.remind_time ?? null,
          goal_title: r.goal_title ?? null,
        },
        ...(smsContent ? { sms_content: smsContent } : {}),
      } as Parameters<typeof createBoardReminder>[0]);
    }
  };

  const runFinalize = async () => {
    if (!map) return;
    setFinalizing(true);
    try {
      const next = finalizeAccountabilityMap(map);
      await scheduleAllReminders(next);
      persistMap(next);
      toast.success("Your action map is finalized. Your reminders are ready.");
    } catch (e) {
      toast.error(actionErrorMessage(e, "Couldn't finalize your plan"));
    } finally {
      setFinalizing(false);
    }
  };

  const hasDraft = Boolean(map?.focuses?.length);
  const hasCalendarReminders = Boolean(
    map?.finalized && map.reminders.some((r) => r.reminder_type === "calendar"),
  );
  const remindersDisabled = !map?.finalized;

  const smsConfiguredCount = useMemo(() => {
    if (!map) return 0;
    if (map.finalized && map.reminders?.length) {
      return map.reminders.filter((r) => r.reminder_type === "sms").length;
    }
    let count = 0;
    for (const focus of map.focuses ?? []) {
      for (const goal of focus.goals ?? []) {
        for (const plan of goal.plans ?? []) {
          for (const action of plan.actions ?? []) {
            if (action.reminder_type === "sms" || action.channels?.sms) count++;
          }
        }
      }
    }
    return count;
  }, [map]);

  const smsCounterText = `${smsConfiguredCount} of ${DAILY_SMS_LIMIT} text reminders used`;

  const loadSmsPrefs = useCallback(async () => {
    if (!user?.id) return;
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("sms_reminders_enabled, phone_number_e164, sms_reminder_consent_at, sms_reminder_opted_out_at")
      .eq("user_id", user.id)
      .maybeSingle();
    setSmsRemindersEnabled(prefs?.sms_reminders_enabled === true);
    const phone =
      typeof prefs?.phone_number_e164 === "string" && prefs.phone_number_e164.trim()
        ? prefs.phone_number_e164.trim()
        : "";
    setSmsPhoneConfigured(Boolean(phone));
    setSmsConsentOk(
      prefs?.sms_reminder_consent_at != null && prefs?.sms_reminder_opted_out_at == null,
    );
    if (phone) setSmsPhoneInput(phone.replace(/^\+1/, ""));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void loadSmsPrefs();
  }, [user?.id, loadSmsPrefs]);

  useEffect(() => {
    const syncPrefs = () => void loadSmsPrefs();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncPrefs();
    };
    window.addEventListener("focus", syncPrefs);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", syncPrefs);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadSmsPrefs]);

  const completeSmsOptIn = async (): Promise<boolean> => {
    if (!user?.id) return false;
    const e164 = normalizeToE164(smsPhoneInput);
    if (!e164) {
      toast.error("Enter a valid U.S. phone number for text reminders.");
      return false;
    }
    if (!smsConsentChecked) {
      toast.error("Please agree to receive text reminders.");
      return false;
    }
    const now = new Date().toISOString();
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        phone_number_e164: e164,
        sms_reminders_enabled: true,
        sms_reminder_consent_at: now,
        sms_reminder_consent_source: "action",
        sms_reminder_opted_out_at: null,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      toast.error("Couldn't save text reminder preferences.");
      return false;
    }
    await supabase.from("profiles").update({ phone: e164 }).eq("id", user.id);
    setSmsRemindersEnabled(true);
    setSmsPhoneConfigured(true);
    setSmsConsentOk(true);
    trackReminderAnalytics("sms_consent_granted");
    setShowSmsConsentDialog(false);
    if (pendingFinalizeAfterSms) {
      setPendingFinalizeAfterSms(false);
      await runFinalize();
    }
    return true;
  };

  const runExportIcal = () => {
    if (!map?.finalized || !map.reminders.length) {
      toast.error(map?.finalized ? "No calendar reminders in this plan" : "Finalize your plan first");
      return;
    }

    const calendarReminders = map.reminders.filter((r) => r.reminder_type === "calendar");
    if (!calendarReminders.length) {
      toast.message("No actions have Calendar selected. Turn on Calendar for the actions you want to export.");
      return;
    }

    setExportingIcal(true);
    try {
      downloadAccountabilityIcalFile(calendarReminders, "palette-plotting-action-reminders.ics");
      toast.success("Calendar file ready");
    } catch {
      toast.error("Couldn't add to calendar");
    } finally {
      setExportingIcal(false);
    }
  };

  const smsReady = hasPro && smsRemindersEnabled && smsPhoneConfigured && smsConsentOk;

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#ebe8e3]">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <header className="flex shrink-0 items-center justify-between gap-1 border-b border-neutral-200 bg-white px-4 py-3 max-md:px-2 max-md:py-1.5">
          <div className="flex min-w-0 shrink-0 items-center gap-2 max-md:gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 max-md:h-7 max-md:w-7"
              onClick={() => navigate(visionBoardsHref)}
            >
              <ArrowLeft className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" />
            </Button>
            <ListChecks className="h-5 w-5 text-neutral-700 max-md:h-3.5 max-md:w-3.5" />
            <h1 className="text-sm font-semibold text-neutral-900 max-md:text-xs max-md:font-medium">Action</h1>
          </div>
          <div className="hidden min-w-0 items-center gap-1.5 md:flex">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={analyzing || loading}
              onClick={() => void runAnalyze()}
            >
              {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
              Analyze workspace
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={exportingIcal || remindersDisabled || !hasCalendarReminders}
              onClick={() => runExportIcal()}
            >
              {exportingIcal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Calendar export
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-stone-900 text-xs"
              disabled={!hasDraft || finalizing || map?.finalized}
              onClick={() => void runFinalize()}
            >
              {finalizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Finalize
            </Button>
            <div className="ml-1 flex shrink-0 items-center gap-2 border-l border-neutral-200 pl-2">
              <LayoutGrid className="h-5 w-5 shrink-0 text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900">Vision</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => navigate(visionBoardsHref)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 border-l border-neutral-200 pl-2 md:hidden">
            <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-neutral-700" />
            <h2 className="text-xs font-medium text-neutral-900">Vision</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => navigate(visionBoardsHref)}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        <div className="hidden shrink-0 flex-wrap items-center gap-4 border-b border-neutral-200 bg-white px-4 py-2 text-xs md:flex">
          {map?.summary ? (
            <p className="min-w-0 flex-1 text-[11px] leading-snug text-neutral-600">{map.summary}</p>
          ) : !hasDraft ? (
            <p className="text-[11px] text-neutral-500">
              Turn your workspace into an action map. Nothing is sent until you review and finalize.
            </p>
          ) : null}
          {analyzePhase ? (
            <p className="text-[11px] text-neutral-500">{analyzePhase}</p>
          ) : null}
          {map?.finalized ? (
            <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
              Finalized
            </span>
          ) : null}
          {map ? <p className="shrink-0 text-[11px] text-stone-500">{smsCounterText}</p> : null}
        </div>

        {isMobile && map ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 bg-[#f3f0eb] px-4 py-2">
            <p className="text-[11px] text-stone-500">{smsCounterText}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : !workspace ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">No workspace found</div>
        ) : (
          <div
            className={cn(
              "flex min-h-0 flex-1 overflow-hidden bg-[#ebe8e3]",
              isMobile ? "flex-col" : "flex-row",
            )}
          >
            {!isMobile && workspace ? (
              <aside className="flex w-72 shrink-0 flex-col border-r border-stone-300/80 bg-[#f3f0eb]">
                <BoardGuideChatPanel
                  mode="action"
                  workspaceId={workspace.id}
                  actionMap={map}
                  onActionMapChange={persistMap}
                />
              </aside>
            ) : null}

            {isMobile && workspace ? (
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden pb-[4.25rem]">
                <BoardAccountabilityFlow
                  map={map}
                  boards={workspace.boards}
                  onChange={persistMap}
                  smsReady={smsReady}
                  hasPro={hasPro}
                  compact
                  onRequestSmsSetup={() => {
                    setPendingFinalizeAfterSms(false);
                    setShowSmsConsentDialog(true);
                  }}
                />
                <BoardActionKitTray
                  workspaceId={workspace.id}
                  actionMap={map}
                  onActionMapChange={persistMap}
                  analyzing={analyzing}
                  loading={loading}
                  onAnalyze={() => void runAnalyze()}
                  exportingIcal={exportingIcal}
                  remindersDisabled={remindersDisabled}
                  hasCalendarReminders={hasCalendarReminders}
                  onExportIcal={runExportIcal}
                  finalizing={finalizing}
                  hasDraft={hasDraft}
                  finalized={Boolean(map?.finalized)}
                  onFinalize={() => void runFinalize()}
                />
              </div>
            ) : (
              <BoardAccountabilityFlow
                map={map}
                boards={workspace.boards}
                onChange={persistMap}
                smsReady={smsReady}
                hasPro={hasPro}
                onRequestSmsSetup={() => {
                  setPendingFinalizeAfterSms(false);
                  setShowSmsConsentDialog(true);
                }}
              />
            )}
          </div>
        )}
      </div>

      <Dialog open={showReanalyzeDialog} onOpenChange={setShowReanalyzeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-analyze workspace?</DialogTitle>
            <DialogDescription>
              This may replace your current draft. Your finalized reminders will not change unless you
              finalize again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReanalyzeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowReanalyzeDialog(false);
                void runAnalyze(true);
              }}
            >
              Re-analyze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNeedsContent} onOpenChange={setShowNeedsContent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Palette needs a little more to work with</DialogTitle>
            <DialogDescription>
              Add a few notes, images, goals or dates to your Vision workspace, then analyze again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNeedsContent(false)}>
              Close
            </Button>
            <Button onClick={() => navigate(visionBoardsHref)}>Back to Vision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSmsConsentDialog} onOpenChange={setShowSmsConsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Text reminders</DialogTitle>
            <DialogDescription>
              Text is best for important nudges. Use email or calendar for longer details. Up to 5 text reminders per
              day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="action-sms-phone">Phone number for text reminders</Label>
              <Input
                id="action-sms-phone"
                type="tel"
                inputMode="tel"
                placeholder="(555) 123-4567"
                value={smsPhoneInput}
                onChange={(e) => setSmsPhoneInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Used only for text reminders you choose.</p>
            </div>
            <label className="flex items-start gap-2">
              <Checkbox
                checked={smsConsentChecked}
                onCheckedChange={(v) => setSmsConsentChecked(v === true)}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                I agree to receive text reminders for dates, goals and actions I create in Palette. Message and data
                rates may apply. I can turn text reminders off anytime.
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSmsConsentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => void completeSmsOptIn()}>Save and continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
