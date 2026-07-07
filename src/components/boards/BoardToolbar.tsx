import { useState } from "react";
import {
  Layers,
  Redo2,
  RotateCcw,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";

export type BoardZoomPreset = "fit" | 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5;

type BoardToolbarProps = {
  editorRef: React.RefObject<BoardCanvasHandle | null>;
  onResetBoard?: () => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
  zoomPreset?: BoardZoomPreset;
  onZoomPresetChange?: (preset: BoardZoomPreset) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** Mobile: keep toolbar on one row; Reset + Delete stay paired. */
  compact?: boolean;
  /** Mobile only: Delete menu includes delete board. */
  onDeleteBoard?: () => void;
};

const toolBtn =
  "h-9 justify-start gap-2 rounded-lg px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-100";

export function BoardToolbar({
  editorRef,
  onResetBoard,
  className,
  orientation = "vertical",
  zoomPreset,
  onZoomPresetChange,
  canUndo = false,
  canRedo = false,
  compact = false,
  onDeleteBoard,
}: BoardToolbarProps) {
  const horizontal = orientation === "horizontal";
  const showZoom = horizontal && zoomPreset !== undefined && onZoomPresetChange !== undefined;
  const [resetOpen, setResetOpen] = useState(false);

  const runReset = () => {
    if (onResetBoard) onResetBoard();
    else editorRef.current?.resetBoard();
    setResetOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "shrink-0 gap-1 bg-white p-2",
          horizontal
            ? cn(
                "flex flex-row items-center border-b border-neutral-200",
                compact ? "flex-nowrap gap-0.5 overflow-x-auto p-1.5" : "flex-wrap gap-1 p-2",
              )
            : "flex flex-col border-r border-neutral-200",
          className,
        )}
      >
        {!horizontal && (
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Add</p>
        )}
        <Button
          variant="ghost"
          className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
          onClick={() => editorRef.current?.addText()}
        >
          <Type className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Text</span> : "Text"}
        </Button>
        <Button
          variant="ghost"
          className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
          onClick={() => editorRef.current?.addStickyNote()}
        >
          <StickyNote className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Note</span> : "Sticky note"}
        </Button>

        {horizontal && <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />}

        <Button
          variant="ghost"
          className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
          disabled={!canUndo}
          onClick={() => editorRef.current?.undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Undo</span> : "Undo"}
        </Button>
        <Button
          variant="ghost"
          className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
          disabled={!canRedo}
          onClick={() => editorRef.current?.redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Redo</span> : "Redo"}
        </Button>

        {horizontal && <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />}

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            className={cn(
              toolBtn,
              horizontal ? "h-9 w-auto text-amber-800 hover:bg-amber-50 hover:text-amber-900" : "w-full text-amber-800 hover:bg-amber-50 hover:text-amber-900",
            )}
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
            {horizontal ? "Reset board" : "Reset board"}
          </Button>
          {compact && onDeleteBoard ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    toolBtn,
                    "h-9 w-auto text-red-600 hover:text-red-700 hover:bg-red-50",
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[10.5rem]">
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => editorRef.current?.deleteSelected()}
                >
                  Delete item
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs text-red-600 focus:text-red-600"
                  onClick={onDeleteBoard}
                >
                  Delete board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className={cn(
                toolBtn,
                horizontal ? "h-9 w-auto text-red-600 hover:text-red-700 hover:bg-red-50" : "w-full text-red-600 hover:text-red-700 hover:bg-red-50",
              )}
              onClick={() => editorRef.current?.deleteSelected()}
            >
              <Trash2 className="h-4 w-4" />
              {horizontal ? "Delete" : "Delete selected"}
            </Button>
          )}
        </div>

        {!horizontal && (
          <div className="mt-auto flex items-center gap-1 px-2 pt-4 text-[10px] text-neutral-400">
            <Layers className="h-3 w-3" />
            Right-click menu · Ctrl+C/V · Delete
          </div>
        )}

        {showZoom && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <span className="mr-1 hidden h-6 w-px bg-neutral-200 md:block" aria-hidden />
            <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500">Zoom</span>
              {(
                [
                  { id: "fit" as const, label: "Fit all" },
                  { id: 0.25 as const, label: "25%" },
                  { id: 0.5 as const, label: "50%" },
                  { id: 0.75 as const, label: "75%" },
                  { id: 1 as const, label: "100%" },
                  { id: 1.25 as const, label: "125%" },
                  { id: 1.5 as const, label: "150%" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={String(id)}
                  type="button"
                  onClick={() => onZoomPresetChange(id)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-medium",
                    zoomPreset === id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100",
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                title="Zoom out"
                onClick={() =>
                  onZoomPresetChange(
                    zoomPreset === 1.5
                      ? 1.25
                      : zoomPreset === 1.25
                        ? 1
                        : zoomPreset === 1
                          ? 0.75
                          : zoomPreset === 0.75
                            ? 0.5
                            : zoomPreset === 0.5
                              ? 0.25
                              : zoomPreset === 0.25
                                ? "fit"
                                : "fit",
                  )
                }
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Zoom in"
                onClick={() =>
                  onZoomPresetChange(
                    zoomPreset === "fit"
                      ? 1
                      : zoomPreset === 0.25
                        ? 0.5
                        : zoomPreset === 0.5
                          ? 0.75
                          : zoomPreset === 0.75
                            ? 1
                            : zoomPreset === 1
                              ? 1.25
                              : zoomPreset === 1.25
                                ? 1.5
                                : 1.5,
                  )
                }
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
        )}
        {horizontal && !showZoom && (
          <span className="ml-auto hidden text-[10px] text-neutral-400 sm:inline">
            Right-click menu · Ctrl+C/V
          </span>
        )}
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this board?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all text, images, stickies, and structures from the board. Your board color stays the same.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={runReset}>
              Reset board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
