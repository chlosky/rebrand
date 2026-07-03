import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Canvas, FabricImage, FabricText, Rect, StaticCanvas, type FabricObject } from "fabric";
import { boardFillForKey } from "@/lib/boards/colors";
import type { BoardLayoutMode } from "@/lib/boards/types";
import { cn } from "@/lib/utils";

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
  bringForward: () => void;
  sendBackward: () => void;
  getLayoutJson: () => Record<string, unknown>;
};

export type ImageFitOptions = {
  fit?: "default" | "cover";
  sendToBack?: boolean;
};

type BoardCanvasEditorProps = {
  layoutJson: Record<string, unknown>;
  colorKey: string;
  boardId: string;
  layoutMode?: BoardLayoutMode;
  readOnly?: boolean;
  /** Tighter layout when shown in grid / carousel cells */
  embedded?: boolean;
  onSave: (layout: Record<string, unknown>) => void;
};

export const BoardCanvasEditor = forwardRef<BoardCanvasHandle, BoardCanvasEditorProps>(
  function BoardCanvasEditor({ layoutJson, colorKey, boardId, layoutMode = "vision", readOnly = false, embedded = false, onSave }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const saveTimerRef = useRef<number>();
    const loadedBoardRef = useRef<string | null>(null);

    const scheduleSave = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        onSave(canvas.toJSON() as Record<string, unknown>);
      }, 700);
    }, [onSave, readOnly]);

    const fitCanvas = useCallback((canvas: Canvas) => {
      const container = containerRef.current;
      if (!container) return;
      const pad = embedded ? 8 : 32;
      const maxW = container.clientWidth - pad;
      const maxH = container.clientHeight - pad;
      const scale = Math.min(maxW / ARTBOARD_WIDTH, maxH / ARTBOARD_HEIGHT, 1);
      const zoom = scale > 0 ? scale : 0.5;
      canvas.setZoom(zoom);
      canvas.setDimensions({ width: ARTBOARD_WIDTH * zoom, height: ARTBOARD_HEIGHT * zoom });
      canvas.requestRenderAll();
    }, [embedded]);

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

      if (!readOnly) {
        canvas.on("object:modified", scheduleSave);
        canvas.on("object:added", scheduleSave);
        canvas.on("object:removed", scheduleSave);
      }

      return () => {
        window.removeEventListener("resize", onResize);
        window.clearTimeout(saveTimerRef.current);
        canvas.dispose();
        fabricRef.current = null;
        loadedBoardRef.current = null;
      };
    }, [colorKey, fitCanvas, readOnly, scheduleSave]);

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
        });
      } else {
        canvas.clear();
        canvas.backgroundColor = bg;
        canvas.requestRenderAll();
      }
    }, [boardId, colorKey, layoutJson]);

    const addText = useCallback((text = "Your statement") => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const t = new FabricText(text, {
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
    }, [readOnly]);

    const addStickyNote = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const w = 280;
      const h = 200;
      const rect = new Rect({
        left: ARTBOARD_WIDTH * 0.1,
        top: ARTBOARD_HEIGHT * 0.35,
        width: w,
        height: h,
        fill: "#FFF9C4",
        stroke: "#E8D44D",
        strokeWidth: 1,
        rx: 8,
        ry: 8,
      });
      const label = new FabricText("Next step…", {
        left: (rect.left ?? 0) + 16,
        top: (rect.top ?? 0) + 16,
        fontSize: 22,
        fontFamily: "system-ui, sans-serif",
        fill: "#171717",
      });
      canvas.add(rect, label);
      canvas.setActiveObject(label);
      canvas.requestRenderAll();
    }, [readOnly]);

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
          left,
          top,
          width: w,
          height: h,
          fill,
          stroke,
          strokeWidth: 1,
          rx: 8,
          ry: 8,
        });
        const label = new FabricText(text, {
          left: left + 14,
          top: top + 14,
          fontSize: 20,
          fontFamily: "system-ui, sans-serif",
          fill: "#171717",
          width: w - 28,
        });
        canvas.add(rect, label);
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
    }, [readOnly]);

    const bringForward = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const active = canvas.getActiveObject();
      if (active) {
        canvas.bringObjectForward(active);
        canvas.requestRenderAll();
        scheduleSave();
      }
    }, [readOnly, scheduleSave]);

    const sendBackward = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const active = canvas.getActiveObject();
      if (active) {
        canvas.sendObjectBackwards(active);
        canvas.requestRenderAll();
        scheduleSave();
      }
    }, [readOnly, scheduleSave]);

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
      bringForward,
      sendBackward,
      getLayoutJson: () => (fabricRef.current?.toJSON() as Record<string, unknown>) ?? {},
    }), [addDiagramOverlay, addImageFromFile, addImageFromUrl, addStickyNote, addStickyNoteAt, addText, addTextAt, addTextNormalized, bringForward, deleteSelected, mergeLayoutObjects, sendBackward]);

    return (
      <div
        ref={containerRef}
        className={cn(
          "board-artboard-host flex h-full w-full items-center justify-center bg-[#ebe8e3]",
          embedded ? "min-h-0 p-1" : "min-h-[420px] p-4",
        )}
      >
        <div className="relative h-full w-full min-h-[140px] overflow-hidden rounded-sm shadow-[0_2px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)]">
          <canvas ref={canvasElRef} />
        </div>
      </div>
    );
  },
);
