import { useState } from "react";
import { Bell, Calendar, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { createBoardReminder, deleteBoardReminder } from "@/lib/boards/api";
import { downloadIcalFile } from "@/lib/boards/ical";
import type { Board, BoardReminder } from "@/lib/boards/types";
import { toast } from "sonner";

type BoardReminderPanelProps = {
  board: Board;
  userId: string;
  reminders: BoardReminder[];
  onRefresh: () => void;
  /** Inline card on Your Journey — not a boards-page sidebar. */
  embedded?: boolean;
};

export function BoardReminderPanel({
  board,
  userId,
  reminders,
  onRefresh,
  embedded = false,
}: BoardReminderPanelProps) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const isPlan = board.role === "plan";

  const handleAdd = async () => {
    if (!title.trim() || !when) {
      toast.error("Add a title and date/time");
      return;
    }
    setSaving(true);
    try {
      await createBoardReminder({
        board_id: board.id,
        user_id: userId,
        title: title.trim(),
        body: null,
        remind_at: new Date(when).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        channels: ["email"],
        source: isPlan ? "plan_item" : "user",
        fabric_object_id: null,
      });
      setTitle("");
      setWhen("");
      onRefresh();
      toast.success("Reminder scheduled");
    } catch {
      toast.error("Could not save reminder");
    } finally {
      setSaving(false);
    }
  };

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-board-insights", {
        body: { board_id: board.id, workspace_mode: "themes_and_reminders" },
      });
      if (error) throw error;
      const suggested = (data as { reminders?: { title: string; remind_at?: string }[] })?.reminders ?? [];
      if (!suggested.length) {
        toast.message("No new action items detected — add sticky notes on The Plan board");
        return;
      }
      for (const r of suggested.slice(0, 5)) {
        await createBoardReminder({
          board_id: board.id,
          user_id: userId,
          title: r.title,
          body: null,
          remind_at: r.remind_at ?? new Date(Date.now() + 86400000).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          channels: ["email"],
          source: "ai_extracted",
          fabric_object_id: null,
        });
      }
      onRefresh();
      toast.success(`Added ${Math.min(suggested.length, 5)} suggested reminders`);
    } catch {
      toast.error("Couldn't suggest reminders — add them manually");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? "flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200/75 bg-card/75 backdrop-blur-sm shadow-sm"
          : "flex h-full w-72 shrink-0 flex-col border-l border-neutral-200 bg-white"
      }
    >
      <div className="border-b border-neutral-100 px-3 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Bell className="h-4 w-4" />
          Reminders
        </h3>
        <p className="mt-1 text-[11px] leading-snug text-neutral-500">
          {isPlan
            ? "Email reminders for plan items on this board."
            : "Optional email nudges for this focus board."}
        </p>
      </div>

      <div className="space-y-2 border-b border-neutral-100 p-3">
        <Label className="text-xs">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review focus board" className="h-8 text-xs" />
        <Label className="text-xs">When</Label>
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-8 text-xs" />
        <p className="text-[10px] text-neutral-500">Sent to the email on your account.</p>
        <Button size="sm" className="w-full" onClick={handleAdd} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule"}
        </Button>
        {isPlan && (
          <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleExtract} disabled={extracting}>
            {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Extract from board
          </Button>
        )}
        {reminders.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1 text-xs"
            onClick={() => downloadIcalFile(reminders)}
          >
            <Download className="h-3.5 w-3.5" />
            Export .ics
          </Button>
        )}
      </div>

      <ul className={embedded ? "max-h-64 overflow-y-auto p-2 text-xs" : "flex-1 overflow-y-auto p-2 text-xs"}>
        {reminders.length === 0 ? (
          <li className="px-2 py-4 text-center text-neutral-500">No reminders yet</li>
        ) : (
          reminders.map((r) => (
            <li key={r.id} className="mb-2 rounded-lg border border-neutral-100 p-2">
              <p className="font-medium text-neutral-900">{r.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-neutral-500">
                <Calendar className="h-3 w-3" />
                {new Date(r.remind_at).toLocaleString()}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 px-2 text-[10px] text-red-600"
                onClick={async () => {
                  await deleteBoardReminder(r.id);
                  onRefresh();
                }}
              >
                Remove
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
