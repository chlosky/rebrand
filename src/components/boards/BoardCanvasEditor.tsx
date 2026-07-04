import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Canvas, FabricImage, FabricText, Group, IText, Rect, StaticCanvas, Textbox, ActiveSelection, type FabricObject } from "fabric";
import { BOARD_QUICK_PICK_COLORS, boardFillForKey } from "@/lib/boards/colors";
import type { BoardLayoutMode } from "@/lib/boards/types";
import { cn } from "@/lib/utils";
import { BoardMarksQuickSelector, type BoardMarksQuickAction } from "@/components/boards/BoardMarksQuickSelector";

export const ARTBOARD_WIDTH = 1080;
export const ARTBOARD_HEIGHT = 1350;

const DECAL_INK = "#111111";
const DECAL_MUTED = "rgba(17,17,17,0.58)";
const DECAL_LINE = "rgba(17,17,17,0.82)";

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
  | "five_s";

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
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getLayoutJson: () => Record<string, unknown>;
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
};

const MARK_COLOR_CYCLE = [
  { text: "#171717", note: { fill: "#FFF9C4", stroke: "#E8D44D" } },
  { text: "#171717", note: { fill: "#FCE7F3", stroke: "#F472B6" } },
  { text: "#171717", note: { fill: "#DBEAFE", stroke: "#60A5FA" } },
  { text: "#171717", note: { fill: "#DCFCE7", stroke: "#4ADE80" } },
  { text: "#2563EB" },
  { text: "#DC2626" },
  { text: "#FFFFFF" },
];

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
    const [quickSelector, setQuickSelector] = useState<QuickSelectorState | null>(null);
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

    const closeQuickSelector = useCallback(() => setQuickSelector(null), []);

    const openQuickSelectorFromEvent = useCallback((canvas: Canvas, e: Event, target?: FabricObject) => {
      if (readOnly || !isActiveRef.current) return;
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
        canvas.setActiveObject(root);
        const objects = canvas.getObjects();
        if (objects[objects.length - 1] !== root) {
          canvas.bringObjectToFront(root);
        }
        canvas.requestRenderAll();
      }

      setQuickSelector({
        x: clientX - rect.left,
        y: clientY - rect.top,
        normX: Math.min(1, Math.max(0, pointer.x / ARTBOARD_WIDTH)),
        normY: Math.min(1, Math.max(0, pointer.y / ARTBOARD_HEIGHT)),
        mode: target ? "object" : "empty",
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
        canvas.on("object:modified", onHistoryDebounced);
        canvas.on("object:added", onHistoryImmediate);
        canvas.on("object:removed", onHistoryImmediate);
        canvas.on("text:changed", onHistoryDebounced);
        canvas.on("editing:exited", onHistoryDebounced);
        canvas.on("mouse:down", (opt) => {
          const e = opt.e as MouseEvent;
          const isLeftEmpty = e.button === 0 && !opt.target && !e.ctrlKey && !e.metaKey && !e.shiftKey;
          if (isLeftEmpty) {
            if (!isActiveRef.current) return;
            e.preventDefault();
            e.stopPropagation();
            openQuickSelectorRef.current(canvas, e, undefined);
            return;
          }

          const target = opt.target;
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
          canvas.requestRenderAll();
          resetHistory(canvas);
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
        fill: "#171717",
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
        fontSize: 42,
        fontFamily: "system-ui, sans-serif",
        fill: "#171717",
        fontWeight: "600",
        originX: "center",
        originY: "center",
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
        fill: "#171717",
        fontWeight: "600",
        originX: "center",
        originY: "center",
      });
      canvas.add(t);
      canvas.requestRenderAll();
    }, [readOnly]);

    const addTextNormalized = useCallback(
      (text: string, x: number, y: number, fontSize = 36, fill = "#171717") => {
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
          const rows = items.length ? items.slice(0, 6) : ["Task", "Task", "Task", "Task"];
          addText("Checklist", 0, 0, 22);

          rows.forEach((label, i) => {
            const rowTop = 44 + i * 42;
            objects.push(
              new Rect({
                left: 0,
                top: rowTop,
                width: 18,
                height: 18,
                fill: "transparent",
                stroke: DECAL_LINE,
                strokeWidth: 2,
                rx: 2,
                ry: 2,
                selectable: false,
                evented: false,
              }),
            );
            addLine(34, rowTop + 8, width - 34, 2, "rgba(17,17,17,0.42)");
            if (label && label !== "Task") addText(label, 34, rowTop - 7, 16, DECAL_MUTED, 600);
          });
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
          const labels = items.length >= 4 ? items.slice(0, 4) : ["Do First", "Schedule", "Delegate", "Drop"];

          addLine(width / 2, 0, 3, height);
          addLine(0, height / 2, width, 3);

          labels.forEach((label, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            addText(label, col * (width / 2) + 18, row * (height / 2) + 18, 18);
          });
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
        canvas.add(obj as FabricObject);
      }
      canvas.requestRenderAll();
    }, [readOnly]);

    const deleteSelected = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const active = canvas.getActiveObjects() as FabricObject[];
      if (!active.length) return;
      active.forEach((o) => canvas.remove(o));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
    }, [readOnly, recordHistory, scheduleSave]);

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
      canvas.setActiveObject(textObj);
      textObj.enterEditing();
      if (textObj instanceof IText) textObj.selectAll();
      canvas.requestRenderAll();
    }, [readOnly]);

    const cycleMarkColor = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const active = canvas.getActiveObject();
      if (!active) return;

      let root: FabricObject = active;
      while (root.group) root = root.group;

      if (root instanceof Group) {
        const rect = root.getObjects().find((o) => o instanceof Rect);
        const text = root.getObjects().find((o) => o instanceof Textbox || o instanceof IText);
        if (!(rect instanceof Rect)) return;
        const noteColors = MARK_COLOR_CYCLE.filter((c) => c.note);
        const currentFill = String(rect.fill ?? "");
        let idx = noteColors.findIndex((c) => c.note!.fill === currentFill);
        const next = noteColors[(idx + 1) % noteColors.length];
        if (next.note) {
          rect.set({ fill: next.note.fill, stroke: next.note.stroke });
        }
        if (text instanceof Textbox || text instanceof IText) {
          text.set("fill", next.text);
        }
      } else if (active instanceof IText || active instanceof Textbox || active instanceof FabricText) {
        const currentFill = String(active.fill ?? "#171717").toLowerCase();
        let idx = MARK_COLOR_CYCLE.findIndex((c) => c.text?.toLowerCase() === currentFill);
        const next = MARK_COLOR_CYCLE[(idx + 1) % MARK_COLOR_CYCLE.length];
        if (next.text) active.set("fill", next.text);
      } else {
        return;
      }

      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
    }, [readOnly, recordHistory, scheduleSave]);

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
        if (e.key !== "Delete" && e.key !== "Backspace") return;
        if (!canvas?.getActiveObjects().length) return;
        e.preventDefault();
        deleteSelected();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [readOnly, deleteSelected, redo, selectAllObjects, undo]);

    const handleQuickPick = useCallback(
      (action: BoardMarksQuickAction) => {
        if (!quickSelector) return;
        const { normX, normY } = quickSelector;
        setQuickSelector(null);
        if (action === "statement") addTextAtPoint(normX, normY);
        else if (action === "sticky") addStickyNoteAtPoint(normX, normY);
        else if (action === "image") onRequestImagePick?.();
        else if (action === "edit") editMarkSelected();
        else if (action === "color") cycleMarkColor();
        else if (action === "delete") deleteSelected();
      },
      [
        addStickyNoteAtPoint,
        addTextAtPoint,
        cycleMarkColor,
        deleteSelected,
        editMarkSelected,
        onRequestImagePick,
        quickSelector,
      ],
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
      deleteSelected,
      undo,
      redo,
      canUndo,
      canRedo,
      getLayoutJson: () => (fabricRef.current?.toJSON() as Record<string, unknown>) ?? {},
    }), [addDiagramOverlay, addImageFromFile, addImageFromUrl, addStickyNote, addStickyNoteAt, addText, addTextAt, addTextNormalized, canRedo, canUndo, deleteSelected, mergeLayoutObjects, redo, undo]);

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
          {!readOnly && isActive && quickSelector && (
            <BoardMarksQuickSelector
              x={quickSelector.x}
              y={quickSelector.y}
              mode={quickSelector.mode}
              onPick={handleQuickPick}
              onClose={closeQuickSelector}
              boardColorOptions={BOARD_QUICK_PICK_COLORS}
              activeBoardFill={boardFillForKey(colorKey)}
              onBoardColorPick={onBoardColorPick}
            />
          )}
        </div>
      </div>
    );
  },
);
