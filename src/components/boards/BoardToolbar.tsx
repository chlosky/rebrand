import { useState } from "react";
import {
  Layers,
  Loader2,
  Redo2,
  RotateCcw,
  Save,
  StickyNote,
  Trash2,
  Type,
  Undo2,
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

type BoardToolbarProps = {
  editorRef: React.RefObject<BoardCanvasHandle | null>;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetBoard?: () => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
  canUndo?: boolean;
  canRedo?: boolean;
  /** Explicit save — writes all open boards to Supabase. */
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  /** Mobile: keep toolbar on one row; Reset + Delete stay paired. */
  compact?: boolean;
  /** Mobile only: Delete menu includes delete board. */
  onDeleteBoard?: () => void;
};

const toolBtn =
  "h-9 justify-start gap-2 rounded-lg px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-100";

export function BoardToolbar({
  editorRef,
  onUndo,
  onRedo,
  onResetBoard,
  className,
  orientation = "vertical",
  canUndo = false,
  canRedo = false,
  onSave,
  saving = false,
  compact = false,
  onDeleteBoard,
}: BoardToolbarProps) {
  const horizontal = orientation === "horizontal";

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
          onClick={() => (onUndo ?? (() => editorRef.current?.undo()))()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Undo</span> : "Undo"}
        </Button>
        <Button
          variant="ghost"
          className={cn(toolBtn, horizontal ? "h-9 w-auto" : "w-full")}
          disabled={!canRedo}
          onClick={() => (onRedo ?? (() => editorRef.current?.redo()))()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
          {horizontal ? <span className="sr-only sm:not-sr-only">Redo</span> : "Redo"}
        </Button>

        {horizontal && <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />}

        {onSave ? (
          <Button
            variant="default"
            className={cn(
              toolBtn,
              horizontal
                ? "h-9 w-auto bg-stone-900 text-white hover:bg-stone-800 hover:text-white"
                : "w-full bg-stone-900 text-white hover:bg-stone-800 hover:text-white",
            )}
            disabled={saving}
            onClick={() => void onSave()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {horizontal ? <span className="sr-only sm:not-sr-only">Save</span> : "Save"}
          </Button>
        ) : null}

        {horizontal && onSave ? (
          <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />
        ) : null}

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
