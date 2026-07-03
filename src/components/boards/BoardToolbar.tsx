import {
  ArrowDown,
  ArrowUp,
  Layers,
  StickyNote,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";

type BoardToolbarProps = {
  editorRef: React.RefObject<BoardCanvasHandle | null>;
  className?: string;
  orientation?: "vertical" | "horizontal";
};

const toolBtn =
  "h-9 justify-start gap-2 rounded-lg px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-100";

export function BoardToolbar({ editorRef, className, orientation = "vertical" }: BoardToolbarProps) {
  const horizontal = orientation === "horizontal";

  return (
    <div
      className={cn(
        "gap-1 bg-white p-2",
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

      {!horizontal && (
        <p className="mt-3 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Layer</p>
      )}
      {horizontal && <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />}
      <Button
        variant="ghost"
        className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
        onClick={() => editorRef.current?.bringForward()}
      >
        <ArrowUp className="h-4 w-4" />
        {horizontal ? <span className="sr-only">Forward</span> : "Forward"}
      </Button>
      <Button
        variant="ghost"
        className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
        onClick={() => editorRef.current?.sendBackward()}
      >
        <ArrowDown className="h-4 w-4" />
        {horizontal ? <span className="sr-only">Back</span> : "Back"}
      </Button>
      <Button
        variant="ghost"
        className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
        onClick={() => editorRef.current?.deleteSelected()}
      >
        <Trash2 className="h-4 w-4" />
        {horizontal ? <span className="sr-only">Delete</span> : "Delete"}
      </Button>

      {!horizontal && (
        <div className="mt-auto flex items-center gap-1 px-2 pt-4 text-[10px] text-neutral-400">
          <Layers className="h-3 w-3" />
          Drag to move · corners to resize
        </div>
      )}
    </div>
  );
}
