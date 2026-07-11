import { useRef, useState } from "react";
import type { RefObject } from "react";
import { BookImage, MessageCircleHeart, Palette, PenLine, ScrollText, StickyNote, Type } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";
import { BoardColorStrip } from "@/components/boards/BoardColorStrip";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import {
  BOARD_MARK_SHAPE_OPTIONS,
  BOARD_MARK_STICKER_OPTIONS,
} from "@/components/boards/BoardMarksQuickSelector";
import { PLOT_STRUCTURE_COMPACT, PLOT_STRUCTURES, STRUCTURE_DECAL_SIZE, StructureDecalPreview, type PlotDockTab } from "@/components/boards/BoardPlottingWorkbench";
import { BoardCompanionPanel } from "@/components/boards/BoardCompanionPanel";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<PlotDockTab, string> = {
  companion: "Guide",
  clippings: "Images",
  structures: "Layout",
  marks: "Marks",
};

const PLOT_TABS = [
  { id: "companion" as const, Icon: MessageCircleHeart },
  { id: "clippings" as const, Icon: BookImage },
  { id: "structures" as const, Icon: Palette },
  { id: "marks" as const, Icon: PenLine },
] as const;

type BoardPlotKitTrayProps = {
  workspaceId: string;
  activeBoard: Board;
  activeBoardId: string;
  workspaceBoards: { id: string; title: string; role?: string }[];
  editorRef: RefObject<BoardCanvasHandle | null>;
  getEditor?: () => BoardCanvasHandle | null;
  getEditorForBoard?: (boardId: string) => BoardCanvasHandle | null | Promise<BoardCanvasHandle | null>;
  onPlaceStructure?: (type: BoardDiagramType, items?: string[]) => void;
  userId: string;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  onRenameBoard: (boardId: string, title: string) => Promise<void>;
  onPickImage: (url: string) => void;
  onAddBoard?: (title?: string) => Promise<void>;
  onDeleteBoard?: (boardId: string) => Promise<void>;
  onDuplicateBoard?: (boardId: string, title?: string) => Promise<void>;
  onSelectBoard?: (boardId: string) => void;
  getActiveBoardId?: () => string;
};

export function BoardPlotKitTray({
  workspaceId,
  activeBoard,
  activeBoardId,
  workspaceBoards,
  editorRef,
  getEditor,
  getEditorForBoard,
  onPlaceStructure,
  userId,
  onBoardColorChange,
  onRenameBoard,
  onPickImage,
  onAddBoard,
  onDeleteBoard,
  onDuplicateBoard,
  onSelectBoard,
  getActiveBoardId,
}: BoardPlotKitTrayProps) {
  const [sheetTab, setSheetTab] = useState<PlotDockTab | null>(null);
  const keepCanvasFocusOnCloseRef = useRef(false);
  const close = () => setSheetTab(null);
  const activeBoardFill = boardFillForKey(activeBoard.color_key);
  const editor = () => getEditor?.() ?? editorRef.current;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[39] bg-[#f3f0eb]"
        style={{ height: "env(safe-area-inset-bottom, 0px)" }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-stone-300/80 bg-[#f3f0eb] px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5"
        role="toolbar"
        aria-label="Plotting kit"
      >
        {PLOT_TABS.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSheetTab(id)}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium",
              sheetTab === id ? "text-stone-900" : "text-stone-600",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.25} />
            <span className="truncate">{TAB_LABELS[id]}</span>
          </button>
        ))}
      </div>

      <Sheet open={sheetTab !== null} onOpenChange={(o) => !o && close()}>
        <SheetContent
          side="bottom"
          className="max-h-[min(70vh,520px)] rounded-t-2xl border-stone-300 bg-[#f3f0eb] p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => {
            if (keepCanvasFocusOnCloseRef.current) {
              e.preventDefault();
              keepCanvasFocusOnCloseRef.current = false;
            }
          }}
        >
          <SheetHeader className="border-b border-stone-300/60 px-4 py-3 text-left">
            <SheetTitle className="font-welcome-serif text-base font-normal text-stone-900">
              {sheetTab ? TAB_LABELS[sheetTab] : "Plotting kit"}
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto pb-4" style={{ maxHeight: "calc(min(70vh, 520px) - 3.5rem)" }}>
            {sheetTab === "companion" && (
              <BoardCompanionPanel
                workspaceId={workspaceId}
                activeBoardId={activeBoardId}
                workspaceBoards={workspaceBoards}
                editorRef={editorRef}
                getEditor={getEditor}
                getEditorForBoard={getEditorForBoard}
                onBoardColorChange={onBoardColorChange}
                onRenameBoard={onRenameBoard}
                onAddBoard={onAddBoard}
                onDeleteBoard={onDeleteBoard}
                onDuplicateBoard={onDuplicateBoard}
                onSelectBoard={onSelectBoard}
                getActiveBoardId={getActiveBoardId}
                compact
              />
            )}

            {sheetTab === "clippings" && (
              <div className="h-[min(48vh,360px)]">
                <BoardImagePicker
                  embedded
                  userId={userId}
                  onPickImage={(url) => {
                    onPickImage(url);
                    close();
                  }}
                />
              </div>
            )}

            {sheetTab === "structures" && (
              <>
                <BoardColorStrip
                  userId={userId}
                  activeBoardFill={activeBoardFill}
                  onColorChange={(hex) => void onBoardColorChange(activeBoardId, hex)}
                  className="px-4 py-3"
                  swatchSize="md"
                />
                {PLOT_STRUCTURES.length > 0 ? (
                  <div className="p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                      Digital decals
                    </p>
                    <div className="grid gap-2">
                      {PLOT_STRUCTURES.filter((s) => !PLOT_STRUCTURE_COMPACT.some((c) => c.type === s.type)).map((s) => (
                        <button
                          key={s.type}
                          type="button"
                          onClick={() => {
                            if (onPlaceStructure) {
                              onPlaceStructure(s.type, s.items);
                            } else {
                              const placement = STRUCTURE_DECAL_SIZE[s.type] ?? { x: 0.12, y: 0.28, w: 0.72, h: 0.22 };
                              editor()?.addDiagramOverlay(
                                s.type,
                                placement.x,
                                placement.y,
                                placement.w,
                                placement.h,
                                s.items,
                              );
                            }
                            close();
                          }}
                          className="rounded-lg border border-stone-300/70 bg-[#faf8f5] px-3 py-3 text-left active:bg-white"
                        >
                          <span className="text-sm font-semibold text-stone-900">{s.title}</span>
                          <StructureDecalPreview type={s.type} />
                        </button>
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                        {PLOT_STRUCTURE_COMPACT.map((s) => (
                          <button
                            key={s.type}
                            type="button"
                            onClick={() => {
                              if (onPlaceStructure) {
                                onPlaceStructure(s.type, s.items);
                              } else {
                                const placement = STRUCTURE_DECAL_SIZE[s.type] ?? { x: 0.12, y: 0.28, w: 0.72, h: 0.22 };
                                editor()?.addDiagramOverlay(
                                  s.type,
                                  placement.x,
                                  placement.y,
                                  placement.w,
                                  placement.h,
                                  s.items,
                                );
                              }
                              close();
                            }}
                            className="rounded-lg border border-stone-300/70 bg-[#faf8f5] px-2 py-2 text-left active:bg-white"
                          >
                            <span className="text-xs font-semibold text-stone-900">{s.title}</span>
                            <StructureDecalPreview type={s.type} compact />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {sheetTab === "marks" && (
              <div className="space-y-3 p-3">
                <div className="rounded-lg border border-stone-300/70 bg-white/60 p-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Text & notes</p>
                  <div className="mt-1 space-y-0.5">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-stone-700 active:bg-stone-200/60"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        keepCanvasFocusOnCloseRef.current = true;
                        editor()?.addText();
                        close();
                      }}
                    >
                      <Type className="h-4 w-4" /> Statement
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-stone-700 active:bg-stone-200/60"
                      onClick={() => {
                        editor()?.addStickyNote();
                        window.setTimeout(() => close(), 0);
                      }}
                    >
                      <StickyNote className="h-4 w-4" /> Sticky note
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-stone-700 active:bg-stone-200/60"
                      onClick={() => {
                        editor()?.addParchmentNote();
                        window.setTimeout(() => close(), 0);
                      }}
                    >
                      <ScrollText className="h-4 w-4" /> Parchment
                    </button>
                    <button
                      type="button"
                      title="Double tap to finish"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-stone-700 active:bg-stone-200/60"
                      onClick={() => {
                        editor()?.startDrawMode();
                        close();
                      }}
                    >
                      <PenLine className="h-4 w-4" /> Freehand
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-stone-300/70 bg-white/60 p-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Shapes</p>
                  <div className="mt-1.5 grid grid-cols-4 gap-1">
                    {BOARD_MARK_SHAPE_OPTIONS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        title={label}
                        className="flex flex-col items-center gap-0.5 rounded-md border border-stone-200 bg-[#faf8f5] px-1 py-1.5 text-[9px] font-medium text-stone-700 active:border-stone-400 active:bg-white"
                        onClick={() => {
                          editor()?.addShape(id);
                          close();
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-stone-300/70 bg-white/60 p-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Stickers</p>
                  <div className="mt-1.5 grid grid-cols-6 gap-1">
                    {BOARD_MARK_STICKER_OPTIONS.map(({ id, label, emoji }) => (
                      <button
                        key={id}
                        type="button"
                        title={label}
                        className="flex flex-col items-center gap-0.5 rounded-md border border-stone-200 bg-[#faf8f5] px-1 py-1.5 text-lg active:border-stone-400 active:bg-white"
                        onClick={() => {
                          editor()?.addSticker(id);
                          close();
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
