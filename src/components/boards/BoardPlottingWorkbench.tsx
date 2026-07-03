import { useState } from "react";
import type { RefObject } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookImage,
  Grid3x3,
  Layers,
  MessageCircleHeart,
  PenLine,
  Shapes,
  StickyNote,
  Trash2,
  Type,
} from "lucide-react";
import { BOARD_COLORS, boardFillForKey, type BoardColorKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { BoardCompanionPanel } from "@/components/boards/BoardCompanionPanel";
import { cn } from "@/lib/utils";

export type PlotDockTab = "companion" | "boards" | "clippings" | "structures" | "marks";

export const PLOT_STRUCTURES: {
  type: BoardDiagramType;
  title: string;
  hint: string;
  items?: string[];
}[] = [
  { type: "checklist", title: "Checklist", hint: "Routines, chores, resets" },
  { type: "zones", title: "Zones", hint: "Rooms, areas, stations", items: ["Entry", "Kitchen", "Bedrooms"] },
  {
    type: "eisenhower",
    title: "Priority grid",
    hint: "Urgent × important",
    items: ["Do first", "Schedule", "Delegate", "Drop"],
  },
  { type: "kanban", title: "Flow columns", hint: "Stages & handoffs" },
  { type: "timeline", title: "Timeline", hint: "Phases & beats" },
  { type: "gantt", title: "Schedule bars", hint: "Weeks & deadlines" },
  { type: "okrs", title: "Goals & results", hint: "Quarterly plot", items: ["Objective", "KR 1", "KR 2", "KR 3"] },
  { type: "five_s", title: "5S strip", hint: "Workspace lean reset" },
];

const DOCK_TABS: { id: PlotDockTab; label: string; Icon: typeof Type }[] = [
  { id: "companion", label: "Companion", Icon: MessageCircleHeart },
  { id: "boards", label: "Boards", Icon: Grid3x3 },
  { id: "clippings", label: "Clippings", Icon: BookImage },
  { id: "structures", label: "Structures", Icon: Shapes },
  { id: "marks", label: "Marks", Icon: PenLine },
];

const TAB_INTROS: Record<PlotDockTab, string> = {
  companion: "Tell me the feeling of this board — I'll plot color, words, and structures with you.",
  boards: "Jump between boards in your workspace.",
  clippings: "Images from the library or your camera roll.",
  structures: "Drop planning grids onto the board — mix freely on any board.",
  marks: "Hand-place text, notes, layers, and acrylic board colors.",
};

type BoardPlottingWorkbenchProps = {
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

export function BoardPlottingWorkbench({
  boards,
  activeBoard,
  activeBoardId,
  editorRef,
  userId,
  onSelectBoard,
  onBoardColorChange,
  onPickImage,
  onScanPhysical,
}: BoardPlottingWorkbenchProps) {
  const [openTab, setOpenTab] = useState<PlotDockTab | null>("companion");

  const pickTab = (tab: PlotDockTab) => {
    setOpenTab((prev) => (prev === tab ? null : tab));
  };

  const placeStructure = (type: BoardDiagramType, items?: string[]) => {
    editorRef.current?.addDiagramOverlay(type, 0.1, 0.38, 0.8, 0.48, items);
    setOpenTab(null);
  };

  const markBtn =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-200/60";

  return (
    <div className="flex h-full shrink-0 border-r border-stone-300/80 bg-[#f3f0eb]">
      <nav className="flex w-12 flex-col items-center gap-1 border-r border-stone-300/60 py-3" aria-label="Plotting desk">
        {DOCK_TABS.map(({ id, label, Icon }) => {
          const active = openTab === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => pickTab(id)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                active ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900",
              )}
              style={
                active
                  ? { boxShadow: `inset 3px 0 0 0 ${BOARD_COLORS[activeBoard.color_key as BoardColorKey]?.swatch ?? "#888"}` }
                  : undefined
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          );
        })}
      </nav>

      {openTab ? (
        <div className="flex w-[min(100vw,17.5rem)] flex-col xl:w-72">
          <header className="border-b border-stone-300/60 px-3 py-2.5">
            <p className="font-welcome-serif text-sm font-normal text-stone-900">
              {DOCK_TABS.find((t) => t.id === openTab)?.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{TAB_INTROS[openTab]}</p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {openTab === "companion" && (
              <BoardCompanionPanel
                activeBoardId={activeBoardId}
                editorRef={editorRef}
                onBoardColorChange={onBoardColorChange}
              />
            )}

            {openTab === "boards" && (
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1.5">
                  {boards.map((board) => {
                    const active = board.id === activeBoardId;
                    return (
                      <button
                        key={board.id}
                        type="button"
                        onClick={() => onSelectBoard(board.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                          active
                            ? "border-stone-800 bg-[#faf8f5] shadow-[inset_3px_0_0_0_var(--swatch)]"
                            : "border-transparent bg-transparent hover:border-stone-300/80 hover:bg-stone-200/40",
                        )}
                        style={
                          active
                            ? ({
                                "--swatch": BOARD_COLORS[board.color_key as BoardColorKey]?.swatch ?? "#888",
                              } as React.CSSProperties)
                            : undefined
                        }
                      >
                        <span
                          className="h-7 w-7 shrink-0 rounded-md ring-1 ring-stone-300/50"
                          style={{ backgroundColor: boardFillForKey(board.color_key) }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-stone-900">{board.title}</span>
                          <span className="text-[10px] text-stone-500">{board.role === "plan" ? "Plan" : "Focus"}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {openTab === "clippings" && (
              <div className="min-h-0 flex-1">
                <BoardImagePicker embedded userId={userId} onPickImage={onPickImage} onScanPhysical={onScanPhysical} />
              </div>
            )}

            {openTab === "structures" && (
              <div className="flex-1 overflow-y-auto p-2">
                <div className="grid gap-1.5">
                  {PLOT_STRUCTURES.map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      onClick={() => placeStructure(s.type, s.items)}
                      className="rounded-lg border border-stone-300/70 bg-[#faf8f5] px-3 py-2.5 text-left hover:border-stone-500/50 hover:bg-white"
                    >
                      <span className="text-xs font-semibold text-stone-900">{s.title}</span>
                      <span className="mt-0.5 block text-[10px] text-stone-500">{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {openTab === "marks" && (
              <div className="flex-1 space-y-3 overflow-y-auto p-2">
                <div className="space-y-0.5">
                  <button type="button" className={markBtn} onClick={() => editorRef.current?.addText()}>
                    <Type className="h-4 w-4" /> Statement
                  </button>
                  <button type="button" className={markBtn} onClick={() => editorRef.current?.addStickyNote()}>
                    <StickyNote className="h-4 w-4" /> Sticky note
                  </button>
                </div>
                <div className="space-y-0.5 border-t border-stone-300/50 pt-2">
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Layer</p>
                  <button type="button" className={markBtn} onClick={() => editorRef.current?.bringForward()}>
                    <ArrowUp className="h-4 w-4" /> Forward
                  </button>
                  <button type="button" className={markBtn} onClick={() => editorRef.current?.sendBackward()}>
                    <ArrowDown className="h-4 w-4" /> Back
                  </button>
                  <button type="button" className={markBtn} onClick={() => editorRef.current?.deleteSelected()}>
                    <Trash2 className="h-4 w-4" /> Remove selected
                  </button>
                </div>
                <div className="border-t border-stone-300/50 pt-2">
                  <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Acrylic color</p>
                  <div className="grid grid-cols-4 gap-1.5 px-1">
                    {(Object.keys(BOARD_COLORS) as BoardColorKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        title={BOARD_COLORS[key].label}
                        onClick={() => void onBoardColorChange(activeBoardId, key)}
                        className={cn(
                          "aspect-square rounded-md ring-1 ring-stone-300/60 transition-transform hover:scale-105",
                          activeBoard.color_key === key && "ring-2 ring-stone-900",
                        )}
                        style={{ backgroundColor: BOARD_COLORS[key].fill }}
                      />
                    ))}
                  </div>
                </div>
                <p className="flex items-center gap-1 px-2 text-[10px] text-stone-500">
                  <Layers className="h-3 w-3" />
                  Drag marks on the board · corners to resize
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
