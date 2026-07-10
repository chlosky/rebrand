import { useRef, useState } from "react";
import type { RefObject } from "react";
import {
  BookImage,
  ChevronLeft,
  ChevronRight,
  MessageCircleHeart,
  Palette,
  PenLine,
  ScrollText,
  Shapes,
  StickyNote,
  Type,
} from "lucide-react";
import { boardFillForKey } from "@/lib/boards/colors";
import type { Board } from "@/lib/boards/types";
import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";
import {
  BOARD_MARK_SHAPE_OPTIONS,
  BOARD_MARK_STICKER_OPTIONS,
} from "@/components/boards/BoardMarksQuickSelector";
import { BoardColorStrip } from "@/components/boards/BoardColorStrip";
import { BoardImagePicker } from "@/components/boards/BoardImagePicker";
import { BoardCompanionPanel } from "@/components/boards/BoardCompanionPanel";
import { cn } from "@/lib/utils";

export type PlotDockTab = "companion" | "clippings" | "structures" | "marks";

export const PLOT_STRUCTURE_COMPACT: {
  type: BoardDiagramType;
  title: string;
  items?: string[];
}[] = [
  { type: "checkbox", title: "Checkbox" },
  { type: "bullet", title: "Bullet" },
];

export const PLOT_STRUCTURES: {
  type: BoardDiagramType;
  title: string;
  items?: string[];
}[] = [
  { type: "calendar", title: "Calendar" },
  { type: "numbered_list", title: "Numbered List" },
  { type: "divider", title: "Divider" },
  ...PLOT_STRUCTURE_COMPACT,
];

export const STRUCTURE_DECAL_SIZE: Record<BoardDiagramType, { x: number; y: number; w: number; h: number }> = {
  checkbox: { x: 0.44, y: 0.42, w: 0.12, h: 0.12 },
  numbered_list: { x: 0.14, y: 0.2, w: 0.62, h: 0.34 },
  bullet: { x: 0.46, y: 0.44, w: 0.06, h: 0.06 },
  calendar: { x: 0.06, y: 0.1, w: 0.88, h: 0.72 },
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

export function StructureDecalPreview({ type, compact = false }: { type: BoardDiagramType; compact?: boolean }) {
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
  if (type === "checkbox") {
    return (
      <div className={cn("flex items-center justify-center px-1", compact ? "mt-1 h-4" : "mt-3 h-6")}>
        <span className={cn("border-2 border-neutral-900/80", compact ? "h-3 w-3" : "h-4 w-4")} />
      </div>
    );
  }
  if (type === "numbered_list") {
    return (
      <div className="mt-2 space-y-1.5">
        {["1.", "2.", "3."].map((n) => (
          <div key={n} className="flex items-center gap-1.5">
            <span className="w-4 text-[10px] font-semibold text-neutral-900/80">{n}</span>
            <span className="h-px flex-1 border-b border-dashed border-neutral-400/70" />
          </div>
        ))}
      </div>
    );
  }
  if (type === "bullet") {
    return (
      <div className={cn("flex items-center justify-center px-1", compact ? "mt-1 h-4" : "mt-3 h-6")}>
        <span className={cn("rounded-full bg-neutral-900/85", compact ? "h-2 w-2" : "h-2.5 w-2.5")} />
      </div>
    );
  }
  if (type === "calendar") {
    return (
      <div className="mt-2 overflow-hidden border border-neutral-900/80">
        <div className="h-3 border-b border-neutral-900/80" />
        <div className="grid grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={`h-${i}`} className="h-2 border-b border-r border-neutral-900/50 last:border-r-0" />
          ))}
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className="h-2.5 border-b border-r border-neutral-900/30 last:border-r-0" />
          ))}
        </div>
      </div>
    );
  }
  if (type === "eisenhower") {
    return (
      <div className="mt-2">
        <div className="relative h-4 border-b border-neutral-900/70">
          <span className={`absolute left-[55%] top-0 h-full w-px ${decalInk}`} />
        </div>
        <div className="mt-1 space-y-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="h-px flex-1 border-b border-dashed border-neutral-400/70" />
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
  { id: "structures", label: "Layout", Icon: Palette },
  { id: "marks", label: "Marks", Icon: PenLine },
];

const TAB_INTROS: Record<PlotDockTab, string> = {
  companion: "Colors, labels, images, notes, structures, digital decals, layout, and board names.",
  clippings: "Collection, Affixments, Objects, and Uploads — each with its own tab.",
  structures: "Pick a board color, then add digital decals like calendar, checkbox, and divider.",
  marks: "Right-click empty board to add marks.",
};

type BoardPlottingWorkbenchProps = {
  workspaceId: string;
  activeBoard: Board;
  activeBoardId: string;
  workspaceBoards: { id: string; title: string; role?: string }[];
  editorRef: RefObject<BoardCanvasHandle | null>;
  userId: string;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  onRenameBoard: (boardId: string, title: string) => Promise<void>;
  onPickImage: (url: string) => void;
  getEditor?: () => BoardCanvasHandle | null;
  getEditorForBoard?: (boardId: string) => BoardCanvasHandle | null | Promise<BoardCanvasHandle | null>;
  onAddBoard?: (title?: string) => Promise<void>;
  onDeleteBoard?: (boardId: string) => Promise<void>;
  onDuplicateBoard?: (boardId: string, title?: string) => Promise<void>;
  onSelectBoard?: (boardId: string) => void;
  getActiveBoardId?: () => string;
};

export function BoardPlottingWorkbench({
  workspaceId,
  activeBoard,
  activeBoardId,
  workspaceBoards,
  editorRef,
  userId,
  onBoardColorChange,
  onRenameBoard,
  onPickImage,
  getEditor,
  getEditorForBoard,
  onAddBoard,
  onDeleteBoard,
  onDuplicateBoard,
  onSelectBoard,
  getActiveBoardId,
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
    <div className="flex h-full min-h-0 max-h-full shrink-0 self-stretch border-r border-stone-200/80 bg-[#f3f0eb]">
      <nav
        className="flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-stone-200/80 py-1"
        aria-label="Plotting desk"
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-5 w-5 items-center justify-center text-stone-500 hover:text-stone-900"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.25} /> : <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.25} />}
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
                  ? "bg-white/70 text-stone-800 ring-1 ring-stone-300/70"
                  : "text-stone-500 hover:bg-stone-200/60 hover:text-stone-800",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 1.5 : 1.25} />
            </button>
          );
        })}
      </nav>

      {!collapsed && openTab ? (
        <div className="flex h-full min-h-0 w-[min(100vw,17.5rem)] flex-col overflow-hidden xl:w-72">
          {openTab !== "companion" ? (
            <header className="border-b border-stone-300/60 px-3 py-2.5">
              <p className="font-welcome-serif text-sm font-normal text-stone-900">
                {DOCK_TABS.find((t) => t.id === openTab)?.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{TAB_INTROS[openTab]}</p>
            </header>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {openTab === "companion" && (
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
              />
            )}

            <div className={cn("min-h-0 flex-1", openTab !== "clippings" && "hidden")}>
              <BoardImagePicker embedded userId={userId} onPickImage={onPickImage} />
            </div>

            {openTab === "structures" && (
              <div className="flex-1 overflow-y-auto">
                {boardColorStrip}
                {PLOT_STRUCTURES.length > 0 ? (
                  <div className="p-2">
                    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                      Digital decals
                    </p>
                    <div className="grid gap-1.5">
                      {PLOT_STRUCTURES.filter((s) => !PLOT_STRUCTURE_COMPACT.some((c) => c.type === s.type)).map((s) => (
                        <button
                          key={s.type}
                          type="button"
                          onClick={() => placeStructure(s.type, s.items)}
                          className="rounded-lg border border-stone-300/70 bg-[#faf8f5] px-3 py-2 text-left hover:border-stone-500/50 hover:bg-white"
                        >
                          <span className="text-xs font-semibold text-stone-900">{s.title}</span>
                          <StructureDecalPreview type={s.type} />
                        </button>
                      ))}
                      <div className="grid grid-cols-2 gap-1.5">
                        {PLOT_STRUCTURE_COMPACT.map((s) => (
                          <button
                            key={s.type}
                            type="button"
                            onClick={() => placeStructure(s.type, s.items)}
                            className="rounded-lg border border-stone-300/70 bg-[#faf8f5] px-2 py-1.5 text-left hover:border-stone-500/50 hover:bg-white"
                          >
                            <span className="text-[10px] font-semibold text-stone-900">{s.title}</span>
                            <StructureDecalPreview type={s.type} compact />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {openTab === "marks" && (
              <div className="flex-1 space-y-3 overflow-y-auto p-2">
                <div className="rounded-lg border border-stone-300/70 bg-white/60 p-2">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">Text & notes</p>
                  <div className="mt-1 space-y-0.5">
                    <button type="button" className={markBtn} onClick={() => editorRef.current?.addText()}>
                      <Type className="h-4 w-4" /> Statement
                    </button>
                    <button type="button" className={markBtn} onClick={() => editorRef.current?.addStickyNote()}>
                      <StickyNote className="h-4 w-4" /> Sticky note
                    </button>
                    <button type="button" className={markBtn} onClick={() => editorRef.current?.addParchmentNote()}>
                      <ScrollText className="h-4 w-4" /> Parchment
                    </button>
                    <button
                      type="button"
                      className={markBtn}
                      title="Esc to finish"
                      onClick={() => editorRef.current?.startDrawMode()}
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
                        className="flex flex-col items-center gap-0.5 rounded-md border border-stone-200 bg-[#faf8f5] px-1 py-1.5 text-[9px] font-medium text-stone-700 hover:border-stone-400 hover:bg-white"
                        onClick={() => editorRef.current?.addShape(id)}
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
                        className="flex flex-col items-center gap-0.5 rounded-md border border-stone-200 bg-[#faf8f5] px-1 py-1.5 text-lg hover:border-stone-400 hover:bg-white"
                        onClick={() => editorRef.current?.addSticker(id)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
