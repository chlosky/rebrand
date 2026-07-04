import {
  Layers,
  Redo2,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { STANDARD_BOARD_COUNT } from "@/lib/boards/starterTemplates";

export type BoardZoomPreset = "fit" | 1 | 1.25 | 1.5;

type BoardToolbarProps = {
  editorRef: React.RefObject<BoardCanvasHandle | null>;
  className?: string;
  orientation?: "vertical" | "horizontal";
  boardCount?: number;
  zoomPreset?: BoardZoomPreset;
  onZoomPresetChange?: (preset: BoardZoomPreset) => void;
  canUndo?: boolean;
  canRedo?: boolean;
};

const toolBtn =
  "h-9 justify-start gap-2 rounded-lg px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-100";

export function BoardToolbar({
  editorRef,
  className,
  orientation = "vertical",
  boardCount,
  zoomPreset,
  onZoomPresetChange,
  canUndo = false,
  canRedo = false,
}: BoardToolbarProps) {
  const horizontal = orientation === "horizontal";
  const showZoom = horizontal && zoomPreset !== undefined && onZoomPresetChange !== undefined;

  return (
    <div
      className={cn(
        "shrink-0 gap-1 bg-white p-2",
        horizontal
          ? "flex flex-row flex-wrap items-center border-b border-neutral-200"
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

      <Button
        variant="ghost"
        className={cn(toolBtn, horizontal ? "h-9 w-auto text-red-600 hover:text-red-700 hover:bg-red-50" : "w-full text-red-600 hover:text-red-700 hover:bg-red-50")}
        onClick={() => editorRef.current?.deleteSelected()}
      >
        <Trash2 className="h-4 w-4" />
        {horizontal ? "Delete" : "Delete selected"}
      </Button>

      {!horizontal && (
        <div className="mt-auto flex items-center gap-1 px-2 pt-4 text-[10px] text-neutral-400">
          <Layers className="h-3 w-3" />
          Select an item · click brings it forward · Delete removes it
        </div>
      )}
      {horizontal && boardCount !== undefined && (
        <span className="hidden text-[10px] text-neutral-500 lg:inline">
          {boardCount === STANDARD_BOARD_COUNT
            ? "3 focus boards + The Plan"
            : `${boardCount} boards · scroll for more`}
          {" · "}click to edit
        </span>
      )}
      {showZoom && (
        <>
          <span className="mx-1 hidden h-6 w-px bg-neutral-200 md:block" aria-hidden />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500">Zoom</span>
            {(
              [
                { id: "fit" as const, label: "Fit all" },
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
                  zoomPreset === 1.5 ? 1.25 : zoomPreset === 1.25 ? 1 : zoomPreset === 1 ? "fit" : "fit",
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
                  zoomPreset === "fit" ? 1 : zoomPreset === 1 ? 1.25 : zoomPreset === 1.25 ? 1.5 : 1.5,
                )
              }
              className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
      {horizontal && !showZoom && (
        <span className="ml-auto hidden text-[10px] text-neutral-400 sm:inline">
          Select · click to bring forward · drag · Delete
        </span>
      )}
    </div>
  );
}
