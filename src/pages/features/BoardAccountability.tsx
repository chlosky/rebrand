import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Download,
  ListChecks,
  LayoutGrid,
  Loader2,
  Mail,
  Phone,
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
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { BoardAccountabilityFlow } from "@/components/boards/BoardAccountabilityFlow";
import {
  createBoardReminder,
  ensureDefaultWorkspace,
  fetchUserWorkspaces,
  fetchWorkspaceWithBoards,
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
import { usePlottingPro } from "@/hooks/usePlottingPro";
import { trackReminderAnalytics } from "@/lib/marketingConversionTrack";
import { cn } from "@/lib/utils";
import "@/styles/board-editor.css";

export type { AccountabilityMap } from "@/lib/boards/accountabilityMap";

function storageKey(workspaceId: string) {
  return `board-accountability-map:${workspaceId}`;
}

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
  const { hasPro } = usePlottingPro();
  const navigate = useNavigate();
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
  const [smsUsedToday, setSmsUsedToday] = useState(0);
  const [smsRemindersEnabled, setSmsRemindersEnabled] = useState(false);
  const [showSmsConsentDialog, setShowSmsConsentDialog] = useState(false);
  const [smsConsentChecked, setSmsConsentChecked] = useState(false);
  const [smsPhoneInput, setSmsPhoneInput] = useState("");
  const [pendingFinalizeAfterSms, setPendingFinalizeAfterSms] = useState(false);

  const planBoard = useMemo(
    () => workspace?.boards.find((b) => b.role === "plan") ?? workspace?.boards[0] ?? null,
    [workspace],
  );

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
    if (!user?.id) return;
    setLoading(true);
    try {
      const workspaces = await fetchUserWorkspaces(user.id);
      const full =
        workspaces.length === 0
          ? await ensureDefaultWorkspace(user.id)
          : await fetchWorkspaceWithBoards(workspaces[0].id);
      if (!full) throw new Error("workspace missing");
      setWorkspace(full);
      const cached = sessionStorage.getItem(storageKey(full.id));
      if (cached) {
        try {
          const parsed: unknown = JSON.parse(cached);
          const normalized = normalizeAccountabilityMap(parsed);
          if (normalized) {
            setMap(normalized);
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      toast.error("Could not load your boards");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

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
      toast.success("Action map drafted — review and edit before finalizing");
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

    const hasSmsReminders = finalizedMap.reminders.some((r) => r.channels.includes("sms"));
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
      if (smsUsedToday >= DAILY_SMS_LIMIT) {
        throw new Error("You've used today's 5 text reminders. Use email or calendar instead.");
      }
      const smsInPlan = finalizedMap.reminders.filter((r) => r.channels.includes("sms")).length;
      if (smsUsedToday + smsInPlan > DAILY_SMS_LIMIT) {
        throw new Error("You've used today's 5 text reminders. Use email or calendar instead.");
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
      const channels = r.channels.filter((c) => c === "email" || c === "sms");
      if (channels.length === 0) continue;

      const body = r.goal_title ? `Focus: ${r.goal_title} · ${r.cadence}` : r.cadence;
      const smsContent = channels.includes("sms")
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
      void refreshSmsUsage();
      toast.success("Your action map is finalized. Your reminders are ready.");
    } catch (e) {
      toast.error(actionErrorMessage(e, "Couldn't finalize your plan"));
    } finally {
      setFinalizing(false);
    }
  };

  const hasDraft = Boolean(map?.focuses?.length);
  const remindersDisabled = !map?.finalized;

  const reminderHelperText = remindersDisabled
    ? hasDraft
      ? "Finalize your plan to enable reminders."
      : "Analyze your workspace first."
    : "Your reminder channels are active for finalized actions.";

  const smsCounterText = `${smsUsedToday} of ${DAILY_SMS_LIMIT} text reminders used today`;

  const refreshSmsUsage = useCallback(async () => {
    setSmsUsedToday(0);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setSmsRemindersEnabled(prefs?.sms_reminders_enabled === true);
      if (typeof prefs?.phone_number_e164 === "string" && prefs.phone_number_e164.trim()) {
        setSmsPhoneInput(prefs.phone_number_e164.replace(/^\+1/, ""));
      }
      void refreshSmsUsage();
    })();
  }, [user?.id, refreshSmsUsage]);

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

    const calendarReminders = map.reminders.filter((r) => r.channels.includes("calendar"));
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

  const smsReady = smsRemindersEnabled;

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#ebe8e3]">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            {isMobile && <MobilePWAMenu />}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard/boards")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ListChecks className="h-5 w-5 text-neutral-700" />
            <div>
              <h1 className="text-sm font-semibold text-neutral-900">Action</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {hasDraft && !map?.finalized ? (
              <Button
                size="sm"
                className="gap-1 bg-stone-900 text-xs"
                disabled={finalizing}
                onClick={() => void runFinalize()}
              >
                {finalizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Finalize
              </Button>
            ) : null}
            {isMobile && (
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
            )}
            <div
              className={`flex items-center gap-2${isMobile ? " ml-1 border-l border-neutral-200 pl-2" : ""}`}
            >
              <LayoutGrid className="h-5 w-5 shrink-0 text-neutral-700" />
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Vision</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/dashboard/boards")}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-neutral-200 bg-white px-4 py-2 text-xs">
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
        </div>

        {isMobile ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 bg-[#f3f0eb] px-4 py-2.5">
            <Label className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Reminder channels
            </Label>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 bg-white text-xs"
              disabled={exportingIcal || remindersDisabled}
              onClick={() => runExportIcal()}
            >
              {exportingIcal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Calendar export
            </Button>
            {reminderHelperText ? (
              <p className="text-[11px] text-stone-500">{reminderHelperText}</p>
            ) : null}
            {!remindersDisabled ? (
              <p className="text-[11px] text-stone-500">{smsCounterText}</p>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : !workspace ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">No workspace found</div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden bg-[#ebe8e3]">
            {!isMobile && (
              <aside className="flex w-56 shrink-0 flex-col border-r border-stone-300/80 bg-[#f3f0eb] p-3 text-xs">
                <Label className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">How it works</Label>
                <p className="mt-2 leading-relaxed text-stone-700">
                  Palette reads your Vision workspace and drafts an action map from your boards, notes, images and The
                  Plan. Review, edit or remove anything, then finalize reminders.
                </p>
                <Button
                  className="mt-4 w-full gap-1 bg-stone-900 text-xs"
                  size="sm"
                  disabled={analyzing}
                  onClick={() => void runAnalyze()}
                >
                  {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
                  Analyze workspace
                </Button>
                <Button
                  className="mt-2 w-full gap-1 text-xs"
                  size="sm"
                  disabled={!hasDraft || finalizing || map?.finalized}
                  onClick={() => void runFinalize()}
                >
                  {finalizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Finalize plan
                </Button>
                <Label className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                  Reminder channels
                </Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium",
                      remindersDisabled ? "border-stone-200 text-stone-400" : "border-stone-300 text-stone-700",
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    Calendar
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium",
                      remindersDisabled ? "border-stone-200 text-stone-400" : "border-stone-300 text-stone-700",
                    )}
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium",
                      remindersDisabled ? "border-stone-200 text-stone-400" : "border-stone-300 text-stone-700",
                    )}
                  >
                    <Phone className="h-3 w-3" />
                    Text
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-stone-600">
                  Calendar = scheduled follow-through. Email = soft accountability. Text = stronger nudge.
                </p>
                <Button
                  variant="outline"
                  className="mt-2 w-full gap-1 text-xs"
                  size="sm"
                  disabled={exportingIcal || remindersDisabled}
                  onClick={() => runExportIcal()}
                >
                  {exportingIcal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Calendar export
                </Button>
                {reminderHelperText ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-stone-500">{reminderHelperText}</p>
                ) : null}
                {!remindersDisabled ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{smsCounterText}</p>
                ) : null}
              </aside>
            )}

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
            <Button onClick={() => navigate("/dashboard/boards")}>Back to Vision</Button>
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
