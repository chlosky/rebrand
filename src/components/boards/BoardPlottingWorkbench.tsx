import { useEffect, useState } from "react";
import type { RefObject } from "react";
import {
  BookImage,
  ChevronLeft,
  ChevronRight,
  Layers,
  MessageCircleHeart,
  PenLine,
  Shapes,
  StickyNote,
  Trash2,
  Type,
} from "lucide-react";
import { BOARD_QUICK_PICK_COLORS, boardFillForKey, normalizeBoardColorHex } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { BoardCompanionPanel } from "@/components/boards/BoardCompanionPanel";
import { cn } from "@/lib/utils";

export type PlotDockTab = "companion" | "clippings" | "structures" | "marks";

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
  { id: "clippings", label: "Clippings", Icon: BookImage },
  { id: "structures", label: "Structures", Icon: Shapes },
  { id: "marks", label: "Marks", Icon: PenLine },
];

const TAB_INTROS: Record<PlotDockTab, string> = {
  companion: "Tell me the feeling of this board — I'll plot color, words, and structures with you.",
  clippings: "Images from the library or your camera roll.",
  structures: "Drop planning grids onto the board — mix freely on any board.",
  marks: "Right-click empty space to add · right-click a mark to edit or recolor.",
};

type BoardPlottingWorkbenchProps = {
  activeBoard: Board;
  activeBoardId: string;
  editorRef: RefObject<BoardCanvasHandle | null>;
  userId: string;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  onPickImage: (url: string) => void;
  onScanPhysical?: () => void;
};

export function BoardPlottingWorkbench({
  activeBoard,
  activeBoardId,
  editorRef,
  userId,
  onBoardColorChange,
  onPickImage,
  onScanPhysical,
}: BoardPlottingWorkbenchProps) {
  const [openTab, setOpenTab] = useState<PlotDockTab | null>("companion");
  const [collapsed, setCollapsed] = useState(false);
  const activeBoardFill = boardFillForKey(activeBoard.color_key);
  const [hexDraft, setHexDraft] = useState(activeBoardFill);

  useEffect(() => {
    setHexDraft(activeBoardFill);
  }, [activeBoardFill]);

  const applyBoardHex = (raw: string) => {
    const hex = normalizeBoardColorHex(raw);
    if (!hex) {
      setHexDraft(activeBoardFill);
      return;
    }
    setHexDraft(hex);
    void onBoardColorChange(activeBoardId, hex);
  };

  const applyQuickPick = (hex: string) => {
    setHexDraft(hex);
    void onBoardColorChange(activeBoardId, hex);
  };

  const pickTab = (tab: PlotDockTab) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenTab(tab);
      return;
    }
    setOpenTab((prev) => (prev === tab ? null : tab));
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  const placeStructure = (type: BoardDiagramType, items?: string[]) => {
    editorRef.current?.addDiagramOverlay(type, 0.1, 0.38, 0.8, 0.48, items);
    setOpenTab(null);
  };

  const markBtn =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-200/60";

  return (
    <div className="flex h-full min-h-0 max-h-full shrink-0 self-stretch border-r border-stone-300/80 bg-[#f3f0eb]">
      <nav
        className="flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-stone-300/60 py-1"
        aria-label="Plotting desk"
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-5 w-5 items-center justify-center text-stone-500 hover:text-stone-900"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
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
                  ? { boxShadow: `inset 3px 0 0 0 ${boardFillForKey(activeBoard.color_key)}` }
                  : undefined
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          );
        })}
      </nav>

      {!collapsed && openTab ? (
        <div className="flex h-full min-h-0 w-[min(100vw,17.5rem)] flex-col overflow-hidden xl:w-72">
          <header className="border-b border-stone-300/60 px-3 py-2.5">
            <p className="font-welcome-serif text-sm font-normal text-stone-900">
              {DOCK_TABS.find((t) => t.id === openTab)?.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{TAB_INTROS[openTab]}</p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {openTab === "companion" && (
              <BoardCompanionPanel
                activeBoardId={activeBoardId}
                editorRef={editorRef}
                onBoardColorChange={onBoardColorChange}
              />
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
                  <button type="button" className={markBtn} onClick={() => editorRef.current?.deleteSelected()}>
                    <Trash2 className="h-4 w-4" /> Remove selected
                  </button>
                </div>
                <div className="border-t border-stone-300/50 pt-2">
                  <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Board color</p>
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <label className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center">
                      <span
                        className="h-9 w-9 rounded-full ring-2 ring-stone-300/80 ring-offset-1"
                        style={{ backgroundColor: activeBoardFill }}
                        aria-hidden
                      />
                      <input
                        type="color"
                        value={activeBoardFill}
                        onChange={(e) => applyBoardHex(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label="Pick board color"
                      />
                    </label>
                    <input
                      type="text"
                      value={hexDraft}
                      onChange={(e) => setHexDraft(e.target.value)}
                      onBlur={() => applyBoardHex(hexDraft)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyBoardHex(hexDraft);
                      }}
                      spellCheck={false}
                      className="min-w-0 flex-1 rounded-md border border-stone-300/80 bg-white px-2 py-1.5 font-mono text-[11px] uppercase text-stone-800"
                      aria-label="Board color hex code"
                    />
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 px-1">
                    {BOARD_QUICK_PICK_COLORS.map((pick) => (
                      <button
                        key={pick.hex}
                        type="button"
                        title={`${pick.label} · ${pick.hex}`}
                        onClick={() => applyQuickPick(pick.hex)}
                        className={cn(
                          "aspect-square rounded-md ring-1 ring-stone-300/60 transition-transform hover:scale-105",
                          activeBoardFill === pick.hex && "ring-2 ring-stone-900",
                        )}
                        style={{ backgroundColor: pick.hex }}
                      />
                    ))}
                  </div>
                </div>
                <p className="flex items-center gap-1 px-2 text-[10px] text-stone-500">
                  <Layers className="h-3 w-3" />
                  Right-click empty to add · right-click a mark to edit · hold on mobile
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
