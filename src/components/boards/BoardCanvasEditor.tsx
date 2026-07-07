import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Canvas, Circle, Ellipse, FabricImage, FabricObject, FabricText, Group, IText, Line, Path, PencilBrush, Polygon, Rect, StaticCanvas, Textbox, Triangle, ActiveSelection, type FabricObject as FabricObjectType } from "fabric";
import { BOARD_QUICK_PICK_COLORS, boardFillForKey } from "@/lib/boards/colors";
import type { BoardLayoutMode } from "@/lib/boards/types";
import { cn } from "@/lib/utils";
import {
  BoardMarksQuickSelector,
  BOARD_MARK_STICKER_EMOJI,
  type BoardMarksQuickAction,
  type BoardMarkShapeType,
  type BoardMarkStickerId,
  type BoardMarkTextSize,
} from "@/components/boards/BoardMarksQuickSelector";

export const ARTBOARD_WIDTH = 1080;
export const ARTBOARD_HEIGHT = 1350;

const DECAL_INK = "#111111";
const DECAL_MUTED = "rgba(17,17,17,0.58)";
const DECAL_LINE = "rgba(17,17,17,0.82)";

let boardObjectClipboard: Record<string, unknown>[] | null = null;

const STRUCTURE_ROW_H = 38;
const STRUCTURE_BOX = 20;
const STRUCTURE_FONT = "system-ui, sans-serif";

const MARK_TEXT_SIZES: Record<BoardMarkTextSize, number> = {
  S: 16,
  M: 22,
  L: 32,
  XL: 42,
};

const MARK_TEXT_FILL = "#000000";
const MARK_SHAPE_STROKE = "#111111";
const MARK_DRAW_WIDTH = 4;

for (const prop of [
  "structureId",
  "structureType",
  "structureRole",
  "structureWidth",
  "rowIndex",
  "columnIndex",
  "itemIndex",
  "checked",
  "markKind",
  "shapeType",
  "stickerId",
] as const) {
  if (!FabricObject.customProperties.includes(prop)) {
    FabricObject.customProperties.push(prop);
  }
}

function structureProp(obj: FabricObjectType, key: string): unknown {
  return typeof obj.get === "function" ? obj.get(key) : undefined;
}

function walkStructureObjects(canvas: Canvas, visit: (obj: FabricObjectType) => void) {
  const step = (obj: FabricObjectType) => {
    visit(obj);
    if (obj instanceof Group) {
      for (const child of obj.getObjects()) step(child);
    }
  };
  for (const obj of canvas.getObjects()) step(obj);
}

function findStructureGroup(canvas: Canvas, structureId: string, structureType: string): Group | null {
  const found = canvas.getObjects().find(
    (o) =>
      o instanceof Group &&
      structureProp(o, "structureId") === structureId &&
      structureProp(o, "structureType") === structureType,
  );
  return found instanceof Group ? found : null;
}

function getStructureLayoutWidth(group: Group): number {
  const stored = structureProp(group, "structureWidth");
  if (typeof stored === "number" && stored > 0) return stored;
  return Math.max(group.width ?? 300, 200);
}

function restoreStructureGroupState(group: Group) {
  group.set({ subTargetCheck: true, interactive: true, objectCaching: false });
  const structureType = structureProp(group, "structureType");
  if (structureType === "checklist") {
    for (const child of group.getObjects()) {
      if (structureProp(child, "structureRole") === "checkbox" && child instanceof Rect) {
        const checked = !!structureProp(child, "checked");
        child.set({ fill: checked ? DECAL_INK : "transparent" });
        const rowIndex = structureProp(child, "rowIndex");
        const label = group
          .getObjects()
          .find(
            (o) =>
              structureProp(o, "structureRole") === "label" && structureProp(o, "rowIndex") === rowIndex,
          );
        if (label instanceof IText) {
          label.set({ linethrough: checked, fill: checked ? DECAL_MUTED : DECAL_INK });
        }
      }
    }
  }
  if (structureType === "checklist" || structureType === "priority") {
    reflowInteractiveStructure(group);
  }
}

function normalizeInteractiveStructureResize(group: Group) {
  const sx = group.scaleX ?? 1;
  const sy = group.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

  const newWidth = getStructureLayoutWidth(group) * sx;

  for (const child of group.getObjects()) {
    const csx = child.scaleX ?? 1;
    const csy = child.scaleY ?? 1;
    if (child instanceof IText) {
      if (csx !== 1 || csy !== 1) {
        child.set({ fontSize: (child.fontSize ?? 18) * csy, scaleX: 1, scaleY: 1 });
      }
    } else if (child instanceof FabricText) {
      if (csx !== 1 || csy !== 1) {
        child.set({ fontSize: (child.fontSize ?? 14) * csy, scaleX: 1, scaleY: 1 });
      }
    } else if (child instanceof Rect) {
      const role = structureProp(child, "structureRole");
      if (role === "checkbox") {
        child.set({ width: STRUCTURE_BOX, height: STRUCTURE_BOX, scaleX: 1, scaleY: 1 });
      } else if (role === "frame-v") {
        child.set({ scaleX: 1, scaleY: 1 });
      } else {
        child.set({
          width: (child.width ?? 0) * csx,
          height: (child.height ?? 0) * csy,
          scaleX: 1,
          scaleY: 1,
        });
      }
    }
  }

  group.set({ scaleX: 1, scaleY: 1, structureWidth: newWidth });
}

function reflowInteractiveStructure(group: Group) {
  const structureType = structureProp(group, "structureType") as string | undefined;
  const width = getStructureLayoutWidth(group);

  if (structureType === "checklist") {
    const boxes = group
      .getObjects()
      .filter((o) => structureProp(o, "structureRole") === "checkbox")
      .sort((a, b) => (structureProp(a, "rowIndex") as number) - (structureProp(b, "rowIndex") as number));

    for (const box of boxes) {
      if (!(box instanceof Rect)) continue;
      const rowIndex = structureProp(box, "rowIndex") as number;
      const rowTop = 8 + rowIndex * STRUCTURE_ROW_H;
      const checked = !!structureProp(box, "checked");
      box.set({ left: 0, top: rowTop, width: STRUCTURE_BOX, height: STRUCTURE_BOX, scaleX: 1, scaleY: 1 });
      box.set({ fill: checked ? DECAL_INK : "transparent" });

      const label = group
        .getObjects()
        .find(
          (o) =>
            structureProp(o, "structureRole") === "label" && structureProp(o, "rowIndex") === rowIndex,
        );
      if (label instanceof IText) {
        label.set({
          left: STRUCTURE_BOX + 10,
          top: rowTop - 2,
          width: width - STRUCTURE_BOX - 24,
          scaleX: 1,
          scaleY: 1,
          linethrough: checked,
          fill: checked ? DECAL_MUTED : DECAL_INK,
        });
      }
    }

    const addBtn = group.getObjects().find((o) => structureProp(o, "structureRole") === "add-row");
    if (addBtn) {
      addBtn.set({ top: 8 + boxes.length * STRUCTURE_ROW_H + 4, scaleX: 1, scaleY: 1 });
    }
  }

  if (structureType === "priority") {
    const midX = width * 0.55;
    const leftCells = group
      .getObjects()
      .filter((o) => structureProp(o, "structureRole") === "priority-left")
      .sort((a, b) => (structureProp(a, "rowIndex") as number) - (structureProp(b, "rowIndex") as number));
    const rowCount = leftCells.length;

    const headerLine = group
      .getObjects()
      .find((o) => o instanceof Rect && !structureProp(o, "structureRole") && (o.top ?? 0) <= 34);
    if (headerLine instanceof Rect) {
      headerLine.set({ width, scaleX: 1, scaleY: 1 });
    }

    const lastRowTop = 44 + Math.max(0, rowCount - 1) * STRUCTURE_ROW_H;
    const frameV = group.getObjects().find((o) => structureProp(o, "structureRole") === "frame-v");
    if (frameV instanceof Rect) {
      frameV.set({ left: midX, height: lastRowTop + STRUCTURE_ROW_H + 28, scaleX: 1, scaleY: 1 });
    }

    for (const left of leftCells) {
      if (!(left instanceof IText)) continue;
      const rowIndex = structureProp(left, "rowIndex") as number;
      const rowTop = 44 + rowIndex * STRUCTURE_ROW_H;
      left.set({ left: 8, top: rowTop, width: midX - 20, scaleX: 1, scaleY: 1 });

      const right = group
        .getObjects()
        .find(
          (o) =>
            structureProp(o, "structureRole") === "priority-right" &&
            structureProp(o, "rowIndex") === rowIndex,
        );
      if (right instanceof IText) {
        right.set({ left: midX + 8, top: rowTop, width: width - midX - 16, scaleX: 1, scaleY: 1 });
      }
    }

    const addBtn = group.getObjects().find((o) => structureProp(o, "structureRole") === "add-row");
    if (addBtn) {
      addBtn.set({ top: 44 + rowCount * STRUCTURE_ROW_H + 6, scaleX: 1, scaleY: 1 });
    }
  }

  group.set({ structureWidth: width });
  group.setCoords();
}

const makeDecalLine = (
  left: number,
  top: number,
  width: number,
  height = 3,
  fill = DECAL_LINE,
) =>
  new Rect({
    left,
    top,
    width,
    height,
    fill,
    rx: height / 2,
    ry: height / 2,
    selectable: false,
    evented: false,
  });

const makeDecalText = (
  text: string,
  left: number,
  top: number,
  fontSize = 24,
  fill = DECAL_INK,
  fontWeight: string | number = 700,
) =>
  new FabricText(text.toUpperCase(), {
    left,
    top,
    fontSize,
    fontFamily: "system-ui, sans-serif",
    fill,
    fontWeight,
    selectable: false,
    evented: false,
  });

export type BoardDiagramType =
  | "eisenhower"
  | "checklist"
  | "zones"
  | "timeline"
  | "kanban"
  | "gantt"
  | "okrs"
  | "five_s"
  | "divider";

export type BoardCanvasHandle = {
  addText: (text?: string) => void;
  addTextAt: (text: string, left: number, top: number, fontSize?: number) => void;
  addTextNormalized: (text: string, x: number, y: number, fontSize?: number, fill?: string) => void;
  addStickyNote: () => void;
  addStickyNoteAt: (text: string, x: number, y: number, fill?: string) => void;
  addDiagramOverlay: (
    diagram: BoardDiagramType,
    x: number,
    y: number,
    w: number,
    h: number,
    items?: string[],
    accent?: string,
  ) => void;
  addImageFromUrl: (url: string, options?: ImageFitOptions) => Promise<void>;
  addImageFromFile: (file: File, options?: ImageFitOptions) => Promise<{ width: number; height: number }>;
  mergeLayoutObjects: (layoutJson: Record<string, unknown>, offset?: { x: number; y: number }) => Promise<void>;
  copySelected: () => Promise<boolean>;
  pasteClipboard: () => Promise<boolean>;
  pasteAtPoint: (normX: number, normY: number) => Promise<boolean>;
  canPasteClipboard: () => boolean;
  hasSelection: () => boolean;
  deleteSelected: () => void;
  resetBoard: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getLayoutJson: () => Record<string, unknown>;
  addShape: (shape: BoardMarkShapeType) => void;
  addSticker: (sticker: BoardMarkStickerId) => void;
  startDrawMode: () => void;
};

export type ImageFitOptions = {
  fit?: "default" | "cover";
  sendToBack?: boolean;
};

type QuickSelectorState = {
  x: number;
  y: number;
  normX: number;
  normY: number;
  mode: "empty" | "object";
  textCapable?: boolean;
  shapeCapable?: boolean;
  stickerCapable?: boolean;
};

type BoardCanvasEditorProps = {
  layoutJson: Record<string, unknown>;
  colorKey: string;
  boardId: string;
  layoutMode?: BoardLayoutMode;
  readOnly?: boolean;
  /** Tighter layout when shown in grid / carousel cells */
  embedded?: boolean;
  /** Fill embedded cell by cropping (cover) or letterboxing (contain). */
  cellFit?: "contain" | "cover";
  /** Fit to cell (default) or fixed canvas scale — e.g. 1 = 100% */
  viewZoom?: "fit" | number;
  /** When false (e.g. inactive grid cell), radial menu and keyboard shortcuts are disabled. */
  isActive?: boolean;
  onSave: (layout: Record<string, unknown>) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onBoardColorPick?: (hex: string) => void;
  onRequestImagePick?: () => void;
};

export const BoardCanvasEditor = forwardRef<BoardCanvasHandle, BoardCanvasEditorProps>(
  function BoardCanvasEditor(
    {
      layoutJson,
      colorKey,
      boardId,
      layoutMode = "vision",
      readOnly = false,
      embedded = false,
      cellFit = "contain",
      viewZoom = "fit",
      isActive = true,
      onSave,
      onHistoryChange,
      onBoardColorPick,
      onRequestImagePick,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasWrapRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const saveTimerRef = useRef<number>();
    const historyTimerRef = useRef<number>();
    const loadedBoardRef = useRef<string | null>(null);
    const restoringHistoryRef = useRef(false);
    const suppressHistoryRef = useRef(false);
    const historyRef = useRef<{ snapshots: string[]; index: number }>({ snapshots: [], index: -1 });
    const onHistoryChangeRef = useRef(onHistoryChange);
    const rebindStructureHandlersRef = useRef<(canvas: Canvas) => void>(() => {});
    const handleStructurePointerRef = useRef<(canvas: Canvas, target: FabricObjectType) => boolean>(() => false);
    const [quickSelector, setQuickSelector] = useState<QuickSelectorState | null>(null);
    const [drawingMode, setDrawingMode] = useState(false);
    const drawColorRef = useRef(MARK_SHAPE_STROKE);
    const deleteTargetRef = useRef<FabricObject | null>(null);
    const isActiveRef = useRef(isActive);
    isActiveRef.current = isActive;

    onHistoryChangeRef.current = onHistoryChange;

    useEffect(() => {
      if (!isActive) setQuickSelector(null);
    }, [isActive]);

    const scheduleSave = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        onSave(canvas.toJSON() as Record<string, unknown>);
      }, 700);
    }, [onSave, readOnly]);

    const notifyHistoryChange = useCallback(() => {
      const h = historyRef.current;
      onHistoryChangeRef.current?.({
        canUndo: h.index > 0,
        canRedo: h.index >= 0 && h.index < h.snapshots.length - 1,
      });
    }, []);

    const snapshotCanvas = useCallback((canvas: Canvas) => JSON.stringify(canvas.toJSON()), []);

    const resetHistory = useCallback(
      (canvas: Canvas) => {
        historyRef.current = { snapshots: [snapshotCanvas(canvas)], index: 0 };
        notifyHistoryChange();
      },
      [notifyHistoryChange, snapshotCanvas],
    );

    const commitHistorySnapshot = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly || restoringHistoryRef.current || suppressHistoryRef.current) return;
      const json = snapshotCanvas(canvas);
      const h = historyRef.current;
      if (h.snapshots.length === 0 || h.index < 0) {
        h.snapshots = [json];
        h.index = 0;
        notifyHistoryChange();
        return;
      }
      if (h.snapshots[h.index] === json) return;
      h.snapshots = h.snapshots.slice(0, h.index + 1);
      h.snapshots.push(json);
      if (h.snapshots.length > 40) {
        h.snapshots.shift();
      }
      h.index = h.snapshots.length - 1;
      notifyHistoryChange();
    }, [notifyHistoryChange, readOnly, snapshotCanvas]);

    const flushPendingHistory = useCallback(() => {
      window.clearTimeout(historyTimerRef.current);
      commitHistorySnapshot();
    }, [commitHistorySnapshot]);

    const recordHistory = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly || restoringHistoryRef.current) return;
      window.clearTimeout(historyTimerRef.current);
      historyTimerRef.current = window.setTimeout(commitHistorySnapshot, 250);
    }, [commitHistorySnapshot, readOnly]);

    const commitHistorySnapshotRef = useRef(commitHistorySnapshot);
    commitHistorySnapshotRef.current = commitHistorySnapshot;
    const recordHistoryRef = useRef(recordHistory);
    recordHistoryRef.current = recordHistory;
    const scheduleSaveRef = useRef(scheduleSave);
    scheduleSaveRef.current = scheduleSave;

    const applyHistorySnapshot = useCallback(
      async (index: number) => {
        const canvas = fabricRef.current;
        const h = historyRef.current;
        const json = h.snapshots[index];
        if (!canvas || !json) return;
        restoringHistoryRef.current = true;
        const bg = boardFillForKey(colorKey);
        await canvas.loadFromJSON(JSON.parse(json));
        canvas.backgroundColor = bg;
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        restoringHistoryRef.current = false;
        h.index = index;
        notifyHistoryChange();
        scheduleSave();
        rebindStructureHandlersRef.current(canvas);
      },
      [colorKey, notifyHistoryChange, scheduleSave],
    );

    const undo = useCallback(() => {
      flushPendingHistory();
      const h = historyRef.current;
      if (h.index <= 0) return;
      void applyHistorySnapshot(h.index - 1);
    }, [applyHistorySnapshot, flushPendingHistory]);

    const redo = useCallback(() => {
      flushPendingHistory();
      const h = historyRef.current;
      if (h.index >= h.snapshots.length - 1) return;
      void applyHistorySnapshot(h.index + 1);
    }, [applyHistorySnapshot, flushPendingHistory]);

    const canUndo = useCallback(() => historyRef.current.index > 0, []);
    const canRedo = useCallback(
      () => historyRef.current.index >= 0 && historyRef.current.index < historyRef.current.snapshots.length - 1,
      [],
    );

    useEffect(() => {
      if (isActive) notifyHistoryChange();
    }, [isActive, notifyHistoryChange]);

    const closeQuickSelector = useCallback(() => {
      deleteTargetRef.current = null;
      setQuickSelector(null);
    }, []);

    const openQuickSelectorFromEvent = useCallback((canvas: Canvas, e: Event, target?: FabricObject) => {
      if (readOnly || !isActiveRef.current) return;
      if (canvas.isDrawingMode) {
        canvas.isDrawingMode = false;
        setDrawingMode(false);
      }
      const wrap = canvasWrapRef.current;
      if (!wrap) return;
      let clientX: number | undefined;
      let clientY: number | undefined;
      if ("clientX" in e && typeof e.clientX === "number") {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if ("touches" in e && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("changedTouches" in e && e.changedTouches[0]) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
      if (clientX == null || clientY == null) return;
      const rect = wrap.getBoundingClientRect();
      const pointer = canvas.getScenePoint(e as MouseEvent);

      if (target) {
        let root = target;
        while (root.group) {
          root = root.group;
        }
        deleteTargetRef.current = root;
        canvas.setActiveObject(root);
        const objects = canvas.getObjects();
        if (objects[objects.length - 1] !== root) {
          canvas.bringObjectToFront(root);
        }
        canvas.requestRenderAll();
      }

      let textCapable = false;
      let shapeCapable = false;
      let stickerCapable = false;
      if (target instanceof IText || target instanceof Textbox || target instanceof FabricText) {
        textCapable = true;
      } else if (target) {
        let root = target;
        while (root.group) {
          root = root.group;
        }
        if (root instanceof Group) {
          textCapable = root.getObjects().some((o) => o instanceof Textbox || o instanceof IText || o instanceof FabricText);
        }
        const markKind = typeof root.get === "function" ? root.get("markKind") : undefined;
        shapeCapable = markKind === "shape";
        stickerCapable = markKind === "sticker";
      }

      setQuickSelector({
        x: clientX - rect.left,
        y: clientY - rect.top,
        normX: Math.min(1, Math.max(0, pointer.x / ARTBOARD_WIDTH)),
        normY: Math.min(1, Math.max(0, pointer.y / ARTBOARD_HEIGHT)),
        mode: target ? "object" : "empty",
        textCapable,
        shapeCapable,
        stickerCapable,
      });
    }, [readOnly]);

    const openQuickSelectorRef = useRef(openQuickSelectorFromEvent);
    openQuickSelectorRef.current = openQuickSelectorFromEvent;

    const fitCanvas = useCallback((canvas: Canvas) => {
      const container = containerRef.current;
      const wrap = canvasWrapRef.current;
      if (!container) return;
      const pad = embedded ? 0 : 32;
      const maxW = Math.max(container.clientWidth - pad, 1);
      const maxH = Math.max(container.clientHeight - pad, 1);
      const containScale = Math.min(maxW / ARTBOARD_WIDTH, maxH / ARTBOARD_HEIGHT);
      const coverScale = Math.max(maxW / ARTBOARD_WIDTH, maxH / ARTBOARD_HEIGHT);
      const baseScale =
        embedded && cellFit === "cover"
          ? coverScale
          : Math.min(containScale, embedded ? Infinity : 1);
      const zoom =
        viewZoom === "fit"
          ? baseScale > 0
            ? baseScale
            : 0.5
          : typeof viewZoom === "number"
            ? containScale * viewZoom
            : baseScale > 0
              ? baseScale
              : 0.5;
      canvas.setZoom(zoom);
      const scaledW = ARTBOARD_WIDTH * zoom;
      const scaledH = ARTBOARD_HEIGHT * zoom;
      canvas.setDimensions({ width: scaledW, height: scaledH });
      const canvasEl = canvas.getElement();
      if (embedded && cellFit === "cover" && wrap) {
        canvasEl.style.marginLeft = `${(maxW - scaledW) / 2}px`;
        canvasEl.style.marginTop = `${(maxH - scaledH) / 2}px`;
      } else {
        canvasEl.style.marginLeft = "";
        canvasEl.style.marginTop = "";
      }
      canvas.requestRenderAll();
    }, [cellFit, embedded, viewZoom]);

    useEffect(() => {
      if (!canvasElRef.current) return;
      const bg = boardFillForKey(colorKey);
      const canvas = new Canvas(canvasElRef.current, {
        width: ARTBOARD_WIDTH,
        height: ARTBOARD_HEIGHT,
        backgroundColor: bg,
        selection: !readOnly,
      });
      fabricRef.current = canvas;
      fitCanvas(canvas);

      const onResize = () => fitCanvas(canvas);
      window.addEventListener("resize", onResize);

      let containerObserver: ResizeObserver | undefined;
      if (embedded && containerRef.current) {
        containerObserver = new ResizeObserver(() => fitCanvas(canvas));
        containerObserver.observe(containerRef.current);
      }

      let onContextMenu: ((e: MouseEvent) => void) | undefined;

      if (!readOnly) {
        const onHistoryDebounced = () => {
          recordHistoryRef.current();
          scheduleSaveRef.current();
        };
        const onHistoryImmediate = () => {
          commitHistorySnapshotRef.current();
          scheduleSaveRef.current();
        };
        canvas.on("object:modified", (event) => {
          const target = event.target;
          if (target instanceof Group) {
            const structureId = target.get("structureId");
            const structureType = target.get("structureType");
            if (
              structureId &&
              structureType &&
              (structureType === "priority" || structureType === "checklist")
            ) {
              normalizeInteractiveStructureResize(target);
              reflowInteractiveStructure(target);
              rebindStructureHandlersRef.current(canvas);
              canvas.requestRenderAll();
            }
          }
          onHistoryDebounced();
        });
        canvas.on("object:added", onHistoryImmediate);
        canvas.on("object:removed", onHistoryImmediate);
        canvas.on("text:changed", onHistoryDebounced);
        canvas.on("editing:exited", onHistoryDebounced);
        canvas.on("path:created", (opt) => {
          const path = opt.path;
          if (path) {
            path.set({ markKind: "draw" });
          }
        });
        canvas.on("mouse:down", (opt) => {
          const e = opt.e as MouseEvent;
          if (canvas.isDrawingMode) return;

          const target = opt.target;

          if (target) {
            let hit: FabricObjectType | null = target;
            while (hit) {
              const role = structureProp(hit, "structureRole");
              if (
                role &&
                (role === "checkbox" || role === "add-row" || role === "label" || role === "priority-left" || role === "priority-right")
              ) {
                if (handleStructurePointerRef.current(canvas, hit)) {
                  opt.e.preventDefault?.();
                  opt.e.stopPropagation?.();
                  return;
                }
                break;
              }
              hit = hit.group ?? null;
            }
          }

          const isLeftEmpty = e.button === 0 && !target && !e.ctrlKey && !e.metaKey && !e.shiftKey;
          if (isLeftEmpty) {
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            return;
          }

          if (!target) return;
          let root = target;
          while (root.group) {
            root = root.group;
          }
          const objects = canvas.getObjects();
          if (objects[objects.length - 1] !== root) {
            suppressHistoryRef.current = true;
            canvas.bringObjectToFront(root);
            canvas.requestRenderAll();
            window.setTimeout(() => {
              suppressHistoryRef.current = false;
            }, 0);
          }
        });

        onContextMenu = (e: MouseEvent) => {
          if (!isActiveRef.current) return;
          e.preventDefault();
          openQuickSelectorRef.current(canvas, e, canvas.findTarget(e) ?? undefined);
        };
        canvas.upperCanvasEl.addEventListener("contextmenu", onContextMenu);
      }

      return () => {
        if (onContextMenu) {
          canvas.upperCanvasEl.removeEventListener("contextmenu", onContextMenu);
        }
        window.removeEventListener("resize", onResize);
        containerObserver?.disconnect();
        window.clearTimeout(saveTimerRef.current);
        window.clearTimeout(historyTimerRef.current);
        canvas.dispose();
        fabricRef.current = null;
        loadedBoardRef.current = null;
      };
    }, [colorKey, embedded, fitCanvas, readOnly]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const interactive = isActive;
      canvas.selection = interactive;
      canvas.skipTargetFind = !interactive;
      canvas.forEachObject((obj) => {
        obj.selectable = interactive;
        obj.evented = interactive;
      });
      if (!interactive) canvas.discardActiveObject();
      canvas.requestRenderAll();
    }, [isActive, readOnly]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (canvas) fitCanvas(canvas);
    }, [cellFit, fitCanvas, viewZoom]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (loadedBoardRef.current === boardId) return;
      loadedBoardRef.current = boardId;
      const bg = boardFillForKey(colorKey);
      canvas.backgroundColor = bg;

      const hasObjects =
        layoutJson &&
        typeof layoutJson === "object" &&
        Array.isArray((layoutJson as { objects?: unknown[] }).objects) &&
        ((layoutJson as { objects: unknown[] }).objects?.length ?? 0) > 0;

      if (hasObjects) {
        canvas.loadFromJSON(layoutJson).then(() => {
          canvas.backgroundColor = bg;
          canvas.getObjects().forEach((obj) => {
            if (obj instanceof Group && structureProp(obj, "structureId")) {
              restoreStructureGroupState(obj);
            }
          });
          canvas.requestRenderAll();
          resetHistory(canvas);
          rebindStructureHandlersRef.current(canvas);
        });
      } else {
        canvas.clear();
        canvas.backgroundColor = bg;
        canvas.requestRenderAll();
        resetHistory(canvas);
      }
    }, [boardId, colorKey, layoutJson, resetHistory]);

    const addText = useCallback((text = "") => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const t = new IText(text, {
        left: ARTBOARD_WIDTH * 0.15,
        top: ARTBOARD_HEIGHT * 0.2,
        fontSize: 42,
        fontFamily: "system-ui, sans-serif",
        fill: MARK_TEXT_FILL,
        fontWeight: "600",
      });
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.requestRenderAll();
      requestAnimationFrame(() => {
        t.enterEditing();
        t.selectAll();
      });
      scheduleSave();
    }, [readOnly, scheduleSave]);

    const addStickyNote = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const w = 280;
      const h = 200;
      const left = ARTBOARD_WIDTH * 0.1;
      const top = ARTBOARD_HEIGHT * 0.35;
      const rect = new Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        fill: "#FFF9C4",
        stroke: "#E8D44D",
        strokeWidth: 1,
        rx: 8,
        ry: 8,
        selectable: false,
        evented: false,
      });
      const note = new Textbox("", {
        left: 16,
        top: 16,
        width: w - 32,
        fontSize: 22,
        fontFamily: "system-ui, sans-serif",
        fill: "#171717",
        splitByGrapheme: true,
      });
      const sticky = new Group([rect, note], {
        left,
        top,
        subTargetCheck: true,
      });
      canvas.add(sticky);
      canvas.setActiveObject(note);
      canvas.requestRenderAll();
      requestAnimationFrame(() => {
        note.enterEditing();
      });
      scheduleSave();
    }, [readOnly, scheduleSave]);

    const addTextAtPoint = useCallback((normX: number, normY: number) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const t = new IText("", {
        left: normX * ARTBOARD_WIDTH,
        top: normY * ARTBOARD_HEIGHT,
        fontSize: MARK_TEXT_SIZES.XL,
        fontFamily: "system-ui, sans-serif",
        fill: MARK_TEXT_FILL,
        fontWeight: "600",
      });
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.requestRenderAll();
      requestAnimationFrame(() => {
        t.enterEditing();
        t.selectAll();
      });
      scheduleSave();
    }, [readOnly, scheduleSave]);

    const addStickyNoteAtPoint = useCallback((normX: number, normY: number) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const w = 280;
      const h = 200;
      const left = normX * ARTBOARD_WIDTH - w / 2;
      const top = normY * ARTBOARD_HEIGHT - h / 2;
      const rect = new Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        fill: "#FFF9C4",
        stroke: "#E8D44D",
        strokeWidth: 1,
        rx: 8,
        ry: 8,
        selectable: false,
        evented: false,
      });
      const note = new Textbox("", {
        left: 16,
        top: 16,
        width: w - 32,
        fontSize: 22,
        fontFamily: "system-ui, sans-serif",
        fill: "#171717",
        splitByGrapheme: true,
      });
      const sticky = new Group([rect, note], {
        left,
        top,
        subTargetCheck: true,
      });
      canvas.add(sticky);
      canvas.setActiveObject(note);
      canvas.requestRenderAll();
      requestAnimationFrame(() => {
        note.enterEditing();
      });
      scheduleSave();
    }, [readOnly, scheduleSave]);

    const exitDrawMode = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.isDrawingMode = false;
      setDrawingMode(false);
    }, []);

    const startDrawMode = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      deleteTargetRef.current = null;
      setQuickSelector(null);
      const brush = new PencilBrush(canvas);
      brush.color = drawColorRef.current;
      brush.width = MARK_DRAW_WIDTH;
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setDrawingMode(true);
    }, [readOnly]);

    const addShapeAtPoint = useCallback(
      (shapeType: BoardMarkShapeType, normX: number, normY: number, stroke = MARK_SHAPE_STROKE) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const cx = normX * ARTBOARD_WIDTH;
        const cy = normY * ARTBOARD_HEIGHT;
        const fill = `${stroke}33`;
        const mark = { markKind: "shape" as const, shapeType };
        let shape: FabricObject;
        if (shapeType === "rect") {
          shape = new Rect({
            left: cx - 60,
            top: cy - 45,
            width: 120,
            height: 90,
            fill,
            stroke,
            strokeWidth: 3,
            rx: 4,
            ry: 4,
            ...mark,
          });
        } else if (shapeType === "circle") {
          shape = new Circle({
            left: cx - 55,
            top: cy - 55,
            radius: 55,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        } else if (shapeType === "ellipse") {
          shape = new Ellipse({
            left: cx - 70,
            top: cy - 45,
            rx: 70,
            ry: 45,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        } else if (shapeType === "triangle") {
          shape = new Triangle({
            left: cx - 50,
            top: cy - 45,
            width: 100,
            height: 90,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        } else if (shapeType === "line") {
          shape = new Line([cx - 70, cy, cx + 70, cy], {
            stroke,
            strokeWidth: 3,
            fill: "transparent",
            ...mark,
          });
        } else if (shapeType === "semicircle") {
          shape = new Circle({
            left: cx - 55,
            top: cy - 55,
            radius: 55,
            startAngle: 0,
            endAngle: 180,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        } else if (shapeType === "pie") {
          shape = new Circle({
            left: cx - 55,
            top: cy - 55,
            radius: 55,
            startAngle: -90,
            endAngle: 0,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        } else if (shapeType === "hexagon") {
          shape = new Polygon(
            [
              { x: 0, y: -50 },
              { x: 43, y: -25 },
              { x: 43, y: 25 },
              { x: 0, y: 50 },
              { x: -43, y: 25 },
              { x: -43, y: -25 },
            ],
            {
              left: cx,
              top: cy,
              originX: "center",
              originY: "center",
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "pentagon") {
          shape = new Polygon(
            [
              { x: 0, y: -50 },
              { x: 48, y: -15 },
              { x: 30, y: 40 },
              { x: -30, y: 40 },
              { x: -48, y: -15 },
            ],
            {
              left: cx,
              top: cy,
              originX: "center",
              originY: "center",
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "star") {
          shape = new Polygon(
            [
              { x: 0, y: -52 },
              { x: 12, y: -16 },
              { x: 50, y: -16 },
              { x: 20, y: 8 },
              { x: 32, y: 44 },
              { x: 0, y: 24 },
              { x: -32, y: 44 },
              { x: -20, y: 8 },
              { x: -50, y: -16 },
              { x: -12, y: -16 },
            ],
            {
              left: cx,
              top: cy,
              originX: "center",
              originY: "center",
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "diamond") {
          shape = new Polygon(
            [
              { x: 0, y: -55 },
              { x: 40, y: 0 },
              { x: 0, y: 55 },
              { x: -40, y: 0 },
            ],
            {
              left: cx,
              top: cy,
              originX: "center",
              originY: "center",
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else {
          shape = new Path("M 0 0 L 120 0 L 95 -14 L 120 0 L 95 14 Z", {
            left: cx - 60,
            top: cy - 7,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        }
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.requestRenderAll();
        scheduleSave();
      },
      [readOnly, scheduleSave],
    );

    const addStickerAtPoint = useCallback(
      (stickerId: BoardMarkStickerId, normX: number, normY: number) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const sticker = new FabricText(BOARD_MARK_STICKER_EMOJI[stickerId], {
          left: normX * ARTBOARD_WIDTH,
          top: normY * ARTBOARD_HEIGHT,
          fontSize: 72,
          fontFamily: "system-ui, sans-serif",
          originX: "center",
          originY: "center",
          markKind: "sticker",
          stickerId,
        });
        canvas.add(sticker);
        canvas.setActiveObject(sticker);
        canvas.requestRenderAll();
        scheduleSave();
      },
      [readOnly, scheduleSave],
    );

    const swapMarkShape = useCallback(
      (shapeType: BoardMarkShapeType) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const selected = deleteTargetRef.current ?? canvas.getActiveObject();
        if (!selected) return;
        let root: FabricObject = selected;
        while (root.group) root = root.group;
        if (root.get("markKind") !== "shape") return;
        const center = root.getCenterPoint();
        canvas.remove(root);
        deleteTargetRef.current = null;
        addShapeAtPoint(shapeType, center.x / ARTBOARD_WIDTH, center.y / ARTBOARD_HEIGHT, (root.stroke as string) || MARK_SHAPE_STROKE);
        recordHistory();
      },
      [addShapeAtPoint, readOnly, recordHistory],
    );

    const swapMarkSticker = useCallback(
      (stickerId: BoardMarkStickerId) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const selected = deleteTargetRef.current ?? canvas.getActiveObject();
        if (!selected) return;
        let root: FabricObject = selected;
        while (root.group) root = root.group;
        if (root.get("markKind") !== "sticker" || !(root instanceof FabricText)) return;
        root.set({ text: BOARD_MARK_STICKER_EMOJI[stickerId], stickerId });
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [readOnly, recordHistory, scheduleSave],
    );

    const placeImage = (canvas: Canvas, img: FabricImage, options?: ImageFitOptions) => {
      const fit = options?.fit ?? "default";
      if (fit === "cover") {
        const iw = img.width || 1;
        const ih = img.height || 1;
        const imgAspect = iw / ih;
        const boardAspect = ARTBOARD_WIDTH / ARTBOARD_HEIGHT;
        let scale: number;
        if (imgAspect > boardAspect) {
          scale = ARTBOARD_HEIGHT / ih;
        } else {
          scale = ARTBOARD_WIDTH / iw;
        }
        img.set({
          left: ARTBOARD_WIDTH / 2,
          top: ARTBOARD_HEIGHT / 2,
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });
      } else {
        const maxSide = Math.min(ARTBOARD_WIDTH, ARTBOARD_HEIGHT) * 0.45;
        const scale = Math.min(maxSide / (img.width || 1), maxSide / (img.height || 1), 1);
        img.set({
          left: ARTBOARD_WIDTH * 0.25,
          top: ARTBOARD_HEIGHT * 0.15,
          scaleX: scale,
          scaleY: scale,
        });
      }
      canvas.add(img);
      if (options?.sendToBack) {
        canvas.sendObjectToBack(img);
      }
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    };

    const addImageFromUrl = useCallback(async (url: string, options?: ImageFitOptions) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      try {
        const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
        placeImage(canvas, img, options);
      } catch {
        const res = await fetch(url);
        if (!res.ok) throw new Error("image fetch failed");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        try {
          const img = await FabricImage.fromURL(blobUrl);
          placeImage(canvas, img, options);
        } finally {
          URL.revokeObjectURL(blobUrl);
        }
      }
    }, [readOnly]);

    const addImageFromFile = useCallback(async (file: File, options?: ImageFitOptions) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) throw new Error("read only");
      const blobUrl = URL.createObjectURL(file);
      try {
        const img = await FabricImage.fromURL(blobUrl);
        placeImage(canvas, img, options);
        return { width: img.width || 1, height: img.height || 1 };
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    }, [readOnly]);

    const addTextAt = useCallback((text: string, left: number, top: number, fontSize = 28) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const t = new FabricText(text, {
        left,
        top,
        fontSize,
        fontFamily: "system-ui, sans-serif",
        fill: MARK_TEXT_FILL,
        fontWeight: "600",
        originX: "center",
        originY: "center",
      });
      canvas.add(t);
      canvas.requestRenderAll();
    }, [readOnly]);

    const addTextNormalized = useCallback(
      (text: string, x: number, y: number, fontSize = 36, fill = MARK_TEXT_FILL) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const t = new FabricText(text, {
          left: x * ARTBOARD_WIDTH,
          top: y * ARTBOARD_HEIGHT,
          fontSize,
          fontFamily: "system-ui, sans-serif",
          fill,
          fontWeight: "600",
          originX: "center",
          originY: "center",
        });
        canvas.add(t);
        canvas.requestRenderAll();
      },
      [readOnly],
    );

    const addStickyNoteAt = useCallback(
      (text: string, x: number, y: number, fill = "#FFF9C4") => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const w = 260;
        const h = 170;
        const left = x * ARTBOARD_WIDTH;
        const top = y * ARTBOARD_HEIGHT;
        const stroke = fill === "#FFF9C4" ? "#E8D44D" : fill;
        const rect = new Rect({
          left: 0,
          top: 0,
          width: w,
          height: h,
          fill,
          stroke,
          strokeWidth: 1,
          rx: 8,
          ry: 8,
          selectable: false,
          evented: false,
        });
        const note = new Textbox(text, {
          left: 14,
          top: 14,
          width: w - 28,
          fontSize: 20,
          fontFamily: "system-ui, sans-serif",
          fill: "#171717",
          splitByGrapheme: true,
        });
        canvas.add(new Group([rect, note], { left, top, subTargetCheck: true }));
        canvas.requestRenderAll();
      },
      [readOnly],
    );

    const rebindStructureHandlers = useCallback(
      (canvas: Canvas) => {
        if (readOnly) return;

        const addRow = (structureId: string, structureType: string) => {
          const group = findStructureGroup(canvas, structureId, structureType);
          if (!group) return;

          if (structureType === "checklist") {
            const rowIndex = group.getObjects().filter((o) => structureProp(o, "structureRole") === "checkbox").length;
            const rowTop = 8 + rowIndex * STRUCTURE_ROW_H;
            const box = new Rect({
              left: 0,
              top: rowTop,
              width: STRUCTURE_BOX,
              height: STRUCTURE_BOX,
              fill: "transparent",
              stroke: DECAL_INK,
              strokeWidth: 2,
              rx: 2,
              ry: 2,
              selectable: false,
              evented: true,
              hoverCursor: "pointer",
            });
            box.set({
              structureId,
              structureType,
              structureRole: "checkbox",
              rowIndex,
              checked: false,
            });
            const label = new IText("", {
              left: STRUCTURE_BOX + 10,
              top: rowTop - 2,
              width: Math.max(120, getStructureLayoutWidth(group) - STRUCTURE_BOX - 24),
              fontSize: 18,
              fontFamily: STRUCTURE_FONT,
              fill: DECAL_INK,
              editable: true,
              selectable: false,
              evented: true,
            });
            label.set({ structureId, structureType, structureRole: "label", rowIndex });
            group.add(box, label);
            const addBtn = group.getObjects().find((o) => structureProp(o, "structureRole") === "add-row");
            if (addBtn) addBtn.set({ top: rowTop + STRUCTURE_ROW_H + 4 });
          }

          if (structureType === "priority") {
            const rowIndex = group
              .getObjects()
              .filter((o) => structureProp(o, "structureRole") === "priority-left").length;
            const rowTop = 44 + rowIndex * STRUCTURE_ROW_H;
            const midX = getStructureLayoutWidth(group) * 0.55;
            const left = new IText("", {
              left: 8,
              top: rowTop,
              width: midX - 20,
              fontSize: 18,
              fontFamily: STRUCTURE_FONT,
              fill: DECAL_INK,
              editable: true,
              selectable: false,
              evented: true,
            });
            left.set({ structureId, structureType, structureRole: "priority-left", rowIndex });
            const right = new IText(String(rowIndex + 1), {
              left: midX + 8,
              top: rowTop,
              width: getStructureLayoutWidth(group) - midX - 16,
              fontSize: 18,
              fontFamily: STRUCTURE_FONT,
              fill: DECAL_INK,
              textAlign: "right",
              editable: true,
              selectable: false,
              evented: true,
            });
            right.set({ structureId, structureType, structureRole: "priority-right", rowIndex });
            group.add(left, right);
            const addBtn = group.getObjects().find((o) => structureProp(o, "structureRole") === "add-row");
            if (addBtn) addBtn.set({ top: rowTop + STRUCTURE_ROW_H + 6 });
            const frameV = group.getObjects().find((o) => structureProp(o, "structureRole") === "frame-v");
            if (frameV instanceof Rect) {
              frameV.set({ height: rowTop + STRUCTURE_ROW_H + 28 });
            }
          }

          group.setCoords();
          canvas.requestRenderAll();
          recordHistory();
          scheduleSave();
          rebindStructureHandlersRef.current(canvas);
        };

        walkStructureObjects(canvas, (obj) => {
          if (!(obj instanceof IText)) return;
          const role = structureProp(obj, "structureRole");
          if (role !== "label" && role !== "priority-left" && role !== "priority-right") return;
          const structureId = structureProp(obj, "structureId") as string | undefined;
          const structureType = structureProp(obj, "structureType") as string | undefined;
          if (!structureId || !structureType) return;
          obj.off("keydown");
          obj.on("keydown", (opt) => {
            const e = (opt as { e?: KeyboardEvent }).e;
            if (!e || e.key !== "Enter") return;
            e.preventDefault();
            obj.exitEditing();
            addRow(structureId, structureType);
          });
        });
      },
      [readOnly, recordHistory, scheduleSave],
    );

    rebindStructureHandlersRef.current = rebindStructureHandlers;

    const handleStructurePointer = useCallback(
      (canvas: Canvas, target: FabricObjectType) => {
        const role = structureProp(target, "structureRole");
        const structureId = structureProp(target, "structureId") as string | undefined;
        const structureType = structureProp(target, "structureType") as string | undefined;
        if (!role || !structureId || !structureType) return false;

        if (
          (role === "label" || role === "priority-left" || role === "priority-right") &&
          target instanceof IText
        ) {
          canvas.setActiveObject(target);
          target.enterEditing();
          canvas.requestRenderAll();
          return true;
        }

        if (role === "checkbox" && target instanceof Rect) {
          const checked = !structureProp(target, "checked");
          target.set({
            checked,
            fill: checked ? DECAL_INK : "transparent",
          });
          const rowIndex = structureProp(target, "rowIndex") as number | undefined;
          const group = findStructureGroup(canvas, structureId, structureType);
          const label = group
            ?.getObjects()
            .find(
              (o) =>
                structureProp(o, "structureRole") === "label" && structureProp(o, "rowIndex") === rowIndex,
            );
          if (label instanceof IText) {
            label.set({ linethrough: checked, fill: checked ? DECAL_MUTED : DECAL_INK });
          }
          canvas.requestRenderAll();
          recordHistory();
          scheduleSave();
          return true;
        }

        if (role === "add-row") {
          rebindStructureHandlersRef.current(canvas);
          const group = findStructureGroup(canvas, structureId, structureType);
          if (!group) return true;
          const addRow = () => {
            const rowIndex =
              structureType === "checklist"
                ? group.getObjects().filter((o) => structureProp(o, "structureRole") === "checkbox").length
                : group.getObjects().filter((o) => structureProp(o, "structureRole") === "priority-left").length;
            const rowTop = (structureType === "checklist" ? 8 : 44) + rowIndex * STRUCTURE_ROW_H;

            if (structureType === "checklist") {
              const box = new Rect({
                left: 0,
                top: rowTop,
                width: STRUCTURE_BOX,
                height: STRUCTURE_BOX,
                fill: "transparent",
                stroke: DECAL_INK,
                strokeWidth: 2,
                rx: 2,
                ry: 2,
                selectable: false,
                evented: true,
                hoverCursor: "pointer",
              });
              box.set({
                structureId,
                structureType,
                structureRole: "checkbox",
                rowIndex,
                checked: false,
              });
              const label = new IText("", {
                left: STRUCTURE_BOX + 10,
                top: rowTop - 2,
                width: Math.max(120, getStructureLayoutWidth(group) - STRUCTURE_BOX - 24),
                fontSize: 18,
                fontFamily: STRUCTURE_FONT,
                fill: DECAL_INK,
                editable: true,
                selectable: false,
                evented: true,
              });
              label.set({ structureId, structureType, structureRole: "label", rowIndex });
              group.add(box, label);
            } else {
              const midX = getStructureLayoutWidth(group) * 0.55;
              const left = new IText("", {
                left: 8,
                top: rowTop,
                width: midX - 20,
                fontSize: 18,
                fontFamily: STRUCTURE_FONT,
                fill: DECAL_INK,
                editable: true,
                selectable: false,
                evented: true,
              });
              left.set({ structureId, structureType, structureRole: "priority-left", rowIndex });
              const right = new IText(String(rowIndex + 1), {
                left: midX + 8,
                top: rowTop,
                width: getStructureLayoutWidth(group) - midX - 16,
                fontSize: 18,
                fontFamily: STRUCTURE_FONT,
                fill: DECAL_INK,
                textAlign: "right",
                editable: true,
                selectable: false,
                evented: true,
              });
              right.set({ structureId, structureType, structureRole: "priority-right", rowIndex });
              group.add(left, right);
              const frameV = group.getObjects().find((o) => structureProp(o, "structureRole") === "frame-v");
              if (frameV instanceof Rect) frameV.set({ height: rowTop + STRUCTURE_ROW_H + 28 });
            }

            target.set({ top: rowTop + STRUCTURE_ROW_H + (structureType === "checklist" ? 4 : 6) });
            group.setCoords();
            canvas.requestRenderAll();
            recordHistory();
            scheduleSave();
            rebindStructureHandlersRef.current(canvas);
          };
          addRow();
          return true;
        }

        return false;
      },
      [recordHistory, scheduleSave],
    );

    handleStructurePointerRef.current = handleStructurePointer;

    const placeInteractiveChecklist = (left: number, top: number, width: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const structureId = crypto.randomUUID();
      const rowCount = 4;
      const parts: FabricObjectType[] = [];

      for (let i = 0; i < rowCount; i++) {
        const rowTop = 8 + i * STRUCTURE_ROW_H;
        const box = new Rect({
          left: 0,
          top: rowTop,
          width: STRUCTURE_BOX,
          height: STRUCTURE_BOX,
          fill: "transparent",
          stroke: DECAL_INK,
          strokeWidth: 2,
          rx: 2,
          ry: 2,
          selectable: false,
          evented: true,
          hoverCursor: "pointer",
        });
        box.set({
          structureId,
          structureType: "checklist",
          structureRole: "checkbox",
          rowIndex: i,
          checked: false,
        });
        const label = new IText("", {
          left: STRUCTURE_BOX + 10,
          top: rowTop - 2,
          width: width - STRUCTURE_BOX - 24,
          fontSize: 18,
          fontFamily: STRUCTURE_FONT,
          fill: DECAL_INK,
          editable: true,
          selectable: false,
          evented: true,
        });
        label.set({ structureId, structureType: "checklist", structureRole: "label", rowIndex: i });
        parts.push(box, label);
      }

      const addBtn = new FabricText("+ add line", {
        left: 0,
        top: 8 + rowCount * STRUCTURE_ROW_H + 4,
        fontSize: 14,
        fontFamily: STRUCTURE_FONT,
        fill: DECAL_MUTED,
        selectable: false,
        evented: true,
        hoverCursor: "pointer",
      });
      addBtn.set({ structureId, structureType: "checklist", structureRole: "add-row" });
      parts.push(addBtn);

      const group = new Group(parts, {
        left,
        top,
        subTargetCheck: true,
        interactive: true,
        objectCaching: false,
        cornerStyle: "circle",
        borderColor: "rgba(17,17,17,0.45)",
        cornerColor: "#111111",
        transparentCorners: false,
      });
      group.set({ structureId, structureType: "checklist", structureWidth: width });
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
      rebindStructureHandlersRef.current(canvas);
    };

    const placeInteractivePriority = (left: number, top: number, width: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const structureId = crypto.randomUUID();
      const midX = width * 0.55;
      const rowCount = 6;
      const parts: FabricObjectType[] = [];

      parts.push(
        new Rect({
          left: 0,
          top: 34,
          width,
          height: 2,
          fill: DECAL_LINE,
          selectable: false,
          evented: false,
        }),
      );
      const frameV = new Rect({
        left: midX,
        top: 0,
        width: 2,
        height: 44 + rowCount * STRUCTURE_ROW_H + 16,
        fill: DECAL_LINE,
        selectable: false,
        evented: false,
      });
      frameV.set({ structureRole: "frame-v" });
      parts.push(frameV);

      for (let i = 0; i < rowCount; i++) {
        const rowTop = 44 + i * STRUCTURE_ROW_H;
        const leftCell = new IText("", {
          left: 8,
          top: rowTop,
          width: midX - 20,
          fontSize: 18,
          fontFamily: STRUCTURE_FONT,
          fill: DECAL_INK,
          editable: true,
          selectable: false,
          evented: true,
        });
        leftCell.set({ structureId, structureType: "priority", structureRole: "priority-left", rowIndex: i });
        const rightCell = new IText(String(i + 1), {
          left: midX + 8,
          top: rowTop,
          width: width - midX - 16,
          fontSize: 18,
          fontFamily: STRUCTURE_FONT,
          fill: DECAL_INK,
          textAlign: "right",
          editable: true,
          selectable: false,
          evented: true,
        });
        rightCell.set({ structureId, structureType: "priority", structureRole: "priority-right", rowIndex: i });
        parts.push(leftCell, rightCell);
      }

      const addBtn = new FabricText("+ add row", {
        left: 0,
        top: 44 + rowCount * STRUCTURE_ROW_H + 6,
        fontSize: 14,
        fontFamily: STRUCTURE_FONT,
        fill: DECAL_MUTED,
        selectable: false,
        evented: true,
        hoverCursor: "pointer",
      });
      addBtn.set({ structureId, structureType: "priority", structureRole: "add-row" });
      parts.push(addBtn);

      const group = new Group(parts, {
        left,
        top,
        subTargetCheck: true,
        interactive: true,
        objectCaching: false,
        cornerStyle: "circle",
        borderColor: "rgba(17,17,17,0.45)",
        cornerColor: "#111111",
        transparentCorners: false,
      });
      group.set({ structureId, structureType: "priority", structureWidth: width });
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
      rebindStructureHandlersRef.current(canvas);
    };

    const addDiagramOverlay = useCallback(
      (
        diagram: BoardDiagramType,
        x: number,
        y: number,
        w: number,
        h: number,
        items: string[] = [],
        accent = DECAL_INK,
      ) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;

        const left = x * ARTBOARD_WIDTH;
        const top = y * ARTBOARD_HEIGHT;
        const width = w * ARTBOARD_WIDTH;
        const height = h * ARTBOARD_HEIGHT;

        const objects: FabricObject[] = [];

        const addLine = (lx: number, ly: number, lw: number, lh = 3, fill = DECAL_LINE) => {
          objects.push(makeDecalLine(lx, ly, lw, lh, fill));
        };

        const addText = (
          text: string,
          lx: number,
          ly: number,
          size = 24,
          fill = DECAL_INK,
          weight: string | number = 700,
        ) => {
          objects.push(makeDecalText(text, lx, ly, size, fill, weight));
        };

        if (diagram === "kanban") {
          const labels = items.length >= 3 ? items.slice(0, 3) : ["TO DO", "IN PROGRESS", "DONE"];
          const colW = width / labels.length;

          labels.forEach((label, i) => {
            addText(label, i * colW + 8, 0, 22);
            if (i > 0) addLine(i * colW, 42, 3, height - 42);
          });

          addLine(0, 38, width, 3);
          addLine(0, height - 3, width, 3, "rgba(17,17,17,0.35)");
        }

        if (diagram === "checklist") {
          placeInteractiveChecklist(left, top, width);
          return;
        }

        if (diagram === "zones") {
          const zones = items.length ? items.slice(0, 4) : ["Zone 1", "Zone 2", "Zone 3"];
          addText("Zones", 0, 0, 22);

          const rowH = (height - 42) / zones.length;
          zones.forEach((zone, i) => {
            const rowTop = 42 + i * rowH;
            addText(zone, 0, rowTop + rowH / 2 - 12, 18, DECAL_MUTED, 600);
            addLine(width * 0.28, rowTop + rowH / 2, width * 0.72, 2, "rgba(17,17,17,0.38)");
            if (i > 0) addLine(0, rowTop, width, 2, "rgba(17,17,17,0.28)");
          });
        }

        if (diagram === "eisenhower") {
          placeInteractivePriority(left, top, width);
          return;
        }

        if (diagram === "timeline") {
          const labels = items.length ? items.slice(0, 5) : ["Start", "Middle", "Milestone", "Finish"];
          const yMid = height / 2;

          addText("Timeline", 0, 0, 22);
          addLine(0, yMid, width, 3);

          labels.forEach((label, i) => {
            const tickX = (width / Math.max(labels.length - 1, 1)) * i;
            addLine(tickX, yMid - 14, 3, 28);
            addText(label, Math.max(0, tickX - 26), yMid + 24, 14, DECAL_MUTED, 600);
          });
        }

        if (diagram === "gantt") {
          const rows = items.length ? items.slice(0, 5) : ["Phase 1", "Phase 2", "Phase 3"];
          addText("Schedule", 0, 0, 22);

          rows.forEach((row, i) => {
            const rowTop = 46 + i * 38;
            addText(row, 0, rowTop - 5, 14, DECAL_MUTED, 600);
            addLine(width * 0.28, rowTop + 4, width * 0.68, 2, "rgba(17,17,17,0.22)");

            const barLeft = width * (0.32 + i * 0.08);
            const barWidth = width * (0.34 - i * 0.03);
            addLine(barLeft, rowTop, barWidth, 10, accent);
          });
        }

        if (diagram === "okrs") {
          const labels = items.length >= 4 ? items.slice(0, 4) : ["Objective", "KR 1", "KR 2", "KR 3"];
          addText(labels[0], 0, 0, 22);
          addLine(0, 36, width, 3);

          labels.slice(1).forEach((label, i) => {
            const rowTop = 62 + i * 42;
            addText(label, 0, rowTop - 5, 16, DECAL_MUTED, 700);
            addLine(width * 0.22, rowTop + 5, width * 0.72, 2, "rgba(17,17,17,0.25)");
            addLine(width * 0.22, rowTop + 5, width * (0.18 + i * 0.08), 6, DECAL_INK);
          });
        }

        if (diagram === "five_s") {
          const steps = items.length >= 5 ? items.slice(0, 5) : ["Sort", "Set", "Shine", "Standardize", "Sustain"];
          const colW = width / steps.length;

          addLine(0, 0, width, 3);
          addLine(0, height - 3, width, 3);

          steps.forEach((step, i) => {
            if (i > 0) addLine(i * colW, 0, 3, height);
            addText(step, i * colW + 8, height / 2 - 12, 14, DECAL_INK, 700);
          });
        }

        if (diagram === "divider") {
          const line = new Rect({
            left: left + width / 2,
            top: top + height / 2,
            width,
            height: 4,
            fill: DECAL_LINE,
            rx: 2,
            ry: 2,
            originX: "center",
            originY: "center",
          });
          canvas.add(line);
          canvas.setActiveObject(line);
          canvas.requestRenderAll();
          recordHistory();
          scheduleSave();
          return;
        }

        if (!objects.length) return;

        const group = new Group(objects, {
          left,
          top,
          subTargetCheck: false,
          objectCaching: true,
          cornerStyle: "circle",
          borderColor: "rgba(17,17,17,0.45)",
          cornerColor: "#111111",
          transparentCorners: false,
        });

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [readOnly, recordHistory, scheduleSave],
    );

    const mergeLayoutObjects = useCallback(async (
      layoutJson: Record<string, unknown>,
      offset = { x: 40, y: 40 },
    ) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const objects = (layoutJson as { objects?: Record<string, unknown>[] }).objects ?? [];
      if (!objects.length) return;

      const fragment = JSON.parse(JSON.stringify(layoutJson)) as Record<string, unknown> & {
        objects: Record<string, unknown>[];
      };
      for (const obj of fragment.objects) {
        if (typeof obj.left === "number") obj.left = (obj.left as number) + offset.x;
        if (typeof obj.top === "number") obj.top = (obj.top as number) + offset.y;
      }

      const tempEl = document.createElement("canvas");
      const temp = new StaticCanvas(tempEl, {
        width: ARTBOARD_WIDTH,
        height: ARTBOARD_HEIGHT,
      });
      await temp.loadFromJSON(fragment);
      const clones = await Promise.all(temp.getObjects().map((obj) => obj.clone()));
      temp.dispose();
      for (const obj of clones) {
        if (obj instanceof Group && structureProp(obj, "structureId")) {
          restoreStructureGroupState(obj);
        }
        canvas.add(obj as FabricObject);
      }
      rebindStructureHandlersRef.current(canvas);
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
    }, [readOnly, recordHistory, scheduleSave]);

    const copySelected = useCallback(async () => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return false;

      let activeObject = canvas.getActiveObject();
      if (!activeObject) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) activeObject = activeObjects[0];
      }
      if (!activeObject) return false;

      const toCopy =
        activeObject instanceof ActiveSelection ? activeObject.getObjects() : [activeObject];
      if (!toCopy.length) return false;

      const clones = await Promise.all(toCopy.map((obj) => obj.clone()));
      boardObjectClipboard = clones.map((obj) => obj.toObject() as Record<string, unknown>);
      return true;
    }, [readOnly]);

    const canPasteClipboard = useCallback(() => Boolean(boardObjectClipboard?.length), []);

    const hasSelection = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return false;
      return Boolean(canvas.getActiveObject() || canvas.getActiveObjects().length);
    }, []);

    const pasteClipboard = useCallback(async () => {
      if (!boardObjectClipboard?.length) return false;
      await mergeLayoutObjects({ objects: boardObjectClipboard }, { x: 24, y: 24 });
      return true;
    }, [mergeLayoutObjects]);

    const pasteAtPoint = useCallback(
      async (normX: number, normY: number) => {
        if (!boardObjectClipboard?.length) return false;
        const left = normX * ARTBOARD_WIDTH;
        const top = normY * ARTBOARD_HEIGHT;
        let minLeft = Infinity;
        let minTop = Infinity;
        for (const obj of boardObjectClipboard) {
          if (typeof obj.left === "number") minLeft = Math.min(minLeft, obj.left);
          if (typeof obj.top === "number") minTop = Math.min(minTop, obj.top);
        }
        if (!Number.isFinite(minLeft)) minLeft = 0;
        if (!Number.isFinite(minTop)) minTop = 0;
        await mergeLayoutObjects({ objects: boardObjectClipboard }, { x: left - minLeft, y: top - minTop });
        return true;
      },
      [mergeLayoutObjects],
    );

    const deleteSelected = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;

      const topLevelRoot = (obj: FabricObject): FabricObject => {
        let root = obj;
        while (root.group) root = root.group as FabricObject;
        return root;
      };

      let activeObject = canvas.getActiveObject();
      if (!activeObject && deleteTargetRef.current) {
        activeObject = deleteTargetRef.current;
      }
      if (!activeObject) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) activeObject = activeObjects[0];
      }
      if (!activeObject) return;

      if (activeObject instanceof IText || activeObject instanceof Textbox) {
        if (activeObject.isEditing) activeObject.exitEditing();
      }

      const toRemove =
        activeObject instanceof ActiveSelection
          ? [...new Set(activeObject.getObjects().map(topLevelRoot))]
          : [topLevelRoot(activeObject)];

      if (!toRemove.length) return;

      canvas.discardActiveObject();
      for (const obj of toRemove) {
        canvas.remove(obj);
      }
      deleteTargetRef.current = null;
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
    }, [readOnly, recordHistory, scheduleSave]);

    const resetBoard = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const bg = boardFillForKey(colorKey);

      window.clearTimeout(saveTimerRef.current);
      window.clearTimeout(historyTimerRef.current);
      suppressHistoryRef.current = true;

      canvas.discardActiveObject();
      for (const obj of [...canvas.getObjects()]) {
        canvas.remove(obj);
      }
      canvas.backgroundColor = bg;
      canvas.requestRenderAll();
      deleteTargetRef.current = null;

      resetHistory(canvas);
      suppressHistoryRef.current = false;

      onSave(canvas.toJSON() as Record<string, unknown>);
    }, [colorKey, onSave, readOnly, resetHistory]);

    const selectAllObjects = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const objects = canvas.getObjects().filter((o) => o.selectable !== false && o.evented !== false);
      if (!objects.length) {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        return;
      }
      if (objects.length === 1) {
        canvas.setActiveObject(objects[0]);
      } else {
        canvas.setActiveObject(new ActiveSelection(objects, { canvas }));
      }
      canvas.requestRenderAll();
    }, [readOnly]);

    const editMarkSelected = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const active = canvas.getActiveObject();
      if (!active) return;

      let textObj: IText | Textbox | null = null;
      if (active instanceof IText || active instanceof Textbox) {
        textObj = active;
      } else if (active instanceof Group) {
        const found = active.getObjects().find((o) => o instanceof Textbox || o instanceof IText);
        textObj = found instanceof Textbox || found instanceof IText ? found : null;
      } else if (active.group instanceof Group) {
        const found = active.group.getObjects().find((o) => o instanceof Textbox || o instanceof IText);
        textObj = found instanceof Textbox || found instanceof IText ? found : null;
      }

      if (!textObj || !("enterEditing" in textObj)) return;
      if (textObj.group) canvas.setActiveObject(textObj.group);
      textObj.enterEditing();
      if (textObj instanceof IText) textObj.selectAll();
      canvas.requestRenderAll();
    }, [readOnly]);

    const applyMarkFontSize = useCallback(
      (size: BoardMarkTextSize) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const active = canvas.getActiveObject();
        if (!active) return;
        const fontSize = MARK_TEXT_SIZES[size];

        if (active instanceof IText || active instanceof Textbox || active instanceof FabricText) {
          active.set("fontSize", fontSize);
        } else if (active instanceof Group) {
          const text = active.getObjects().find((o) => o instanceof Textbox || o instanceof IText || o instanceof FabricText);
          if (text instanceof Textbox || text instanceof IText || text instanceof FabricText) {
            text.set("fontSize", fontSize);
          } else {
            return;
          }
        } else {
          return;
        }

        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [readOnly, recordHistory, scheduleSave],
    );

    const applyMarkColor = useCallback(
      (hex: string) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const selected = deleteTargetRef.current ?? canvas.getActiveObject();
        if (!selected) return;

        let root: FabricObject = selected;
        while (root.group) root = root.group;

        const isTextObject = (o: FabricObject) =>
          o instanceof IText ||
          o instanceof Textbox ||
          o instanceof FabricText ||
          o.type === "i-text" ||
          o.type === "textbox" ||
          o.type === "text";

        if (isTextObject(root)) {
          root.set("fill", hex);
        } else if (root.get("markKind") === "shape") {
          root.set({ stroke: hex, fill: `${hex}33` });
          drawColorRef.current = hex;
        } else if (root.get("markKind") === "draw" || root.type === "path") {
          root.set({ stroke: hex });
          drawColorRef.current = hex;
        } else if (root instanceof Group) {
          if (root.type === "activeSelection") {
            const text = root.getObjects().find(isTextObject);
            if (!text) return;
            text.set("fill", hex);
          } else {
            const rect = root.getObjects().find((o) => o instanceof Rect);
            const textbox = root.getObjects().find((o) => o instanceof Textbox);
            if (rect instanceof Rect && textbox instanceof Textbox) {
              rect.set({ fill: hex, stroke: hex });
            } else {
              const text = root.getObjects().find(isTextObject);
              if (!text) return;
              text.set("fill", hex);
            }
          }
        } else {
          return;
        }

        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [readOnly, recordHistory, scheduleSave],
    );

    useEffect(() => {
      if (readOnly) return;
      const onKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable)
        ) {
          return;
        }
        const canvas = fabricRef.current;
        const active = canvas?.getActiveObject() as { isEditing?: boolean } | undefined;
        if (active?.isEditing) return;
        if (!isActiveRef.current) return;
        if (drawingMode && e.key === "Escape") {
          e.preventDefault();
          exitDrawMode();
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
          e.preventDefault();
          selectAllObjects();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
          e.preventDefault();
          void copySelected();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
          e.preventDefault();
          void pasteClipboard();
          return;
        }
        if (e.key !== "Delete" && e.key !== "Backspace") return;
        if (!canvas?.getActiveObjects().length) return;
        e.preventDefault();
        deleteSelected();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [copySelected, deleteSelected, drawingMode, exitDrawMode, pasteClipboard, readOnly, redo, selectAllObjects, undo]);

    useEffect(() => {
      if (isActive) return;
      exitDrawMode();
    }, [exitDrawMode, isActive]);

    const handleQuickPick = useCallback(
      (action: BoardMarksQuickAction) => {
        if (!quickSelector) return;
        if (action === "delete") {
          deleteSelected();
          setQuickSelector(null);
          deleteTargetRef.current = null;
          return;
        }
        if (action === "copy") {
          void copySelected();
          setQuickSelector(null);
          deleteTargetRef.current = null;
          return;
        }
        const { normX, normY } = quickSelector;
        setQuickSelector(null);
        deleteTargetRef.current = null;
        if (action === "statement") addTextAtPoint(normX, normY);
        else if (action === "sticky") addStickyNoteAtPoint(normX, normY);
        else if (action === "image") onRequestImagePick?.();
        else if (action === "draw") startDrawMode();
        else if (action === "edit") editMarkSelected();
        else if (action === "paste") void pasteAtPoint(normX, normY);
      },
      [
        addStickyNoteAtPoint,
        addTextAtPoint,
        copySelected,
        deleteSelected,
        editMarkSelected,
        onRequestImagePick,
        pasteAtPoint,
        quickSelector,
        startDrawMode,
      ],
    );

    const handleShapePick = useCallback(
      (shapeType: BoardMarkShapeType) => {
        if (!quickSelector) return;
        if (quickSelector.mode === "object") {
          swapMarkShape(shapeType);
        } else {
          addShapeAtPoint(shapeType, quickSelector.normX, quickSelector.normY);
        }
        setQuickSelector(null);
        deleteTargetRef.current = null;
      },
      [addShapeAtPoint, quickSelector, swapMarkShape],
    );

    const handleStickerPick = useCallback(
      (stickerId: BoardMarkStickerId) => {
        if (!quickSelector) return;
        if (quickSelector.mode === "object") {
          swapMarkSticker(stickerId);
        } else {
          addStickerAtPoint(stickerId, quickSelector.normX, quickSelector.normY);
        }
        setQuickSelector(null);
        deleteTargetRef.current = null;
      },
      [addStickerAtPoint, quickSelector, swapMarkSticker],
    );

    useEffect(() => {
      if (!quickSelector) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          closeQuickSelector();
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [closeQuickSelector, quickSelector]);

    useEffect(() => {
      if (readOnly) return;
      const wrap = canvasWrapRef.current;
      if (!wrap) return;

      let longPressTimer: number | undefined;
      let touchStartX = 0;
      let touchStartY = 0;

      const onTouchStart = (e: TouchEvent) => {
        if (!isActiveRef.current) return;
        if (fabricRef.current?.isDrawingMode) return;
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        longPressTimer = window.setTimeout(() => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          if (navigator.vibrate) navigator.vibrate(10);
          openQuickSelectorRef.current(canvas, e, canvas.findTarget(e) ?? undefined);
        }, 420);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!longPressTimer || !e.touches[0]) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (dx * dx + dy * dy > 64) {
          window.clearTimeout(longPressTimer);
          longPressTimer = undefined;
        }
      };

      const onTouchEnd = () => {
        if (longPressTimer) window.clearTimeout(longPressTimer);
        longPressTimer = undefined;
      };

      wrap.addEventListener("touchstart", onTouchStart, { passive: true });
      wrap.addEventListener("touchmove", onTouchMove, { passive: true });
      wrap.addEventListener("touchend", onTouchEnd);
      wrap.addEventListener("touchcancel", onTouchEnd);

      return () => {
        if (longPressTimer) window.clearTimeout(longPressTimer);
        wrap.removeEventListener("touchstart", onTouchStart);
        wrap.removeEventListener("touchmove", onTouchMove);
        wrap.removeEventListener("touchend", onTouchEnd);
        wrap.removeEventListener("touchcancel", onTouchEnd);
      };
    }, [readOnly]);

    useImperativeHandle(ref, () => ({
      addText,
      addTextAt,
      addTextNormalized,
      addStickyNote,
      addStickyNoteAt,
      addDiagramOverlay,
      addImageFromUrl,
      addImageFromFile,
      mergeLayoutObjects,
      copySelected,
      pasteClipboard,
      pasteAtPoint,
      canPasteClipboard,
      hasSelection,
      deleteSelected,
      resetBoard,
      undo,
      redo,
      canUndo,
      canRedo,
      getLayoutJson: () => (fabricRef.current?.toJSON() as Record<string, unknown>) ?? {},
      addShape: (shape) => addShapeAtPoint(shape, 0.5, 0.5),
      addSticker: (sticker) => addStickerAtPoint(sticker, 0.5, 0.5),
      startDrawMode,
    }), [addDiagramOverlay, addImageFromFile, addImageFromUrl, addShapeAtPoint, addStickerAtPoint, addStickyNote, addStickyNoteAt, addText, addTextAt, addTextNormalized, canPasteClipboard, canRedo, canUndo, copySelected, deleteSelected, hasSelection, mergeLayoutObjects, pasteAtPoint, pasteClipboard, redo, resetBoard, startDrawMode, undo]);

    return (
      <div
        ref={containerRef}
        style={embedded ? { backgroundColor: boardFillForKey(colorKey) } : undefined}
        className={cn(
          "board-artboard-host h-full w-full",
          embedded
            ? "min-h-0 overflow-hidden p-0"
            : "flex min-h-[420px] items-center justify-center bg-[#ebe8e3] p-4",
        )}
      >
        <div
          ref={canvasWrapRef}
          className={cn(
            "relative h-full w-full overflow-hidden",
            embedded ? "flex items-start justify-center" : "min-h-[140px] rounded-sm shadow-[0_2px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)]",
          )}
        >
          <canvas ref={canvasElRef} />
          {!readOnly && isActive && drawingMode && (
            <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border border-stone-300/80 bg-white/95 px-3 py-1 text-[11px] font-medium text-stone-700 shadow-sm">
              Esc to finish
            </div>
          )}
          {!readOnly && isActive && quickSelector && (
            <BoardMarksQuickSelector
              x={quickSelector.x}
              y={quickSelector.y}
              mode={quickSelector.mode}
              textCapable={quickSelector.textCapable}
              shapeCapable={quickSelector.shapeCapable}
              stickerCapable={quickSelector.stickerCapable}
              canPaste={canPasteClipboard()}
              onPick={handleQuickPick}
              onClose={closeQuickSelector}
              boardColorOptions={BOARD_QUICK_PICK_COLORS}
              activeBoardFill={boardFillForKey(colorKey)}
              onBoardColorPick={onBoardColorPick}
              onElementColorPick={applyMarkColor}
              onElementSizePick={applyMarkFontSize}
              onShapePick={handleShapePick}
              onStickerPick={handleStickerPick}
            />
          )}
        </div>
      </div>
    );
  },
);
