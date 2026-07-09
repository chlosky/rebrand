import { useCallback, useEffect, useRef, type ComponentProps } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BoardCanvasEditor, type BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import { BoardEditableTitle } from "@/components/boards/BoardEditableTitle";

type BoardMobileCarouselProps = {
  boards: Board[];
  activeId: string;
  onSelect: (id: string) => void;
  onSave: (boardId: string, layout: Record<string, unknown>) => void;
  registerEditor: (boardId: string, handle: BoardCanvasHandle | null) => void;
  onRenameBoard: (boardId: string, title: string) => void | Promise<void>;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onBoardColorChange?: (boardId: string, colorKey: string) => void | Promise<void>;
  onRequestImagePick?: () => void;
};

type RegisteredBoardCanvasEditorProps = ComponentProps<typeof BoardCanvasEditor> & {
  registerEditor: (boardId: string, handle: BoardCanvasHandle | null) => void;
};

function RegisteredBoardCanvasEditor({
  boardId,
  registerEditor,
  ...rest
}: RegisteredBoardCanvasEditorProps) {
  const handleRef = useRef<BoardCanvasHandle | null>(null);

  const setRef = useCallback(
    (handle: BoardCanvasHandle | null) => {
      handleRef.current = handle;
      if (handle) registerEditor(boardId, handle);
    },
    [boardId, registerEditor],
  );

  useEffect(() => {
    if (handleRef.current) registerEditor(boardId, handleRef.current);
  });

  useEffect(() => () => registerEditor(boardId, null), [boardId, registerEditor]);

  return <BoardCanvasEditor ref={setRef} boardId={boardId} {...rest} />;
}

export function BoardMobileCarousel({
  boards,
  activeId,
  onSelect,
  onSave,
  registerEditor,
  onRenameBoard,
  onHistoryChange,
  onBoardColorChange,
  onRequestImagePick,
}: BoardMobileCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveHandlers = useRef(new Map<string, (layout: Record<string, unknown>) => void>());
  const scrollingProgrammatically = useRef(false);
  const scrollResetTimer = useRef<number | undefined>(undefined);
  const swipeRef = useRef({ startX: 0, startY: 0, tracking: false });
  const activeIndexRef = useRef(0);

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
  activeIndexRef.current = activeIndex;

  const scrollToIndex = useCallback(
    (index: number, select = true) => {
      const clamped = Math.max(0, Math.min(boards.length - 1, index));
      const el = scrollRef.current;
      const child = el?.children[clamped] as HTMLElement | undefined;
      if (!el || !child) return clamped;

      scrollingProgrammatically.current = true;
      el.scrollLeft = child.offsetLeft;

      const next = boards[clamped];
      if (select && next && next.id !== activeId) onSelect(next.id);

      if (scrollResetTimer.current !== undefined) window.clearTimeout(scrollResetTimer.current);
      scrollResetTimer.current = window.setTimeout(() => {
        scrollingProgrammatically.current = false;
        scrollResetTimer.current = undefined;
      }, 450);

      return clamped;
    },
    [activeId, boards, onSelect],
  );

  const goToIndex = useCallback(
    (index: number) => {
      scrollToIndex(index, true);
    },
    [scrollToIndex],
  );

  useEffect(() => {
    scrollToIndex(activeIndex, false);
  }, [activeIndex, boards.length, scrollToIndex]);

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
    if (next && next.id !== activeId) {
      scrollingProgrammatically.current = true;
      onSelect(next.id);
      if (scrollResetTimer.current !== undefined) window.clearTimeout(scrollResetTimer.current);
      scrollResetTimer.current = window.setTimeout(() => {
        scrollingProgrammatically.current = false;
        scrollResetTimer.current = undefined;
      }, 450);
    }
  }, [activeId, boards, onSelect]);

  useEffect(() => {
    const root = scrollRef.current?.parentElement;
    if (!root || boards.length <= 1) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      swipeRef.current.startX = e.touches[0].clientX;
      swipeRef.current.startY = e.touches[0].clientY;
      swipeRef.current.tracking = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!swipeRef.current.tracking) return;
      swipeRef.current.tracking = false;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - swipeRef.current.startX;
      const dy = touch.clientY - swipeRef.current.startY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
      const current = activeIndexRef.current;
      goToIndex(current + (dx < 0 ? 1 : -1));
    };

    root.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    root.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
    root.addEventListener("touchcancel", onTouchEnd, { capture: true, passive: true });
    return () => {
      root.removeEventListener("touchstart", onTouchStart, { capture: true });
      root.removeEventListener("touchend", onTouchEnd, { capture: true });
      root.removeEventListener("touchcancel", onTouchEnd, { capture: true });
    };
  }, [boards.length, goToIndex]);

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
              className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-2 py-2"
              style={{ backgroundColor: boardFillForKey(board.color_key) }}
            >
              {boards.length > 1 ? (
                <button
                  type="button"
                  aria-label="Previous board"
                  disabled={activeIndex === 0}
                  onClick={() => goToIndex(activeIndex - 1)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 active:bg-black/5 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <span className="w-10 shrink-0" />
              )}
              <BoardEditableTitle
                boardId={board.id}
                title={board.title}
                headerFill={boardFillForKey(board.color_key)}
                onRename={onRenameBoard}
                className="min-w-0 flex-1 text-center text-sm font-semibold"
                inputClassName="w-full text-center text-sm font-semibold"
              />
              {boards.length > 1 ? (
                <button
                  type="button"
                  aria-label="Next board"
                  disabled={activeIndex === boards.length - 1}
                  onClick={() => goToIndex(activeIndex + 1)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 active:bg-black/5 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : board.role === "plan" ? (
                <span className="shrink-0 rounded bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase">
                  Plan
                </span>
              ) : (
                <span className="w-10 shrink-0" />
              )}
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <RegisteredBoardCanvasEditor
                boardId={board.id}
                registerEditor={registerEditor}
                colorKey={board.color_key}
                layoutMode={board.layout_mode ?? "vision"}
                layoutJson={board.layout_json}
                artboardWidth={board.artboard_width}
                artboardHeight={board.artboard_height}
                onSave={getSaveHandler(board.id)}
                onHistoryChange={board.id === activeId ? onHistoryChange : undefined}
                isActive={board.id === activeId}
                embedded
                cellFit="contain"
                fabricSelectionControls
                onBoardColorPick={(hex) => void onBoardColorChange?.(board.id, hex)}
                onRequestImagePick={board.id === activeId ? onRequestImagePick : undefined}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
