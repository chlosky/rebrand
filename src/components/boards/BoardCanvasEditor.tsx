import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Canvas, FabricImage, FabricText, Group, IText, Rect, StaticCanvas, Textbox, type FabricObject } from "fabric";
import { boardFillForKey } from "@/lib/boards/colors";
import type { BoardLayoutMode } from "@/lib/boards/types";
import { cn } from "@/lib/utils";
import { BoardMarksQuickSelector, type BoardMarksQuickAction } from "@/components/boards/BoardMarksQuickSelector";

export const ARTBOARD_WIDTH = 1080;
export const ARTBOARD_HEIGHT = 1350;

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
  onSave: (layout: Record<string, unknown>) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
};

export const BoardCanvasEditor = forwardRef<BoardCanvasHandle, BoardCanvasEditorProps>(
  function BoardCanvasEditor({ layoutJson, colorKey, boardId, layoutMode = "vision", readOnly = false, embedded = false, cellFit = "contain", viewZoom = "fit", onSave, onHistoryChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasWrapRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const saveTimerRef = useRef<number>();
    const historyTimerRef = useRef<number>();
    const loadedBoardRef = useRef<string | null>(null);
    const restoringHistoryRef = useRef(false);
    const historyRef = useRef<{ snapshots: string[]; index: number }>({ snapshots: [], index: -1 });
    const onHistoryChangeRef = useRef(onHistoryChange);
    const [quickSelector, setQuickSelector] = useState<QuickSelectorState | null>(null);

    onHistoryChangeRef.current = onHistoryChange;

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

    const recordHistory = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly || restoringHistoryRef.current) return;
      window.clearTimeout(historyTimerRef.current);
      historyTimerRef.current = window.setTimeout(() => {
        const json = snapshotCanvas(canvas);
        const h = historyRef.current;
        if (h.snapshots[h.index] === json) return;
        h.snapshots = h.snapshots.slice(0, h.index + 1);
        h.snapshots.push(json);
        if (h.snapshots.length > 40) {
          h.snapshots.shift();
        }
        h.index = h.snapshots.length - 1;
        notifyHistoryChange();
      }, 250);
    }, [notifyHistoryChange, readOnly, snapshotCanvas]);

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
      const h = historyRef.current;
      if (h.index <= 0) return;
      void applyHistorySnapshot(h.index - 1);
    }, [applyHistorySnapshot]);

    const redo = useCallback(() => {
      const h = historyRef.current;
      if (h.index >= h.snapshots.length - 1) return;
      void applyHistorySnapshot(h.index + 1);
    }, [applyHistorySnapshot]);

    const canUndo = useCallback(() => historyRef.current.index > 0, []);
    const canRedo = useCallback(
      () => historyRef.current.index >= 0 && historyRef.current.index < historyRef.current.snapshots.length - 1,
      [],
    );

    const closeQuickSelector = useCallback(() => setQuickSelector(null), []);

    const openQuickSelectorFromEvent = useCallback((canvas: Canvas, e: Event, target?: FabricObject) => {
      if (readOnly) return;
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
        const onHistoryEvent = () => {
          recordHistory();
          scheduleSave();
        };
        canvas.on("object:modified", onHistoryEvent);
        canvas.on("object:added", onHistoryEvent);
        canvas.on("object:removed", onHistoryEvent);
        canvas.on("text:changed", onHistoryEvent);
        canvas.on("editing:exited", onHistoryEvent);
        canvas.on("mouse:down", (opt) => {
          const e = opt.e as MouseEvent;
          const isLeftEmpty = e.button === 0 && !opt.target && !e.ctrlKey && !e.metaKey && !e.shiftKey;
          if (isLeftEmpty) {
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
            canvas.bringObjectToFront(root);
            canvas.requestRenderAll();
            recordHistory();
            scheduleSave();
          }
        });

        onContextMenu = (e: MouseEvent) => {
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
    }, [colorKey, embedded, fitCanvas, readOnly, recordHistory, scheduleSave]);

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
        accent = "#2563EB",
      ) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const left = x * ARTBOARD_WIDTH;
        const top = y * ARTBOARD_HEIGHT;
        const width = w * ARTBOARD_WIDTH;
        const height = h * ARTBOARD_HEIGHT;

        const frame = new Rect({
          left,
          top,
          width,
          height,
          fill: "rgba(255,255,255,0.72)",
          stroke: accent,
          strokeWidth: 2,
          rx: 10,
          ry: 10,
        });
        canvas.add(frame);

        if (diagram === "eisenhower") {
          const labels = items.length >= 4 ? items.slice(0, 4) : ["Do first", "Schedule", "Delegate", "Drop"];
          const hw = width / 2 - 6;
          const hh = height / 2 - 6;
          labels.forEach((label, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cell = new Rect({
              left: left + 8 + col * (hw + 4),
              top: top + 8 + row * (hh + 4),
              width: hw,
              height: hh,
              fill: i === 0 ? `${accent}18` : "#ffffffcc",
              stroke: "#e5e5e5",
              strokeWidth: 1,
              rx: 6,
              ry: 6,
            });
            const t = new FabricText(label, {
              left: cell.left! + 8,
              top: cell.top! + 8,
              fontSize: 16,
              fontFamily: "system-ui, sans-serif",
              fill: "#404040",
              fontWeight: "600",
              width: hw - 16,
            });
            canvas.add(cell, t);
          });
        } else if (diagram === "checklist") {
          const rows = items.length ? items.slice(0, 8) : ["Morning reset", "Afternoon block", "Evening close"];
          const rowH = Math.min(44, (height - 24) / rows.length);
          rows.forEach((item, i) => {
            const rowTop = top + 12 + i * rowH;
            const box = new Rect({
              left: left + 12,
              top: rowTop,
              width: 18,
              height: 18,
              fill: "#fff",
              stroke: accent,
              strokeWidth: 1.5,
              rx: 3,
              ry: 3,
            });
            const t = new FabricText(item, {
              left: left + 38,
              top: rowTop - 2,
              fontSize: 18,
              fontFamily: "system-ui, sans-serif",
              fill: "#262626",
              width: width - 50,
            });
            canvas.add(box, t);
          });
        } else if (diagram === "zones") {
          const zones = items.length ? items.slice(0, 3) : ["Zone A", "Zone B", "Zone C"];
          const zoneH = height / zones.length;
          zones.forEach((zone, i) => {
            const zTop = top + i * zoneH;
            const band = new Rect({
              left: left + 8,
              top: zTop + 4,
              width: width - 16,
              height: zoneH - 8,
              fill: i === 1 ? `${accent}22` : "#ffffffaa",
              stroke: "#e5e5e5",
              strokeWidth: 1,
              rx: 6,
              ry: 6,
            });
            const t = new FabricText(zone, {
              left: left + 20,
              top: zTop + zoneH / 2 - 10,
              fontSize: 20,
              fontFamily: "system-ui, sans-serif",
              fill: "#171717",
              fontWeight: "600",
            });
            canvas.add(band, t);
          });
        } else if (diagram === "timeline") {
          const tasks = items.length ? items.slice(0, 5) : ["Phase 1", "Phase 2", "Milestone"];
          const rowH = Math.min(48, (height - 20) / tasks.length);
          tasks.forEach((task, i) => {
            const rowTop = top + 16 + i * rowH;
            const barW = width * (0.55 - i * 0.08);
            const bar = new Rect({
              left: left + width * 0.22 + i * (width * 0.06),
              top: rowTop + 10,
              width: barW,
              height: 14,
              fill: accent,
              opacity: 0.75,
              rx: 7,
              ry: 7,
            });
            const t = new FabricText(task, {
              left: left + 12,
              top: rowTop,
              fontSize: 16,
              fontFamily: "system-ui, sans-serif",
              fill: "#404040",
              fontWeight: "500",
            });
            canvas.add(bar, t);
          });
        } else if (diagram === "kanban") {
          const cols = items.length >= 2 ? items.slice(0, 4) : ["Backlog", "To Do", "Doing", "Done"];
          const colW = (width - 20) / cols.length;
          cols.forEach((title, i) => {
            const cx = left + 6 + i * (colW + 4);
            const header = new Rect({
              left: cx,
              top: top + 8,
              width: colW,
              height: 26,
              fill: accent,
              opacity: 0.88,
              rx: 5,
              ry: 5,
            });
            const ht = new FabricText(title, {
              left: cx + 6,
              top: top + 13,
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
              fill: "#ffffff",
              fontWeight: "600",
            });
            canvas.add(header, ht);
            for (let c = 0; c < 2; c++) {
              const card = new Rect({
                left: cx,
                top: top + 40 + c * 48,
                width: colW,
                height: 40,
                fill: "#ffffff",
                stroke: "#e5e5e5",
                strokeWidth: 1,
                rx: 4,
                ry: 4,
              });
              canvas.add(card);
            }
          });
        } else if (diagram === "okrs") {
          const krs = items.length >= 2 ? items.slice(1, 4) : ["Key result 1", "Key result 2", "Key result 3"];
          const objective = items[0] ?? "Objective";
          const objBox = new Rect({
            left: left + 8,
            top: top + 8,
            width: width - 16,
            height: 44,
            fill: `${accent}22`,
            stroke: accent,
            strokeWidth: 1.5,
            rx: 6,
            ry: 6,
          });
          const objText = new FabricText(objective, {
            left: left + 16,
            top: top + 20,
            fontSize: 17,
            fontFamily: "system-ui, sans-serif",
            fill: "#171717",
            fontWeight: "600",
            width: width - 32,
          });
          canvas.add(objBox, objText);
          krs.forEach((kr, i) => {
            const rowTop = top + 60 + i * 36;
            const track = new Rect({
              left: left + 12,
              top: rowTop + 18,
              width: width - 24,
              height: 8,
              fill: "#e5e5e5",
              rx: 4,
              ry: 4,
            });
            const fill = new Rect({
              left: left + 12,
              top: rowTop + 18,
              width: (width - 24) * (0.25 + i * 0.1),
              height: 8,
              fill: accent,
              opacity: 0.7,
              rx: 4,
              ry: 4,
            });
            const t = new FabricText(kr, {
              left: left + 12,
              top: rowTop,
              fontSize: 14,
              fontFamily: "system-ui, sans-serif",
              fill: "#404040",
            });
            canvas.add(track, fill, t);
          });
        } else if (diagram === "five_s") {
          const steps = items.length >= 5 ? items.slice(0, 5) : ["Sort", "Set", "Shine", "Standardize", "Sustain"];
          const stepH = (height - 16) / steps.length;
          steps.forEach((step, i) => {
            const rowTop = top + 8 + i * stepH;
            const band = new Rect({
              left: left + 8,
              top: rowTop + 2,
              width: width - 16,
              height: stepH - 4,
              fill: i === 2 ? `${accent}18` : "#ffffffbb",
              stroke: "#e5e5e5",
              strokeWidth: 1,
              rx: 5,
              ry: 5,
            });
            const num = new FabricText(String(i + 1), {
              left: left + 16,
              top: rowTop + stepH / 2 - 8,
              fontSize: 14,
              fontFamily: "system-ui, sans-serif",
              fill: accent,
              fontWeight: "700",
            });
            const t = new FabricText(step, {
              left: left + 36,
              top: rowTop + stepH / 2 - 9,
              fontSize: 15,
              fontFamily: "system-ui, sans-serif",
              fill: "#262626",
              fontWeight: "500",
            });
            canvas.add(band, num, t);
          });
        } else if (diagram === "gantt") {
          const tasks = items.length ? items.slice(0, 6) : ["Kickoff", "Build", "Ship"];
          const rowH = Math.min(40, (height - 16) / tasks.length);
          tasks.forEach((task, i) => {
            const rowTop = top + 10 + i * rowH;
            const t = new FabricText(task, {
              left: left + 8,
              top: rowTop + 4,
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
              fill: "#525252",
              width: width * 0.28,
            });
            const barLeft = left + width * 0.3 + i * (width * 0.05);
            const barW = width * (0.45 - i * 0.06);
            const bar = new Rect({
              left: barLeft,
              top: rowTop + 6,
              width: barW,
              height: 12,
              fill: accent,
              opacity: 0.8,
              rx: 6,
              ry: 6,
            });
            canvas.add(t, bar);
          });
        }

        canvas.requestRenderAll();
      },
      [readOnly],
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
    }, [readOnly, deleteSelected, redo, undo]);

    const handleQuickPick = useCallback(
      (action: BoardMarksQuickAction) => {
        if (!quickSelector) return;
        const { normX, normY } = quickSelector;
        setQuickSelector(null);
        if (action === "statement") addTextAtPoint(normX, normY);
        else if (action === "sticky") addStickyNoteAtPoint(normX, normY);
        else if (action === "edit") editMarkSelected();
        else if (action === "color") cycleMarkColor();
        else if (action === "delete") deleteSelected();
      },
      [addStickyNoteAtPoint, addTextAtPoint, cycleMarkColor, deleteSelected, editMarkSelected, quickSelector],
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
          {!readOnly && quickSelector && (
            <BoardMarksQuickSelector
              x={quickSelector.x}
              y={quickSelector.y}
              mode={quickSelector.mode}
              onPick={handleQuickPick}
              onClose={closeQuickSelector}
            />
          )}
        </div>
      </div>
    );
  },
);
