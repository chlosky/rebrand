import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Download,
  ListChecks,
  LayoutGrid,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { BoardAccountabilityGrid } from "@/components/boards/BoardAccountabilityGrid";
import {
  createBoardReminder,
  ensureDefaultWorkspace,
  fetchBoardReminders,
  fetchUserWorkspaces,
  fetchWorkspaceWithBoards,
} from "@/lib/boards/api";
import type { AccountabilityMap } from "@/lib/boards/accountabilityMap";
import type { BoardWorkspaceWithBoards } from "@/lib/boards/types";
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
  const [generating, setGenerating] = useState(false);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelSms, setChannelSms] = useState(false);

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
      sessionStorage.setItem(storageKey(workspace.id), JSON.stringify(result));
      toast.success("Action plan ready");
    } catch {
      toast.error("Could not analyze boards — check Pro access and try again");
    } finally {
      setAnalyzing(false);
    }
  };

  const runGenerateReminders = async () => {
    if (!map?.reminders.length || !planBoard || !user?.id) {
      toast.error("Analyze boards first");
      return;
    }
    const channels: string[] = [];
    if (channelEmail) channels.push("email");
    if (channelSms) channels.push("sms");
    if (!channels.length) {
      toast.error("Pick at least one reminder channel");
      return;
    }

    setGenerating(true);
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
          channels,
          source: "ai_extracted",
          fabric_object_id: null,
        });
      }
      const rows = await fetchBoardReminders(planBoard.id);
      downloadIcalFile(rows, "palette-plotting-accountability.ics");
      toast.success(`Scheduled ${Math.min(map.reminders.length, 20)} reminders`);
    } catch {
      toast.error("Could not generate reminders");
    } finally {
      setGenerating(false);
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
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={analyzing || loading}
              onClick={() => void runAnalyze()}
            >
              {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Analyze</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={generating || !map?.reminders.length}
              onClick={() => void runGenerateReminders()}
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Reminders</span>
            </Button>
            <div className="ml-1 flex items-center gap-2 border-l border-neutral-200 pl-2">
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
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={channelEmail} onCheckedChange={(v) => setChannelEmail(v === true)} />
              Email
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={channelSms} onCheckedChange={(v) => setChannelSms(v === true)} />
              SMS
            </label>
          </div>
          {map?.summary ? (
            <p className="min-w-0 flex-1 text-[11px] leading-snug text-neutral-600">{map.summary}</p>
          ) : (
            <p className="text-[11px] text-neutral-500">
              Maps focus boards and The Plan into accountability trees with quarterly resets and daily steps.
            </p>
          )}
        </div>

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
                  AI reads board titles, statements, and image placements — especially The Plan — then builds goal trees
                  with quarterly accountability checks, monthly milestones, weekly habits, and daily actions.
                </p>
                <Button
                  className="mt-4 w-full gap-1 bg-stone-900 text-xs"
                  size="sm"
                  disabled={analyzing}
                  onClick={() => void runAnalyze()}
                >
                  {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Analyze boards
                </Button>
                <Button
                  variant="outline"
                  className="mt-2 w-full gap-1 text-xs"
                  size="sm"
                  disabled={generating || !map?.reminders.length}
                  onClick={() => void runGenerateReminders()}
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Generate reminders + iCal
                </Button>
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
