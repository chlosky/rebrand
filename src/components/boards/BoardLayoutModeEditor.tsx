import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardLayoutMode } from "@/lib/boards/types";
import { cn } from "@/lib/utils";
import { Plus, GripVertical } from "lucide-react";

type KanbanCard = { id: string; text: string };
type KanbanColumn = { id: string; title: string; cards: KanbanCard[] };
type GanttTask = { id: string; name: string; start: number; width: number };

type BoardLayoutModeEditorProps = {
  mode: BoardLayoutMode;
  layoutJson: Record<string, unknown>;
  embedded?: boolean;
  readOnly?: boolean;
  onSave: (layout: Record<string, unknown>) => void;
};

const DEFAULT_KANBAN: KanbanColumn[] = [
  { id: "backlog", title: "Backlog", cards: [] },
  { id: "todo", title: "To Do", cards: [{ id: "seed-1", text: "New task" }] },
  { id: "doing", title: "Doing", cards: [] },
  { id: "done", title: "Done", cards: [] },
];

const DEFAULT_GANTT: GanttTask[] = [
  { id: "g1", name: "Phase 1", start: 4, width: 38 },
  { id: "g2", name: "Phase 2", start: 28, width: 42 },
  { id: "g3", name: "Milestone", start: 62, width: 22 },
];

function newId() {
  return crypto.randomUUID();
}

function parseKanban(layoutJson: Record<string, unknown>): KanbanColumn[] {
  if (layoutJson.editor === "kanban" && Array.isArray(layoutJson.columns)) {
    return layoutJson.columns as KanbanColumn[];
  }
  return DEFAULT_KANBAN.map((c) => ({
    ...c,
    cards: c.cards.map((card) => ({ ...card, id: newId() })),
  }));
}

function parseGantt(layoutJson: Record<string, unknown>): GanttTask[] {
  if (layoutJson.editor === "gantt" && Array.isArray(layoutJson.tasks)) {
    return layoutJson.tasks as GanttTask[];
  }
  return DEFAULT_GANTT.map((t) => ({ ...t, id: newId() }));
}

export function BoardLayoutModeEditor({
  mode,
  layoutJson,
  embedded = false,
  readOnly = false,
  onSave,
}: BoardLayoutModeEditorProps) {
  const saveTimer = useRef<number>();
  const [kanban, setKanban] = useState<KanbanColumn[]>(() => parseKanban(layoutJson));
  const [gantt, setGantt] = useState<GanttTask[]>(() => parseGantt(layoutJson));
  const dragCard = useRef<{ cardId: string; fromColId: string } | null>(null);
  const dragGantt = useRef<{ taskId: string; mode: "move" | "resize"; startX: number; origStart: number; origWidth: number } | null>(null);

  const scheduleSave = useCallback(
    (payload: Record<string, unknown>) => {
      if (readOnly) return;
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => onSave(payload), 500);
    },
    [onSave, readOnly],
  );

  useEffect(() => {
    return () => window.clearTimeout(saveTimer.current);
  }, []);

  useEffect(() => {
    if (mode === "kanban") setKanban(parseKanban(layoutJson));
    if (mode === "gantt") setGantt(parseGantt(layoutJson));
  }, [layoutJson, mode]);

  const pad = embedded ? "p-1.5" : "p-3";
  const text = embedded ? "text-[8px]" : "text-[10px]";
  const head = embedded ? "text-[9px]" : "text-xs";

  if (mode === "kanban") {
    const moveCard = (cardId: string, fromColId: string, toColId: string) => {
      if (fromColId === toColId || readOnly) return;
      setKanban((prev) => {
        let moved: KanbanCard | null = null;
        const next = prev.map((col) => {
          if (col.id !== fromColId) return col;
          const cards = col.cards.filter((c) => {
            if (c.id === cardId) {
              moved = c;
              return false;
            }
            return true;
          });
          return { ...col, cards };
        });
        if (!moved) return prev;
        const result = next.map((col) =>
          col.id === toColId ? { ...col, cards: [...col.cards, moved!] } : col,
        );
        scheduleSave({ editor: "kanban", columns: result });
        return result;
      });
    };

    const addCard = (colId: string) => {
      if (readOnly) return;
      setKanban((prev) => {
        const result = prev.map((col) =>
          col.id === colId
            ? { ...col, cards: [...col.cards, { id: newId(), text: "New task" }] }
            : col,
        );
        scheduleSave({ editor: "kanban", columns: result });
        return result;
      });
    };

    const updateCardText = (colId: string, cardId: string, text: string) => {
      if (readOnly) return;
      setKanban((prev) => {
        const result = prev.map((col) =>
          col.id === colId
            ? {
                ...col,
                cards: col.cards.map((c) => (c.id === cardId ? { ...c, text } : c)),
              }
            : col,
        );
        scheduleSave({ editor: "kanban", columns: result });
        return result;
      });
    };

    return (
      <div className={cn("absolute inset-0 z-[2] flex gap-1 bg-neutral-50/95", pad)}>
        {kanban.map((col) => (
          <div
            key={col.id}
            className="flex min-w-0 flex-1 flex-col rounded-md bg-white ring-1 ring-neutral-200"
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={() => {
              const d = dragCard.current;
              if (!d) return;
              moveCard(d.cardId, d.fromColId, col.id);
              dragCard.current = null;
            }}
          >
            <div className={cn("flex items-center justify-between border-b border-neutral-200 px-1.5 py-1", head)}>
              <span className="font-semibold text-neutral-800">{col.title}</span>
              {!readOnly ? (
                <button
                  type="button"
                  className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  onClick={() => addCard(col.id)}
                  aria-label={`Add card to ${col.title}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              ) : null}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-1">
              {col.cards.map((card) => (
                <div
                  key={card.id}
                  draggable={!readOnly}
                  onDragStart={() => {
                    dragCard.current = { cardId: card.id, fromColId: col.id };
                  }}
                  className={cn(
                    "flex items-start gap-1 rounded border border-neutral-200 bg-neutral-50 px-1 py-1.5",
                    !readOnly && "cursor-grab active:cursor-grabbing",
                  )}
                >
                  {!readOnly ? (
                    <GripVertical className="mt-0.5 h-3 w-3 shrink-0 text-neutral-300" aria-hidden />
                  ) : null}
                  <input
                    type="text"
                    value={card.text}
                    readOnly={readOnly}
                    onChange={(e) => updateCardText(col.id, card.id, e.target.value)}
                    className={cn(
                      "min-w-0 flex-1 border-0 bg-transparent font-medium text-neutral-800 outline-none",
                      text,
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "gantt") {
    const onGanttPointerMove = (e: PointerEvent) => {
      const d = dragGantt.current;
      if (!d) return;
      const track = document.getElementById("gantt-track");
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const deltaPct = ((e.clientX - d.startX) / rect.width) * 100;
      setGantt((prev) => {
        const result = prev.map((task) => {
          if (task.id !== d.taskId) return task;
          if (d.mode === "move") {
            const start = Math.max(0, Math.min(100 - task.width, d.origStart + deltaPct));
            return { ...task, start };
          }
          const width = Math.max(8, Math.min(100 - task.start, d.origWidth + deltaPct));
          return { ...task, width };
        });
        scheduleSave({ editor: "gantt", tasks: result });
        return result;
      });
    };

    const onGanttPointerUp = () => {
      dragGantt.current = null;
      window.removeEventListener("pointermove", onGanttPointerMove);
      window.removeEventListener("pointerup", onGanttPointerUp);
    };

    const startGanttDrag = (
      e: React.PointerEvent,
      taskId: string,
      mode: "move" | "resize",
      task: GanttTask,
    ) => {
      if (readOnly) return;
      e.preventDefault();
      dragGantt.current = {
        taskId,
        mode,
        startX: e.clientX,
        origStart: task.start,
        origWidth: task.width,
      };
      window.addEventListener("pointermove", onGanttPointerMove);
      window.addEventListener("pointerup", onGanttPointerUp);
    };

    const addTask = () => {
      if (readOnly) return;
      setGantt((prev) => {
        const result = [...prev, { id: newId(), name: "New task", start: 8, width: 28 }];
        scheduleSave({ editor: "gantt", tasks: result });
        return result;
      });
    };

    const updateTaskName = (taskId: string, name: string) => {
      if (readOnly) return;
      setGantt((prev) => {
        const result = prev.map((t) => (t.id === taskId ? { ...t, name } : t));
        scheduleSave({ editor: "gantt", tasks: result });
        return result;
      });
    };

    return (
      <div className={cn("absolute inset-0 z-[2] flex flex-col bg-neutral-50/95", pad)}>
        <div className="mb-1 flex items-center justify-between">
          <span className={cn("font-semibold text-neutral-700", head)}>Timeline</span>
          {!readOnly ? (
            <button
              type="button"
              onClick={addTask}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          ) : null}
        </div>
        <div id="gantt-track" className="flex flex-1 flex-col justify-center gap-2">
          {gantt.map((task) => (
            <div key={task.id} className="flex items-center gap-2">
              <input
                type="text"
                value={task.name}
                readOnly={readOnly}
                onChange={(e) => updateTaskName(task.id, e.target.value)}
                className={cn("w-14 shrink-0 truncate border-0 bg-transparent text-neutral-600 outline-none", text)}
              />
              <div className="relative h-4 flex-1 rounded-full bg-neutral-200/80">
                <div
                  className={cn(
                    "absolute top-0 h-full rounded-full bg-blue-500/80",
                    !readOnly && "cursor-grab active:cursor-grabbing",
                  )}
                  style={{ left: `${task.start}%`, width: `${task.width}%` }}
                  onPointerDown={(e) => startGanttDrag(e, task.id, "move", task)}
                />
                {!readOnly ? (
                  <div
                    className="absolute top-0 h-full w-2 cursor-ew-resize"
                    style={{ left: `calc(${task.start + task.width}% - 4px)` }}
                    onPointerDown={(e) => startGanttDrag(e, task.id, "resize", task)}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export function isInteractiveLayoutMode(mode: BoardLayoutMode): boolean {
  return mode === "kanban" || mode === "gantt";
}
