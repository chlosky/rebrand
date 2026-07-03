import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOARD_COLORS } from "@/lib/boards/colors";
import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ChatTurn = { role: "user" | "assistant"; content: string };

const VALID_COLOR_KEYS = new Set(Object.keys(BOARD_COLORS));
const VALID_DIAGRAMS = new Set<BoardDiagramType>([
  "eisenhower",
  "checklist",
  "zones",
  "timeline",
  "kanban",
  "gantt",
  "okrs",
  "five_s",
]);

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

type BoardCompanionPanelProps = {
  activeBoardId: string;
  editorRef: RefObject<BoardCanvasHandle | null>;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  compact?: boolean;
};

export function BoardCompanionPanel({
  activeBoardId,
  editorRef,
  onBoardColorChange,
  compact = false,
}: BoardCompanionPanelProps) {
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content: "Tell me the feeling of this board — I'll plot color, words, and structures with you.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [lastApplied, setLastApplied] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const applyActions = useCallback(
    async (actions: unknown[]) => {
      const editor = editorRef.current;
      let applied = 0;

      for (const raw of actions) {
        if (!raw || typeof raw !== "object") continue;
        const action = raw as Record<string, unknown>;
        const type = action.type;

        if (type === "set_color" && typeof action.color_key === "string" && VALID_COLOR_KEYS.has(action.color_key)) {
          await onBoardColorChange(activeBoardId, action.color_key);
          applied += 1;
          continue;
        }

        if (!editor) continue;

        if (type === "kanban_seed" && Array.isArray(action.columns)) {
          const titles = (action.columns as { title?: string }[])
            .map((c) => (typeof c.title === "string" ? c.title : ""))
            .filter(Boolean);
          editor.addDiagramOverlay("kanban", 0.08, 0.42, 0.84, 0.5, titles.length ? titles : undefined);
          applied += 1;
          continue;
        }

        if (type === "gantt_seed" && Array.isArray(action.tasks)) {
          const names = (action.tasks as { name?: string }[])
            .map((t) => (typeof t.name === "string" ? t.name : ""))
            .filter(Boolean);
          editor.addDiagramOverlay("gantt", 0.1, 0.45, 0.8, 0.42, names.length ? names : undefined);
          applied += 1;
          continue;
        }

        if (type === "add_text" && typeof action.text === "string") {
          editor.addTextNormalized(
            action.text,
            clamp01(typeof action.x === "number" ? action.x : 0.5),
            clamp01(typeof action.y === "number" ? action.y : 0.12),
            typeof action.font_size === "number" ? action.font_size : 40,
            typeof action.color === "string" ? action.color : "#171717",
          );
          applied += 1;
          continue;
        }

        if (type === "add_sticky" && typeof action.text === "string") {
          editor.addStickyNoteAt(
            action.text,
            clamp01(typeof action.x === "number" ? action.x : 0.12),
            clamp01(typeof action.y === "number" ? action.y : 0.35),
            typeof action.fill === "string" ? action.fill : "#FFF9C4",
          );
          applied += 1;
          continue;
        }

        if (type === "add_diagram" && typeof action.diagram === "string") {
          const diagram = action.diagram as BoardDiagramType;
          if (!VALID_DIAGRAMS.has(diagram)) continue;
          const items = Array.isArray(action.items)
            ? action.items.filter((i): i is string => typeof i === "string")
            : [];
          editor.addDiagramOverlay(
            diagram,
            clamp01(typeof action.x === "number" ? action.x : 0.52),
            clamp01(typeof action.y === "number" ? action.y : 0.52),
            clamp01(typeof action.w === "number" ? action.w : 0.4),
            clamp01(typeof action.h === "number" ? action.h : 0.34),
            items,
            typeof action.accent === "string" ? action.accent : "#2563EB",
          );
          applied += 1;
        }
      }

      if (applied > 0) setLastApplied(applied);
    },
    [activeBoardId, editorRef, onBoardColorChange],
  );

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending || !activeBoardId) return;
    setDraft("");
    setLastApplied(0);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("board-design-chat", {
        body: {
          board_id: activeBoardId,
          message: text,
          history: messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-8),
        },
      });
      if (error) throw error;
      const payload = data as { reply?: string; actions?: unknown[] };
      await applyActions(Array.isArray(payload.actions) ? payload.actions : []);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: payload.reply ?? "Plotted a few things — move them how you like." },
      ]);
      window.setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Companion's quiet for a moment — try again shortly." },
      ]);
    } finally {
      setSending(false);
    }
  }, [activeBoardId, applyActions, draft, messages, sending]);

  return (
    <div className={cn("flex flex-col", compact ? "min-h-[280px]" : "min-h-0 flex-1")}>
      <div
        ref={scrollRef}
        className={cn("flex flex-col gap-2 overflow-y-auto p-3", compact ? "max-h-[36vh]" : "min-h-0 flex-1")}
      >
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={cn(
              "rounded-lg px-3 py-2 text-xs leading-relaxed",
              m.role === "user"
                ? "ml-3 bg-stone-900 text-stone-50"
                : "mr-1 border border-stone-300/80 bg-[#faf8f5] text-stone-800",
            )}
          >
            {m.content}
          </div>
        ))}
        {lastApplied > 0 ? (
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-stone-600">
            <Sparkles className="h-3 w-3" />
            Plotted {lastApplied} {lastApplied === 1 ? "piece" : "pieces"} on the board
          </p>
        ) : null}
        {sending ? (
          <p className="flex items-center gap-2 text-xs text-stone-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Plotting…
          </p>
        ) : null}
      </div>
      <form
        className="flex shrink-0 gap-2 border-t border-stone-300/60 bg-[#f3f0eb] p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="The vibe, the goal, the feeling…"
          className="h-9 border-stone-300 bg-[#faf8f5] text-xs"
          disabled={sending}
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0 bg-stone-900" disabled={sending || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
