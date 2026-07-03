import { useCallback, useRef } from "react";
import { BoardCanvasEditor, type BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import { cn } from "@/lib/utils";

type BoardDesktopGridProps = {
  boards: Board[];
  activeId: string;
  onSelect: (id: string) => void;
  onSave: (boardId: string, layout: Record<string, unknown>) => void;
  registerEditor: (boardId: string, handle: BoardCanvasHandle | null) => void;
};

export function BoardDesktopGrid({
  boards,
  activeId,
  onSelect,
  onSave,
  registerEditor,
}: BoardDesktopGridProps) {
  const saveHandlers = useRef(new Map<string, (layout: Record<string, unknown>) => void>());

  const getSaveHandler = useCallback(
    (boardId: string) => {
      if (!saveHandlers.current.has(boardId)) {
        saveHandlers.current.set(boardId, (layout) => onSave(boardId, layout));
      }
      return saveHandlers.current.get(boardId)!;
    },
    [onSave],
  );

  return (
    <div className="board-desktop-grid flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-4">
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-3 overflow-y-auto",
          boards.length === 1 ? "grid-cols-1" : "grid-cols-2",
          boards.length > 2 ? "auto-rows-fr" : "grid-rows-1",
        )}
        style={boards.length > 2 ? { gridTemplateRows: `repeat(${Math.ceil(boards.length / 2)}, minmax(0, 1fr))` } : undefined}
      >
        {boards.map((board) => {
          const active = board.id === activeId;
          return (
            <div
              key={board.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(board.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(board.id);
                }
              }}
              className={cn(
                "board-grid-cell flex min-h-0 flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-shadow",
                active ? "border-neutral-900 ring-2 ring-neutral-900/10" : "border-neutral-200 hover:border-neutral-300",
              )}
            >
              <div
                className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-3 py-2"
                style={{ backgroundColor: boardFillForKey(board.color_key) }}
              >
                <span className="truncate text-xs font-semibold text-neutral-900">{board.title}</span>
                {board.role === "plan" && (
                  <span className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-neutral-800">
                    Plan
                  </span>
                )}
              </div>
              <div className="relative min-h-0 flex-1">
                <BoardCanvasEditor
                  ref={(handle) => registerEditor(board.id, handle)}
                  boardId={board.id}
                  colorKey={board.color_key}
                  layoutMode={board.layout_mode ?? "vision"}
                  layoutJson={board.layout_json}
                  onSave={getSaveHandler(board.id)}
                  embedded
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 shrink-0 text-center text-[10px] text-neutral-400">
        Click a board to edit with the toolbar · all boards save automatically
      </p>
    </div>
  );
}
