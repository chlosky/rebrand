import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  ListChecks,
  LayoutGrid,
  Loader2,
  ScanSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { BoardAccountabilityGrid } from "@/components/boards/BoardAccountabilityGrid";
import {
  createBoardReminder,
  ensureDefaultWorkspace,
  fetchUserWorkspaces,
  fetchWorkspaceWithBoards,
} from "@/lib/boards/api";
import type { AccountabilityMap } from "@/lib/boards/accountabilityMap";
import type { BoardReminder, BoardWorkspaceWithBoards } from "@/lib/boards/types";
import { downloadIcalFile } from "@/lib/boards/ical";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "@/styles/board-editor.css";

export type { AccountabilityGoal, AccountabilityMap } from "@/lib/boards/accountabilityMap";

function storageKey(workspaceId: string) {
  return `board-accountability-map:${workspaceId}`;
}

export default function BoardAccountability() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<BoardWorkspaceWithBoards | null>(null);
  const [map, setMap] = useState<AccountabilityMap | null>(null);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [schedulingEmail, setSchedulingEmail] = useState(false);
  const [schedulingSms, setSchedulingSms] = useState(false);
  const [exportingIcal, setExportingIcal] = useState(false);
  const [emailOptedIn, setEmailOptedIn] = useState(false);
  const [textOptedIn, setTextOptedIn] = useState(false);

  const planBoard = useMemo(
    () => workspace?.boards.find((b) => b.role === "plan") ?? workspace?.boards[0] ?? null,
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
          const parsed = JSON.parse(cached) as AccountabilityMap;
          setMap(parsed);
          setActiveGoalId(parsed.goals[0]?.id ?? null);
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

  const runAnalyze = async () => {
    if (!workspace) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("board-accountability-map", {
        body: { workspace_id: workspace.id },
      });
      if (error) throw error;
      const result = data as AccountabilityMap;
      if (!result?.goals?.length) {
        toast.message("Add titles and statements on your boards, then analyze again");
        return;
      }
      setMap(result);
      setActiveGoalId(result.goals[0]?.id ?? null);
      setEmailOptedIn(false);
      setTextOptedIn(false);
      sessionStorage.setItem(storageKey(workspace.id), JSON.stringify(result));
      toast.success("Action plan ready");
    } catch {
      toast.error("Could not analyze boards — check Pro access and try again");
    } finally {
      setAnalyzing(false);
    }
  };

  const remindersDisabled = !map?.reminders.length;

  const scheduleReminders = async (channel: "email" | "sms") => {
    if (!map?.reminders.length || !planBoard || !user?.id) {
      toast.error("Analyze boards first");
      return false;
    }
    const setBusy = channel === "email" ? setSchedulingEmail : setSchedulingSms;
    setBusy(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      for (const r of map.reminders.slice(0, 20)) {
        const ms = Date.now() + Math.max(1, r.days_from_now) * 24 * 60 * 60 * 1000;
        await createBoardReminder({
          board_id: planBoard.id,
          user_id: user.id,
          title: r.title,
          body: r.goal_title ? `Goal: ${r.goal_title} · ${r.cadence}` : r.cadence,
          remind_at: new Date(ms).toISOString(),
          timezone: tz,
          channels: [channel],
          source: "ai_extracted",
          fabric_object_id: null,
        });
      }
      const count = Math.min(map.reminders.length, 20);
      if (channel === "email") {
        toast.success(`${count} email reminders set`);
      } else {
        toast.success(`${count} text reminders set`);
      }
      return true;
    } catch {
      toast.error(channel === "email" ? "Couldn't set up email reminders" : "Couldn't set up text reminders");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggleEmailReminders = async () => {
    if (remindersDisabled) return;
    if (emailOptedIn) {
      setEmailOptedIn(false);
      return;
    }
    const ok = await scheduleReminders("email");
    if (ok) setEmailOptedIn(true);
  };

  const toggleTextReminders = async () => {
    if (remindersDisabled) return;
    if (textOptedIn) {
      setTextOptedIn(false);
      return;
    }
    const ok = await scheduleReminders("sms");
    if (ok) setTextOptedIn(true);
  };

  const runExportIcal = () => {
    if (!map?.reminders.length || !planBoard || !user?.id) {
      toast.error("Analyze boards first");
      return;
    }
    setExportingIcal(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date().toISOString();
      const rows: BoardReminder[] = map.reminders.slice(0, 20).map((r, i) => {
        const ms = Date.now() + Math.max(1, r.days_from_now) * 24 * 60 * 60 * 1000;
        return {
          id: `ical-export-${i}`,
          board_id: planBoard.id,
          user_id: user.id,
          title: r.title,
          body: r.goal_title ? `Goal: ${r.goal_title} · ${r.cadence}` : r.cadence,
          remind_at: new Date(ms).toISOString(),
          timezone: tz,
          channels: ["email"],
          source: "ai_extracted",
          fabric_object_id: null,
          status: "pending",
          ical_uid: `accountability-${planBoard.id}-${i}@paletteplot.com`,
          last_sent_at: null,
          created_at: now,
          updated_at: now,
        };
      });
      downloadIcalFile(rows, "palette-plotting-accountability.ics");
      toast.success("Calendar file ready");
    } catch {
      toast.error("Couldn't add to calendar");
    } finally {
      setExportingIcal(false);
    }
  };

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
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                disabled={analyzing || loading}
                onClick={() => void runAnalyze()}
              >
                {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
                Analyze
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
          ) : (
            <p className="text-[11px] text-neutral-500">
              Run Analyze to map goals from your boards into a quarterly → monthly → weekly → daily action.
            </p>
          )}
        </div>

        {isMobile ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 bg-[#f3f0eb] px-4 py-2.5">
            <Label className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Reminders</Label>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 bg-white text-xs"
              disabled={exportingIcal || remindersDisabled}
              onClick={() => runExportIcal()}
            >
              {exportingIcal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Add to calendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`gap-1 bg-white text-xs${emailOptedIn ? " border-stone-900" : ""}`}
              disabled={schedulingEmail || remindersDisabled}
              onClick={() => void toggleEmailReminders()}
            >
              {schedulingEmail ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : emailOptedIn ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5 opacity-40" />
              )}
              Email reminders
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`gap-1 bg-white text-xs${textOptedIn ? " border-stone-900" : ""}`}
              disabled={schedulingSms || remindersDisabled}
              onClick={() => void toggleTextReminders()}
            >
              {schedulingSms ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : textOptedIn ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5 opacity-40" />
              )}
              Text reminders
            </Button>
            {remindersDisabled ? (
              <p className="text-[11px] text-stone-500">Run Analyze first to set up follow-through.</p>
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
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
            {!isMobile && (
              <aside className="flex w-56 shrink-0 flex-col border-r border-stone-300/80 bg-[#f3f0eb] p-3 text-xs">
                <Label className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">How it works</Label>
                <p className="mt-2 leading-relaxed text-stone-700">
                  AI reads board titles, statements, and image placements — especially The Plan — then maps goals
                  into quarterly, monthly, weekly, and daily actions.
                </p>
                <Button
                  className="mt-4 w-full gap-1 bg-stone-900 text-xs"
                  size="sm"
                  disabled={analyzing}
                  onClick={() => void runAnalyze()}
                >
                  {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
                  Analyze
                </Button>
                <Label className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Reminders</Label>
                <Button
                  variant="outline"
                  className="mt-2 w-full gap-1 text-xs"
                  size="sm"
                  disabled={exportingIcal || remindersDisabled}
                  onClick={() => runExportIcal()}
                >
                  {exportingIcal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Add to calendar
                </Button>
                <Button
                  variant="outline"
                  className={`mt-2 w-full gap-1 text-xs${emailOptedIn ? " border-stone-900" : ""}`}
                  size="sm"
                  disabled={schedulingEmail || remindersDisabled}
                  onClick={() => void toggleEmailReminders()}
                >
                  {schedulingEmail ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : emailOptedIn ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 opacity-40" />
                  )}
                  Email reminders
                </Button>
                <Button
                  variant="outline"
                  className={`mt-2 w-full gap-1 text-xs${textOptedIn ? " border-stone-900" : ""}`}
                  size="sm"
                  disabled={schedulingSms || remindersDisabled}
                  onClick={() => void toggleTextReminders()}
                >
                  {schedulingSms ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : textOptedIn ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 opacity-40" />
                  )}
                  Text reminders
                </Button>
                {remindersDisabled ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-stone-500">Run Analyze first to set up follow-through.</p>
                ) : null}
              </aside>
            )}

            <BoardAccountabilityGrid
              goals={map?.goals ?? []}
              boards={workspace.boards}
              activeId={activeGoalId}
              onSelect={setActiveGoalId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
