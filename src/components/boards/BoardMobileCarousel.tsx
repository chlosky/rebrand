import { useCallback, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardCanvasEditor, type BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import { BoardEditableTitle } from "@/components/boards/BoardEditableTitle";
import { cn } from "@/lib/utils";

type BoardMobileCarouselProps = {
  boards: Board[];
  activeId: string;
  onSelect: (id: string) => void;
  onSave: (boardId: string, layout: Record<string, unknown>) => void;
  onAddBoard: () => void;
  onRemoveBoard?: () => void;
  canRemoveBoard?: boolean;
  registerEditor: (boardId: string, handle: BoardCanvasHandle | null) => void;
  onRenameBoard: (boardId: string, title: string) => void | Promise<void>;
  onTitleStyleChange: (
    boardId: string,
    patch: { title_color?: string | null; title_font?: string | null },
  ) => void | Promise<void>;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
};

export function BoardMobileCarousel({
  boards,
  activeId,
  onSelect,
  onSave,
  onAddBoard,
  onRemoveBoard,
  canRemoveBoard = false,
  registerEditor,
  onRenameBoard,
  onTitleStyleChange,
  onHistoryChange,
}: BoardMobileCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveHandlers = useRef(new Map<string, (layout: Record<string, unknown>) => void>());
  const scrollingProgrammatically = useRef(false);

  const getSaveHandler = useCallback(
    (boardId: string) => {
      if (!saveHandlers.current.has(boardId)) {
        saveHandlers.current.set(boardId, (layout) => onSave(boardId, layout));
      }
      return saveHandlers.current.get(boardId)!;
    },
    [onSave],
  );

  const activeIndex = Math.max(0, boards.findIndex((b) => b.id === activeId));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || boards.length === 0) return;
    const child = el.children[activeIndex] as HTMLElement | undefined;
    if (!child) return;
    scrollingProgrammatically.current = true;
    child.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    const t = window.setTimeout(() => {
      scrollingProgrammatically.current = false;
    }, 400);
    return () => window.clearTimeout(t);
  }, [activeIndex, boards.length]);

  const handleScroll = useCallback(() => {
    if (scrollingProgrammatically.current) return;
    const el = scrollRef.current;
    if (!el || boards.length === 0) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(center - childCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    const next = boards[bestIdx];
    if (next && next.id !== activeId) onSelect(next.id);
  }, [activeId, boards, onSelect]);

  return (
    <div className="board-mobile-carousel relative flex h-0 min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-0 min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {boards.map((board) => (
          <div
            key={board.id}
            className="flex h-full w-full shrink-0 snap-center flex-col"
          >
            <div
              className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-4 py-2"
              style={{ backgroundColor: boardFillForKey(board.color_key) }}
            >
              <BoardEditableTitle
                boardId={board.id}
                title={board.title}
                headerFill={boardFillForKey(board.color_key)}
                titleColor={board.title_color}
                titleFont={board.title_font}
                onRename={onRenameBoard}
                onStyleChange={onTitleStyleChange}
                showStyleControls={board.id === activeId}
                className="text-sm font-semibold"
                inputClassName="w-full text-sm font-semibold"
              />
              {board.role === "plan" && (
                <span className="shrink-0 rounded bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Plan
                </span>
              )}
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden px-1 pb-1">
              <BoardCanvasEditor
                ref={(handle) => registerEditor(board.id, handle)}
                boardId={board.id}
                colorKey={board.color_key}
                layoutMode={board.layout_mode ?? "vision"}
                layoutJson={board.layout_json}
                onSave={getSaveHandler(board.id)}
                onHistoryChange={board.id === activeId ? onHistoryChange : undefined}
                embedded
                cellFit="cover"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-1.5 border-t border-neutral-100 bg-white py-1.5">
        {boards.map((board, i) => (
          <button
            key={board.id}
            type="button"
            aria-label={`Go to ${board.title}`}
            onClick={() => onSelect(board.id)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === activeIndex ? "w-5 bg-neutral-900" : "w-2 bg-neutral-300",
            )}
          />
        ))}
        <Button
          variant="outline"
          size="icon"
          className="ml-2 h-8 w-8 rounded-full border-dashed"
          onClick={onAddBoard}
          aria-label="Add focus board"
        >
          <Plus className="h-4 w-4" />
        </Button>
        {canRemoveBoard && onRemoveBoard && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-red-600"
            onClick={onRemoveBoard}
            aria-label="Remove this board"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="shrink-0 pb-0.5 text-center text-[10px] text-neutral-400">
        Swipe between boards · tap an item, then Delete on the bar above
      </p>
    </div>
  );
}
