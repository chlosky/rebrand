import { useState } from "react";
import type { RefObject } from "react";
import { BookImage, Grid3x3, MessageCircleHeart, PenLine, Shapes } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BOARD_COLORS, boardFillForKey, type BoardColorKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle } from "@/components/boards/BoardCanvasEditor";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { PLOT_STRUCTURES, type PlotDockTab } from "@/components/boards/BoardPlottingWorkbench";
import { BoardCompanionPanel } from "@/components/boards/BoardCompanionPanel";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<PlotDockTab, string> = {
  companion: "Companion",
  boards: "Boards",
  clippings: "Clippings",
  structures: "Structures",
  marks: "Marks",
};

type BoardPlotKitTrayProps = {
  boards: Board[];
  activeBoard: Board;
  activeBoardId: string;
  editorRef: RefObject<BoardCanvasHandle | null>;
  userId: string;
  onSelectBoard: (id: string) => void;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  onPickImage: (url: string) => void;
  onScanPhysical?: () => void;
};

export function BoardPlotKitTray({
  boards,
  activeBoard,
  activeBoardId,
  editorRef,
  userId,
  onSelectBoard,
  onBoardColorChange,
  onPickImage,
  onScanPhysical,
}: BoardPlotKitTrayProps) {
  const [sheetTab, setSheetTab] = useState<PlotDockTab | null>(null);
  const close = () => setSheetTab(null);

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
            { id: "boards" as const, Icon: Grid3x3 },
            { id: "clippings" as const, Icon: BookImage },
            { id: "structures" as const, Icon: Shapes },
            { id: "marks" as const, Icon: PenLine },
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

            {sheetTab === "boards" && (
              <ul className="space-y-1 p-3">
                {boards.map((board) => (
                  <li key={board.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBoard(board.id);
                        close();
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                        board.id === activeBoardId ? "bg-stone-900 text-white" : "bg-[#faf8f5] text-stone-900",
                      )}
                    >
                      <span
                        className="h-8 w-8 shrink-0 rounded-md"
                        style={{ backgroundColor: boardFillForKey(board.color_key) }}
                      />
                      <span className="font-medium">{board.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
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
              <div className="grid gap-2 p-3">
                {PLOT_STRUCTURES.map((s) => (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => {
                      editorRef.current?.addDiagramOverlay(s.type, 0.08, 0.35, 0.84, 0.5, s.items);
                      close();
                    }}
                    className="rounded-lg border border-stone-300/70 bg-[#faf8f5] px-3 py-3 text-left active:bg-white"
                  >
                    <span className="text-sm font-semibold text-stone-900">{s.title}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">{s.hint}</span>
                  </button>
                ))}
              </div>
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
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Acrylic color</p>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(BOARD_COLORS) as BoardColorKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => void onBoardColorChange(activeBoardId, key)}
                      className={cn(
                        "aspect-square rounded-lg ring-1 ring-stone-300/60",
                        activeBoard.color_key === key && "ring-2 ring-stone-900",
                      )}
                      style={{ backgroundColor: BOARD_COLORS[key].fill }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
