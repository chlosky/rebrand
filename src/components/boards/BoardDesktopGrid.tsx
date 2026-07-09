import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";

import { ChevronLeft, ChevronRight, GripVertical, Plus } from "lucide-react";

import {
  BoardCanvasEditor,
  ARTBOARD_HEIGHT,
  ARTBOARD_WIDTH,
  type BoardCanvasHandle,
} from "@/components/boards/BoardCanvasEditor";

import type { BoardZoomPreset } from "@/components/boards/BoardToolbar";

import { boardFillForKey } from "@/lib/boards/colors";

import { STANDARD_BOARD_COUNT } from "@/lib/boards/starterTemplates";

import type { Board } from "@/lib/boards/types";

import { BoardEditableTitle } from "@/components/boards/BoardEditableTitle";

import { cn } from "@/lib/utils";



const GRID_GAP_PX = 10;

const GRID_PAD_PX = 8;

const ADD_BTN_WIDTH_PX = 40;

const TITLE_BAR_PX = 32;

const MIN_CELL_WIDTH_PX = 120;

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

type CellSize = { width: number; height: number };



type BoardDesktopGridProps = {

  boards: Board[];

  activeId: string;

  onSelect: (id: string) => void;

  onSave: (boardId: string, layout: Record<string, unknown>) => void;

  registerEditor: (boardId: string, handle: BoardCanvasHandle | null) => void;

  onAddBoard?: () => void;

  onRenameBoard: (boardId: string, title: string) => void | Promise<void>;

  zoomPreset: BoardZoomPreset;

  presentationMode?: "row" | "matrix";

  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;

  onReorderBoards?: (fromIndex: number, toIndex: number) => void;

};



export function BoardDesktopGrid({

  boards,

  activeId,

  onSelect,

  onSave,

  registerEditor,

  onAddBoard,

  onRenameBoard,

  zoomPreset,

  presentationMode = "row",

  onHistoryChange,

  onReorderBoards,

}: BoardDesktopGridProps) {

  const saveHandlers = useRef(new Map<string, (layout: Record<string, unknown>) => void>());

  const gridRef = useRef<HTMLDivElement>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

  const [cellSize, setCellSize] = useState<CellSize>({ width: 200, height: 280 });

  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const [canScrollRight, setCanScrollRight] = useState(false);

  const [dragBoardId, setDragBoardId] = useState<string | null>(null);

  const [dropBoardId, setDropBoardId] = useState<string | null>(null);

  const isMatrix = presentationMode === "matrix";



  const getSaveHandler = useCallback(
    (boardId: string) => {
      if (!saveHandlers.current.has(boardId)) {
        saveHandlers.current.set(boardId, (layout) => onSave(boardId, layout));
      }
      return saveHandlers.current.get(boardId)!;
    },
    [onSave],
  );



  const updateScrollHints = useCallback(() => {

    const el = viewportRef.current;

    if (!el) return;

    if (isMatrix) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(el.scrollLeft > 4);

    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);

  }, [isMatrix]);



  useLayoutEffect(() => {

    const grid = gridRef.current;

    const viewport = viewportRef.current;

    if (!grid || !viewport) return;



    const measure = () => {

      const availW = viewport.clientWidth - GRID_PAD_PX * 2;

      const availH = grid.clientHeight - GRID_PAD_PX * 2;

      const addReserve = !isMatrix && onAddBoard ? ADD_BTN_WIDTH_PX + GRID_GAP_PX : 0;

      const boardGaps = GRID_GAP_PX * Math.max(STANDARD_BOARD_COUNT - 1, 0);



      const maxWFromWidth = isMatrix
        ? (availW - GRID_GAP_PX) / 2
        : (availW - addReserve - boardGaps) / STANDARD_BOARD_COUNT;

      const canvasAvailH = Math.max(availH - TITLE_BAR_PX, 160);

      const multiplier = zoomPreset === "fit" ? 1 : zoomPreset;
      const firstBoard = boards[0];
      const boardAspectHeight =
        firstBoard && firstBoard.artboard_width > 0
          ? firstBoard.artboard_height / firstBoard.artboard_width
          : ARTBOARD_HEIGHT / ARTBOARD_WIDTH;



      let cellWidth = maxWFromWidth * multiplier;

      let cellHeight = (isMatrix ? Math.max((availH - GRID_GAP_PX) / 2 - TITLE_BAR_PX, 220) : canvasAvailH) * multiplier;



      if (!isMatrix && cellWidth * STANDARD_BOARD_COUNT + boardGaps + addReserve > availW) {

        cellWidth = maxWFromWidth;

      }



      setCellSize({
        width: Math.max(MIN_CELL_WIDTH_PX, Math.round(cellWidth)),
        height: isMatrix
          ? Math.max(Math.round(cellWidth * boardAspectHeight), 220)
          : Math.max(Math.round(cellWidth * boardAspectHeight), 220),
      });

    };



    measure();

    const observer = new ResizeObserver(() => {

      measure();

      updateScrollHints();

    });

    observer.observe(grid);

    observer.observe(viewport);

    window.addEventListener("resize", measure);

    return () => {

      observer.disconnect();

      window.removeEventListener("resize", measure);

    };

  }, [boards, isMatrix, onAddBoard, updateScrollHints, zoomPreset]);



  useEffect(() => {

    updateScrollHints();

  }, [boards.length, cellSize.width, updateScrollHints]);



  useEffect(() => {

    const viewport = viewportRef.current;

    if (!viewport) return;

    const activeEl = viewport.querySelector(`[data-board-id="${activeId}"]`);

    activeEl?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });

  }, [activeId, cellSize.width]);



  const scrollByPage = (direction: -1 | 1) => {

    const el = viewportRef.current;

    if (!el) return;

    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.6, cellSize.width), behavior: "smooth" });

  };



  const rowHeight = cellSize.height + TITLE_BAR_PX;

  const rowScrollWidth =

    boards.length * cellSize.width +

    Math.max(boards.length - 1, 0) * GRID_GAP_PX +

    (onAddBoard ? ADD_BTN_WIDTH_PX + GRID_GAP_PX : 0);



  return (

    <div ref={gridRef} className="board-desktop-grid flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

      <div className="relative min-h-0 flex-1 overflow-hidden">

        {canScrollLeft && (

          <button

            type="button"

            aria-label="Scroll boards left"

            onClick={() => scrollByPage(-1)}

            className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-sm hover:bg-white"

          >

            <ChevronLeft className="h-4 w-4" />

          </button>

        )}

        {canScrollRight && (

          <button

            type="button"

            aria-label="Scroll boards right"

            onClick={() => scrollByPage(1)}

            className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-sm hover:bg-white"

          >

            <ChevronRight className="h-4 w-4" />

          </button>

        )}



        <div

          ref={viewportRef}

          className={cn(
            "board-row-scroll flex h-full flex-col scroll-smooth p-2",
            isMatrix ? "overflow-x-hidden overflow-y-auto" : "overflow-x-auto overflow-y-auto",
          )}

          onScroll={updateScrollHints}

          onWheel={(e) => {

            const el = viewportRef.current;

            if (isMatrix || !el || el.scrollWidth <= el.clientWidth) return;

            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {

              el.scrollLeft += e.deltaY;

              e.preventDefault();

            }

          }}

        >

          <div

            className={cn(
              "min-h-full gap-2.5",
              isMatrix ? "grid grid-cols-2 content-start items-start" : "flex flex-row flex-nowrap items-stretch",
            )}

            style={
              isMatrix
                ? { gridAutoRows: rowHeight, minHeight: rowHeight }
                : { width: rowScrollWidth, minHeight: rowHeight, height: rowHeight }
            }

          >

            {boards.map((board, boardIndex) => {

              const active = board.id === activeId;
              const canReorder = !!onReorderBoards && boards.length > 1;
              const isDropTarget = dropBoardId === board.id && dragBoardId !== board.id;

              return (

                <div

                  key={board.id}

                  data-board-id={board.id}

                  role="button"

                  tabIndex={0}

                  onClick={() => onSelect(board.id)}

                  onKeyDown={(e) => {

                    if (e.key === "Enter" || e.key === " ") {

                      e.preventDefault();

                      onSelect(board.id);

                    }

                  }}

                  onDragOver={
                    canReorder
                      ? (e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDropBoardId(board.id);
                        }
                      : undefined
                  }

                  onDragLeave={
                    canReorder
                      ? () => {
                          setDropBoardId((prev) => (prev === board.id ? null : prev));
                        }
                      : undefined
                  }

                  onDrop={
                    canReorder
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const fromId = e.dataTransfer.getData("text/board-id");
                          const fromIndex = boards.findIndex((b) => b.id === fromId);
                          if (fromIndex >= 0 && fromIndex !== boardIndex) {
                            onReorderBoards(fromIndex, boardIndex);
                          }
                          setDragBoardId(null);
                          setDropBoardId(null);
                        }
                      : undefined
                  }

                  style={{ width: isMatrix ? "100%" : cellSize.width, height: rowHeight }}

                  className={cn(

                    "board-grid-cell flex shrink-0 flex-col overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-shadow",

                    active ? "border-neutral-900 ring-2 ring-neutral-900/10" : "border-neutral-200 hover:border-neutral-300",

                    isDropTarget && "border-neutral-500 ring-2 ring-neutral-400/30",

                  )}

                >

                  <div

                    className="flex h-8 shrink-0 items-center justify-between gap-1 border-b border-neutral-100 px-1.5"

                    style={{ backgroundColor: boardFillForKey(board.color_key) }}

                  >

                    {canReorder ? (
                      <button
                        type="button"
                        draggable
                        aria-label={`Drag to reorder ${board.title}`}
                        className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-neutral-500 hover:bg-black/5 hover:text-neutral-800 active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/board-id", board.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragBoardId(board.id);
                        }}
                        onDragEnd={() => {
                          setDragBoardId(null);
                          setDropBoardId(null);
                        }}
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                    ) : null}

                    <BoardEditableTitle

                      boardId={board.id}

                      title={board.title}

                      headerFill={boardFillForKey(board.color_key)}

                      onRename={onRenameBoard}

                      className="min-w-0 flex-1 text-[11px] font-semibold"

                      inputClassName="w-full text-[11px] font-semibold"

                    />

                    {board.role === "plan" && (

                      <span className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-neutral-800">

                        Plan

                      </span>

                    )}

                  </div>

                  <div className="relative min-h-0 flex-1 overflow-hidden" style={{ height: cellSize.height }}>

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
                      viewZoom="fit"
                    />

                  </div>

                </div>

              );

            })}



            {onAddBoard && (

              <button

                type="button"

                onClick={onAddBoard}

                title="Add focus board"

                style={{ width: isMatrix ? "100%" : ADD_BTN_WIDTH_PX, height: rowHeight }}

                className="flex shrink-0 flex-col items-center justify-center self-stretch rounded-lg border border-dashed border-neutral-300 bg-white/40 text-neutral-500 transition-colors hover:border-neutral-500 hover:bg-white hover:text-neutral-900"

              >

                <Plus className="h-5 w-5" />

              </button>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}


