# Action Page Code Dump

Generated from the current working tree. This file is for review/reference only.

## Action page route

`src/pages/features/BoardAccountability.tsx`

````tsx
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

````

## Action map UI

`src/components/boards/BoardAccountabilityFlow.tsx`

````tsx
import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type {
  AccountabilityAction,
  AccountabilityMap,
  AccountabilityPlan,
  MapCadence,
  ReminderChannelFlags,
} from "@/lib/boards/accountabilityMap";
import {
  CADENCE_OPTIONS,
  DAILY_TIME_QUICK_OPTIONS,
  DEFAULT_REMINDER_CHANNELS,
  naturalizeTitle,
  SMS_MAX_LENGTH,
  stripChromeFromInput,
  stripSmsText,
  smsTextFromTitle,
  WEEKDAY_OPTIONS,
} from "@/lib/boards/accountabilityMap";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BoardAccountabilityFlowProps = {
  map: AccountabilityMap | null;
  boards: Board[];
  onChange: (map: AccountabilityMap) => void;
  smsReady?: boolean;
  hasPro?: boolean;
  onRequestSmsSetup?: () => void;
};

const MAP_GRID = "grid-cols-[240px_minmax(220px,280px)_minmax(460px,1fr)]";
const PLAN_ACTION_GRID = "grid-cols-[minmax(220px,280px)_32px_minmax(460px,1fr)]";

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function visible<T extends { status: string }>(items: T[]) {
  return items.filter((i) => i.status !== "rejected");
}

function suggestedBorder(status: string) {
  return status === "suggested" ? "border-neutral-300/90" : "border-neutral-200";
}

const PILL_SELECT =
  "h-7 shrink-0 rounded-lg border-0 bg-neutral-100 px-2 text-[11px] text-neutral-700 outline-none focus:ring-1 focus:ring-neutral-300";

type ReminderType = "calendar" | "email" | "sms";

function primaryReminderType(channels: ReminderChannelFlags): ReminderType {
  if (channels.sms) return "sms";
  if (channels.calendar) return "calendar";
  return "email";
}

function reminderTypeToChannels(type: ReminderType): ReminderChannelFlags {
  return { calendar: type === "calendar", email: type === "email", sms: type === "sms" };
}

function CadenceTimingControls({
  cadence,
  remind_date,
  remind_day_of_month,
  remind_day_of_week,
  remind_time,
  locked,
  onCadence,
  onRemindDate,
  onDayOfMonth,
  onDayOfWeek,
  onTime,
}: {
  cadence: MapCadence;
  remind_date: string | null;
  remind_day_of_month: number | null;
  remind_day_of_week: string | null;
  remind_time: string | null;
  locked: boolean;
  onCadence: (c: MapCadence) => void;
  onRemindDate: (d: string) => void;
  onDayOfMonth: (d: number) => void;
  onDayOfWeek: (d: string) => void;
  onTime: (t: string) => void;
}) {
  const timeValue = remind_time ?? "09:00";
  const timeOptions: readonly string[] =
    (DAILY_TIME_QUICK_OPTIONS as readonly string[]).includes(timeValue)
      ? DAILY_TIME_QUICK_OPTIONS
      : [...DAILY_TIME_QUICK_OPTIONS, timeValue];

  const timeLabel = (t: string) => {
    const [h, m] = t.split(":").map((x) => parseInt(x, 10));
    const hour = Number.isFinite(h) ? h : 9;
    const min = Number.isFinite(m) ? m : 0;
    const period = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${String(min).padStart(2, "0")} ${period}`;
  };

  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-1">
      <select
        disabled={locked}
        value={cadence}
        onChange={(e) => onCadence(e.target.value as MapCadence)}
        className={cn(PILL_SELECT, "w-[76px] capitalize")}
      >
        {CADENCE_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>
      <div
        className={cn(
          "shrink-0",
          cadence === "daily" ? "w-0 overflow-hidden" : cadence === "once" ? "w-[120px]" : "w-[80px]",
        )}
      >
        {cadence === "once" ? (
          <input
            type="date"
            disabled={locked}
            value={remind_date ?? ""}
            onChange={(e) => onRemindDate(e.target.value)}
            className={cn(PILL_SELECT, "w-full")}
          />
        ) : cadence === "monthly" ? (
          <select
            disabled={locked}
          value={String(Math.min(31, Math.max(1, remind_day_of_month ?? 1)))}
          onChange={(e) => onDayOfMonth(parseInt(e.target.value, 10))}
            className={cn(PILL_SELECT, "w-full")}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                Day {d}
              </option>
            ))}
          </select>
        ) : cadence === "weekly" ? (
          <select
            disabled={locked}
            value={remind_day_of_week ?? "monday"}
            onChange={(e) => onDayOfWeek(e.target.value)}
            className={cn(PILL_SELECT, "w-full capitalize")}
          >
            {WEEKDAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d.slice(0, 3)}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <select
        disabled={locked}
        value={timeValue}
        onChange={(e) => onTime(e.target.value)}
        className={cn(PILL_SELECT, "w-[96px]")}
      >
        {timeOptions.map((t) => (
          <option key={t} value={t}>
            {timeLabel(t)}
          </option>
        ))}
      </select>
    </div>
  );
}

function PlanNodeRow({
  title,
  placeholder,
  status,
  locked,
  onTitle,
  onAddAction,
  onReject,
  onDelete,
  className,
}: {
  title: string;
  placeholder: string;
  status: string;
  locked: boolean;
  onTitle: (v: string) => void;
  onAddAction?: () => void;
  onReject: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[40px] w-full flex-wrap items-center gap-1.5 rounded-xl border bg-white/95 py-1 pl-2.5 pr-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        suggestedBorder(status),
        className,
      )}
      data-map-node
    >
      <Input
        value={title}
        disabled={locked}
        onChange={(e) => onTitle(stripChromeFromInput(e.target.value))}
        onBlur={(e) => {
          const cleaned = naturalizeTitle(e.target.value);
          if (cleaned !== e.target.value) onTitle(cleaned);
        }}
        className="h-8 min-w-[120px] flex-1 border-0 bg-transparent px-1 text-sm font-medium text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-0"
        placeholder={placeholder}
      />
      {!locked && onAddAction ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddAction();
          }}
          className="shrink-0 rounded-full border border-dashed border-neutral-300 bg-white/70 px-2.5 py-1 text-[10px] text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
        >
          <Plus className="mr-1 inline h-3 w-3" />
          Add action
        </button>
      ) : null}
      <RejectOrDeleteButton
        suggested={status === "suggested"}
        locked={locked}
        onReject={onReject}
        onDelete={onDelete}
      />
    </div>
  );
}

function ActionNodeRow({
  action,
  locked,
  smsReady,
  hasPro,
  onRequestSmsSetup,
  onPatch,
  onReject,
  onDelete,
}: {
  action: AccountabilityAction;
  locked: boolean;
  smsReady: boolean;
  hasPro: boolean;
  onRequestSmsSetup?: () => void;
  onPatch: (patch: Partial<AccountabilityAction>) => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const smsLen = stripSmsText(action.sms_text ?? smsTextFromTitle(action.title)).length;
  const smsOver = smsLen > SMS_MAX_LENGTH;

  const reminderType = primaryReminderType(action.channels);

  const onReminderTypeChange = (type: ReminderType) => {
    if (type === "sms") {
      if (!hasPro) return;
      if (!smsReady) {
        onRequestSmsSetup?.();
        return;
      }
    }
    const channels = reminderTypeToChannels(type);
    const patch: Partial<AccountabilityAction> = { channels };
    if (type === "sms" && !action.sms_text) {
      patch.sms_text = smsTextFromTitle(action.title);
    }
    if (type !== "sms") {
      patch.sms_text = null;
    }
    onPatch(patch);
  };

  return (
    <div className="flex w-full max-w-full flex-col gap-1" data-map-node>
      <div
        className={cn(
          "inline-flex min-h-[40px] w-full flex-wrap items-center gap-1.5 rounded-xl border bg-white/95 py-1 pl-2.5 pr-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
          suggestedBorder(action.status),
        )}
      >
        <Input
          value={action.title}
          disabled={locked}
          onChange={(e) => onPatch({ title: stripChromeFromInput(e.target.value) })}
          onBlur={(e) => {
            const cleaned = naturalizeTitle(e.target.value);
            if (cleaned !== e.target.value) onPatch({ title: cleaned });
          }}
          className="h-8 min-w-[100px] flex-1 border-0 bg-transparent px-1 text-sm font-medium text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-0"
          placeholder="Action"
        />
        <select
          disabled={locked}
          value={reminderType}
          onChange={(e) => onReminderTypeChange(e.target.value as ReminderType)}
          className={cn(PILL_SELECT, "w-[96px]")}
          title="Reminder type"
        >
          <option value="calendar">Calendar</option>
          <option value="email">Email</option>
          <option value="sms" disabled={!hasPro}>
            Text
          </option>
        </select>
        <CadenceTimingControls
          cadence={action.cadence}
          remind_date={action.remind_date}
          remind_day_of_month={action.remind_day_of_month}
          remind_day_of_week={action.remind_day_of_week}
          remind_time={action.remind_time}
          locked={locked}
          onCadence={(c) => onPatch({ cadence: c, ...applyCadenceFields(c) })}
          onRemindDate={(d) => onPatch({ remind_date: d })}
          onDayOfMonth={(d) => onPatch({ remind_day_of_month: d })}
          onDayOfWeek={(d) => onPatch({ remind_day_of_week: d })}
          onTime={(t) => onPatch({ remind_time: t })}
        />
        <RejectOrDeleteButton
          suggested={action.status === "suggested"}
          locked={locked}
          onReject={onReject}
          onDelete={onDelete}
        />
      </div>

      {action.channels.sms && !locked ? (
        <div className="flex flex-wrap items-center gap-2 px-2.5 pb-0.5">
          <span className="shrink-0 text-[10px] text-neutral-500">Text reminder</span>
          <Input
            value={action.sms_text ?? smsTextFromTitle(action.title)}
            onChange={(e) =>
              onPatch({ sms_text: stripSmsText(e.target.value).slice(0, SMS_MAX_LENGTH) })
            }
            className="h-7 min-w-[160px] flex-1 text-sm"
            maxLength={SMS_MAX_LENGTH}
            placeholder="70 characters max"
          />
          <span className={cn("shrink-0 text-[10px]", smsOver ? "text-destructive" : "text-neutral-400")}>
            {smsLen}/{SMS_MAX_LENGTH}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function applyCadenceFields(cadence: MapCadence): Pick<
  AccountabilityAction,
  "remind_day_of_month" | "remind_day_of_week" | "remind_date"
> {
  if (cadence === "monthly") return { remind_day_of_month: 1, remind_day_of_week: null, remind_date: null };
  if (cadence === "weekly") return { remind_day_of_month: null, remind_day_of_week: "monday", remind_date: null };
  if (cadence === "once") {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return { remind_day_of_month: null, remind_day_of_week: null, remind_date: d.toISOString().slice(0, 10) };
  }
  return { remind_day_of_month: null, remind_day_of_week: null, remind_date: null };
}

function RejectOrDeleteButton({
  suggested,
  locked,
  onReject,
  onDelete,
}: {
  suggested: boolean;
  locked: boolean;
  onReject: () => void;
  onDelete: () => void;
}) {
  if (locked) return null;
  return (
    <button
      type="button"
      className="shrink-0 text-neutral-400 hover:text-neutral-900"
      title={suggested ? "Reject" : "Delete"}
      onClick={suggested ? onReject : onDelete}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

export function BoardAccountabilityFlow({
  map,
  boards,
  onChange,
  smsReady = false,
  hasPro = false,
  onRequestSmsSetup,
}: BoardAccountabilityFlowProps) {
  const boardById = new Map(boards.map((b) => [b.id, b]));
  const viewportRef = useRef<HTMLDivElement>(null);
  const panDrag = useRef<{ sx: number; sy: number; sl: number; st: number } | null>(null);

  const isInteractiveTarget = (target: EventTarget | null) =>
    !!(target as Element)?.closest?.(
      "[data-map-node], input, button, select, textarea, a, [role='button']",
    );

  const onPanStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || isInteractiveTarget(e.target)) return;
    const el = viewportRef.current;
    if (!el) return;
    panDrag.current = { sx: e.clientX, sy: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
    el.setPointerCapture(e.pointerId);
    el.classList.add("cursor-grabbing");
    el.classList.remove("cursor-grab");
  };

  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panDrag.current || !viewportRef.current) return;
    const dx = e.clientX - panDrag.current.sx;
    const dy = e.clientY - panDrag.current.sy;
    viewportRef.current.scrollLeft = panDrag.current.sl - dx;
    viewportRef.current.scrollTop = panDrag.current.st - dy;
  };

  const onPanEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panDrag.current) return;
    panDrag.current = null;
    const el = viewportRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    el?.classList.remove("cursor-grabbing");
    el?.classList.add("cursor-grab");
  };

  const locked = map?.finalized ?? false;

  const patch = (next: AccountabilityMap) => {
    const withEdited = { ...next, edited_at: new Date().toISOString() };
    if (map?.finalized) {
      onChange({ ...withEdited, finalized: false, reminders: [], analysis_status: "draft_ready" });
    } else {
      onChange(withEdited);
    }
  };

  const updatePlan = (id: string, patchPlan: Partial<AccountabilityPlan>) => {
    if (!map) return;
    patch({
      ...map,
      plans: map.plans.map((p) => (p.id === id ? { ...p, ...patchPlan } : p)),
    });
  };

  const rejectPlan = (id: string) => {
    if (!map) return;
    patch({
      ...map,
      plans: map.plans.map((p) => (p.id === id ? { ...p, status: "rejected" } : p)),
    });
  };

  const deletePlan = (id: string) => {
    if (!map) return;
    patch({
      ...map,
      plans: map.plans.filter((p) => p.id !== id),
      actions: map.actions.filter((a) => a.plan_id !== id),
    });
  };

  const addPlan = (focusId: string) => {
    if (!map) return;
    const plan: AccountabilityPlan = {
      id: newId("plan"),
      focus_id: focusId,
      title: "",
      cadence: "monthly",
      remind_day_of_month: null,
      remind_day_of_week: null,
      remind_time: null,
      status: "accepted",
    };
    patch({ ...map, plans: [...map.plans, plan] });
  };

  const updateAction = (id: string, patchAction: Partial<AccountabilityAction>) => {
    if (!map) return;
    patch({
      ...map,
      actions: map.actions.map((a) => (a.id === id ? { ...a, ...patchAction } : a)),
    });
  };

  const rejectAction = (id: string) => {
    if (!map) return;
    patch({
      ...map,
      actions: map.actions.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)),
    });
  };

  const deleteAction = (id: string) => {
    if (!map) return;
    patch({ ...map, actions: map.actions.filter((a) => a.id !== id) });
  };

  const addAction = (planId: string) => {
    if (!map) return;
    const action: AccountabilityAction = {
      id: newId("action"),
      plan_id: planId,
      title: "",
      cadence: "weekly",
      remind_date: null,
      remind_day_of_month: null,
      remind_day_of_week: "monday",
      remind_time: "09:00",
      status: "accepted",
      kind: "action",
      step_type: "task",
      reminder_enabled: true,
      channels: { ...DEFAULT_REMINDER_CHANNELS },
      sms_text: null,
      source_evidence: null,
      confidence: null,
    };
    patch({ ...map, actions: [...map.actions, action] });
  };

  const applyCadence = (cadence: MapCadence): Pick<AccountabilityPlan, "remind_day_of_month" | "remind_day_of_week"> => {
    if (cadence === "monthly") return { remind_day_of_month: 1, remind_day_of_week: null };
    if (cadence === "weekly") return { remind_day_of_month: null, remind_day_of_week: "monday" };
    return { remind_day_of_month: null, remind_day_of_week: null };
  };

  const lowConfidence =
    map?.meta_confidence != null && map.meta_confidence < 0.65 && !map.finalized;

  return (
    <main
      ref={viewportRef}
      className="min-h-0 min-w-0 flex-1 cursor-grab overflow-auto overscroll-contain touch-pan-x touch-pan-y"
      onPointerDown={onPanStart}
      onPointerMove={onPanMove}
      onPointerUp={onPanEnd}
      onPointerCancel={onPanEnd}
      onPointerLeave={onPanEnd}
    >
      <div className="inline-block min-w-[1180px] p-12">
        {!map?.focuses?.length ? (
          <div className="flex min-h-[320px] max-w-lg flex-col items-center justify-center px-6 text-center">
            <h2 className="text-lg font-semibold text-neutral-900">
              Turn your workspace into an action map
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Analyze your Vision workspace to draft focus areas, plans, actions and reminders. You
              can edit everything before anything is finalized.
            </p>
            <p className="mt-3 text-xs text-neutral-500">Nothing is sent until you review and finalize.</p>
          </div>
        ) : (
          <>
            {lowConfidence ? (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                Palette found a few possible actions. Review closely before finalizing.
              </div>
            ) : null}
            <div
              className={cn(
                "mb-6 grid gap-8 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500",
                MAP_GRID,
              )}
            >
              <span>Focus</span>
              <span>Plan</span>
              <span className="pl-6">Action</span>
            </div>

            <div className="space-y-6">
              {map.focuses.map((focus) => {
                const board = boardById.get(focus.board_id);
                const headerFill = board ? boardFillForKey(board.color_key) : "#f5f5f5";
                const plansForFocus = visible(map.plans.filter((p) => p.focus_id === focus.id));

                return (
                  <section key={focus.id} className={cn("relative grid items-start gap-8", MAP_GRID)}>
                    <div className="relative">
                      <div
                        className="relative min-h-[92px] rounded-2xl border border-black/5 px-4 py-3 shadow-sm"
                        style={{ backgroundColor: headerFill }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">Focus</p>
                        <p className="mt-2 line-clamp-2 text-base font-semibold text-neutral-950">{focus.title}</p>
                        {!locked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addPlan(focus.id);
                            }}
                            className="mt-3 rounded-full border border-black/10 bg-white/55 px-2.5 py-1 text-[10px] font-medium text-neutral-700 hover:bg-white/75"
                          >
                            <Plus className="mr-1 inline h-3 w-3" />
                            Add plan
                          </button>
                        ) : null}
                      </div>
                      {plansForFocus.length > 0 ? (
                        <div className="pointer-events-none absolute right-0 top-1/2 h-px w-8 translate-x-full bg-neutral-300" />
                      ) : null}
                    </div>

                    <div className="col-span-2 relative">
                      {plansForFocus.length > 0 ? (
                        <div className="pointer-events-none absolute bottom-5 left-0 top-5 w-px bg-neutral-300" />
                      ) : null}
                      <div className="space-y-3 pl-6">
                      {plansForFocus.length === 0 ? null : plansForFocus.map((plan) => {
                        const actionsForPlan = visible(map.actions.filter((a) => a.plan_id === plan.id));
                        return (
                          <div
                            key={plan.id}
                            className={cn("grid items-start", PLAN_ACTION_GRID)}
                          >
                            <div className="relative">
                              <div className="pointer-events-none absolute left-[-24px] top-5 h-px w-6 bg-neutral-300" />
                              <PlanNodeRow
                                title={plan.title}
                                placeholder="Plan name"
                                status={plan.status}
                                locked={locked}
                                onTitle={(v) => updatePlan(plan.id, { title: v })}
                                onAddAction={() => addAction(plan.id)}
                                onReject={() => rejectPlan(plan.id)}
                                onDelete={() => deletePlan(plan.id)}
                              />
                            </div>
                            <div className="relative min-h-[40px]">
                              {actionsForPlan.length > 0 ? (
                                <div className="pointer-events-none absolute left-0 right-0 top-5 h-px bg-neutral-300" />
                              ) : null}
                            </div>
                            <div className="relative pl-6">
                              {actionsForPlan.length > 0 ? (
                                <div className="pointer-events-none absolute bottom-5 left-0 top-5 w-px bg-neutral-300" />
                              ) : null}
                              <div className="flex flex-col items-start gap-3">
                                {actionsForPlan.map((action) => (
                                  <div key={action.id} className="relative w-full">
                                    <div className="pointer-events-none absolute left-[-24px] top-5 h-px w-6 bg-neutral-300" />
                                    <ActionNodeRow
                                      action={action}
                                      locked={locked}
                                      smsReady={smsReady}
                                      hasPro={hasPro}
                                      onRequestSmsSetup={onRequestSmsSetup}
                                      onPatch={(patchAction) => updateAction(action.id, patchAction)}
                                      onReject={() => rejectAction(action.id)}
                                      onDelete={() => deleteAction(action.id)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

````

## Action map data model

`src/lib/boards/accountabilityMap.ts`

````ts
export type ActionItemStatus = "suggested" | "accepted" | "rejected";

export type MapCadence = "once" | "monthly" | "weekly" | "daily";

export type StepType =
  | "task"
  | "deadline"
  | "appointment"
  | "purchase"
  | "follow_up"
  | "review"
  | "custom";

export type ReminderChannelFlags = {
  calendar: boolean;
  email: boolean;
  sms: boolean;
};

export const DEFAULT_REMINDER_CHANNELS: ReminderChannelFlags = {
  calendar: false,
  email: true,
  sms: false,
};

export const STEP_TYPE_OPTIONS: StepType[] = [
  "task",
  "deadline",
  "appointment",
  "purchase",
  "follow_up",
  "review",
  "custom",
];

export const SMS_MAX_LENGTH = 70;

export type AccountabilityFocus = {
  id: string;
  board_id: string;
  title: string;
};

export type AccountabilityReviewCycle = {
  title: string;
  remind_date: string | null;
  remind_time: string | null;
};

export type AccountabilityPlan = {
  id: string;
  focus_id: string;
  title: string;
  cadence: MapCadence;
  remind_day_of_month: number | null;
  remind_day_of_week: string | null;
  remind_time: string | null;
  status: ActionItemStatus;
};

export type AccountabilityAction = {
  id: string;
  plan_id: string;
  title: string;
  cadence: MapCadence;
  remind_date: string | null;
  remind_day_of_month: number | null;
  remind_day_of_week: string | null;
  remind_time: string | null;
  status: ActionItemStatus;
  kind: "action" | "micro";
  step_type: StepType;
  reminder_enabled: boolean;
  channels: ReminderChannelFlags;
  sms_text: string | null;
  source_evidence: string | null;
  confidence: number | null;
};

export type AccountabilityReminderCadence = "quarterly" | "monthly" | "weekly" | "daily";

export type AccountabilityReminder = {
  title: string;
  cadence: AccountabilityReminderCadence;
  goal_title: string;
  channels: string[];
  remind_date?: string | null;
  remind_time?: string | null;
  day_of_month?: number | null;
  day_of_week?: string | null;
  sms_text?: string | null;
};

export type AccountabilityMap = {
  version: 2;
  summary: string;
  finalized: boolean;
  analysis_status?: "draft" | "draft_ready" | "needs_more_content" | "finalized";
  analyzed_at?: string | null;
  edited_at?: string | null;
  finalized_at?: string | null;
  meta_confidence?: number | null;
  unmapped_items?: { text: string; reason: string }[];
  review_cycle: AccountabilityReviewCycle;
  focuses: AccountabilityFocus[];
  plans: AccountabilityPlan[];
  actions: AccountabilityAction[];
  reminders: AccountabilityReminder[];
};

export const WEEKDAY_OPTIONS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const DAILY_TIME_QUICK_OPTIONS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "12:00",
  "15:00",
  "18:00",
  "20:00",
  "22:00",
] as const;

export const CADENCE_OPTIONS: MapCadence[] = ["once", "monthly", "weekly", "daily"];

const DEFAULT_TIME = "09:00";

function defaultReviewDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asStatus(v: unknown): ActionItemStatus {
  if (v === "accepted" || v === "rejected" || v === "suggested") return v;
  return "suggested";
}

function asCadence(v: unknown, fallback: MapCadence = "weekly"): MapCadence {
  if (v === "once" || v === "monthly" || v === "weekly" || v === "daily") return v;
  return fallback;
}

function asStepType(v: unknown): StepType {
  const allowed: StepType[] = [
    "task",
    "deadline",
    "appointment",
    "purchase",
    "follow_up",
    "review",
    "custom",
  ];
  return allowed.includes(v as StepType) ? (v as StepType) : "task";
}

function parseChannels(raw: unknown): ReminderChannelFlags {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_REMINDER_CHANNELS };
  const o = raw as Record<string, unknown>;
  return {
    calendar: o.calendar === true,
    email: o.email !== false,
    sms: o.sms === true,
  };
}

export function stripSmsText(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function smsTextFromTitle(title: string): string {
  return stripSmsText(title).slice(0, SMS_MAX_LENGTH);
}

export function isJunkBoardText(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return true;
  if (t === "untitled") return true;
  if (/^\+?\s*add\s*line\.?$/.test(t)) return true;
  if (/^add\s*(row|line)\.?$/.test(t)) return true;
  if (/add\s*line/.test(t) && t.length <= 32) return true;
  return false;
}

export function naturalizeTitle(title: string): string {
  const t = title
    .replace(/\+?\s*add\s*line/gi, "")
    .replace(/\badd\s*line\b/gi, "")
    .replace(/^Monthly goal:\s*/i, "")
    .replace(/^Weekly touchpoint\s*[—-]\s*/i, "")
    .replace(/^From The Plan:\s*/i, "")
    .replace(/^5-minute action toward\s*/i, "")
    .replace(/\s*[—-]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return isJunkBoardText(t) ? "" : t;
}

export function stripChromeFromInput(text: string): string {
  return text.replace(/\+?\s*add\s*line/gi, "").replace(/\badd\s*line\b/gi, "");
}

export function sanitizeNodeTitle(title: string, fallback: string): string {
  const cleaned = naturalizeTitle(title);
  return cleaned || fallback;
}

export function scrubMapTitles(map: AccountabilityMap): AccountabilityMap {
  const focusName = (id: string) => map.focuses.find((f) => f.id === id)?.title ?? "Focus";

  const plans = map.plans.map((p) => ({
    ...p,
    title: sanitizeNodeTitle(p.title, focusName(p.focus_id)),
  }));

  const planTitle = (id: string) => plans.find((p) => p.id === id)?.title ?? "Action";

  const actions = map.actions.map((a) => ({
    ...a,
    title: sanitizeNodeTitle(a.title, planTitle(a.plan_id)),
  }));

  return { ...map, plans, actions };
}

function timeFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function dayOfWeekFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return WEEKDAY_OPTIONS[d.getDay() === 0 ? 6 : d.getDay() - 1] ?? "monday";
}

function dayOfMonthFromDate(date: string): number | null {
  const n = parseInt(date.slice(8, 10), 10);
  return Number.isFinite(n) && n >= 1 && n <= 31 ? n : null;
}

function normalizeReviewCycle(raw: Record<string, unknown>): AccountabilityReviewCycle {
  const remind_date =
    asString(raw.remind_date) ?? asString(raw.check_in_date) ?? defaultReviewDate();
  return {
    title: asString(raw.title) ?? "Accountability review",
    remind_date,
    remind_time: asString(raw.remind_time) ?? DEFAULT_TIME,
  };
}

function normalizePlan(raw: Record<string, unknown>): AccountabilityPlan {
  const cadence = asCadence(raw.cadence, "monthly");
  let remind_day_of_month: number | null =
    typeof raw.remind_day_of_month === "number" ? raw.remind_day_of_month : null;
  let remind_day_of_week = asString(raw.remind_day_of_week);
  let remind_time = asString(raw.remind_time);

  if (cadence === "monthly" && remind_day_of_month == null && asString(raw.check_in_date)) {
    remind_day_of_month = dayOfMonthFromDate(raw.check_in_date as string);
  }
  if (asString(raw.remind_at)) {
    const iso = raw.remind_at as string;
    if (!remind_day_of_week) remind_day_of_week = dayOfWeekFromIso(iso);
    if (!remind_time) remind_time = timeFromIso(iso);
  }

  if (cadence === "monthly" && remind_day_of_month == null) remind_day_of_month = 1;
  if (cadence === "monthly" && remind_day_of_month !== -1 && remind_day_of_month != null) {
    remind_day_of_month = Math.min(31, Math.max(1, remind_day_of_month));
  }
  if (cadence === "weekly" && !remind_day_of_week) remind_day_of_week = "monday";
  if (!remind_time) remind_time = DEFAULT_TIME;

  return {
    id: asString(raw.id) ?? `plan-${crypto.randomUUID().slice(0, 8)}`,
    focus_id: asString(raw.focus_id) ?? "",
    title: naturalizeTitle(asString(raw.title) ?? ""),
    cadence,
    remind_day_of_month: cadence === "monthly" ? remind_day_of_month : null,
    remind_day_of_week: cadence === "weekly" ? remind_day_of_week : null,
    remind_time,
    status: asStatus(raw.status),
  };
}

function normalizeAction(raw: Record<string, unknown>): AccountabilityAction {
  const cadence = asCadence(raw.cadence, "weekly");
  let remind_day_of_month: number | null =
    typeof raw.remind_day_of_month === "number" ? raw.remind_day_of_month : null;
  let remind_day_of_week = asString(raw.remind_day_of_week);
  let remind_time = asString(raw.remind_time);
  let remind_date = asString(raw.remind_date);

  const reminder =
    raw.reminder && typeof raw.reminder === "object" ? (raw.reminder as Record<string, unknown>) : null;

  if (asString(raw.remind_at)) {
    const iso = raw.remind_at as string;
    if (!remind_day_of_week) remind_day_of_week = dayOfWeekFromIso(iso);
    if (!remind_time) remind_time = timeFromIso(iso);
    if (!remind_date) remind_date = iso.slice(0, 10);
  }

  if (cadence === "monthly" && remind_day_of_month == null) remind_day_of_month = 1;
  if (cadence === "monthly" && remind_day_of_month !== -1 && remind_day_of_month != null) {
    remind_day_of_month = Math.min(31, Math.max(1, remind_day_of_month));
  }
  if (cadence === "weekly" && !remind_day_of_week) remind_day_of_week = "monday";
  if (!remind_time) remind_time = DEFAULT_TIME;

  const kind = raw.kind === "micro" ? "micro" : "action";
  const channels = reminder?.channels ? parseChannels(reminder.channels) : parseChannels(raw.channels);
  const smsRaw =
    asString(raw.sms_text) ??
    asString(reminder?.smsText) ??
    asString(reminder?.sms_text) ??
    null;
  const sms_text = smsRaw ? stripSmsText(smsRaw).slice(0, SMS_MAX_LENGTH) : null;

  return {
    id: asString(raw.id) ?? `action-${crypto.randomUUID().slice(0, 8)}`,
    plan_id: asString(raw.plan_id) ?? asString(raw.weekly_action_id) ?? "",
    title: naturalizeTitle(asString(raw.title) ?? ""),
    cadence,
    remind_date,
    remind_day_of_month: cadence === "monthly" ? remind_day_of_month : null,
    remind_day_of_week: cadence === "weekly" ? remind_day_of_week : null,
    remind_time,
    status: asStatus(raw.status),
    kind,
    step_type: asStepType(raw.step_type ?? raw.type),
    reminder_enabled: reminder?.enabled !== false && raw.reminder_enabled !== false,
    channels,
    sms_text,
    source_evidence:
      asString(raw.source_evidence) ??
      (Array.isArray((raw.source as Record<string, unknown> | undefined)?.evidence)
        ? ((raw.source as { evidence: string[] }).evidence[0] ?? null)
        : null),
    confidence: typeof raw.confidence === "number" ? raw.confidence : null,
  };
}

function migrateLegacyMap(o: Record<string, unknown>): { plans: AccountabilityPlan[]; actions: AccountabilityAction[] } {
  const plans: AccountabilityPlan[] = [];
  const actions: AccountabilityAction[] = [];

  const monthlies = Array.isArray(o.monthly_goals) ? o.monthly_goals : [];
  const weeklies = Array.isArray(o.weekly_actions) ? o.weekly_actions : [];
  const dailies = Array.isArray(o.daily_actions) ? o.daily_actions : [];

  for (const raw of monthlies) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    plans.push(normalizePlan({ ...row, cadence: "monthly" }));
  }

  for (const raw of weeklies) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const monthly = monthlies.find(
      (m) => m && typeof m === "object" && (m as Record<string, unknown>).id === row.monthly_goal_id,
    ) as Record<string, unknown> | undefined;
    plans.push(
      normalizePlan({
        ...row,
        focus_id: monthly?.focus_id ?? row.focus_id,
        cadence: "weekly",
      }),
    );
  }

  for (const raw of dailies) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    actions.push(
      normalizeAction({
        ...row,
        plan_id: row.weekly_action_id,
        cadence: "daily",
        kind: "micro",
        reminder_enabled: true,
        channels: DEFAULT_REMINDER_CHANNELS,
      }),
    );
  }

  return { plans, actions };
}

export function isAccountabilityMapV2(raw: unknown): raw is AccountabilityMap {
  return (
    !!raw &&
    typeof raw === "object" &&
    (raw as AccountabilityMap).version === 2 &&
    Array.isArray((raw as AccountabilityMap).focuses)
  );
}

export function normalizeAccountabilityMap(raw: unknown): AccountabilityMap | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 2 || !Array.isArray(o.focuses)) return null;

  const focuses = (o.focuses as unknown[])
    .filter((f) => f && typeof f === "object")
    .map((f) => {
      const row = f as Record<string, unknown>;
      return {
        id: asString(row.id) ?? "",
        board_id: asString(row.board_id) ?? "",
        title: asString(row.title) ?? "",
      };
    })
    .filter((f) => f.id && f.title);

  if (!focuses.length) return null;

  let plans: AccountabilityPlan[];
  let actions: AccountabilityAction[];

  if (Array.isArray(o.plans)) {
    plans = (o.plans as unknown[]).map((p) => normalizePlan(p as Record<string, unknown>));
    actions = Array.isArray(o.actions)
      ? (o.actions as unknown[]).map((a) => normalizeAction(a as Record<string, unknown>))
      : [];
  } else {
    const migrated = migrateLegacyMap(o);
    plans = migrated.plans;
    actions = migrated.actions;
  }

  return scrubMapTitles({
    version: 2,
    summary: asString(o.summary) ?? "",
    finalized: Boolean(o.finalized),
    analysis_status:
      o.analysis_status === "draft_ready" ||
      o.analysis_status === "needs_more_content" ||
      o.analysis_status === "finalized" ||
      o.analysis_status === "draft"
        ? o.analysis_status
        : "draft_ready",
    analyzed_at: asString(o.analyzed_at),
    edited_at: asString(o.edited_at),
    finalized_at: asString(o.finalized_at),
    meta_confidence: typeof o.meta_confidence === "number" ? o.meta_confidence : null,
    unmapped_items: Array.isArray(o.unmapped_items)
      ? (o.unmapped_items as { text: string; reason: string }[])
      : [],
    review_cycle: normalizeReviewCycle(
      ((o.review_cycle ?? o.quarterly_reset) as Record<string, unknown>) ?? {},
    ),
    focuses,
    plans,
    actions,
    reminders: Array.isArray(o.reminders) ? (o.reminders as AccountabilityReminder[]) : [],
  });
}

export function buildRemindersFromMap(map: AccountabilityMap): AccountabilityReminder[] {
  const reminders: AccountabilityReminder[] = [];

  const focusTitleForPlan = (planId: string) => {
    const plan = map.plans.find((p) => p.id === planId);
    if (!plan) return "";
    return map.focuses.find((f) => f.id === plan.focus_id)?.title ?? "";
  };

  const channelsForAction = (action: AccountabilityAction): string[] => {
    const out: string[] = [];
    if (action.channels.calendar) out.push("calendar");
    if (action.channels.email) out.push("email");
    if (action.channels.sms) out.push("sms");
    return out.length > 0 ? out : ["email"];
  };

  for (const action of map.actions) {
    if (action.status === "rejected") continue;
    if (!action.reminder_enabled) continue;
    if (!action.title.trim()) continue;

    const channels = channelsForAction(action);
    const sms_text =
      action.channels.sms && action.sms_text
        ? stripSmsText(action.sms_text).slice(0, SMS_MAX_LENGTH)
        : action.channels.sms
          ? smsTextFromTitle(action.title)
          : null;

    const base = {
      title: action.title.trim(),
      goal_title: focusTitleForPlan(action.plan_id),
      channels,
      remind_time: action.remind_time ?? DEFAULT_TIME,
      sms_text,
    };

    if (action.cadence === "once") {
      reminders.push({
        ...base,
        cadence: "quarterly",
        remind_date: action.remind_date ?? defaultReviewDate(),
      });
      continue;
    }

    if (action.cadence === "monthly") {
      reminders.push({
        ...base,
        cadence: "monthly",
        day_of_month: action.remind_day_of_month ?? 1,
      });
      continue;
    }

    if (action.cadence === "weekly") {
      reminders.push({
        ...base,
        cadence: "weekly",
        day_of_week: action.remind_day_of_week ?? "monday",
      });
      continue;
    }

    reminders.push({
      ...base,
      cadence: "daily",
    });
  }

  return reminders.slice(0, 20);
}

export type FinalizeValidationResult = { ok: true } | { ok: false; message: string };

export function validateMapForFinalize(map: AccountabilityMap): FinalizeValidationResult {
  const activeActions = map.actions.filter((a) => a.status !== "rejected" && a.reminder_enabled);
  if (activeActions.length === 0) {
    return { ok: false, message: "Add at least one action before finalizing." };
  }
  for (const action of activeActions) {
    if (!action.title.trim()) {
      return { ok: false, message: "Every action needs a title before finalizing." };
    }
    if (action.channels.sms) {
      const sms = action.sms_text ? stripSmsText(action.sms_text) : smsTextFromTitle(action.title);
      if (sms.length > SMS_MAX_LENGTH) {
        return { ok: false, message: "Text reminders must be 70 characters or less." };
      }
    }
  }
  return { ok: true };
}

function parseHm(time: string): { h: number; m: number } {
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  return { h: Number.isFinite(h) ? h : 9, m: Number.isFinite(m) ? m : 0 };
}

function setLocalTime(d: Date, time: string) {
  const { h, m } = parseHm(time);
  d.setHours(h, m, 0, 0);
}

function weekdayIndex(day: string): number {
  const i = WEEKDAY_OPTIONS.indexOf(day.toLowerCase() as (typeof WEEKDAY_OPTIONS)[number]);
  return i >= 0 ? i : 0;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function reminderToIso(reminder: AccountabilityReminder, from = new Date()): string {
  const time = reminder.remind_time ?? DEFAULT_TIME;

  if (reminder.cadence === "quarterly" && reminder.remind_date) {
    const d = new Date(`${reminder.remind_date}T00:00:00`);
    setLocalTime(d, time);
    if (d.getTime() <= from.getTime()) {
      d.setMonth(d.getMonth() + 3);
    }
    return d.toISOString();
  }

  if (reminder.cadence === "monthly") {
    const requested = reminder.day_of_month ?? 1;
    const d = new Date(from);

    const dom =
      requested === -1
        ? lastDayOfMonth(d.getFullYear(), d.getMonth())
        : Math.min(31, Math.max(1, requested));

    d.setDate(Math.min(dom, lastDayOfMonth(d.getFullYear(), d.getMonth())));
    setLocalTime(d, time);

    if (d.getTime() <= from.getTime()) {
      d.setMonth(d.getMonth() + 1);

      const nextDom =
        requested === -1
          ? lastDayOfMonth(d.getFullYear(), d.getMonth())
          : Math.min(31, Math.max(1, requested));

      d.setDate(Math.min(nextDom, lastDayOfMonth(d.getFullYear(), d.getMonth())));
      setLocalTime(d, time);
    }

    return d.toISOString();
  }

  if (reminder.cadence === "weekly") {
    const target = weekdayIndex(reminder.day_of_week ?? "monday");
    const d = new Date(from);
    const current = d.getDay() === 0 ? 6 : d.getDay() - 1;
    let delta = target - current;
    if (delta < 0) delta += 7;
    d.setDate(d.getDate() + delta);
    setLocalTime(d, time);
    if (d.getTime() <= from.getTime()) {
      d.setDate(d.getDate() + 7);
    }
    return d.toISOString();
  }

  const d = new Date(from);
  setLocalTime(d, time);
  if (d.getTime() <= from.getTime()) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

export function finalizeAccountabilityMap(map: AccountabilityMap): AccountabilityMap {
  const validation = validateMapForFinalize(map);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const accept = <T extends { status: ActionItemStatus }>(item: T): T => ({
    ...item,
    status: item.status === "rejected" ? "rejected" : "accepted",
  });

  const now = new Date().toISOString();
  const next: AccountabilityMap = {
    ...map,
    finalized: true,
    analysis_status: "finalized",
    finalized_at: now,
    plans: map.plans.map(accept),
    actions: map.actions.map(accept),
    reminders: [],
  };
  next.reminders = buildRemindersFromMap(next);
  return next;
}

````

## AI analysis edge function

`supabase/functions/board-accountability-map/index.ts`

````ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createServiceRoleClient,
  plottingProRequiredResponse,
  userHasActivePlottingPro,
} from "../_shared/requirePlottingPro.ts";
import { BOARDS_AI_SAFETY_POLICY, screenBoardsCorpus } from "../_shared/boardsAiGuardrails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BoardRow = {
  id: string;
  title: string;
  role: string;
  layout_json: unknown;
  sort_order: number;
};

function isJunkBoardText(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return true;
  if (t === "untitled") return true;
  if (/^\+?\s*add\s*line\.?$/.test(t)) return true;
  if (/^add\s*(row|line)\.?$/.test(t)) return true;
  if (/add\s*line/.test(t) && t.length <= 32) return true;
  return false;
}

function collectTextsFromLayout(layout: unknown): { texts: string[]; imageCount: number } {
  const texts: string[] = [];
  let imageCount = 0;
  const walk = (items: unknown[]) => {
    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const role = String(o.structureRole ?? "");
      if (role === "add-row" || role === "add-button" || role === "checkbox") continue;
      if (typeof o.text === "string") {
        const t = o.text.trim();
        if (t.length > 1 && !isJunkBoardText(t)) texts.push(t);
      }
      const type = String(o.type ?? "").toLowerCase();
      if (type === "image" || type.includes("image")) imageCount += 1;
      if (Array.isArray(o.objects)) walk(o.objects);
    }
  };
  const objs = (layout as { objects?: unknown[] })?.objects;
  if (Array.isArray(objs)) walk(objs);
  return { texts, imageCount };
}

function focusBoards(boards: BoardRow[]) {
  return [...boards]
    .filter((b) => b.role === "focus")
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 3);
}

function defaultReviewDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

function naturalizeTitle(title: string): string {
  const t = title
    .replace(/\+?\s*add\s*line/gi, "")
    .replace(/\badd\s*line\b/gi, "")
    .replace(/^Monthly goal:\s*/i, "")
    .replace(/^Weekly touchpoint\s*[—-]\s*/i, "")
    .replace(/^From The Plan:\s*/i, "")
    .replace(/^5-minute action toward\s*/i, "")
    .replace(/\s*[—-]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return isJunkBoardText(t) ? "" : t;
}

function sanitizeNodeTitle(title: string, fallback: string): string {
  const cleaned = naturalizeTitle(title);
  return cleaned || fallback;
}

function scrubMapTitles(
  map: Record<string, unknown>,
  focuses: { id: string; title: string }[],
): Record<string, unknown> {
  const focusName = (id: string) => focuses.find((f) => f.id === id)?.title ?? "Focus";
  const plans = Array.isArray(map.plans)
    ? (map.plans as Record<string, unknown>[]).map((p) => ({
        ...p,
        title: sanitizeNodeTitle(String(p.title ?? ""), focusName(String(p.focus_id ?? ""))),
      }))
    : [];
  const planTitle = (id: string) => {
    const p = plans.find((row) => String(row.id ?? "") === id);
    return p ? String(p.title ?? "Action") : "Action";
  };
  const actions = Array.isArray(map.actions)
    ? (map.actions as Record<string, unknown>[]).map((a) => {
        const reminder =
          a.reminder && typeof a.reminder === "object"
            ? (a.reminder as Record<string, unknown>)
            : null;
        const channels = reminder?.channels ?? a.channels;
        const smsText = reminder?.smsText ?? reminder?.sms_text ?? a.sms_text ?? null;
        return {
          ...a,
          title: sanitizeNodeTitle(String(a.title ?? ""), planTitle(String(a.plan_id ?? ""))),
          channels,
          sms_text: typeof smsText === "string" ? smsText.slice(0, 70) : null,
          reminder_enabled: reminder?.enabled !== false,
        };
      })
    : [];
  return { ...map, plans, actions };
}

function workspaceHasEnoughContent(boardPayload: { texts: string[]; image_count: number }[]): boolean {
  const textChars = boardPayload.reduce((sum, b) => sum + b.texts.join(" ").length, 0);
  const imageCount = boardPayload.reduce((sum, b) => sum + b.image_count, 0);
  return textChars >= 24 || imageCount >= 2;
}

function needsMoreContentResponse() {
  return new Response(
    JSON.stringify({
      status: "needs_more_content",
      message: "Not enough workspace content to draft a useful action map.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createServiceRoleClient();
    const hasPro = await userHasActivePlottingPro(admin, userData.user.id);
    if (!hasPro) {
      return plottingProRequiredResponse(corsHeaders);
    }

    const body = await req.json();
    const workspace_id = body.workspace_id as string | undefined;
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: "workspace_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: boards, error: boardsErr } = await supabase
      .from("boards")
      .select("id, title, role, layout_json, sort_order")
      .eq("workspace_id", workspace_id)
      .eq("user_id", userData.user.id)
      .order("sort_order", { ascending: true });

    if (boardsErr || !boards?.length) {
      return new Response(JSON.stringify({ error: "No boards in workspace" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const boardRows = boards as BoardRow[];
    const focusList = focusBoards(boardRows);
    if (!focusList.length) {
      return new Response(JSON.stringify({ error: "No focus boards in workspace" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const boardPayload = boardRows.map((b) => {
      const { texts, imageCount } = collectTextsFromLayout(b.layout_json);
      return {
        id: b.id,
        title: b.title,
        role: b.role,
        texts: texts.slice(0, 32),
        image_count: imageCount,
      };
    });

    if (!workspaceHasEnoughContent(boardPayload)) {
      return needsMoreContentResponse();
    }

    const corpus = boardPayload
      .map((b) => `${b.title} (${b.role}): ${b.texts.join(" | ")}`)
      .join("\n");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey || !screenBoardsCorpus(corpus)) {
      return needsMoreContentResponse();
    }

    const focusIds = focusList.map((b, i) => ({
      focus_id: `focus-${i + 1}`,
      board_id: b.id,
      board_title: b.title,
    }));

    const prompt = `You are drafting a first-pass ACTION MAP for Palette Plotting from the user's actual Vision workspace.

The user will review and edit everything before any reminders go live. Do not auto-finalize.

Workspace boards:
${JSON.stringify(boardPayload, null, 2)}

Focus slots (use exactly these ids and board titles):
${JSON.stringify(focusIds, null, 2)}

Visible columns: Focus | Plan | Action

CHANNEL RULES (suggest per action; user controls final selection):
- calendar: scheduled follow-through — appointments, deadlines, due dates, date-specific work
- email: soft accountability — longer details, weekly reviews, summaries, non-urgent check-ins
- sms: stronger nudge — short, high-priority only; OFF by default unless clearly urgent

SMS RULES (if you suggest sms):
- sms must be optional; default sms false for most items
- smsText max 70 characters, ASCII, no emoji, no links, no motivational fluff
- derive smsText from the action title only — short practical nudge
- usually pair sms with email or calendar, not sms alone for everything
- if sms is false, smsText must be null

AI BEHAVIOR:
- Use only content supported by the workspace — do not invent focus areas or filler goals
- No generic "Daily Gratitude", "Review board", or placeholder actions unless the workspace supports them
- No therapy language, manifesting, alignment, or fake specificity
- Keep titles short and editable
- Prefer concrete actions over vague motivation
- Mark uncertain items with lower confidence (0.4-0.6) and source_evidence
- If workspace is too thin, return { "status": "needs_more_content", "message": "..." }

STRUCTURE:
- 1-3 plans per focus, each with 1-4 actions
- focus titles = board titles (do not rename)
- weight The Plan board (role "plan") for dates, deadlines, purchases, appointments
- all plans/actions status "suggested"
- step_type one of: task, deadline, appointment, purchase, follow_up, review, custom
- cadence on actions: once, daily, weekly, monthly
- timing on actions only: remind_date (YYYY-MM-DD for once), remind_day_of_month, remind_day_of_week, remind_time (HH:mm 24h)

Each action JSON:
{
  "id": "action-1-1",
  "plan_id": "plan-1-1",
  "title": "short concrete title from workspace",
  "step_type": "task",
  "cadence": "weekly",
  "remind_day_of_week": "monday",
  "remind_time": "09:00",
  "status": "suggested",
  "kind": "action",
  "confidence": 0.8,
  "source_evidence": "From: Career board",
  "reminder_enabled": true,
  "channels": { "calendar": false, "email": true, "sms": false },
  "sms_text": null
}

Return JSON only:
{
  "version": 2,
  "summary": "Palette drafted this from your workspace. Review before finalizing.",
  "analysis_status": "draft_ready",
  "meta_confidence": 0.0,
  "finalized": false,
  "review_cycle": { "title": "Review cycle", "remind_date": "YYYY-MM-DD", "remind_time": "09:00" },
  "focuses": [{ "id": "focus-1", "board_id": "uuid", "title": "board title" }],
  "plans": [{ "id": "plan-1-1", "focus_id": "focus-1", "title": "...", "cadence": "monthly", "remind_day_of_month": null, "remind_day_of_week": null, "remind_time": null, "status": "suggested" }],
  "actions": [ ... ],
  "unmapped_items": [{ "text": "...", "reason": "..." }],
  "reminders": []
}`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Return valid JSON only.\n\n${BOARDS_AI_SAFETY_POLICY}`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      console.error("OpenAI error:", await aiRes.text());
      return needsMoreContentResponse();
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return needsMoreContentResponse();
    }

    if (parsed.status === "needs_more_content") {
      return needsMoreContentResponse();
    }

    const hasPlans = Array.isArray(parsed.plans) && parsed.plans.length > 0;
    const hasActions = Array.isArray(parsed.actions) && parsed.actions.length > 0;

    if (parsed.version !== 2 || !Array.isArray(parsed.focuses) || !hasPlans || !hasActions) {
      return needsMoreContentResponse();
    }

    const reviewRaw = (parsed.review_cycle ?? parsed.quarterly_reset) as Record<string, unknown> | undefined;
    const now = new Date().toISOString();

    const map = scrubMapTitles(
      {
        version: 2 as const,
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim()
            : "Palette drafted this from your workspace. Review before finalizing.",
        analysis_status: "draft_ready",
        analyzed_at: now,
        edited_at: null,
        finalized_at: null,
        meta_confidence: typeof parsed.meta_confidence === "number" ? parsed.meta_confidence : null,
        finalized: false,
        review_cycle: {
          title: typeof reviewRaw?.title === "string" ? reviewRaw.title : "Review cycle",
          remind_date:
            typeof reviewRaw?.remind_date === "string" ? reviewRaw.remind_date : defaultReviewDate(),
          remind_time: typeof reviewRaw?.remind_time === "string" ? reviewRaw.remind_time : "09:00",
        },
        focuses: parsed.focuses,
        plans: parsed.plans,
        actions: parsed.actions,
        unmapped_items: Array.isArray(parsed.unmapped_items) ? parsed.unmapped_items : [],
        reminders: [],
      },
      parsed.focuses as { id: string; title: string }[],
    );

    return new Response(JSON.stringify(map), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "accountability map failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

````

