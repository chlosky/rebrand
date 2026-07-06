import { useRef, useState } from "react";
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
  Type,
} from "lucide-react";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";
import { BoardColorStrip } from "@/components/boards/BoardColorStrip";
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
  { type: "checklist", title: "Checklist", hint: "Type items · click box to check · Enter or + for new line" },
  { type: "divider", title: "Divider", hint: "Build your own structure" },
  { type: "zones", title: "Zones", hint: "Rooms, areas, stations", items: ["Entry", "Kitchen", "Bedrooms"] },
  {
    type: "eisenhower",
    title: "Priority grid",
    hint: "Item & rank columns · Enter or + for new row",
    items: ["Do first", "Schedule", "Delegate", "Drop"],
  },
  { type: "kanban", title: "Flow columns", hint: "Stages & handoffs" },
  { type: "timeline", title: "Timeline", hint: "Phases & beats" },
];

export const STRUCTURE_DECAL_SIZE: Record<BoardDiagramType, { x: number; y: number; w: number; h: number }> = {
  checklist: { x: 0.14, y: 0.2, w: 0.62, h: 0.34 },
  divider: { x: 0.12, y: 0.46, w: 0.76, h: 0.02 },
  zones: { x: 0.12, y: 0.24, w: 0.68, h: 0.24 },
  eisenhower: { x: 0.14, y: 0.18, w: 0.62, h: 0.44 },
  kanban: { x: 0.1, y: 0.28, w: 0.78, h: 0.18 },
  timeline: { x: 0.1, y: 0.34, w: 0.78, h: 0.16 },
  gantt: { x: 0.12, y: 0.26, w: 0.72, h: 0.26 },
  okrs: { x: 0.14, y: 0.24, w: 0.66, h: 0.28 },
  five_s: { x: 0.1, y: 0.34, w: 0.78, h: 0.12 },
};

const decalInk = "bg-neutral-900";

export function StructureDecalPreview({ type }: { type: BoardDiagramType }) {
  if (type === "kanban") {
    return (
      <div className="mt-2 flex h-8 items-end gap-0 border-b border-neutral-900/70 pb-0.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative flex flex-1 flex-col items-center gap-0.5">
            {i > 0 && <span className={`absolute bottom-0 left-0 top-0 w-px ${decalInk}`} />}
            <span className={`h-0.5 w-4/5 ${decalInk}`} />
          </div>
        ))}
      </div>
    );
  }
  if (type === "divider") {
    return (
      <div className="mt-3 flex h-6 items-center px-1">
        <span className={`block h-0.5 w-full ${decalInk}`} />
      </div>
    );
  }
  if (type === "checklist") {
    return (
      <div className="mt-2 space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 border border-neutral-900/80" />
            <span className="h-px flex-1 border-b border-dashed border-neutral-400/70" />
          </div>
        ))}
        <span className="text-[9px] text-neutral-400">+ add line</span>
      </div>
    );
  }
  if (type === "eisenhower") {
    return (
      <div className="mt-2">
        <div className="relative h-5 border-b border-neutral-900/70">
          <span className={`absolute left-[55%] top-0 h-full w-px ${decalInk}`} />
        </div>
        <div className="mt-1 space-y-1">
          {["x", "y", "z"].map((label) => (
            <div key={label} className="flex text-[9px] text-neutral-500">
              <span className="w-[55%]">{label}</span>
              <span className="flex-1 text-right pr-1">·</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (type === "timeline") {
    return (
      <div className="relative mt-3 h-4">
        <span className={`absolute left-0 top-1/2 h-px w-full -translate-y-1/2 ${decalInk}`} />
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`absolute top-0 h-2 w-px ${decalInk}`}
            style={{ left: `${i * 33}%` }}
          />
        ))}
      </div>
    );
  }
  if (type === "zones") {
    return (
      <div className="mt-2 space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <span className={`h-px w-3 ${decalInk} opacity-50`} />
            <span className={`h-px flex-1 ${decalInk} opacity-30`} />
          </div>
        ))}
      </div>
    );
  }
  return null;
}

const DOCK_TABS: { id: PlotDockTab; label: string; Icon: typeof Type }[] = [
  { id: "companion", label: "Guide", Icon: MessageCircleHeart },
  { id: "clippings", label: "Images", Icon: BookImage },
  { id: "structures", label: "Layouts", Icon: Shapes },
  { id: "marks", label: "Text / Notes", Icon: PenLine },
];

const TAB_INTROS: Record<PlotDockTab, string> = {
  companion: "Tell me the feeling of this board — I'll plot color, words, and structures with you.",
  clippings: "Browse Our Collection or add photos to Your Library.",
  structures: "Drop planning grids onto the board — mix freely on any board.",
  marks: "Tap empty board space to add · hold items to edit.",
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
  const [openTab, setOpenTab] = useState<PlotDockTab | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const lastOpenTabRef = useRef<PlotDockTab | null>(null);
  const activeBoardFill = boardFillForKey(activeBoard.color_key);

  const showTab = (tab: PlotDockTab) => {
    lastOpenTabRef.current = tab;
    setOpenTab(tab);
  };

  const pickTab = (tab: PlotDockTab) => {
    if (collapsed) {
      setCollapsed(false);
      showTab(tab);
      return;
    }
    if (openTab === tab) {
      setOpenTab(null);
      return;
    }
    showTab(tab);
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      if (prev) {
        setOpenTab((current) => current ?? lastOpenTabRef.current);
      }
      return !prev;
    });
  };

  const placeStructure = (type: BoardDiagramType, items?: string[]) => {
    const placement = STRUCTURE_DECAL_SIZE[type] ?? { x: 0.12, y: 0.28, w: 0.72, h: 0.22 };
    editorRef.current?.addDiagramOverlay(type, placement.x, placement.y, placement.w, placement.h, items);
    setOpenTab(null);
  };

  const markBtn =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-200/60";

  const boardColorStrip = (
    <BoardColorStrip
      userId={userId}
      activeBoardFill={activeBoardFill}
      onColorChange={(hex) => void onBoardColorChange(activeBoardId, hex)}
      className="px-3 py-2"
    />
  );

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
          const active = !collapsed && openTab === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-pressed={active}
              onClick={() => pickTab(id)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-transparent text-stone-900 ring-2 ring-stone-900 ring-offset-1 ring-offset-[#f3f0eb]"
                  : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.75} />
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
              <div className="flex-1 overflow-y-auto">
                {boardColorStrip}
                <div className="p-2">
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
                        <StructureDecalPreview type={s.type} />
                      </button>
                    ))}
                  </div>
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
