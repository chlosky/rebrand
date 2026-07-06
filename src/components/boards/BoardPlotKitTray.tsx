import { useState } from "react";
import type { RefObject } from "react";
import { BookImage, MessageCircleHeart, Shapes } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { BoardColorStrip } from "@/components/boards/BoardColorStrip";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { PLOT_STRUCTURES, STRUCTURE_DECAL_SIZE, StructureDecalPreview, type PlotDockTab } from "@/components/boards/BoardPlottingWorkbench";
import { BoardCompanionPanel } from "@/components/boards/BoardCompanionPanel";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<PlotDockTab, string> = {
  companion: "Guide",
  clippings: "Images",
  structures: "Structures",
  marks: "Marks",
};

type BoardPlotKitTrayProps = {
  activeBoard: Board;
  activeBoardId: string;
  editorRef: RefObject<BoardCanvasHandle | null>;
  userId: string;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  onPickImage: (url: string) => void;
  onScanPhysical?: () => void;
};

export function BoardPlotKitTray({
  activeBoard,
  activeBoardId,
  editorRef,
  userId,
  onBoardColorChange,
  onPickImage,
  onScanPhysical,
}: BoardPlotKitTrayProps) {
  const [sheetTab, setSheetTab] = useState<PlotDockTab | null>(null);
  const close = () => setSheetTab(null);
  const activeBoardFill = boardFillForKey(activeBoard.color_key);

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-stone-300/80 bg-[#f3f0eb]/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-sm"
        role="toolbar"
        aria-label="Plotting kit"
      >
        {(
          [
            { id: "companion" as const, Icon: MessageCircleHeart },
            { id: "clippings" as const, Icon: BookImage },
            { id: "structures" as const, Icon: Shapes },
          ] as const
        ).map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSheetTab(id)}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium",
              sheetTab === id ? "text-stone-900" : "text-stone-600",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            <span className="truncate">{TAB_LABELS[id]}</span>
          </button>
        ))}
      </div>

      <Sheet open={sheetTab !== null} onOpenChange={(o) => !o && close()}>
        <SheetContent side="bottom" className="max-h-[min(70vh,520px)] rounded-t-2xl border-stone-300 bg-[#f3f0eb] p-0">
          <SheetHeader className="border-b border-stone-300/60 px-4 py-3 text-left">
            <SheetTitle className="font-welcome-serif text-base font-normal text-stone-900">
              {sheetTab ? TAB_LABELS[sheetTab] : "Plotting kit"}
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto pb-4" style={{ maxHeight: "calc(min(70vh, 520px) - 3.5rem)" }}>
            {sheetTab === "companion" && (
              <BoardCompanionPanel
                activeBoardId={activeBoardId}
                editorRef={editorRef}
                onBoardColorChange={onBoardColorChange}
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
                  onScanPhysical={onScanPhysical}
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
                <div className="grid gap-2 p-3">
                  {PLOT_STRUCTURES.map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      onClick={() => {
                        const placement = STRUCTURE_DECAL_SIZE[s.type] ?? { x: 0.12, y: 0.28, w: 0.72, h: 0.22 };
                        editorRef.current?.addDiagramOverlay(
                          s.type,
                          placement.x,
                          placement.y,
                          placement.w,
                          placement.h,
                          s.items,
                        );
                        close();
                      }}
                      className="rounded-lg border border-stone-300/70 bg-[#faf8f5] px-3 py-3 text-left active:bg-white"
                    >
                      <span className="text-sm font-semibold text-stone-900">{s.title}</span>
                      <span className="mt-0.5 block text-xs text-stone-500">{s.hint}</span>
                      <StructureDecalPreview type={s.type} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {sheetTab === "marks" && (
              <div className="space-y-3 p-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-stone-300 bg-[#faf8f5] py-3 text-sm font-medium text-stone-900"
                    onClick={() => {
                      editorRef.current?.addText();
                      close();
                    }}
                  >
                    Statement
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-stone-300 bg-[#faf8f5] py-3 text-sm font-medium text-stone-900"
                    onClick={() => {
                      editorRef.current?.addStickyNote();
                      close();
                    }}
                  >
                    Sticky
                  </button>
                </div>
                <p className="text-[10px] text-stone-500">
                  Right-click, tap empty board space, or hold on mobile for the marks wheel.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
