import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { Canvas, Circle, FabricImage, FabricObject, FabricText, Group, IText, Line, Path, PencilBrush, Polygon, Rect, StaticCanvas, Textbox, Triangle, ActiveSelection, type FabricObject as FabricObjectType } from "fabric";
import { artboardSizeForOrientation, withArtboardMeta } from "@/lib/boards/artboard";
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
  type BoardMarkTextAlign,
  type BoardMarkTextFont,
  BOARD_MARK_FONT_OPTIONS,
} from "@/components/boards/BoardMarksQuickSelector";
import { PLOT_STRUCTURES, STRUCTURE_DECAL_SIZE } from "@/components/boards/BoardPlottingWorkbench";

export const ARTBOARD_WIDTH = 1080;
export const ARTBOARD_HEIGHT = 1350;

type FabricCanvasInternals = Canvas & { destroyed?: boolean; contextTop?: CanvasRenderingContext2D };

function fabricCanvasRenderable(canvas: Canvas | null | undefined): canvas is Canvas {
  if (!canvas) return false;
  const internals = canvas as FabricCanvasInternals;
  if (internals.destroyed) return false;
  if (!canvas.lowerCanvasEl?.getContext("2d") || !canvas.upperCanvasEl?.getContext("2d")) return false;
  if (!internals.contextTop) return false;
  return true;
}

function requestFabricRender(canvas: Canvas) {
  if (!fabricCanvasRenderable(canvas)) return;
  try {
    canvas.requestRenderAll();
  } catch (err) {
    console.warn("fabric render skipped", err);
  }
}

function boardLayoutLoadKey(boardId: string, colorKey: string, layoutJson: unknown): string {
  const objects = (layoutJson as { objects?: unknown[] })?.objects;
  const count = Array.isArray(objects) ? objects.length : 0;
  return `${boardId}:${colorKey}:${count}`;
}

/** Nudge an object back inside the real artboard so it can reach the true edges without clipping. */
function keepObjectFullyInsideArtboard(
  obj: FabricObject,
  artboardWidth: number,
  artboardHeight: number,
) {
  obj.setCoords();
  const bounds = obj.getBoundingRect();
  const tooWide = bounds.width > artboardWidth;
  const tooTall = bounds.height > artboardHeight;
  let dx = 0;
  let dy = 0;
  if (!tooWide) {
    if (bounds.left < 0) dx = -bounds.left;
    else if (bounds.left + bounds.width > artboardWidth) dx = artboardWidth - (bounds.left + bounds.width);
  }
  if (!tooTall) {
    if (bounds.top < 0) dy = -bounds.top;
    else if (bounds.top + bounds.height > artboardHeight) dy = artboardHeight - (bounds.top + bounds.height);
  }
  if (dx || dy) {
    obj.set({ left: (obj.left ?? 0) + dx, top: (obj.top ?? 0) + dy });
    obj.setCoords();
  }
}

const DECAL_INK = "#111111";
const DECAL_MUTED = "rgba(17,17,17,0.58)";
const DECAL_LINE = "rgba(17,17,17,0.82)";
const LINE_DASH_PATTERN = [16, 10];

let boardObjectClipboard: Record<string, unknown>[] | null = null;

const STRUCTURE_ROW_H = 38;
const STRUCTURE_FONT = "system-ui, sans-serif";

const CALENDAR_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const CALENDAR_WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

const CALENDAR_MIN_W = 520;
const CALENDAR_MIN_H = 360;
const NUMBERED_LIST_MIN_W = 280;
const NUMBERED_LIST_MIN_H = 180;
const STRUCTURE_INLINE_LABEL_W = 200;
const STRUCTURE_INLINE_LABEL_GAP = 10;
const EISENHOWER_MIN_W = 420;
const EISENHOWER_MIN_H = 320;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function firstWeekdayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex, 1).getDay();
}

function clampCalendarMonth(month: number): number {
  if (!Number.isFinite(month)) return new Date().getMonth();
  return Math.max(0, Math.min(11, Math.round(month)));
}

function clampCalendarYear(year: number): number {
  if (!Number.isFinite(year)) return new Date().getFullYear();
  return Math.max(1900, Math.min(2200, Math.round(year)));
}

const MARK_TEXT_SIZES: Record<BoardMarkTextSize, number> = {
  S: 16,
  M: 22,
  L: 32,
  XL: 42,
};

const MARK_TEXT_FONTS: Record<BoardMarkTextFont, string> = Object.fromEntries(
  BOARD_MARK_FONT_OPTIONS.map((option) => [option.id, option.fontFamily]),
) as Record<BoardMarkTextFont, string>;

const MARK_TEXT_FILL = "#000000";
const MARK_SHAPE_STROKE = "#111111";
const MARK_DRAW_WIDTH = 4;

const STICKY_PADDING = 16;
const STICKY_DEFAULT_W = 280;
const STICKY_DEFAULT_H = 200;
const STICKY_MIN_W = 140;
const STICKY_MIN_H = 100;

const PARCHMENT_PADDING = 18;
const PARCHMENT_DEFAULT_W = 280;
const PARCHMENT_DEFAULT_H = 200;
const PARCHMENT_MIN_W = 140;
const PARCHMENT_MIN_H = 100;
const PARCHMENT_BASE_W = 280;
const PARCHMENT_BASE_H = 200;
const PARCHMENT_DEFAULT_FILL = "#EDE4D3";
const PARCHMENT_FONT = "Georgia, 'Times New Roman', serif";

/** Fabric default — blue border + square handles. */
const FABRIC_CONTROL_STYLE = {
  cornerStyle: "rect" as const,
  borderColor: "rgb(102, 153, 255)",
  cornerColor: "rgb(102, 153, 255)",
  transparentCorners: false,
  hasControls: true,
  hasBorders: true,
  cornerSize: 18,
  touchCornerSize: 40,
  padding: 8,
  borderScaleFactor: 2,
};

function applyBoardFabricControls(obj: FabricObject) {
  obj.set({
    ...FABRIC_CONTROL_STYLE,
    selectable: true,
    evented: true,
    hasControls: true,
    hasBorders: true,
  });
  obj.setCoords();
  return obj;
}

function applyStickyFabricControls(obj: Group | Rect) {
  applyBoardFabricControls(obj);
  obj.set({
    lockUniScaling: false,
    objectCaching: false,
    markKind: "sticky",
  });

  obj.setCoords();

  return obj;
}

const TEXT_CAPABLE_SHAPES = new Set<BoardMarkShapeType>();

for (const prop of [
  "structureId",
  "structureType",
  "structureRole",
  "structureWidth",
  "structureHeight",
  "structureColor",
  "rowIndex",
  "columnIndex",
  "itemIndex",
  "checked",
  "markKind",
  "shapeType",
  "stickerId",
  "textCapable",
  "stickyWidth",
  "stickyHeight",
  "parchmentColor",
  "parchmentWidth",
  "parchmentHeight",
  "shapeWidth",
  "shapeHeight",
  "calendarMonth",
  "calendarYear",
  "calendarCellIndex",
  "calendarDayNumber",
  "calendarDateKey",
  "imageCornerRadius",
  "frameShapeType",
  "frameWidth",
  "frameHeight",
  "framePhotoWidth",
  "framePhotoHeight",
  "lineDashed",
  "quadrantColor",
  "foundObjectType",
] as const) {
  if (!FabricObject.customProperties.includes(prop)) {
    FabricObject.customProperties.push(prop);
  }
}

function structureProp(obj: FabricObjectType, key: string): unknown {
  return typeof obj.get === "function" ? obj.get(key) : undefined;
}

function findEditableTextInGroup(group: Group): Textbox | IText | null {
  const found = group.getObjects().find((o) => o instanceof Textbox || o instanceof IText);
  return found instanceof Textbox || found instanceof IText ? found : null;
}

const IMAGE_CLIP_FRAME_SHAPES = new Set<BoardMarkShapeType>(["rect", "circle", "heart", "star", "hexagon", "diamond"]);
const IMAGE_FRAME_SHAPES = new Set<BoardMarkShapeType>([...IMAGE_CLIP_FRAME_SHAPES, "photo"]);

function polaroidMetrics(photoW: number, photoH: number) {
  const border = Math.max(8, Math.min(photoW, photoH) * 0.08);
  return {
    photoW,
    photoH,
    border,
    totalW: photoW + border * 2,
    totalH: photoH + border * 2,
  };
}

function imageFrameInnerSize(group: Group): { w: number; h: number } {
  if (group.get("frameShapeType") === "photo") {
    return {
      w: Number(group.get("framePhotoWidth") ?? 200),
      h: Number(group.get("framePhotoHeight") ?? 200),
    };
  }
  return {
    w: Number(group.get("frameWidth") ?? group.width ?? 200),
    h: Number(group.get("frameHeight") ?? group.height ?? 200),
  };
}

function prepareImageForPolaroidFrame(img: FabricImage, m: ReturnType<typeof polaroidMetrics>) {
  const iw = img.width ?? 1;
  const ih = img.height ?? 1;
  const coverScale = Math.max(m.photoW / iw, m.photoH / ih);
  const clip = new Rect({
    width: m.photoW / coverScale,
    height: m.photoH / coverScale,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  img.set({
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    angle: 0,
    scaleX: coverScale,
    scaleY: coverScale,
    clipPath: clip,
    markKind: "frame-image",
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    imageCornerRadius: 0,
  });
}

function createPolaroidImageFrameGroup(
  image: FabricImage,
  photoW: number,
  photoH: number,
  center: { x: number; y: number },
  angle: number,
): Group {
  const m = polaroidMetrics(photoW, photoH);
  prepareImageForPolaroidFrame(image, m);

  const backing = new Rect({
    width: m.totalW,
    height: m.totalH,
    fill: "#FFFFFF",
    stroke: "rgba(17,17,17,0.08)",
    strokeWidth: 1,
    shadow: {
      color: "rgba(0,0,0,0.14)",
      blur: 12,
      offsetX: 1,
      offsetY: 4,
    },
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    markKind: "frame-backing",
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
  });

  const inset = new Rect({
    width: m.photoW,
    height: m.photoH,
    fill: "transparent",
    stroke: "rgba(0,0,0,0.09)",
    strokeWidth: 1,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    markKind: "frame-inset",
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
  });

  return new Group([backing, image, inset], {
    left: center.x,
    top: center.y,
    originX: "center",
    originY: "center",
    width: m.totalW,
    height: m.totalH,
    angle,
    markKind: "image-frame",
    frameShapeType: "photo",
    frameWidth: m.totalW,
    frameHeight: m.totalH,
    framePhotoWidth: m.photoW,
    framePhotoHeight: m.photoH,
    subTargetCheck: false,
    interactive: true,
    objectCaching: false,
  });
}

function createClipImageFrameGroup(
  image: FabricImage,
  frameW: number,
  frameH: number,
  shapeType: BoardMarkShapeType,
  center: { x: number; y: number },
  angle: number,
): Group {
  prepareImageForFrame(image, frameW, frameH);
  return new Group([image], {
    left: center.x,
    top: center.y,
    originX: "center",
    originY: "center",
    width: frameW,
    height: frameH,
    angle,
    clipPath: createImageFrameClipShape(shapeType, frameW, frameH),
    markKind: "image-frame",
    frameShapeType: shapeType,
    frameWidth: frameW,
    frameHeight: frameH,
    subTargetCheck: false,
    interactive: true,
    objectCaching: false,
  });
}

function imageFrameGroupFromTarget(obj: FabricObject): Group | null {
  let current: FabricObject = obj;
  while (current.group) current = current.group as FabricObject;
  if (current instanceof Group && current.get("markKind") === "image-frame") return current;
  if (
    obj instanceof FabricImage &&
    obj.get("markKind") === "frame-image" &&
    obj.group instanceof Group &&
    obj.group.get("markKind") === "image-frame"
  ) {
    return obj.group;
  }
  return null;
}

function boardImageFromTarget(obj: FabricObject): FabricImage | null {
  const frame = imageFrameGroupFromTarget(obj);
  if (frame) {
    const inner = frame.getObjects().find((o) => o instanceof FabricImage && o.get("markKind") === "frame-image");
    return inner instanceof FabricImage ? inner : null;
  }
  if (obj instanceof FabricImage && obj.get("markKind") !== "sticker") {
    let root: FabricObject = obj;
    while (root.group) root = root.group as FabricObject;
    return root instanceof FabricImage ? root : null;
  }
  return null;
}

type RadialObjectKind = "image" | "line" | "shape" | "sticker" | "text" | "sticky" | "parchment" | "structure" | "generic";

function topLevelBoardRoot(obj: FabricObject): FabricObject {
  let root = obj;
  while (root.group) root = root.group as FabricObject;
  return root;
}

function radialKindForRoot(root: FabricObject): RadialObjectKind {
  const structureType = structureProp(root, "structureType");
  if (structureType) return "structure";

  const markKind = root.get("markKind") as string | undefined;
  const shapeType = root.get("shapeType") as string | undefined;

  if (markKind === "image-frame") return "image";
  if (root instanceof FabricImage && markKind !== "sticker" && markKind !== "frame-image") return "image";
  if (markKind === "sticker") return "sticker";
  if (structureProp(root, "structureType") === "divider") return "line";
  if (markKind === "shape" && shapeType === "line" && root instanceof Line) return "line";
  if (markKind === "draw" || root.type === "path") return "line";
  if (markKind === "shape") return "shape";
  if (markKind === "sticky") return "sticky";
  if (markKind === "parchment") return "parchment";
  if (root instanceof IText || root instanceof Textbox || root instanceof FabricText) return "text";
  if (root instanceof Group) {
    if (root.get("textCapable")) return "text";
    if (root.getObjects().some((o) => o instanceof Textbox || o instanceof IText || o instanceof FabricText)) {
      return "text";
    }
  }
  return "generic";
}

function radialCapabilitiesForRoot(root: FabricObject) {
  const kind = radialKindForRoot(root);
  return {
    textCapable: kind === "text",
    shapeCapable: kind === "shape",
    stickerCapable: kind === "sticker",
    imageCapable: kind === "image",
    lineCapable: kind === "line",
  };
}

function homogeneousRadialKind(roots: FabricObject[]): RadialObjectKind | null {
  if (!roots.length) return null;
  const kinds = roots.map(radialKindForRoot);
  const first = kinds[0];
  return kinds.every((kind) => kind === first) ? first : null;
}

function applyImageFrameToRoot(
  canvas: Canvas,
  selected: FabricObject,
  shapeType: BoardMarkShapeType,
): Group | null {
  if (!IMAGE_FRAME_SHAPES.has(shapeType)) return null;

  const existingFrame = imageFrameGroupFromTarget(selected);
  let image: FabricImage | null = null;
  let center = { x: 0, y: 0 };
  let angle = 0;
  let photoW = 200;
  let photoH = 200;

  if (existingFrame) {
    const inner = existingFrame
      .getObjects()
      .find((o) => o instanceof FabricImage && o.get("markKind") === "frame-image");
    if (!(inner instanceof FabricImage)) return null;
    center = existingFrame.getCenterPoint();
    angle = existingFrame.angle ?? 0;
    ({ w: photoW, h: photoH } = imageFrameInnerSize(existingFrame));
    existingFrame.remove(inner);
    canvas.remove(existingFrame);
    image = inner;
  } else {
    image = boardImageFromTarget(selected);
    if (!image) return null;
    center = image.getCenterPoint();
    angle = image.angle ?? 0;
    photoW = (image.width ?? 1) * Math.abs(image.scaleX ?? 1);
    photoH = (image.height ?? 1) * Math.abs(image.scaleY ?? 1);
    canvas.remove(image);
  }

  const group =
    shapeType === "photo"
      ? createPolaroidImageFrameGroup(image, photoW, photoH, center, angle)
      : createClipImageFrameGroup(image, photoW, photoH, shapeType, center, angle);

  applyBoardFabricControls(group);
  canvas.add(group);
  return group;
}

function createImageFrameClipShape(shapeType: BoardMarkShapeType, width: number, height: number): FabricObject {
  const hw = width / 2;
  const hh = height / 2;
  if (shapeType === "circle") {
    return new Circle({
      radius: Math.min(hw, hh),
      originX: "center",
      originY: "center",
      left: 0,
      top: 0,
    });
  }
  if (shapeType === "heart") {
    return new Path(
      "M 50 88 C 20 66 6 52 6 34 C 6 20 16 10 30 10 C 38 10 45 14 50 20 C 55 14 62 10 70 10 C 84 10 94 20 94 34 C 94 52 80 66 50 88 Z",
      {
        originX: "center",
        originY: "center",
        left: 0,
        top: 0,
        scaleX: width / 100,
        scaleY: height / 100,
      },
    );
  }
  if (shapeType === "star") {
    return new Polygon(
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
        originX: "center",
        originY: "center",
        left: 0,
        top: 0,
        scaleX: width / 100,
        scaleY: height / 100,
      },
    );
  }
  if (shapeType === "hexagon") {
    return new Polygon(
      [
        { x: 0, y: -50 },
        { x: 43, y: -25 },
        { x: 43, y: 25 },
        { x: 0, y: 50 },
        { x: -43, y: 25 },
        { x: -43, y: -25 },
      ],
      {
        originX: "center",
        originY: "center",
        left: 0,
        top: 0,
        scaleX: width / 86,
        scaleY: height / 100,
      },
    );
  }
  if (shapeType === "diamond") {
    return new Polygon(
      [
        { x: 0, y: -55 },
        { x: 40, y: 0 },
        { x: 0, y: 55 },
        { x: -40, y: 0 },
      ],
      {
        originX: "center",
        originY: "center",
        left: 0,
        top: 0,
        scaleX: width / 80,
        scaleY: height / 110,
      },
    );
  }
  return new Rect({
    width,
    height,
    rx: 0,
    ry: 0,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
}

function applyImageCornerRadius(img: FabricImage, radius: number) {
  const w = img.width ?? 1;
  const h = img.height ?? 1;
  if (radius <= 0) {
    img.set({ clipPath: undefined, imageCornerRadius: 0 });
    img.setCoords();
    return;
  }
  const displayR = radius === -1 ? Math.min(w * Math.abs(img.scaleX ?? 1), h * Math.abs(img.scaleY ?? 1)) / 2 : radius;
  const rx = Math.min(displayR / Math.abs(img.scaleX ?? 1), w / 2, h / 2);
  const clip = new Rect({
    width: w,
    height: h,
    rx,
    ry: rx,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  img.set({ clipPath: clip, imageCornerRadius: radius });
  img.setCoords();
}

function restoreImageCornerRadius(img: FabricImage) {
  const radius = Number(img.get("imageCornerRadius") ?? 0);
  if (radius > 0 || radius === -1) applyImageCornerRadius(img, radius);
}

function restoreImageFrameAfterLoad(group: Group) {
  const shapeType = group.get("frameShapeType") as BoardMarkShapeType | undefined;
  const frameW = Number(group.get("frameWidth") ?? group.width ?? 200);
  const frameH = Number(group.get("frameHeight") ?? group.height ?? 200);
  if (shapeType === "photo") {
    const photoW = Number(group.get("framePhotoWidth") ?? frameW * 0.84);
    const photoH = Number(group.get("framePhotoHeight") ?? frameH * 0.84);
    const m = polaroidMetrics(photoW, photoH);
    group.set({
      clipPath: undefined,
      subTargetCheck: false,
      interactive: true,
      objectCaching: false,
      markKind: "image-frame",
      frameWidth: m.totalW,
      frameHeight: m.totalH,
      framePhotoWidth: m.photoW,
      framePhotoHeight: m.photoH,
    });
    let backing = group.getObjects().find((o) => o.get("markKind") === "frame-backing");
    if (!(backing instanceof Rect)) {
      backing = new Rect({
        width: m.totalW,
        height: m.totalH,
        fill: "#FFFFFF",
        stroke: "rgba(17,17,17,0.08)",
        strokeWidth: 1,
        shadow: {
          color: "rgba(0,0,0,0.14)",
          blur: 12,
          offsetX: 1,
          offsetY: 4,
        },
        originX: "center",
        originY: "center",
        left: 0,
        top: 0,
        markKind: "frame-backing",
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      });
      group.insertAt(0, backing);
    } else {
      backing.set({ width: m.totalW, height: m.totalH });
    }
    let inset = group.getObjects().find((o) => o.get("markKind") === "frame-inset");
    if (!(inset instanceof Rect)) {
      inset = new Rect({
        width: m.photoW,
        height: m.photoH,
        fill: "transparent",
        stroke: "rgba(0,0,0,0.09)",
        strokeWidth: 1,
        originX: "center",
        originY: "center",
        left: 0,
        top: 0,
        markKind: "frame-inset",
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      });
      group.add(inset);
    } else {
      inset.set({ width: m.photoW, height: m.photoH, top: 0 });
    }
    for (const child of group.getObjects()) {
      if (child instanceof FabricImage && child.get("markKind") === "frame-image") {
        prepareImageForPolaroidFrame(child, m);
        child.set({ selectable: false, evented: false, hasControls: false, hasBorders: false });
      } else if (child.get("markKind") === "frame-backing" || child.get("markKind") === "frame-inset") {
        child.set({ selectable: false, evented: false, hasControls: false, hasBorders: false });
      }
    }
  } else if (shapeType && IMAGE_CLIP_FRAME_SHAPES.has(shapeType)) {
    group.set({
      clipPath: createImageFrameClipShape(shapeType, frameW, frameH),
      subTargetCheck: false,
      interactive: true,
      objectCaching: false,
      markKind: "image-frame",
    });
    for (const child of group.getObjects()) {
      if (child instanceof FabricImage && child.get("markKind") === "frame-image") {
        child.set({ selectable: false, evented: false, hasControls: false, hasBorders: false });
      }
    }
  }
  applyBoardFabricControls(group);
  group.setCoords();
}

function prepareImageForFrame(img: FabricImage, frameW: number, frameH: number) {
  const iw = img.width ?? 1;
  const ih = img.height ?? 1;
  const coverScale = Math.max(frameW / iw, frameH / ih);
  img.set({
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    angle: 0,
    scaleX: coverScale,
    scaleY: coverScale,
    markKind: "frame-image",
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    clipPath: undefined,
    imageCornerRadius: 0,
  });
}

function stickyStrokeForFill(fill: string) {
  return fill === "#FFF9C4" ? "#E8D44D" : fill;
}

function isStickyRect(obj: FabricObject | null | undefined): obj is Rect {
  return obj instanceof Rect && obj.get("markKind") === "sticky";
}

function isLegacyFlatStickyTextbox(obj: FabricObject | null | undefined): obj is Textbox {
  return obj instanceof Textbox && obj.get("markKind") === "sticky";
}

function isLegacyStickyGroup(obj: FabricObject | null | undefined): obj is Group {
  return obj instanceof Group && obj.get("markKind") === "sticky";
}

function stickyMarkFromTarget(obj: FabricObject): Rect | Group | null {
  if (isStickyRect(obj)) return obj;
  let current: FabricObject = obj;
  while (current.group) current = current.group as FabricObject;
  if (isStickyRect(current)) return current;
  if (isLegacyStickyGroup(current)) return current;
  return null;
}

function stickyGroupFromTarget(obj: FabricObject): Group | null {
  const mark = stickyMarkFromTarget(obj);
  return mark instanceof Group ? mark : null;
}

function stickyLocalBox(width: number, height: number) {
  return {
    rectLeft: -width / 2,
    rectTop: -height / 2,
    textLeft: -width / 2 + STICKY_PADDING,
    textTop: -height / 2 + STICKY_PADDING,
    textWidth: Math.max(40, width - STICKY_PADDING * 2),
  };
}

function stickyParts(group: Group) {
  const rect = group
    .getObjects()
    .find((o) => o.get("markKind") === "sticky-bg") as Rect | undefined;

  const text = group
    .getObjects()
    .find((o) => o.get("markKind") === "sticky-text") as Textbox | undefined;

  return { rect, text };
}

function fitStickyText(group: Group, width: number, height: number) {
  const { text } = stickyParts(group);
  if (!text) return;

  text.set({
    width: Math.max(40, width - STICKY_PADDING * 2),
    fontSize: Math.max(14, Math.sqrt(width * height) / 10),
    lineHeight: 1.15,
  });
  text.initDimensions();
}

function getStickyStoredSize(group: Group) {
  const storedW = Number(group.get("stickyWidth"));
  const storedH = Number(group.get("stickyHeight"));

  return {
    width:
      Number.isFinite(storedW) && storedW > 0
        ? storedW
        : Math.max(STICKY_MIN_W, group.width ?? STICKY_DEFAULT_W),
    height:
      Number.isFinite(storedH) && storedH > 0
        ? storedH
        : Math.max(STICKY_MIN_H, group.height ?? STICKY_DEFAULT_H),
  };
}

function updateStickyLayout(group: Group, width?: number, height?: number) {
  const { rect, text } = stickyParts(group);
  if (!rect || !text) return group;

  const stored = getStickyStoredSize(group);
  const nextW = Math.max(STICKY_MIN_W, width ?? stored.width);
  const nextH = Math.max(STICKY_MIN_H, height ?? stored.height);
  const box = stickyLocalBox(nextW, nextH);

  rect.set({
    left: box.rectLeft,
    top: box.rectTop,
    width: nextW,
    height: nextH,
    originX: "left",
    originY: "top",
    scaleX: 1,
    scaleY: 1,
    selectable: false,
    evented: false,
    markKind: "sticky-bg",
  });

  text.set({
    left: box.textLeft,
    top: box.textTop,
    width: box.textWidth,
    originX: "left",
    originY: "top",
    scaleX: 1,
    scaleY: 1,
    selectable: false,
    evented: false,
    editable: true,
    markKind: "sticky-text",
  });
  fitStickyText(group, nextW, nextH);

  group.set({
    width: nextW,
    height: nextH,
    originX: "center",
    originY: "center",
    scaleX: 1,
    scaleY: 1,
    stickyWidth: nextW,
    stickyHeight: nextH,
    subTargetCheck: false,
    interactive: true,
    objectCaching: false,
    selectable: true,
    evented: true,
    markKind: "sticky",
  });

  rect.setCoords();
  text.setCoords();
  group.setCoords();

  return group;
}

function normalizeStickyResize(sticky: Group) {
  const sx = sticky.scaleX ?? 1;
  const sy = sticky.scaleY ?? 1;
  const stored = getStickyStoredSize(sticky);
  const nextW = Math.max(STICKY_MIN_W, stored.width * sx);
  const nextH = Math.max(STICKY_MIN_H, stored.height * sy);
  updateStickyLayout(sticky, nextW, nextH);
  applyStickyFabricControls(sticky);
  return sticky;
}

function restoreStickyAfterLoad(sticky: Group) {
  normalizeStickyResize(sticky);
  updateStickyLayout(sticky);
  applyStickyFabricControls(sticky);
  return sticky;
}

function replaceStickyOnCanvas(canvas: Canvas, prev: FabricObject, sticky: Group) {
  const index = canvas.getObjects().indexOf(prev);
  canvas.remove(prev);
  if (index >= 0) canvas.insertAt(index, sticky);
  else canvas.add(sticky);
  applyStickyFabricControls(sticky);
  sticky.setCoords();
  return sticky;
}

function migrateStickyRectToGroup(canvas: Canvas, rect: Rect): Group {
  const width = Math.max(STICKY_MIN_W, (rect.width ?? STICKY_DEFAULT_W) * (rect.scaleX ?? 1));
  const height = Math.max(STICKY_MIN_H, (rect.height ?? STICKY_DEFAULT_H) * (rect.scaleY ?? 1));
  const fill = typeof rect.fill === "string" ? rect.fill : "#FFF9C4";
  const sticky = createStickyNoteGroup({
    left: rect.left ?? 0,
    top: rect.top ?? 0,
    width,
    height,
    fill,
    angle: rect.angle ?? 0,
  });
  return replaceStickyOnCanvas(canvas, rect, sticky);
}

function migrateTextboxStickyToGroup(canvas: Canvas, textbox: Textbox): Group {
  const w = Number(textbox.get("stickyWidth")) || STICKY_DEFAULT_W;
  const h = Number(textbox.get("stickyHeight")) || STICKY_DEFAULT_H;
  const fill =
    (typeof textbox.backgroundColor === "string" && textbox.backgroundColor) ||
    (typeof textbox.fill === "string" && textbox.fill !== "#171717" ? textbox.fill : "#FFF9C4");
  const stroke = typeof textbox.stroke === "string" ? textbox.stroke : stickyStrokeForFill(fill);
  const sticky = createStickyNoteGroup({
    left: (textbox.left ?? 0) as number,
    top: (textbox.top ?? 0) as number,
    width: w,
    height: h,
    fill: fill === "#171717" ? "#FFF9C4" : fill,
    stroke,
    angle: textbox.angle ?? 0,
    text: textbox.text ?? "",
  });
  return replaceStickyOnCanvas(canvas, textbox, sticky);
}

function createStickyNoteGroup(params: {
  left: number;
  top: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  angle?: number;
  text?: string;
}): Group {
  const w = Math.max(STICKY_MIN_W, params.width ?? STICKY_DEFAULT_W);
  const h = Math.max(STICKY_MIN_H, params.height ?? STICKY_DEFAULT_H);
  const fill = params.fill ?? "#FFF9C4";
  const stroke = params.stroke ?? stickyStrokeForFill(fill);
  const box = stickyLocalBox(w, h);

  const rect = new Rect({
    left: box.rectLeft,
    top: box.rectTop,
    width: w,
    height: h,
    fill,
    stroke,
    strokeWidth: 1,
    originX: "left",
    originY: "top",
    selectable: false,
    evented: false,
    markKind: "sticky-bg",
  });
  const text = new Textbox(params.text ?? "", {
    left: box.textLeft,
    top: box.textTop,
    width: box.textWidth,
    fontSize: 28,
    fontFamily: "system-ui, sans-serif",
    fill: "#171717",
    lineHeight: 1.15,
    originX: "left",
    originY: "top",
    editable: true,
    selectable: false,
    evented: false,
    markKind: "sticky-text",
  });
  const sticky = new Group([rect, text], {
    left: params.left + w / 2,
    top: params.top + h / 2,
    originX: "center",
    originY: "center",
    angle: params.angle ?? 0,
    markKind: "sticky",
    stickyWidth: w,
    stickyHeight: h,
    subTargetCheck: false,
    interactive: true,
    objectCaching: false,
    lockScalingFlip: true,
  });
  updateStickyLayout(sticky, w, h);
  applyStickyFabricControls(sticky);
  return sticky;
}

function parchmentStrokeForFill(fill: string) {
  if (fill === PARCHMENT_DEFAULT_FILL) return "#C9B896";
  return fill;
}

function buildParchmentPathData(width: number, height: number): string {
  const x = (pct: number) => ((pct / 100) * width).toFixed(1);
  const y = (pct: number) => ((pct / 100) * height).toFixed(1);
  return [
    `M ${x(2)} ${y(12)}`,
    `L ${x(11)} ${y(5)} L ${x(21)} ${y(9)} L ${x(33)} ${y(4)} L ${x(45)} ${y(8)}`,
    `L ${x(57)} ${y(3)} L ${x(69)} ${y(7)} L ${x(81)} ${y(4)} L ${x(93)} ${y(9)} L ${x(98)} ${y(6)}`,
    `L ${x(99)} ${y(20)} L ${x(97)} ${y(34)} L ${x(99)} ${y(48)} L ${x(96)} ${y(62)} L ${x(98)} ${y(76)}`,
    `L ${x(95)} ${y(90)} L ${x(98)} ${y(96)} L ${x(87)} ${y(98)} L ${x(75)} ${y(99)} L ${x(63)} ${y(96)}`,
    `L ${x(51)} ${y(99)} L ${x(39)} ${y(95)} L ${x(27)} ${y(98)} L ${x(15)} ${y(94)} L ${x(4)} ${y(97)}`,
    `L ${x(1)} ${y(91)} L ${x(3)} ${y(77)} L ${x(1)} ${y(63)} L ${x(4)} ${y(49)} L ${x(2)} ${y(35)} L ${x(5)} ${y(21)} Z`,
  ].join(" ");
}

function parchmentGroupFromTarget(obj: FabricObject): Group | null {
  let current: FabricObject = obj;
  while (current.group) current = current.group as FabricObject;
  return current instanceof Group && current.get("markKind") === "parchment" ? current : null;
}

function parchmentParts(group: Group) {
  const body = group.getObjects().find((o) => o.get("markKind") === "parchment-bg") as Path | undefined;
  const text = group.getObjects().find((o) => o.get("markKind") === "parchment-text") as Textbox | undefined;
  return { body, text };
}

function parchmentLocalBox(width: number, height: number) {
  return {
    bodyLeft: -width / 2,
    bodyTop: -height / 2,
    textLeft: -width / 2 + PARCHMENT_PADDING,
    textTop: -height / 2 + PARCHMENT_PADDING,
    textWidth: Math.max(40, width - PARCHMENT_PADDING * 2),
  };
}

function applyParchmentSurfaceColor(group: Group, fill: string) {
  const stroke = parchmentStrokeForFill(fill);
  group.set("parchmentColor", fill);
  for (const child of group.getObjects()) {
    const role = String(child.get("markKind") ?? "");
    if (role === "parchment-bg" && child instanceof Path) {
      child.set({ fill, stroke, strokeWidth: 1.2 });
    } else if (role === "parchment-fiber" && child instanceof Path) {
      child.set({ stroke: fill, opacity: 0.14 });
    }
  }
}

function fitParchmentText(group: Group, width: number, height: number) {
  const { text } = parchmentParts(group);
  if (!text) return;
  text.set({
    width: Math.max(40, width - PARCHMENT_PADDING * 2),
    fontSize: Math.max(15, Math.sqrt(width * height) / 11),
    lineHeight: 1.2,
  });
  text.initDimensions();
}

function getParchmentStoredSize(group: Group) {
  const storedW = Number(group.get("parchmentWidth"));
  const storedH = Number(group.get("parchmentHeight"));
  return {
    width:
      Number.isFinite(storedW) && storedW > 0
        ? storedW
        : Math.max(PARCHMENT_MIN_W, group.width ?? PARCHMENT_DEFAULT_W),
    height:
      Number.isFinite(storedH) && storedH > 0
        ? storedH
        : Math.max(PARCHMENT_MIN_H, group.height ?? PARCHMENT_DEFAULT_H),
  };
}

function updateParchmentLayout(group: Group, width?: number, height?: number) {
  const { body, text } = parchmentParts(group);
  if (!body || !text) return group;

  const stored = getParchmentStoredSize(group);
  const nextW = Math.max(PARCHMENT_MIN_W, width ?? stored.width);
  const nextH = Math.max(PARCHMENT_MIN_H, height ?? stored.height);
  const box = parchmentLocalBox(nextW, nextH);
  const scaleX = nextW / PARCHMENT_BASE_W;
  const scaleY = nextH / PARCHMENT_BASE_H;

  body.set({
    left: box.bodyLeft,
    top: box.bodyTop,
    scaleX,
    scaleY,
    originX: "left",
    originY: "top",
    selectable: false,
    evented: false,
    markKind: "parchment-bg",
  });

  for (const child of group.getObjects()) {
    if (child.get("markKind") !== "parchment-fiber") continue;
    child.set({
      scaleX,
      scaleY,
      left: box.bodyLeft,
      top: box.bodyTop,
      originX: "left",
      originY: "top",
      selectable: false,
      evented: false,
    });
  }

  text.set({
    left: box.textLeft,
    top: box.textTop,
    width: box.textWidth,
    originX: "left",
    originY: "top",
    scaleX: 1,
    scaleY: 1,
    selectable: false,
    evented: false,
    editable: true,
    markKind: "parchment-text",
  });
  fitParchmentText(group, nextW, nextH);

  group.set({
    width: nextW,
    height: nextH,
    originX: "center",
    originY: "center",
    scaleX: 1,
    scaleY: 1,
    parchmentWidth: nextW,
    parchmentHeight: nextH,
    subTargetCheck: false,
    interactive: true,
    objectCaching: false,
    selectable: true,
    evented: true,
    markKind: "parchment",
  });

  body.setCoords();
  text.setCoords();
  group.setCoords();
  return group;
}

function normalizeParchmentResize(group: Group) {
  const sx = group.scaleX ?? 1;
  const sy = group.scaleY ?? 1;
  const stored = getParchmentStoredSize(group);
  const nextW = Math.max(PARCHMENT_MIN_W, stored.width * sx);
  const nextH = Math.max(PARCHMENT_MIN_H, stored.height * sy);
  updateParchmentLayout(group, nextW, nextH);
  applyParchmentFabricControls(group);
  return group;
}

function restoreParchmentAfterLoad(group: Group) {
  normalizeParchmentResize(group);
  applyParchmentSurfaceColor(group, String(group.get("parchmentColor") ?? PARCHMENT_DEFAULT_FILL));
  updateParchmentLayout(group);
  applyParchmentFabricControls(group);
  return group;
}

function applyParchmentFabricControls(obj: Group) {
  applyBoardFabricControls(obj);
  obj.set({
    lockUniScaling: false,
    objectCaching: false,
    markKind: "parchment",
  });
  obj.setCoords();
  return obj;
}

function createParchmentNoteGroup(params: {
  left: number;
  top: number;
  width?: number;
  height?: number;
  fill?: string;
  angle?: number;
  text?: string;
}): Group {
  const w = Math.max(PARCHMENT_MIN_W, params.width ?? PARCHMENT_DEFAULT_W);
  const h = Math.max(PARCHMENT_MIN_H, params.height ?? PARCHMENT_DEFAULT_H);
  const fill = params.fill ?? PARCHMENT_DEFAULT_FILL;
  const stroke = parchmentStrokeForFill(fill);
  const box = parchmentLocalBox(w, h);

  const body = new Path(buildParchmentPathData(PARCHMENT_BASE_W, PARCHMENT_BASE_H), {
    left: box.bodyLeft,
    top: box.bodyTop,
    fill,
    stroke,
    strokeWidth: 1.2,
    originX: "left",
    originY: "top",
    selectable: false,
    evented: false,
    markKind: "parchment-bg",
  });

  const fiberA = new Path("M 28 58 L 248 50", {
    left: box.bodyLeft,
    top: box.bodyTop,
    fill: "transparent",
    stroke: fill,
    strokeWidth: 1.4,
    opacity: 0.14,
    selectable: false,
    evented: false,
    markKind: "parchment-fiber",
  });
  const fiberB = new Path("M 22 118 L 252 112", {
    left: box.bodyLeft,
    top: box.bodyTop,
    fill: "transparent",
    stroke: fill,
    strokeWidth: 1.2,
    opacity: 0.1,
    selectable: false,
    evented: false,
    markKind: "parchment-fiber",
  });

  const text = new Textbox(params.text ?? "", {
    left: box.textLeft,
    top: box.textTop,
    width: box.textWidth,
    fontSize: 24,
    fontFamily: PARCHMENT_FONT,
    fill: "#3D3428",
    lineHeight: 1.2,
    textAlign: "center",
    originX: "left",
    originY: "top",
    editable: true,
    selectable: false,
    evented: false,
    markKind: "parchment-text",
  });

  const parchment = new Group([body, fiberA, fiberB, text], {
    left: params.left + w / 2,
    top: params.top + h / 2,
    originX: "center",
    originY: "center",
    angle: params.angle ?? 0,
    markKind: "parchment",
    parchmentColor: fill,
    parchmentWidth: w,
    parchmentHeight: h,
    subTargetCheck: false,
    interactive: true,
    objectCaching: false,
    lockScalingFlip: true,
  });
  updateParchmentLayout(parchment, w, h);
  applyParchmentFabricControls(parchment);
  return parchment;
}

function enterObjectTextEditing(
  canvas: Canvas,
  obj: FabricObject,
  syncFocus = false,
): boolean {
  if (isStickyRect(obj)) return false;

  let textObj: Textbox | IText | null = null;
  let root: FabricObject = obj;
  while (root.group) root = root.group as FabricObject;

  if (root instanceof Textbox || root instanceof IText) {
    textObj = root;
  } else if (root instanceof Group) {
    textObj = findEditableTextInGroup(root);
  }

  if (!textObj) return false;

  canvas.setActiveObject(textObj);
  canvas.requestRenderAll();

  const beginEditing = () => {
    textObj.enterEditing();

    if (textObj instanceof IText) {
      textObj.selectAll();
    } else if (textObj instanceof Textbox) {
      const len = textObj.text?.length ?? 0;
      textObj.selectionStart = len;
      textObj.selectionEnd = len;
    }

    const hiddenTextarea = (textObj as Textbox & { hiddenTextarea?: HTMLTextAreaElement }).hiddenTextarea;
    if (hiddenTextarea) {
      hiddenTextarea.focus({ preventScroll: true });
      if (syncFocus) hiddenTextarea.click();
    }

    canvas.requestRenderAll();
  };

  if (syncFocus) beginEditing();
  else requestAnimationFrame(beginEditing);

  return true;
}

function normalizeTextCapableShapeResize(group: Group) {
  const sx = group.scaleX ?? 1;
  const sy = group.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

  const currentW =
    typeof group.get("shapeWidth") === "number" ? Number(group.get("shapeWidth")) : group.width ?? 120;
  const currentH =
    typeof group.get("shapeHeight") === "number" ? Number(group.get("shapeHeight")) : group.height ?? 90;

  const nextW = Math.max(60, currentW * sx);
  const nextH = Math.max(50, currentH * sy);

  const shapeObj = group
    .getObjects()
    .find((o) => o.get("markKind") !== "shape-text" && !(o instanceof Textbox) && !(o instanceof IText));
  const text = group.getObjects().find((o) => o.get("markKind") === "shape-text") as Textbox | undefined;

  if (shapeObj) {
    const sw = shapeObj.width ?? currentW;
    const sh = shapeObj.height ?? currentH;
    const scaleShapeX = nextW / (sw * (shapeObj.scaleX ?? 1));
    const scaleShapeY = nextH / (sh * (shapeObj.scaleY ?? 1));
    if (shapeObj instanceof Circle) {
      const r = (shapeObj.radius ?? 55) * Math.min(scaleShapeX, scaleShapeY);
      shapeObj.set({ radius: r, left: nextW / 2, top: nextH / 2, originX: "center", originY: "center", scaleX: 1, scaleY: 1 });
    } else if (shapeObj instanceof Rect) {
      shapeObj.set({ left: 0, top: 0, width: nextW, height: nextH, scaleX: 1, scaleY: 1 });
    } else {
      shapeObj.set({
        scaleX: (shapeObj.scaleX ?? 1) * scaleShapeX,
        scaleY: (shapeObj.scaleY ?? 1) * scaleShapeY,
        left: nextW / 2,
        top: nextH / 2,
        originX: "center",
        originY: "center",
      });
      shapeObj.set({ scaleX: 1, scaleY: 1 });
      shapeObj.scale(scaleShapeX);
    }
  }

  if (text) {
    text.set({
      left: nextW / 2,
      top: nextH / 2,
      width: nextW * 0.85,
      scaleX: 1,
      scaleY: 1,
      originX: "center",
      originY: "center",
    });
  }

  group.set({ scaleX: 1, scaleY: 1, width: nextW, height: nextH, shapeWidth: nextW, shapeHeight: nextH });
  group.setCoords();
}

function restoreShapeGroupAfterLoad(group: Group) {
  group.set({ subTargetCheck: true, objectCaching: false });
  const w = (group.get("shapeWidth") as number) ?? 120;
  const h = (group.get("shapeHeight") as number) ?? 90;
  const text = group.getObjects().find((o) => o.get("markKind") === "shape-text") as Textbox | undefined;
  if (text) {
    text.set({
      editable: true,
      evented: true,
      selectable: false,
      textAlign: "center",
      originX: "center",
      originY: "center",
      left: w / 2,
      top: h / 2,
      width: w * 0.85,
    });
  }
  group.setCoords();
}

function createStructureId(): string {
  return crypto.randomUUID();
}

function createStructureAddButton(
  structureId: string,
  structureType: string,
  left: number,
  top: number,
): FabricObjectType[] {
  const btnSize = 24;
  const circle = new Circle({
    left,
    top,
    radius: btnSize / 2,
    fill: "#ffffff",
    stroke: DECAL_MUTED,
    strokeWidth: 1.5,
    selectable: false,
    evented: true,
    hoverCursor: "pointer",
    originX: "center",
    originY: "center",
  });
  circle.set({ structureId, structureType, structureRole: "add-button" });

  const plus = new FabricText("+", {
    left,
    top,
    fontSize: 16,
    fontFamily: STRUCTURE_FONT,
    fill: DECAL_MUTED,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: true,
    hoverCursor: "pointer",
  });
  plus.set({ structureId, structureType, structureRole: "add-button" });

  return [circle, plus];
}

function isAddButtonHit(obj: FabricObjectType): boolean {
  const role = structureProp(obj, "structureRole");
  return role === "add-button" || role === "add-row";
}

function buildShapePrimitive(
  shapeType: BoardMarkShapeType,
  groupW: number,
  groupH: number,
  stroke: string,
  fill: string,
): FabricObject {
  if (shapeType === "rect") {
    return new Rect({
      left: 0,
      top: 0,
      width: groupW,
      height: groupH,
      fill,
      stroke,
      strokeWidth: 3,
      rx: 4,
      ry: 4,
      selectable: false,
      evented: false,
    });
  }
  if (shapeType === "circle") {
    const r = Math.min(groupW, groupH) / 2;
    return new Circle({
      left: groupW / 2,
      top: groupH / 2,
      radius: r,
      fill,
      stroke,
      strokeWidth: 3,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
  }
  if (shapeType === "triangle") {
    return new Triangle({
      left: groupW / 2,
      top: groupH / 2,
      width: groupW,
      height: groupH,
      fill,
      stroke,
      strokeWidth: 3,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
  }
  if (shapeType === "hexagon") {
    const hw = groupW / 2;
    const hh = groupH / 2;
    return new Polygon(
      [
        { x: 0, y: -hh },
        { x: hw * 0.86, y: -hh / 2 },
        { x: hw * 0.86, y: hh / 2 },
        { x: 0, y: hh },
        { x: -hw * 0.86, y: hh / 2 },
        { x: -hw * 0.86, y: -hh / 2 },
      ],
      {
        left: groupW / 2,
        top: groupH / 2,
        originX: "center",
        originY: "center",
        fill,
        stroke,
        strokeWidth: 3,
        selectable: false,
        evented: false,
      },
    );
  }
  if (shapeType === "pentagon") {
    const hw = groupW / 2;
    const hh = groupH / 2;
    return new Polygon(
      [
        { x: 0, y: -hh },
        { x: hw, y: -hh * 0.3 },
        { x: hw * 0.62, y: hh },
        { x: -hw * 0.62, y: hh },
        { x: -hw, y: -hh * 0.3 },
      ],
      {
        left: groupW / 2,
        top: groupH / 2,
        originX: "center",
        originY: "center",
        fill,
        stroke,
        strokeWidth: 3,
        selectable: false,
        evented: false,
      },
    );
  }
  if (shapeType === "diamond") {
    const hw = groupW / 2;
    const hh = groupH / 2;
    return new Polygon(
      [
        { x: 0, y: -hh },
        { x: hw, y: 0 },
        { x: 0, y: hh },
        { x: -hw, y: 0 },
      ],
      {
        left: groupW / 2,
        top: groupH / 2,
        originX: "center",
        originY: "center",
        fill,
        stroke,
        strokeWidth: 3,
        selectable: false,
        evented: false,
      },
    );
  }
  if (shapeType === "heart") {
    return new Path(
      "M 50 88 C 20 66 6 52 6 34 C 6 20 16 10 30 10 C 38 10 45 14 50 20 C 55 14 62 10 70 10 C 84 10 94 20 94 34 C 94 52 80 66 50 88 Z",
      {
        left: groupW / 2 - 50,
        top: groupH / 2 - 50,
        fill,
        stroke,
        strokeWidth: 3,
        selectable: false,
        evented: false,
      },
    );
  }
  // bubble
  return new Path(
    "M 8 10 Q 8 2 16 2 L 104 2 Q 112 2 112 10 L 112 58 Q 112 66 104 66 L 58 66 L 44 82 L 46 66 L 16 66 Q 8 66 8 58 Z",
    {
      left: groupW / 2 - 60,
      top: groupH / 2 - 42,
      fill,
      stroke,
      strokeWidth: 3,
      selectable: false,
      evented: false,
    },
  );
}

function createTextCapableShapeGroup(
  shapeType: BoardMarkShapeType,
  cx: number,
  cy: number,
  stroke = MARK_SHAPE_STROKE,
): Group {
  const groupW = 120;
  const groupH = 90;
  const fill = `${stroke}33`;
  const shape = buildShapePrimitive(shapeType, groupW, groupH, stroke, fill);
  const text = new Textbox("", {
    left: groupW / 2,
    top: groupH / 2,
    width: groupW * 0.85,
    fontSize: 18,
    fontFamily: "system-ui, sans-serif",
    fill: MARK_TEXT_FILL,
    textAlign: "center",
    originX: "center",
    originY: "center",
    editable: true,
    evented: true,
    selectable: false,
    markKind: "shape-text",
  });
  return new Group([shape, text], {
    left: cx - groupW / 2,
    top: cy - groupH / 2,
    subTargetCheck: true,
    objectCaching: false,
    markKind: "shape",
    shapeType,
    textCapable: true,
    shapeWidth: groupW,
    shapeHeight: groupH,
  });
}

function getCheckboxBoxSize(group: Group): number {
  const stored = structureProp(group, "structureBoxSize");
  if (typeof stored === "number" && stored > 0) return stored;
  const box = group.getObjects().find((o) => o instanceof Rect);
  if (box instanceof Rect) return box.width ?? 48;
  return 48;
}

function reflowCheckboxItem(group: Group) {
  const boxSize = getCheckboxBoxSize(group);
  const checked = !!structureProp(group, "checked");
  const gap = STRUCTURE_INLINE_LABEL_GAP;
  const labelWidth = Math.max(120, getStructureLayoutWidth(group) - boxSize - gap);
  const rowH = Math.max(boxSize, 28);
  const boxTop = (rowH - boxSize) / 2;
  const fontSize = Math.max(16, Math.min(28, boxSize * 0.38));

  const box = group.getObjects().find((o) => o instanceof Rect);
  const checkmark = group
    .getObjects()
    .find((o) => o instanceof FabricText && structureProp(o, "structureRole") === "checkbox-toggle");
  const label = group.getObjects().find((o) => structureProp(o, "structureRole") === "checkbox-label");

  if (box instanceof Rect) {
    box.set({
      left: 0,
      top: boxTop,
      width: boxSize,
      height: boxSize,
      strokeWidth: Math.max(3, boxSize * 0.06),
      rx: Math.max(4, boxSize * 0.08),
      ry: Math.max(4, boxSize * 0.08),
      scaleX: 1,
      scaleY: 1,
    });
  }
  if (checkmark instanceof FabricText) {
    checkmark.set({
      left: boxSize / 2,
      top: boxTop + boxSize / 2,
      fontSize: boxSize * 0.72,
      visible: checked,
      scaleX: 1,
      scaleY: 1,
    });
  }
  if (label instanceof IText || label instanceof Textbox) {
    label.set({
      left: boxSize + gap,
      top: rowH / 2,
      width: labelWidth,
      fontSize,
      originY: "center",
      scaleX: 1,
      scaleY: 1,
    });
  }

  group.set({
    scaleX: 1,
    scaleY: 1,
    structureBoxSize: boxSize,
    structureWidth: boxSize + gap + labelWidth,
    structureHeight: rowH,
  });
  group.setCoords();
}

function getBulletDotSize(group: Group): number {
  const stored = structureProp(group, "structureDotSize");
  if (typeof stored === "number" && stored > 0) return stored;
  const dot = group.getObjects().find((o) => structureProp(o, "structureRole") === "bullet-dot");
  if (dot instanceof Circle) return Math.max(12, (dot.radius ?? 6) * 2);
  return 12;
}

function reflowBulletItem(group: Group) {
  const diameter = getBulletDotSize(group);
  const gap = STRUCTURE_INLINE_LABEL_GAP;
  const labelWidth = Math.max(120, getStructureLayoutWidth(group) - diameter - gap);
  const rowH = Math.max(diameter, 28);
  const fontSize = Math.max(16, Math.min(24, diameter * 0.85));

  const dot = group.getObjects().find((o) => structureProp(o, "structureRole") === "bullet-dot");
  const label = group.getObjects().find((o) => structureProp(o, "structureRole") === "bullet-label");

  if (dot instanceof Circle) {
    dot.set({
      left: diameter / 2,
      top: rowH / 2,
      radius: diameter / 2,
      originX: "center",
      originY: "center",
      scaleX: 1,
      scaleY: 1,
    });
  }
  if (label instanceof IText || label instanceof Textbox) {
    label.set({
      left: diameter + gap,
      top: rowH / 2,
      width: labelWidth,
      fontSize,
      originY: "center",
      scaleX: 1,
      scaleY: 1,
    });
  }

  group.set({
    scaleX: 1,
    scaleY: 1,
    structureDotSize: diameter,
    structureWidth: diameter + gap + labelWidth,
    structureHeight: rowH,
  });
  group.setCoords();
}

function createDynamicCheckboxDecal(left: number, top: number, size: number): Group {
  const structureId = createStructureId();
  const boxSize = Math.max(48, size);
  const box = new Rect({
    left: 0,
    top: 0,
    width: boxSize,
    height: boxSize,
    fill: "transparent",
    stroke: DECAL_INK,
    strokeWidth: Math.max(3, boxSize * 0.06),
    rx: Math.max(4, boxSize * 0.08),
    ry: Math.max(4, boxSize * 0.08),
    selectable: false,
    evented: false,
  });
  box.set({
    structureId,
    structureType: "checkbox",
    structureRole: "checkbox-toggle",
    checked: false,
  });
  const checkmark = new FabricText("✓", {
    left: boxSize / 2,
    top: boxSize / 2,
    fontSize: boxSize * 0.72,
    fontFamily: STRUCTURE_FONT,
    fontWeight: 700,
    fill: DECAL_INK,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
    visible: false,
  });
  checkmark.set({
    structureId,
    structureType: "checkbox",
    structureRole: "checkbox-toggle",
    checked: false,
  });
  const label = new IText("", {
    left: 0,
    top: 0,
    width: STRUCTURE_INLINE_LABEL_W,
    fontSize: Math.max(16, Math.min(28, boxSize * 0.38)),
    fontFamily: STRUCTURE_FONT,
    fill: DECAL_INK,
    originX: "left",
    originY: "center",
    editable: true,
    selectable: false,
    evented: true,
  });
  label.set({
    structureId,
    structureType: "checkbox",
    structureRole: "checkbox-label",
  });
  const group = new Group([box, checkmark, label], {
    left,
    top,
    subTargetCheck: true,
    interactive: true,
    objectCaching: false,
    cornerStyle: "circle",
    borderColor: "rgba(17,17,17,0.45)",
    cornerColor: "#111111",
    transparentCorners: false,
    lockUniScaling: true,
  });
  group.set({
    structureId,
    structureType: "checkbox",
    structureBoxSize: boxSize,
    structureWidth: boxSize + STRUCTURE_INLINE_LABEL_GAP + STRUCTURE_INLINE_LABEL_W,
    structureHeight: boxSize,
    structureColor: DECAL_INK,
    checked: false,
  });
  reflowCheckboxItem(group);
  return group;
}

function createDynamicBulletDecal(centerLeft: number, centerTop: number, size: number): Group {
  const structureId = createStructureId();
  const diameter = Math.max(12, size);
  const gap = STRUCTURE_INLINE_LABEL_GAP;
  const labelWidth = STRUCTURE_INLINE_LABEL_W;
  const rowH = Math.max(diameter, 28);

  const dot = new Circle({
    left: diameter / 2,
    top: rowH / 2,
    radius: diameter / 2,
    fill: DECAL_INK,
    stroke: "transparent",
    strokeWidth: 0,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  });
  dot.set({
    structureId,
    structureType: "bullet",
    structureRole: "bullet-dot",
  });

  const label = new IText("", {
    left: 0,
    top: 0,
    width: labelWidth,
    fontSize: Math.max(16, Math.min(24, diameter * 0.85)),
    fontFamily: STRUCTURE_FONT,
    fill: DECAL_INK,
    originX: "left",
    originY: "center",
    editable: true,
    selectable: false,
    evented: true,
  });
  label.set({
    structureId,
    structureType: "bullet",
    structureRole: "bullet-label",
  });

  const group = new Group([dot, label], {
    left: centerLeft - diameter / 2,
    top: centerTop - rowH / 2,
    subTargetCheck: true,
    interactive: true,
    objectCaching: false,
    lockUniScaling: true,
    cornerStyle: "circle",
    borderColor: "rgba(17,17,17,0.45)",
    cornerColor: "#111111",
    transparentCorners: false,
  });
  group.set({
    structureId,
    structureType: "bullet",
    structureDotSize: diameter,
    structureWidth: diameter + gap + labelWidth,
    structureHeight: rowH,
    structureColor: DECAL_INK,
  });
  reflowBulletItem(group);
  applyBoardFabricControls(group);
  return group;
}

function numberedListMinHeight(rowCount: number): number {
  return Math.max(NUMBERED_LIST_MIN_H, 28 + Math.max(1, rowCount) * STRUCTURE_ROW_H + 38);
}

function createNumberedListRowParts(
  structureId: string,
  rowIndex: number,
  text = "",
): FabricObjectType[] {
  const number = new FabricText(`${rowIndex + 1}.`, {
    left: 0,
    top: 0,
    fontSize: 22,
    fontFamily: STRUCTURE_FONT,
    fill: DECAL_INK,
    fontWeight: 700,
    originX: "left",
    originY: "center",
    selectable: false,
    evented: false,
  });
  number.set({
    structureId,
    structureType: "numbered_list",
    structureRole: "numbered-list-index",
    rowIndex,
  });

  const label = new IText(text, {
    left: 0,
    top: 0,
    width: 180,
    fontSize: 20,
    fontFamily: STRUCTURE_FONT,
    fill: DECAL_INK,
    originX: "left",
    originY: "center",
    editable: true,
    selectable: false,
    evented: true,
  });
  label.set({
    structureId,
    structureType: "numbered_list",
    structureRole: "numbered-list-label",
    rowIndex,
  });

  return [number, label];
}

function createDynamicNumberedListDecal(params: {
  left: number;
  top: number;
  width: number;
  height: number;
  items?: string[];
  structureId?: string;
}): Group {
  const structureId = params.structureId ?? createStructureId();
  const seededItems = (params.items ?? [])
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .slice(0, 12);
  const items = seededItems.length ? seededItems : ["First point", "Second point", "Third point"];
  const width = Math.max(NUMBERED_LIST_MIN_W, params.width);
  const height = Math.max(numberedListMinHeight(items.length), params.height);

  const bounds = new Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    selectable: false,
    evented: false,
  });
  bounds.set({
    structureId,
    structureType: "numbered_list",
    structureRole: "numbered-list-bounds",
  });

  const parts: FabricObjectType[] = [bounds];
  items.forEach((item, index) => {
    parts.push(...createNumberedListRowParts(structureId, index, item));
  });
  parts.push(...createStructureAddButton(structureId, "numbered_list", width - 18, height - 18));

  const group = new Group(parts, {
    left: params.left,
    top: params.top,
    subTargetCheck: true,
    interactive: true,
    objectCaching: false,
    cornerStyle: "circle",
    borderColor: "rgba(17,17,17,0.45)",
    cornerColor: "#111111",
    transparentCorners: false,
  });
  group.set({
    structureId,
    structureType: "numbered_list",
    structureWidth: width,
    structureHeight: height,
    structureColor: DECAL_INK,
  });
  reflowNumberedList(group);
  return group;
}

function createDynamicEisenhowerMatrixDecal(params: {
  left: number;
  top: number;
  width: number;
  height: number;
  structureId?: string;
}): Group {
  const structureId = params.structureId ?? createStructureId();
  const width = Math.max(EISENHOWER_MIN_W, params.width);
  const height = Math.max(EISENHOWER_MIN_H, params.height);
  const quadrantColors = ["#D9F99D", "#BFDBFE", "#FDE68A", "#FCA5A5"] as const;

  const bounds = new Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    selectable: false,
    evented: false,
  });
  bounds.set({
    structureId,
    structureType: "eisenhower",
    structureRole: "eisenhower-bounds",
  });

  const title = new FabricText("EISENHOWER MATRIX", {
    left: 0,
    top: 0,
    fontSize: 28,
    fontFamily: STRUCTURE_FONT,
    fontWeight: 700,
    fill: DECAL_INK,
    originX: "center",
    originY: "top",
    selectable: false,
    evented: false,
  });
  title.set({
    structureId,
    structureType: "eisenhower",
    structureRole: "eisenhower-title",
  });

  const urgent = new FabricText("URGENT", {
    left: 0,
    top: 0,
    fontSize: 20,
    fontFamily: STRUCTURE_FONT,
    fontWeight: 700,
    fill: DECAL_INK,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  });
  urgent.set({
    structureId,
    structureType: "eisenhower",
    structureRole: "eisenhower-top-left",
  });

  const notUrgent = new FabricText("NOT URGENT", {
    left: 0,
    top: 0,
    fontSize: 20,
    fontFamily: STRUCTURE_FONT,
    fontWeight: 700,
    fill: DECAL_INK,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  });
  notUrgent.set({
    structureId,
    structureType: "eisenhower",
    structureRole: "eisenhower-top-right",
  });

  const important = new FabricText("IMPORTANT", {
    left: 0,
    top: 0,
    fontSize: 18,
    fontFamily: STRUCTURE_FONT,
    fontWeight: 700,
    fill: DECAL_INK,
    angle: -90,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  });
  important.set({
    structureId,
    structureType: "eisenhower",
    structureRole: "eisenhower-left-top",
  });

  const notImportant = new FabricText("NOT IMPORTANT", {
    left: 0,
    top: 0,
    fontSize: 18,
    fontFamily: STRUCTURE_FONT,
    fontWeight: 700,
    fill: DECAL_INK,
    angle: -90,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  });
  notImportant.set({
    structureId,
    structureType: "eisenhower",
    structureRole: "eisenhower-left-bottom",
  });

  const quadrantKeys = [
    "eisenhower-quadrant-do",
    "eisenhower-quadrant-schedule",
    "eisenhower-quadrant-delegate",
    "eisenhower-quadrant-delete",
  ] as const;
  const quadrants = quadrantKeys.map((quadrantRole, index) => {
    const rect = new Rect({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      rx: 4,
      ry: 4,
      fill: quadrantColors[index],
      stroke: "transparent",
      strokeWidth: 0,
      selectable: false,
      evented: true,
      hoverCursor: "pointer",
    });
    rect.set({
      structureId,
      structureType: "eisenhower",
      structureRole: quadrantRole,
      quadrantColor: quadrantColors[index],
    });
    return rect;
  });

  const group = new Group(
    [bounds, title, urgent, notUrgent, important, notImportant, ...quadrants],
    {
      left: params.left,
      top: params.top,
      subTargetCheck: true,
      interactive: true,
      objectCaching: false,
      cornerStyle: "circle",
      borderColor: "rgba(17,17,17,0.45)",
      cornerColor: "#111111",
      transparentCorners: false,
    },
  );
  group.set({
    structureId,
    structureType: "eisenhower",
    structureWidth: width,
    structureHeight: height,
    structureColor: DECAL_INK,
  });
  reflowEisenhowerMatrix(group);
  return group;
}

function createPriorityRowParts(
  structureId: string,
  rowIndex: number,
  width: number,
): FabricObjectType[] {
  const rowTop = 44 + rowIndex * STRUCTURE_ROW_H;
  const midX = width * 0.55;
  const left = new IText("", {
    left: 8,
    top: rowTop,
    width: midX - 20,
    fontSize: 18,
    fontFamily: STRUCTURE_FONT,
    fill: DECAL_INK,
    textAlign: "left",
    originX: "left",
    originY: "top",
    editable: true,
    selectable: false,
    evented: true,
  });
  left.set({ structureId, structureType: "priority", structureRole: "priority-left", rowIndex });

  const right = new IText(String(rowIndex + 1), {
    left: midX + 8,
    top: rowTop,
    width: width - midX - 40,
    fontSize: 18,
    fontFamily: STRUCTURE_FONT,
    fill: DECAL_INK,
    textAlign: "right",
    editable: true,
    selectable: false,
    evented: true,
  });
  right.set({ structureId, structureType: "priority", structureRole: "priority-right", rowIndex });

  return [left, right];
}

function createPriorityGroup(left: number, top: number, width: number): Group {
  const structureId = createStructureId();
  const midX = width * 0.55;
  const rowCount = 4;
  const parts: FabricObjectType[] = [];

  const headerLine = new Rect({
    left: 0,
    top: 34,
    width,
    height: 2,
    fill: DECAL_LINE,
    selectable: false,
    evented: false,
  });
  headerLine.set({ structureRole: "header-line" });
  parts.push(headerLine);

  const frameV = new Rect({
    left: midX,
    top: 0,
    width: 2,
    height: 44 + rowCount * STRUCTURE_ROW_H + 36,
    fill: DECAL_LINE,
    selectable: false,
    evented: false,
  });
  frameV.set({ structureRole: "frame-v" });
  parts.push(frameV);

  for (let i = 0; i < rowCount; i++) {
    parts.push(...createPriorityRowParts(structureId, i, width));
  }

  const btnTop = 44 + rowCount * STRUCTURE_ROW_H + 18;
  parts.push(...createStructureAddButton(structureId, "priority", width - 14, btnTop));

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
  return group;
}

function createDynamicCalendarDecal(params: {
  left: number;
  top: number;
  width: number;
  height: number;
  month?: number;
  year?: number;
  structureId?: string;
}): Group {
  const structureId = params.structureId ?? createStructureId();
  const month = clampCalendarMonth(params.month ?? new Date().getMonth());
  const year = clampCalendarYear(params.year ?? new Date().getFullYear());

  const width = Math.max(CALENDAR_MIN_W, params.width);
  const height = Math.max(CALENDAR_MIN_H, params.height);

  const headerH = Math.max(52, height * 0.12);
  const weekdayH = Math.max(30, height * 0.07);
  const gridTop = headerH + weekdayH;
  const gridH = height - gridTop;
  const cols = 7;
  const rows = 6;
  const cellW = width / cols;
  const cellH = gridH / rows;

  const parts: FabricObjectType[] = [];

  const outer = new Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: "transparent",
    stroke: DECAL_INK,
    strokeWidth: 2,
    rx: 0,
    ry: 0,
    selectable: false,
    evented: false,
  });
  outer.set({ structureId, structureType: "calendar", structureRole: "calendar-frame" });
  parts.push(outer);

  const title = new FabricText(`${CALENDAR_MONTHS[month]} ${year}`, {
    left: width / 2,
    top: headerH / 2,
    fontSize: Math.max(22, Math.min(42, headerH * 0.48)),
    fontFamily: STRUCTURE_FONT,
    fontWeight: 700,
    fill: DECAL_INK,
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  });
  title.set({
    structureId,
    structureType: "calendar",
    structureRole: "calendar-title",
    calendarMonth: month,
    calendarYear: year,
  });
  parts.push(title);

  const headerLine = new Rect({
    left: 0,
    top: headerH,
    width,
    height: 2,
    fill: DECAL_LINE,
    selectable: false,
    evented: false,
  });
  headerLine.set({ structureId, structureType: "calendar", structureRole: "calendar-line" });
  parts.push(headerLine);

  const weekdayLine = new Rect({
    left: 0,
    top: gridTop,
    width,
    height: 2,
    fill: DECAL_LINE,
    selectable: false,
    evented: false,
  });
  weekdayLine.set({ structureId, structureType: "calendar", structureRole: "calendar-line" });
  parts.push(weekdayLine);

  for (let c = 0; c < cols; c += 1) {
    const label = new FabricText(CALENDAR_WEEKDAYS[c], {
      left: c * cellW + cellW / 2,
      top: headerH + weekdayH / 2,
      fontSize: Math.max(11, Math.min(16, weekdayH * 0.42)),
      fontFamily: STRUCTURE_FONT,
      fontWeight: 700,
      fill: DECAL_INK,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    label.set({
      structureId,
      structureType: "calendar",
      structureRole: "calendar-weekday",
      columnIndex: c,
    });
    parts.push(label);
  }

  for (let c = 1; c < cols; c += 1) {
    const line = new Rect({
      left: c * cellW,
      top: headerH,
      width: 2,
      height: height - headerH,
      fill: DECAL_LINE,
      selectable: false,
      evented: false,
    });
    line.set({ structureId, structureType: "calendar", structureRole: "calendar-line" });
    parts.push(line);
  }

  for (let r = 1; r <= rows; r += 1) {
    const line = new Rect({
      left: 0,
      top: gridTop + r * cellH,
      width,
      height: 2,
      fill: DECAL_LINE,
      selectable: false,
      evented: false,
    });
    line.set({ structureId, structureType: "calendar", structureRole: "calendar-line" });
    parts.push(line);
  }

  const firstOffset = firstWeekdayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);

  for (let day = 1; day <= totalDays; day += 1) {
    const cellIndex = firstOffset + day - 1;
    const row = Math.floor(cellIndex / cols);
    const col = cellIndex % cols;

    if (row >= rows) continue;

    const cellX = col * cellW;
    const cellY = gridTop + row * cellH;

    const dayText = new FabricText(String(day), {
      left: cellX + 9,
      top: cellY + 7,
      fontSize: Math.max(13, Math.min(20, cellH * 0.18)),
      fontFamily: STRUCTURE_FONT,
      fontWeight: 700,
      fill: DECAL_INK,
      originX: "left",
      originY: "top",
      selectable: false,
      evented: false,
    });
    dayText.set({
      structureId,
      structureType: "calendar",
      structureRole: "calendar-day-number",
      calendarCellIndex: cellIndex,
      calendarDayNumber: day,
      calendarDateKey: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    });
    parts.push(dayText);

    const corner = new Rect({
      left: cellX + cellW - 20,
      top: cellY,
      width: 20,
      height: 20,
      fill: "transparent",
      stroke: DECAL_INK,
      strokeWidth: 1.5,
      selectable: false,
      evented: false,
    });
    corner.set({
      structureId,
      structureType: "calendar",
      structureRole: "calendar-corner-box",
      calendarCellIndex: cellIndex,
      calendarDayNumber: day,
      calendarDateKey: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    });
    parts.push(corner);
  }

  const group = new Group(parts, {
    left: params.left,
    top: params.top,
    subTargetCheck: false,
    interactive: true,
    objectCaching: false,
    cornerStyle: "circle",
    borderColor: "rgba(17,17,17,0.45)",
    cornerColor: "#111111",
    transparentCorners: false,
  });

  group.set({
    structureId,
    structureType: "calendar",
    structureWidth: width,
    structureHeight: height,
    structureColor: DECAL_INK,
    calendarMonth: month,
    calendarYear: year,
  });

  return group;
}

function addPriorityRow(canvas: Canvas, group: Group) {
  const structureId = structureProp(group, "structureId") as string;
  const width = getStructureLayoutWidth(group);
  const rowIndex = group.getObjects().filter((o) => structureProp(o, "structureRole") === "priority-left").length;
  const parts = createPriorityRowParts(structureId, rowIndex, width);
  group.add(...parts);
  reflowPriority(group);
  canvas.requestRenderAll();
}

function addNumberedListRow(canvas: Canvas, group: Group) {
  const structureId = structureProp(group, "structureId") as string;
  const rowIndex = group.getObjects().filter((o) => structureProp(o, "structureRole") === "numbered-list-label").length;
  const parts = createNumberedListRowParts(structureId, rowIndex);
  group.add(...parts);
  group.set({
    structureHeight: Math.max(
      getStructureLayoutHeight(group),
      numberedListMinHeight(rowIndex + 1),
    ),
  });
  reflowNumberedList(group);
  canvas.requestRenderAll();
}

function enterStructureTextEditing(canvas: Canvas, target: FabricObject, syncFocus = false): boolean {
  const role = structureProp(target, "structureRole");
  if (
    role !== "label" &&
    role !== "priority-left" &&
    role !== "priority-right" &&
    role !== "numbered-list-label" &&
    role !== "checkbox-label" &&
    role !== "bullet-label"
  )
    return false;
  if (!(target instanceof IText) && !(target instanceof Textbox)) return false;
  return enterObjectTextEditing(canvas, target, syncFocus);
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

function getStructureLayoutHeight(group: Group): number {
  const stored = structureProp(group, "structureHeight");
  if (typeof stored === "number" && stored > 0) return stored;
  return Math.max(group.height ?? CALENDAR_MIN_H, CALENDAR_MIN_H);
}

function restoreAllGroupsAfterLoad(canvas: Canvas) {
  for (const obj of [...canvas.getObjects()]) {
    if (isLegacyFlatStickyTextbox(obj)) {
      migrateTextboxStickyToGroup(canvas, obj);
      continue;
    }
    if (isStickyRect(obj)) {
      migrateStickyRectToGroup(canvas, obj);
      continue;
    }
    if (obj instanceof Rect && structureProp(obj, "structureType") === "divider") {
      const left = obj.left ?? 0;
      const top = obj.top ?? 0;
      const width = Math.max(80, (obj.width ?? 80) * (obj.scaleX ?? 1));
      const color = String(obj.get("structureColor") ?? obj.fill ?? DECAL_LINE);
      const structureId = String(obj.get("structureId") ?? createStructureId());
      const angle = obj.angle ?? 0;
      const dashed = !!obj.get("lineDashed");
      const line = createDynamicDividerDecal(left - width / 2, top, width, dashed);
      line.set({ structureId, structureColor: color, stroke: color, angle });
      canvas.remove(obj);
      canvas.add(line);
      line.setCoords();
      continue;
    }
    if (obj instanceof Line && structureProp(obj, "structureType") === "divider") {
      normalizeDynamicDividerDecal(obj);
      continue;
    }
    if (obj instanceof Circle && structureProp(obj, "structureType") === "bullet") {
      const centerLeft = obj.left ?? 0;
      const centerTop = obj.top ?? 0;
      const stored = structureProp(obj, "structureWidth");
      const dotSize =
        typeof stored === "number" && stored > 0 ? stored : Math.max(12, (obj.radius ?? 6) * 2);
      const color = String(obj.get("structureColor") ?? DECAL_INK);
      const angle = obj.angle ?? 0;
      const group = createDynamicBulletDecal(centerLeft, centerTop, dotSize);
      group.set({ angle, structureColor: color });
      applyDynamicDecalColor(group, color);
      canvas.remove(obj);
      canvas.add(group);
      group.setCoords();
      continue;
    }
    if (!(obj instanceof Group)) continue;
    if (obj.get("markKind") === "sticky") {
      restoreStickyAfterLoad(obj);
    } else if (obj.get("markKind") === "parchment") {
      restoreParchmentAfterLoad(obj);
    } else if (obj.get("markKind") === "shape" && obj.get("textCapable")) {
      restoreShapeGroupAfterLoad(obj);
    } else if (obj.get("markKind") === "image-frame") {
      restoreImageFrameAfterLoad(obj);
    } else if (structureProp(obj, "structureType") === "calendar") {
      restoreCalendarAfterLoad(canvas, obj);
    } else if (structureProp(obj, "structureId")) {
      restoreStructureAfterLoad(obj);
    }
  }
}

/** Rebuild clip paths and group layout after loadFromJSON (editor + export). */
export function restoreBoardLayoutAfterLoad(canvas: Canvas) {
  restoreAllGroupsAfterLoad(canvas);
  for (const obj of canvas.getObjects()) {
    if (structureProp(obj, "structureId")) continue;
    if (obj instanceof FabricImage && obj.get("markKind") !== "frame-image") {
      restoreImageCornerRadius(obj);
    }
  }
}

function restoreStructureAfterLoad(group: Group) {
  group.set({ subTargetCheck: true, interactive: true, objectCaching: false });
  const structureType = structureProp(group, "structureType");
  if (structureType === "checkbox") {
    group.set({ subTargetCheck: true });
    const checked = !!structureProp(group, "checked");
    const structureId = String(group.get("structureId") ?? createStructureId());
    const hasLabel = group.getObjects().some((o) => structureProp(o, "structureRole") === "checkbox-label");
    if (!hasLabel) {
      const boxSize = getCheckboxBoxSize(group);
      const label = new IText("", {
        left: 0,
        top: 0,
        width: STRUCTURE_INLINE_LABEL_W,
        fontSize: Math.max(16, Math.min(28, boxSize * 0.38)),
        fontFamily: STRUCTURE_FONT,
        fill: DECAL_INK,
        originX: "left",
        originY: "center",
        editable: true,
        selectable: false,
        evented: true,
      });
      label.set({
        structureId,
        structureType: "checkbox",
        structureRole: "checkbox-label",
      });
      group.add(label);
    }
    for (const child of group.getObjects()) {
      const role = structureProp(child, "structureRole");
      child.set({ evented: false, selectable: false, checked });
      if (role === "checkbox-label") {
        child.set({ evented: true, editable: true });
      } else if (child instanceof FabricText && role === "checkbox-toggle") {
        child.set({ visible: checked });
      }
    }
    reflowCheckboxItem(group);
    applyDynamicDecalColor(group, String(group.get("structureColor") ?? DECAL_INK));
  }
  if (structureType === "bullet") {
    for (const child of group.getObjects()) {
      const role = structureProp(child, "structureRole");
      if (role === "bullet-label") {
        child.set({ evented: true, selectable: false, editable: true });
      } else {
        child.set({ evented: false, selectable: false });
      }
    }
    const sx = group.scaleX ?? 1;
    const sy = group.scaleY ?? 1;
    if (Math.abs(sx - 1) >= 0.001 || Math.abs(sy - 1) >= 0.001) {
      normalizeBulletResize(group);
    } else {
      reflowBulletItem(group);
    }
    applyDynamicDecalColor(group, String(group.get("structureColor") ?? DECAL_INK));
  }
  if (structureType === "eisenhower") {
    group.set({ subTargetCheck: true });
    for (const child of group.getObjects()) {
      const role = structureProp(child, "structureRole");
      if (
        role === "eisenhower-quadrant-do" ||
        role === "eisenhower-quadrant-schedule" ||
        role === "eisenhower-quadrant-delegate" ||
        role === "eisenhower-quadrant-delete"
      ) {
        child.set({ evented: true, selectable: false, hoverCursor: "pointer" });
        if (child instanceof Rect) {
          child.set("fill", String(child.get("quadrantColor") ?? child.fill ?? "#E5E7EB"));
        }
      } else {
        child.set({ evented: false, selectable: false });
      }
    }
    const sx = group.scaleX ?? 1;
    const sy = group.scaleY ?? 1;
    if (Math.abs(sx - 1) >= 0.001 || Math.abs(sy - 1) >= 0.001) {
      normalizeEisenhowerResize(group);
    } else {
      reflowEisenhowerMatrix(group);
    }
  }
  if (structureType === "numbered_list") {
    for (const child of group.getObjects()) {
      const role = structureProp(child, "structureRole");
      if (role === "numbered-list-index" || role === "numbered-list-bounds") {
        child.set({ evented: false, selectable: false });
      } else if (role === "numbered-list-label") {
        child.set({ evented: true, selectable: false, editable: true });
      } else if (role === "add-button") {
        child.set({ evented: true, selectable: false });
      }
    }
    const sx = group.scaleX ?? 1;
    const sy = group.scaleY ?? 1;
    if (Math.abs(sx - 1) >= 0.001 || Math.abs(sy - 1) >= 0.001) {
      normalizeNumberedListResize(group);
    } else {
      reflowNumberedList(group);
    }
    applyDynamicDecalColor(group, String(group.get("structureColor") ?? DECAL_INK));
  }
  if (structureType === "priority") {
    reflowPriority(group);
  }
}

function restoreCalendarAfterLoad(canvas: Canvas, group: Group) {
  const month = clampCalendarMonth(Number(group.get("calendarMonth")));
  const year = clampCalendarYear(Number(group.get("calendarYear")));
  const width = Math.max(CALENDAR_MIN_W, getStructureLayoutWidth(group));
  const height = Math.max(CALENDAR_MIN_H, getStructureLayoutHeight(group));
  replaceCalendarGroup(canvas, group, month, year, width, height, { select: false });
}

function replaceCalendarGroup(
  canvas: Canvas,
  group: Group,
  month: number,
  year: number,
  width?: number,
  height?: number,
  options?: { select?: boolean },
): Group {
  const left = group.left ?? 0;
  const top = group.top ?? 0;
  const angle = group.angle ?? 0;
  const structureId = String(group.get("structureId") ?? createStructureId());
  const structureColor = String(group.get("structureColor") ?? DECAL_INK);

  const next = createDynamicCalendarDecal({
    left,
    top,
    width: width ?? getStructureLayoutWidth(group),
    height: height ?? getStructureLayoutHeight(group),
    month,
    year,
    structureId,
  });

  next.set({ angle });
  applyDynamicDecalColor(next, structureColor);

  canvas.remove(group);
  canvas.add(next);
  if (options?.select !== false) {
    canvas.setActiveObject(next);
  }
  next.setCoords();
  canvas.requestRenderAll();

  return next;
}

function normalizeCalendarResize(canvas: Canvas, group: Group) {
  const sx = group.scaleX ?? 1;
  const sy = group.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

  const currentW = getStructureLayoutWidth(group);
  const currentH = getStructureLayoutHeight(group);

  const nextW = Math.max(CALENDAR_MIN_W, currentW * sx);
  const nextH = Math.max(CALENDAR_MIN_H, currentH * sy);

  const month = clampCalendarMonth(Number(group.get("calendarMonth")));
  const year = clampCalendarYear(Number(group.get("calendarYear")));

  replaceCalendarGroup(canvas, group, month, year, nextW, nextH);
}

function normalizeStructureResize(group: Group) {
  const sx = group.scaleX ?? 1;
  const sy = group.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

  const newWidth = getStructureLayoutWidth(group) * sx;

  for (const child of group.getObjects()) {
    const csx = child.scaleX ?? 1;
    const csy = child.scaleY ?? 1;
    if (child instanceof IText || child instanceof Textbox) {
      if (csx !== 1 || csy !== 1) {
        child.set({ scaleX: 1, scaleY: 1 });
      }
    } else if (child instanceof FabricText) {
      if (csx !== 1 || csy !== 1) {
        child.set({ scaleX: 1, scaleY: 1 });
      }
    } else if (child instanceof Rect) {
      const role = structureProp(child, "structureRole");
      if (role === "checkbox" || role === "divider-line" || role === "header-line") {
        child.set({ scaleX: 1, scaleY: 1 });
      } else if (role === "frame-v" || role === "divider") {
        child.set({ scaleX: 1, scaleY: 1 });
      } else {
        child.set({
          width: (child.width ?? 0) * csx,
          height: (child.height ?? 0) * csy,
          scaleX: 1,
          scaleY: 1,
        });
      }
    } else if (child instanceof Circle) {
      child.set({ scaleX: 1, scaleY: 1 });
    }
  }

  group.set({ scaleX: 1, scaleY: 1, structureWidth: newWidth });
}

function positionStructureAddButton(group: Group) {
  const width = getStructureLayoutWidth(group);
  const leftCells = group
    .getObjects()
    .filter((o) => structureProp(o, "structureRole") === "priority-left")
    .sort((a, b) => (structureProp(a, "rowIndex") as number) - (structureProp(b, "rowIndex") as number));
  const baseTop = 44 + leftCells.length * STRUCTURE_ROW_H + 6;
  const btnLeft = width - 14;
  const btnTop = baseTop + 12;

  for (const obj of group.getObjects()) {
    if (structureProp(obj, "structureRole") !== "add-button") continue;
    if (obj instanceof Circle) {
      obj.set({ left: btnLeft, top: btnTop, scaleX: 1, scaleY: 1 });
    } else if (obj instanceof FabricText) {
      obj.set({ left: btnLeft, top: btnTop, scaleX: 1, scaleY: 1 });
    }
  }
}

function reflowNumberedList(group: Group) {
  const labels = group
    .getObjects()
    .filter((o) => structureProp(o, "structureRole") === "numbered-list-label")
    .sort((a, b) => Number(structureProp(a, "rowIndex")) - Number(structureProp(b, "rowIndex")));
  const numbers = group
    .getObjects()
    .filter((o) => structureProp(o, "structureRole") === "numbered-list-index")
    .sort((a, b) => Number(structureProp(a, "rowIndex")) - Number(structureProp(b, "rowIndex")));

  const rowCount = Math.max(labels.length, 1);
  const width = Math.max(NUMBERED_LIST_MIN_W, getStructureLayoutWidth(group));
  const height = Math.max(numberedListMinHeight(rowCount), getStructureLayoutHeight(group));
  const padX = Math.max(18, width * 0.06);
  const topPad = Math.max(18, height * 0.1);
  const bottomPad = Math.max(18, height * 0.1);
  const addArea = 32;
  const rowPitch = Math.max(STRUCTURE_ROW_H, (height - topPad - bottomPad - addArea) / rowCount);
  const fontSize = Math.max(18, Math.min(34, rowPitch * 0.52));
  const indexFontSize = Math.max(18, Math.min(36, rowPitch * 0.58));
  const numberColumnW = Math.max(34, Math.max(String(rowCount).length, 2) * indexFontSize * 0.48 + 16);
  const labelLeft = padX + numberColumnW;
  const labelWidth = Math.max(120, width - labelLeft - padX);

  const bounds = group.getObjects().find((o) => structureProp(o, "structureRole") === "numbered-list-bounds");
  if (bounds instanceof Rect) {
    bounds.set({ width, height, scaleX: 1, scaleY: 1 });
  }

  labels.forEach((label, index) => {
    const rowCenter = topPad + rowPitch * index + rowPitch / 2;
    const number = numbers[index];

    if (number instanceof FabricText) {
      number.set({
        text: `${index + 1}.`,
        left: padX,
        top: rowCenter,
        fontSize: indexFontSize,
        scaleX: 1,
        scaleY: 1,
      });
      number.set({ rowIndex: index });
    }
    if (label instanceof IText || label instanceof Textbox) {
      label.set({
        left: labelLeft,
        top: rowCenter,
        width: labelWidth,
        fontSize,
        scaleX: 1,
        scaleY: 1,
      });
      label.set({ rowIndex: index });
    }
  });

  const btnLeft = width - padX;
  const btnTop = height - Math.max(18, bottomPad * 0.75);
  for (const obj of group.getObjects()) {
    if (structureProp(obj, "structureRole") !== "add-button") continue;
    if (obj instanceof Circle) {
      obj.set({ left: btnLeft, top: btnTop, scaleX: 1, scaleY: 1 });
    } else if (obj instanceof FabricText) {
      obj.set({ left: btnLeft, top: btnTop, scaleX: 1, scaleY: 1 });
    }
  }

  group.set({
    scaleX: 1,
    scaleY: 1,
    structureWidth: width,
    structureHeight: height,
  });
  group.setCoords();
}

function reflowEisenhowerMatrix(group: Group) {
  const width = Math.max(EISENHOWER_MIN_W, getStructureLayoutWidth(group));
  const height = Math.max(EISENHOWER_MIN_H, getStructureLayoutHeight(group));
  const leftPad = Math.max(52, width * 0.12);
  const rightPad = Math.max(14, width * 0.04);
  const titleTop = Math.max(10, height * 0.03);
  const titleSize = Math.max(20, Math.min(36, width * 0.055));
  const topLabelSize = Math.max(14, Math.min(24, width * 0.038));
  const sideLabelSize = Math.max(13, Math.min(22, width * 0.032));
  const axisGap = Math.max(10, height * 0.025);
  const quadrantGap = Math.max(10, Math.min(width, height) * 0.025);
  const titleH = titleSize + 8;
  const topLabelH = topLabelSize + 10;
  const gridTop = titleTop + titleH + axisGap + topLabelH;
  const gridBottomPad = Math.max(14, height * 0.05);
  const gridWidth = Math.max(220, width - leftPad - rightPad);
  const gridHeight = Math.max(180, height - gridTop - gridBottomPad);
  const quadW = (gridWidth - quadrantGap) / 2;
  const quadH = (gridHeight - quadrantGap) / 2;
  const rightColLeft = leftPad + quadW + quadrantGap;
  const bottomRowTop = gridTop + quadH + quadrantGap;

  for (const child of group.getObjects()) {
    const role = structureProp(child, "structureRole");
    if (role === "eisenhower-bounds" && child instanceof Rect) {
      child.set({ width, height, scaleX: 1, scaleY: 1 });
      continue;
    }
    if (role === "eisenhower-title" && child instanceof FabricText) {
      child.set({ left: width / 2, top: titleTop, fontSize: titleSize, scaleX: 1, scaleY: 1 });
      continue;
    }
    if (role === "eisenhower-top-left" && child instanceof FabricText) {
      child.set({
        left: leftPad + quadW / 2,
        top: titleTop + titleH + axisGap + topLabelH / 2,
        fontSize: topLabelSize,
        scaleX: 1,
        scaleY: 1,
      });
      continue;
    }
    if (role === "eisenhower-top-right" && child instanceof FabricText) {
      child.set({
        left: rightColLeft + quadW / 2,
        top: titleTop + titleH + axisGap + topLabelH / 2,
        fontSize: topLabelSize,
        scaleX: 1,
        scaleY: 1,
      });
      continue;
    }
    if (role === "eisenhower-left-top" && child instanceof FabricText) {
      child.set({
        left: leftPad * 0.42,
        top: gridTop + quadH / 2,
        fontSize: sideLabelSize,
        scaleX: 1,
        scaleY: 1,
      });
      continue;
    }
    if (role === "eisenhower-left-bottom" && child instanceof FabricText) {
      child.set({
        left: leftPad * 0.42,
        top: bottomRowTop + quadH / 2,
        fontSize: sideLabelSize,
        scaleX: 1,
        scaleY: 1,
      });
      continue;
    }
    if (!(child instanceof Rect)) continue;

    if (role === "eisenhower-quadrant-do") {
      child.set({ left: leftPad, top: gridTop, width: quadW, height: quadH, scaleX: 1, scaleY: 1 });
    } else if (role === "eisenhower-quadrant-schedule") {
      child.set({ left: rightColLeft, top: gridTop, width: quadW, height: quadH, scaleX: 1, scaleY: 1 });
    } else if (role === "eisenhower-quadrant-delegate") {
      child.set({ left: leftPad, top: bottomRowTop, width: quadW, height: quadH, scaleX: 1, scaleY: 1 });
    } else if (role === "eisenhower-quadrant-delete") {
      child.set({ left: rightColLeft, top: bottomRowTop, width: quadW, height: quadH, scaleX: 1, scaleY: 1 });
    }
  }

  group.set({
    scaleX: 1,
    scaleY: 1,
    structureWidth: width,
    structureHeight: height,
  });
  group.setCoords();
}

function reflowPriority(group: Group) {
  const width = getStructureLayoutWidth(group);
  const midX = width * 0.55;
  const leftCells = group
    .getObjects()
    .filter((o) => structureProp(o, "structureRole") === "priority-left")
    .sort((a, b) => (structureProp(a, "rowIndex") as number) - (structureProp(b, "rowIndex") as number));
  const rowCount = leftCells.length;

  const headerLine = group.getObjects().find((o) => structureProp(o, "structureRole") === "header-line");
  if (headerLine instanceof Rect) {
    headerLine.set({ width, scaleX: 1, scaleY: 1 });
  }

  const lastRowTop = 44 + Math.max(0, rowCount - 1) * STRUCTURE_ROW_H;
  const frameV = group.getObjects().find((o) => structureProp(o, "structureRole") === "frame-v");
  if (frameV instanceof Rect) {
    frameV.set({ left: midX, height: lastRowTop + STRUCTURE_ROW_H + 36, scaleX: 1, scaleY: 1 });
  }

  for (const left of leftCells) {
    if (!(left instanceof IText) && !(left instanceof Textbox)) continue;
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
    if (right instanceof IText || right instanceof Textbox) {
      right.set({ left: midX + 8, top: rowTop, width: width - midX - 40, scaleX: 1, scaleY: 1 });
    }
  }

  positionStructureAddButton(group);
  group.set({ structureWidth: width });
  group.setCoords();
}

function reflowInteractiveStructure(group: Group) {
  const structureType = structureProp(group, "structureType") as string | undefined;
  if (structureType === "priority") reflowPriority(group);
  if (structureType === "numbered_list") reflowNumberedList(group);
  if (structureType === "eisenhower") reflowEisenhowerMatrix(group);
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

function createDynamicDividerDecal(left: number, top: number, width: number, dashed = false): Line {
  const structureId = createStructureId();
  const lineWidth = Math.max(80, width);
  const line = new Line([-lineWidth / 2, 0, lineWidth / 2, 0], {
    left: left + lineWidth / 2,
    top,
    stroke: DECAL_LINE,
    strokeWidth: 4,
    strokeLineCap: "round",
    originX: "center",
    originY: "center",
    fill: "transparent",
    lockScalingY: true,
    lockRotation: true,
    strokeDashArray: dashed ? LINE_DASH_PATTERN : undefined,
  });
  line.set({
    structureId,
    structureType: "divider",
    structureRole: "divider-line",
    structureWidth: lineWidth,
    structureColor: DECAL_LINE,
    lineDashed: dashed,
  });
  applyBoardFabricControls(line);
  line.setControlsVisibility({
    mt: false,
    mb: false,
    tl: false,
    tr: false,
    bl: false,
    br: false,
    mtr: false,
  });
  return line;
}

function normalizeDynamicDividerDecal(divider: FabricObject) {
  if (divider instanceof Line && structureProp(divider, "structureType") === "divider") {
    const sx = divider.scaleX ?? 1;
    const stored = structureProp(divider, "structureWidth");
    const currentW = typeof stored === "number" && stored > 0 ? stored : Math.max(divider.width ?? 80, 80);
    const width = Math.max(80, currentW * sx);
    divider.set({
      x1: -width / 2,
      y1: 0,
      x2: width / 2,
      y2: 0,
      scaleX: 1,
      scaleY: 1,
      structureWidth: width,
      lockScalingY: true,
      lockRotation: true,
    });
    divider.setControlsVisibility({
      mt: false,
      mb: false,
      tl: false,
      tr: false,
      bl: false,
      br: false,
      mtr: false,
    });
    divider.setCoords();
    return;
  }

  if (!(divider instanceof Rect) || structureProp(divider, "structureType") !== "divider") return;

  const width = Math.max(80, (divider.width ?? 80) * (divider.scaleX ?? 1));
  divider.set({
    width,
    height: 4,
    scaleX: 1,
    scaleY: 1,
    structureWidth: width,
    lockScalingY: true,
    lockRotation: true,
  });
  divider.setControlsVisibility({
    mt: false,
    mb: false,
    tl: false,
    tr: false,
    bl: false,
    br: false,
    mtr: false,
  });
  divider.setCoords();
}

function applyDynamicDecalColor(root: FabricObject, color: string) {
  root.set("structureColor", color);

  if (structureProp(root, "structureType") === "divider") {
    if (root instanceof Line) {
      root.set("stroke", color);
    } else if (root instanceof Rect) {
      root.set("fill", color);
    }
    return;
  }
  if (structureProp(root, "structureType") === "bullet" && root instanceof Circle) {
    root.set("fill", color);
    return;
  }
  if (!(root instanceof Group)) return;

  const structureType = structureProp(root, "structureType");

  for (const child of root.getObjects()) {
    const role = structureProp(child, "structureRole");
    if (structureType === "calendar") {
      if (child instanceof FabricText || child instanceof IText || child instanceof Textbox) {
        child.set("fill", color);
      } else if (child instanceof Rect) {
        if (role === "calendar-frame" || role === "calendar-corner-box") child.set("stroke", color);
        else if (role === "calendar-line") child.set("fill", color);
      }
      continue;
    }

    if (structureType === "eisenhower") {
      if (
        (role === "eisenhower-quadrant-do" ||
          role === "eisenhower-quadrant-schedule" ||
          role === "eisenhower-quadrant-delegate" ||
          role === "eisenhower-quadrant-delete") &&
        child instanceof Rect
      ) {
        child.set({ fill: color, quadrantColor: color });
      }
      continue;
    }

    if (structureType === "checkbox") {
      if (child instanceof Rect) {
        child.set({
          stroke: color,
          fill: "transparent",
        });
      } else if (child instanceof FabricText && role === "checkbox-toggle") {
        child.set({ fill: color, visible: !!structureProp(root, "checked") });
      } else if ((child instanceof IText || child instanceof Textbox) && role === "checkbox-label") {
        child.set("fill", color);
      }
      continue;
    }

    if (structureType === "bullet") {
      if (role === "bullet-dot" && child instanceof Circle) {
        child.set("fill", color);
      } else if (role === "bullet-label" && (child instanceof IText || child instanceof Textbox)) {
        child.set("fill", color);
      }
      continue;
    }

    if (structureType === "numbered_list") {
      if (role === "numbered-list-index" && child instanceof FabricText) {
        child.set("fill", color);
      } else if (role === "numbered-list-label" && (child instanceof IText || child instanceof Textbox)) {
        child.set("fill", color);
      } else if (role === "add-button" && child instanceof Circle) {
        child.set("stroke", color);
      } else if (role === "add-button" && child instanceof FabricText) {
        child.set("fill", color);
      }
    }
  }
}

function normalizeCheckboxResize(group: Group) {
  const sx = group.scaleX ?? 1;
  const sy = group.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

  const currentSize = getCheckboxBoxSize(group);
  const nextSize = Math.max(48, currentSize * Math.max(sx, sy));
  const structureColor = String(group.get("structureColor") ?? DECAL_INK);

  group.set({ structureBoxSize: nextSize, scaleX: 1, scaleY: 1 });
  reflowCheckboxItem(group);
  applyDynamicDecalColor(group, structureColor);
  group.setCoords();
}

function normalizeEisenhowerResize(group: Group) {
  const sx = group.scaleX ?? 1;
  const sy = group.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

  for (const child of group.getObjects()) {
    child.set({ scaleX: 1, scaleY: 1 });
  }

  group.set({
    scaleX: 1,
    scaleY: 1,
    structureWidth: Math.max(EISENHOWER_MIN_W, getStructureLayoutWidth(group) * sx),
    structureHeight: Math.max(EISENHOWER_MIN_H, getStructureLayoutHeight(group) * sy),
  });
  reflowEisenhowerMatrix(group);
}

function normalizeNumberedListResize(group: Group) {
  const sx = group.scaleX ?? 1;
  const sy = group.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

  const structureColor = String(group.get("structureColor") ?? DECAL_INK);
  const width = Math.max(NUMBERED_LIST_MIN_W, getStructureLayoutWidth(group) * sx);
  const height = Math.max(NUMBERED_LIST_MIN_H, getStructureLayoutHeight(group) * sy);

  for (const child of group.getObjects()) {
    child.set({ scaleX: 1, scaleY: 1 });
  }

  group.set({
    scaleX: 1,
    scaleY: 1,
    structureWidth: width,
    structureHeight: height,
  });
  reflowNumberedList(group);
  applyDynamicDecalColor(group, structureColor);
}

function normalizeBulletResize(target: FabricObject) {
  if (target instanceof Circle && structureProp(target, "structureType") === "bullet") {
    const sx = target.scaleX ?? 1;
    const sy = target.scaleY ?? 1;
    if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

    const stored = structureProp(target, "structureWidth");
    const currentSize =
      typeof stored === "number" && stored > 0 ? stored : Math.max(12, (target.radius ?? 6) * 2);
    const nextSize = Math.max(12, currentSize * Math.max(sx, sy));
    const structureColor = String(target.get("structureColor") ?? DECAL_INK);

    target.set({
      radius: nextSize / 2,
      scaleX: 1,
      scaleY: 1,
      structureWidth: nextSize,
      structureHeight: nextSize,
    });
    applyDynamicDecalColor(target, structureColor);
    target.setCoords();
    return;
  }

  if (!(target instanceof Group) || structureProp(target, "structureType") !== "bullet") return;

  const sx = target.scaleX ?? 1;
  const sy = target.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;

  const currentSize = getBulletDotSize(target);
  const nextSize = Math.max(12, currentSize * Math.max(sx, sy));
  const structureColor = String(target.get("structureColor") ?? DECAL_INK);

  target.set({ structureDotSize: nextSize, scaleX: 1, scaleY: 1 });
  reflowBulletItem(target);
  applyDynamicDecalColor(target, structureColor);
  target.setCoords();
}

export type BoardDiagramType =
  | "eisenhower"
  | "checkbox"
  | "numbered_list"
  | "bullet"
  | "calendar"
  | "zones"
  | "timeline"
  | "kanban"
  | "gantt"
  | "okrs"
  | "five_s"
  | "divider";

export type BoardCanvasHandle = {
  boardId: string;
  addText: (text?: string) => void;
  addTextAt: (text: string, left: number, top: number, fontSize?: number) => void;
  addTextNormalized: (text: string, x: number, y: number, fontSize?: number, fill?: string) => void;
  addStickyNote: () => void;
  addStickyNoteAt: (text: string, x: number, y: number, fill?: string) => void;
  addParchmentNote: () => void;
  addParchmentNoteAt: (text: string, x: number, y: number, fill?: string) => void;
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
  removeElements: (criteria: {
    element_index?: number;
    match_text?: string;
    kind?: string;
    sticker?: string;
    shape?: string;
    structure?: string;
    all?: boolean;
  }) => number;
  resetBoard: () => void;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getLayoutJson: () => Record<string, unknown>;
  addShape: (shape: BoardMarkShapeType) => void;
  addShapeAt: (shape: BoardMarkShapeType, x: number, y: number) => void;
  addSticker: (sticker: BoardMarkStickerId) => void;
  addStickerAt: (sticker: BoardMarkStickerId, x: number, y: number) => void;
  startDrawMode: () => void;
};

export type ImageFitOptions = {
  fit?: "default" | "cover";
  sendToBack?: boolean;
  normX?: number;
  normY?: number;
};

type QuickSelectorState = {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  normX: number;
  normY: number;
  mode: "empty" | "object";
  textCapable?: boolean;
  shapeCapable?: boolean;
  stickerCapable?: boolean;
  imageCapable?: boolean;
  lineCapable?: boolean;
  batchMixed?: boolean;
};

type CalendarControlState = {
  structureId: string;
  month: number;
  year: number;
};

type BoardCanvasEditorProps = {
  layoutJson: Record<string, unknown>;
  colorKey: string;
  boardId: string;
  layoutMode?: BoardLayoutMode;
  artboardWidth?: number;
  artboardHeight?: number;
  orientation?: "portrait" | "landscape";
  readOnly?: boolean;
  /** Tighter layout when shown in grid / carousel cells */
  embedded?: boolean;
  /** Fill embedded cell by cropping (cover) or letterboxing (contain). */
  cellFit?: "contain" | "cover";
  /** When false (e.g. inactive grid cell), radial menu and keyboard shortcuts are disabled. */
  isActive?: boolean;
  onSave: (layout: Record<string, unknown>) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onBoardColorPick?: (hex: string) => void;
  onRequestImagePick?: () => void;
  /** Mobile: use Fabric blue square handles instead of black circles. */
  fabricSelectionControls?: boolean;
};

export const BoardCanvasEditor = forwardRef<BoardCanvasHandle, BoardCanvasEditorProps>(
  function BoardCanvasEditor(
    {
      layoutJson,
      colorKey,
      boardId,
      layoutMode = "vision",
      artboardWidth = ARTBOARD_WIDTH,
      artboardHeight = ARTBOARD_HEIGHT,
      orientation,
      readOnly = false,
      embedded = false,
      cellFit = "contain",
      isActive = true,
      onSave,
      onHistoryChange,
      onBoardColorPick,
      onRequestImagePick,
      fabricSelectionControls = false,
    },
    ref,
  ) {
    // Real (orientation-aware) artboard size. Prefer explicit dims; fall back to orientation.
    const artboardSize = useMemo(() => {
      if (typeof artboardWidth === "number" && typeof artboardHeight === "number") {
        return {
          width: artboardWidth,
          height: artboardHeight,
          orientation: (artboardWidth > artboardHeight ? "landscape" : "portrait") as
            | "landscape"
            | "portrait",
        };
      }
      return artboardSizeForOrientation(orientation);
    }, [artboardWidth, artboardHeight, orientation]);

    // Real usable artboard coordinate space (1350×1080 for landscape). All placement,
    // canvas sizing and pointer math must use these, never the scaled display size.
    const activeArtboardWidth = artboardSize.width;
    const activeArtboardHeight = artboardSize.height;

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
    const lastEmittedLayoutRef = useRef<{ boardId: string; json: string } | null>(null);
    const onHistoryChangeRef = useRef(onHistoryChange);
    const rebindStructureHandlersRef = useRef<(canvas: Canvas) => void>(() => {});
    const handleStructurePointerRef = useRef<(canvas: Canvas, target: FabricObjectType) => boolean>(() => false);
    const toggleCheckboxRef = useRef<(canvas: Canvas, group: Group) => void>(() => {});
    const refreshCalendarControlRef = useRef<(canvas: Canvas | null) => void>(() => {});
    const [quickSelector, setQuickSelector] = useState<QuickSelectorState | null>(null);
    const [calendarControl, setCalendarControl] = useState<CalendarControlState | null>(null);
    const [drawingMode, setDrawingMode] = useState(false);
    const [cropMode, setCropMode] = useState(false);
    const cropTargetRef = useRef<{ group: Group | null; image: FabricImage } | null>(null);
    const drawColorRef = useRef(MARK_SHAPE_STROKE);
    const deleteTargetRef = useRef<FabricObject | null>(null);
    const radialTargetsRef = useRef<FabricObject[]>([]);
    const isActiveRef = useRef(isActive);
    isActiveRef.current = isActive;
    const syncTextFocusRef = useRef(fabricSelectionControls);
    syncTextFocusRef.current = fabricSelectionControls;
    const cropModeRef = useRef(cropMode);
    cropModeRef.current = cropMode;

    onHistoryChangeRef.current = onHistoryChange;

    useEffect(() => {
      if (!isActive) {
        setQuickSelector(null);
        setCalendarControl(null);
      } else {
        refreshCalendarControlRef.current(fabricRef.current);
      }
    }, [isActive]);

    const refreshCalendarControl = useCallback((canvas: Canvas | null) => {
      if (!canvas || readOnly || !isActiveRef.current) {
        setCalendarControl(null);
        return;
      }

      const active = canvas.getActiveObject();

      if (active instanceof Group && active.get("structureType") === "calendar") {
        setCalendarControl({
          structureId: String(active.get("structureId")),
          month: clampCalendarMonth(Number(active.get("calendarMonth"))),
          year: clampCalendarYear(Number(active.get("calendarYear"))),
        });
        return;
      }

      setCalendarControl(null);
    }, [readOnly]);

    refreshCalendarControlRef.current = refreshCalendarControl;

    const scheduleSave = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        const layout = withArtboardMeta(canvas.toJSON() as Record<string, unknown>, artboardSize);
        lastEmittedLayoutRef.current = { boardId, json: JSON.stringify(layout) };
        onSave(layout);
      }, 700);
    }, [onSave, readOnly, artboardSize, boardId]);

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

    const updateSelectedCalendar = useCallback(
      (patch: { month?: number; year?: number }) => {
        const canvas = fabricRef.current;
        if (!canvas || !isActiveRef.current) return;

        const active = canvas.getActiveObject();

        if (!(active instanceof Group) || active.get("structureType") !== "calendar") return;

        const currentMonth = clampCalendarMonth(Number(active.get("calendarMonth")));
        const currentYear = clampCalendarYear(Number(active.get("calendarYear")));

        const nextMonth = patch.month == null ? currentMonth : clampCalendarMonth(patch.month);
        const nextYear = patch.year == null ? currentYear : clampCalendarYear(patch.year);

        if (nextMonth === currentMonth && nextYear === currentYear) return;

        const next = replaceCalendarGroup(canvas, active, nextMonth, nextYear);
        setCalendarControl({
          structureId: String(next.get("structureId")),
          month: nextMonth,
          year: nextYear,
        });

        recordHistory();
        scheduleSave();
      },
      [recordHistory, scheduleSave],
    );

    const applyHistorySnapshot = useCallback(
      async (index: number) => {
        const canvas = fabricRef.current;
        const h = historyRef.current;
        const json = h.snapshots[index];
        if (!canvas || !json) return;
        if (!fabricCanvasRenderable(canvas)) return;
        restoringHistoryRef.current = true;
        const bg = boardFillForKey(colorKey);
        try {
          await canvas.loadFromJSON(JSON.parse(json));
        } catch (err) {
          console.warn("fabric history restore skipped", err);
          restoringHistoryRef.current = false;
          return;
        }
        if (fabricRef.current !== canvas) return;
        canvas.backgroundColor = bg;
        restoreBoardLayoutAfterLoad(canvas);
        for (const obj of canvas.getObjects()) {
          if (structureProp(obj, "structureId")) continue;
          if (obj.get("markKind") || obj instanceof FabricImage) {
            applyBoardFabricControls(obj);
          }
        }
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

    const undo = useCallback(async () => {
      flushPendingHistory();
      const h = historyRef.current;
      if (h.index <= 0) return;
      await applyHistorySnapshot(h.index - 1);
    }, [applyHistorySnapshot, flushPendingHistory]);

    const redo = useCallback(async () => {
      flushPendingHistory();
      const h = historyRef.current;
      if (h.index >= h.snapshots.length - 1) return;
      await applyHistorySnapshot(h.index + 1);
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
      radialTargetsRef.current = [];
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

      const active = canvas.getActiveObject();
      let batchRoots: FabricObject[] = [];
      if (active instanceof ActiveSelection && active.getObjects().length > 1) {
        batchRoots = [...new Set(active.getObjects().map(topLevelBoardRoot))];
      }

      const homogeneousKind = batchRoots.length > 1 ? homogeneousRadialKind(batchRoots) : null;
      const batchMixed = batchRoots.length > 1 && !homogeneousKind;

      radialTargetsRef.current = [];

      if (batchRoots.length > 1 && homogeneousKind) {
        radialTargetsRef.current = batchRoots;
      } else if (batchRoots.length > 1 && batchMixed) {
        radialTargetsRef.current = batchRoots;
      } else if (target) {
        let root = target;
        while (root.group) {
          root = root.group;
        }
        const role = structureProp(target as unknown as FabricObjectType, "structureRole");
        const structureType = structureProp(target as unknown as FabricObjectType, "structureType");
        if (
          structureType === "eisenhower" &&
          typeof role === "string" &&
          role.startsWith("eisenhower-quadrant-")
        ) {
          deleteTargetRef.current = target;
        } else {
          deleteTargetRef.current = root;
        }
        radialTargetsRef.current = [root];
        canvas.setActiveObject(root);
        const objects = canvas.getObjects();
        if (objects[objects.length - 1] !== root) {
          canvas.bringObjectToFront(root);
        }
        canvas.requestRenderAll();
      } else if (active) {
        const root = topLevelBoardRoot(active);
        deleteTargetRef.current = root;
        radialTargetsRef.current = [root];
      } else {
        deleteTargetRef.current = null;
      }

      let textCapable = false;
      let shapeCapable = false;
      let stickerCapable = false;
      let imageCapable = false;
      let lineCapable = false;

      if (batchRoots.length > 1 && homogeneousKind) {
        const caps = radialCapabilitiesForRoot(batchRoots[0]);
        textCapable = caps.textCapable;
        shapeCapable = caps.shapeCapable;
        stickerCapable = caps.stickerCapable;
        imageCapable = caps.imageCapable;
        lineCapable = caps.lineCapable;
        if (homogeneousKind === "shape") {
          textCapable = batchRoots.every((root) => Boolean(root.get("textCapable")));
        }
      } else if (target instanceof IText || target instanceof Textbox || target instanceof FabricText) {
        textCapable = true;
      } else if (target) {
        let root = target;
        while (root.group) {
          root = root.group as FabricObject;
        }
        if (root instanceof Group) {
          textCapable = root.getObjects().some((o) => o instanceof Textbox || o instanceof IText || o instanceof FabricText);
        }
        const markKind = typeof root.get === "function" ? root.get("markKind") : undefined;
        const shapeType = typeof root.get === "function" ? root.get("shapeType") : undefined;
        shapeCapable = markKind === "shape";
        stickerCapable = markKind === "sticker";
        imageCapable =
          markKind === "image-frame" ||
          (root instanceof FabricImage && markKind !== "sticker" && markKind !== "frame-image");
        lineCapable =
          structureProp(root, "structureType") === "divider" ||
          (markKind === "shape" && shapeType === "line" && root instanceof Line) ||
          markKind === "draw";
      } else if (radialTargetsRef.current[0]) {
        const caps = radialCapabilitiesForRoot(radialTargetsRef.current[0]);
        textCapable = caps.textCapable;
        shapeCapable = caps.shapeCapable;
        stickerCapable = caps.stickerCapable;
        imageCapable = caps.imageCapable;
        lineCapable = caps.lineCapable;
      }

      setQuickSelector({
        x: clientX - rect.left,
        y: clientY - rect.top,
        clientX,
        clientY,
        normX: Math.min(1, Math.max(0, pointer.x / activeArtboardWidth)),
        normY: Math.min(1, Math.max(0, pointer.y / activeArtboardHeight)),
        mode: target || active || radialTargetsRef.current.length ? "object" : "empty",
        textCapable,
        shapeCapable,
        stickerCapable,
        imageCapable,
        lineCapable,
        batchMixed,
      });
    }, [readOnly, activeArtboardWidth, activeArtboardHeight]);

    const getRadialActionTargets = useCallback((): FabricObject[] => {
      if (radialTargetsRef.current.length) return [...radialTargetsRef.current];
      const canvas = fabricRef.current;
      if (!canvas) return [];
      const selected = deleteTargetRef.current ?? canvas.getActiveObject();
      if (!selected) return [];
      if (selected instanceof ActiveSelection) {
        return [...new Set(selected.getObjects().map(topLevelBoardRoot))];
      }
      return [topLevelBoardRoot(selected)];
    }, []);

    const restoreRadialSelection = useCallback((canvas: Canvas, objects: FabricObject[]) => {
      const next = objects.filter((obj) => canvas.getObjects().includes(obj));
      if (!next.length) return;
      if (next.length === 1) {
        canvas.setActiveObject(next[0]);
      } else {
        canvas.setActiveObject(new ActiveSelection(next, { canvas }));
      }
    }, []);

    const openQuickSelectorRef = useRef(openQuickSelectorFromEvent);
    openQuickSelectorRef.current = openQuickSelectorFromEvent;
    const enterImageCropModeRef = useRef<(target?: FabricObject | null) => boolean>(() => false);

    const fitCanvas = useCallback((canvas: Canvas) => {
      const container = containerRef.current;
      const wrap = canvasWrapRef.current;
      if (!container || !wrap) return;

      const pad = embedded ? 0 : 32;
      const maxW = Math.max(container.clientWidth - pad, 1);
      const maxH = Math.max(container.clientHeight - pad, 1);

      const fitScale = Math.min(
        maxW / activeArtboardWidth,
        maxH / activeArtboardHeight,
      );

      const displayScale = Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 0.5;

      const displayW = Math.max(1, Math.round(activeArtboardWidth * displayScale));
      const displayH = Math.max(1, Math.round(activeArtboardHeight * displayScale));

      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.setZoom(1);

      canvas.setDimensions(
        { width: activeArtboardWidth, height: activeArtboardHeight },
        { backstoreOnly: true },
      );

      canvas.setDimensions(
        { width: `${displayW}px`, height: `${displayH}px` },
        { cssOnly: true },
      );

      const fabricContainer =
        canvas.upperCanvasEl?.parentElement ??
        canvas.getElement().parentElement;

      if (fabricContainer) {
        fabricContainer.style.width = `${displayW}px`;
        fabricContainer.style.height = `${displayH}px`;
        fabricContainer.style.maxWidth = "none";
        fabricContainer.style.maxHeight = "none";
        fabricContainer.style.position = "relative";
        fabricContainer.style.flex = "0 0 auto";
      }

      wrap.style.overflow = "auto";
      wrap.style.display = "flex";
      wrap.style.justifyContent = displayW <= wrap.clientWidth ? "center" : "flex-start";
      wrap.style.alignItems = displayH <= wrap.clientHeight ? "center" : "flex-start";

      const canvasEl = canvas.getElement();
      canvasEl.style.margin = "0";

      canvas.calcOffset();
      canvas.requestRenderAll();
    }, [embedded, activeArtboardWidth, activeArtboardHeight]);

    useEffect(() => {
      if (!canvasElRef.current) return;
      const bg = boardFillForKey(colorKey);
      const canvas = new Canvas(canvasElRef.current, {
        width: activeArtboardWidth,
        height: activeArtboardHeight,
        backgroundColor: bg,
        selection: !readOnly,
        targetFindTolerance: fabricSelectionControls ? 16 : 10,
        perPixelTargetFind: false,
        preserveObjectStacking: true,
      });
      fabricRef.current = canvas;
      fitCanvas(canvas);

      const onResize = () => fitCanvas(canvas);
      window.addEventListener("resize", onResize);

      let containerObserver: ResizeObserver | undefined;
      if (embedded && containerRef.current) {
        let fitFrame = 0;
        containerObserver = new ResizeObserver(() => {
          if (fitFrame) cancelAnimationFrame(fitFrame);
          fitFrame = requestAnimationFrame(() => {
            fitFrame = 0;
            fitCanvas(canvas);
          });
        });
        containerObserver.observe(containerRef.current);
      }

      let onContextMenu: ((e: MouseEvent) => void) | undefined;
      let onSelectionChanged: ((event?: { selected?: FabricObject[] }) => void) | undefined;
      let onSelectionCleared: (() => void) | undefined;

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
          if (isStickyRect(target)) {
            migrateStickyRectToGroup(canvas, target);
          } else if (structureProp(target, "structureType") === "divider") {
            normalizeDynamicDividerDecal(target);
          } else if (structureProp(target, "structureType") === "bullet") {
            normalizeBulletResize(target);
          } else if (target instanceof Group) {
            if (target.get("markKind") === "sticky") {
              normalizeStickyResize(target);
            } else if (target.get("markKind") === "parchment") {
              normalizeParchmentResize(target);
            } else if (target.get("markKind") === "shape" && target.get("textCapable")) {
              normalizeTextCapableShapeResize(target);
            } else if (target.get("structureId")) {
              const structureType = target.get("structureType");

              if (structureType === "calendar") {
                normalizeCalendarResize(canvas, target);
              } else if (structureType === "checkbox") {
                normalizeCheckboxResize(target);
              } else if (structureType === "eisenhower") {
                normalizeEisenhowerResize(target);
              } else if (structureType === "numbered_list") {
                normalizeNumberedListResize(target);
                rebindStructureHandlersRef.current(canvas);
              } else if (structureType === "priority") {
                normalizeStructureResize(target);
                reflowInteractiveStructure(target);
                rebindStructureHandlersRef.current(canvas);
              }
            }
          }
          onHistoryDebounced();
        });
        canvas.on("object:added", onHistoryImmediate);
        canvas.on("object:removed", onHistoryImmediate);
        canvas.on("text:changed", (event) => {
          const target = event.target as FabricObject | undefined;
          if (!target) return;
          const sticky = stickyGroupFromTarget(target);
          if (sticky) {
            const stored = getStickyStoredSize(sticky);
            fitStickyText(sticky, stored.width, stored.height);
            sticky.setCoords();
            canvas.requestRenderAll();
            onHistoryDebounced();
            return;
          }
          const parchment = parchmentGroupFromTarget(target);
          if (parchment) {
            const stored = getParchmentStoredSize(parchment);
            fitParchmentText(parchment, stored.width, stored.height);
            parchment.setCoords();
            canvas.requestRenderAll();
            onHistoryDebounced();
            return;
          }
          onHistoryDebounced();
        });
        const handleSelectionChanged = (event?: { selected?: FabricObject[] }) => {
          const obj = event?.selected?.[0];
          if (obj) {
            if (isStickyRect(obj)) {
              applyStickyFabricControls(obj);
              canvas.requestRenderAll();
            } else {
              const stickyGroup = stickyGroupFromTarget(obj);
              if (stickyGroup) {
                if (obj.get("markKind") === "sticky-text") {
                  canvas.requestRenderAll();
                  return;
                }
                applyStickyFabricControls(stickyGroup);
                if (canvas.getActiveObject() !== stickyGroup) {
                  canvas.discardActiveObject();
                  canvas.setActiveObject(stickyGroup);
                }
                stickyGroup.setCoords();
                canvas.requestRenderAll();
              } else {
                const parchmentGroup = parchmentGroupFromTarget(obj);
                if (parchmentGroup) {
                  if (obj.get("markKind") === "parchment-text") {
                    canvas.requestRenderAll();
                    return;
                  }
                  applyParchmentFabricControls(parchmentGroup);
                  if (canvas.getActiveObject() !== parchmentGroup) {
                    canvas.discardActiveObject();
                    canvas.setActiveObject(parchmentGroup);
                  }
                  parchmentGroup.setCoords();
                  canvas.requestRenderAll();
                } else if (
                obj.get("markKind") ||
                obj instanceof FabricImage ||
                obj instanceof IText ||
                obj instanceof Textbox ||
                obj instanceof FabricText
              ) {
                applyBoardFabricControls(obj);
                canvas.requestRenderAll();
              }
              }
            }
          }
          refreshCalendarControlRef.current(canvas);
        };
        onSelectionChanged = handleSelectionChanged;
        onSelectionCleared = () => refreshCalendarControlRef.current(canvas);
        canvas.on("selection:created", onSelectionChanged);
        canvas.on("selection:updated", onSelectionChanged);
        canvas.on("selection:cleared", onSelectionCleared);
        canvas.on("path:created", (opt) => {
          const path = opt.path;
          if (path) {
            path.set({ markKind: "draw" });
          }
          onHistoryImmediate();
        });
        canvas.on("mouse:dblclick", (opt) => {
          const target = opt.target;
          if (!target) return;
          if (imageFrameGroupFromTarget(target as FabricObject)) {
            if (enterImageCropModeRef.current(target as FabricObject)) {
              opt.e.preventDefault?.();
              opt.e.stopPropagation?.();
              return;
            }
          }
          let root: FabricObject = target as FabricObject;
          while (root.group) root = root.group as FabricObject;
          if (root instanceof Group && structureProp(root, "structureType") === "checkbox") {
            if (structureProp(target, "structureRole") === "checkbox-label") {
              enterObjectTextEditing(canvas, target as FabricObject);
              opt.e.preventDefault?.();
              opt.e.stopPropagation?.();
              return;
            }
            toggleCheckboxRef.current(canvas, root);
            opt.e.preventDefault?.();
            opt.e.stopPropagation?.();
            return;
          }
          if (enterObjectTextEditing(canvas, target as FabricObject)) {
            opt.e.preventDefault?.();
            opt.e.stopPropagation?.();
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
                (role === "add-button" ||
                  role === "add-row" ||
                  role === "label" ||
                  role === "numbered-list-label" ||
                  role === "checkbox-label" ||
                  role === "bullet-label" ||
                  role === "priority-left" ||
                  role === "priority-right")
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

          if (syncTextFocusRef.current && target) {
            if (!isStickyRect(target as FabricObject) && !stickyGroupFromTarget(target as FabricObject) && !parchmentGroupFromTarget(target as FabricObject)) {
              let root: FabricObject = target;
              while (root.group) root = root.group as FabricObject;
              if (
                (root instanceof IText || root instanceof Textbox) &&
                root.get("markKind") !== "sticky-text" &&
                root.get("markKind") !== "parchment-text" &&
                !structureProp(root, "structureRole")
              ) {
                if (enterObjectTextEditing(canvas, root, true)) {
                  opt.e.preventDefault?.();
                  opt.e.stopPropagation?.();
                  return;
                }
              }
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
        if (onSelectionChanged) {
          canvas.off("selection:created", onSelectionChanged);
          canvas.off("selection:updated", onSelectionChanged);
        }
        if (onSelectionCleared) canvas.off("selection:cleared", onSelectionCleared);
        window.removeEventListener("resize", onResize);
        containerObserver?.disconnect();
        window.clearTimeout(saveTimerRef.current);
        window.clearTimeout(historyTimerRef.current);
        canvas.dispose();
        fabricRef.current = null;
        loadedBoardRef.current = null;
      };
    }, [colorKey, embedded, fitCanvas, readOnly, activeArtboardWidth, activeArtboardHeight]);

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
      requestFabricRender(canvas);
    }, [isActive, readOnly]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (canvas) fitCanvas(canvas);
    }, [cellFit, fitCanvas]);

    useEffect(() => {
      let cancelled = false;
      let frame = 0;

      const runLoad = () => {
        if (cancelled) return;
        const canvas = fabricRef.current;
        if (!fabricCanvasRenderable(canvas)) return;

        const loadKey = boardLayoutLoadKey(boardId, colorKey, layoutJson);
        const lastEmittedLayout = lastEmittedLayoutRef.current;
        if (
          lastEmittedLayout?.boardId === boardId &&
          lastEmittedLayout.json === JSON.stringify(layoutJson)
        ) {
          loadedBoardRef.current = loadKey;
          return;
        }
        if (loadedBoardRef.current === loadKey) return;

        loadedBoardRef.current = loadKey;
        const bg = boardFillForKey(colorKey);
        canvas.backgroundColor = bg;

        const hasObjects =
          layoutJson &&
          typeof layoutJson === "object" &&
          Array.isArray((layoutJson as { objects?: unknown[] }).objects) &&
          ((layoutJson as { objects: unknown[] }).objects?.length ?? 0) > 0;

        if (hasObjects) {
          suppressHistoryRef.current = true;
          void canvas
            .loadFromJSON(layoutJson)
            .then(() => {
              if (cancelled || fabricRef.current !== canvas || loadedBoardRef.current !== loadKey) return;
              if (!fabricCanvasRenderable(canvas)) return;
              canvas.backgroundColor = bg;
              restoreBoardLayoutAfterLoad(canvas);
              for (const obj of canvas.getObjects()) {
                if (structureProp(obj, "structureId")) continue;
                if (obj.get("markKind") || obj instanceof FabricImage) {
                  applyBoardFabricControls(obj);
                }
              }
              if (fabricSelectionControls) {
                for (const obj of canvas.getObjects()) {
                  if (obj instanceof Group && obj.get("markKind") === "shape" && obj.get("textCapable")) {
                    obj.set(FABRIC_CONTROL_STYLE);
                  }
                }
              }
              requestFabricRender(canvas);
              resetHistory(canvas);
              suppressHistoryRef.current = false;
              rebindStructureHandlersRef.current(canvas);
            })
            .catch((err) => {
              console.warn("fabric board load skipped", err);
              if (loadedBoardRef.current === loadKey) {
                loadedBoardRef.current = null;
              }
              suppressHistoryRef.current = false;
            });
          return;
        }

        suppressHistoryRef.current = true;
        canvas.discardActiveObject();
        for (const obj of [...canvas.getObjects()]) {
          canvas.remove(obj);
        }
        canvas.backgroundColor = bg;
        requestFabricRender(canvas);
        resetHistory(canvas);
        suppressHistoryRef.current = false;
        rebindStructureHandlersRef.current(canvas);
      };

      frame = requestAnimationFrame(runLoad);

      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }, [boardId, colorKey, fabricSelectionControls, layoutJson, resetHistory]);

    const addText = useCallback((text = "") => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const t = new IText(text, {
        left: activeArtboardWidth / 2,
        top: activeArtboardHeight * 0.38,
        originX: "center",
        originY: "top",
        fontSize: 42,
        fontFamily: "system-ui, sans-serif",
        fill: MARK_TEXT_FILL,
        fontWeight: "600",
      });
      applyBoardFabricControls(t);
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.requestRenderAll();
      if (fabricSelectionControls) {
        t.enterEditing();
        t.selectAll();
        const hidden = (t as IText & { hiddenTextarea?: HTMLTextAreaElement }).hiddenTextarea;
        if (hidden) {
          hidden.focus({ preventScroll: true });
          hidden.click();
        }
      } else {
        requestAnimationFrame(() => {
          t.enterEditing();
          t.selectAll();
        });
      }
      commitHistorySnapshot();
      scheduleSave();
    }, [commitHistorySnapshot, fabricSelectionControls, readOnly, scheduleSave]);

    const addStickyNote = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const sticky = createStickyNoteGroup({
        left: activeArtboardWidth / 2 - STICKY_DEFAULT_W / 2,
        top: activeArtboardHeight * 0.38 - STICKY_DEFAULT_H / 2,
      });
      canvas.add(sticky);
      canvas.setActiveObject(sticky);
      applyStickyFabricControls(sticky);
      canvas.requestRenderAll();

      commitHistorySnapshot();
      scheduleSave();
    }, [commitHistorySnapshot, readOnly, scheduleSave, activeArtboardWidth, activeArtboardHeight]);

    const addParchmentNote = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const parchment = createParchmentNoteGroup({
        left: activeArtboardWidth / 2 - PARCHMENT_DEFAULT_W / 2,
        top: activeArtboardHeight * 0.38 - PARCHMENT_DEFAULT_H / 2,
      });
      canvas.add(parchment);
      canvas.setActiveObject(parchment);
      applyParchmentFabricControls(parchment);
      canvas.requestRenderAll();
      commitHistorySnapshot();
      scheduleSave();
    }, [commitHistorySnapshot, readOnly, scheduleSave, activeArtboardWidth, activeArtboardHeight]);

    const addTextAtPoint = useCallback((normX: number, normY: number) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;
      const t = new IText("", {
        left: normX * activeArtboardWidth,
        top: normY * activeArtboardHeight,
        fontSize: MARK_TEXT_SIZES.XL,
        fontFamily: "system-ui, sans-serif",
        fill: MARK_TEXT_FILL,
        fontWeight: "600",
      });
      applyBoardFabricControls(t);
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.requestRenderAll();
      if (fabricSelectionControls) {
        t.enterEditing();
        t.selectAll();
        const hidden = (t as IText & { hiddenTextarea?: HTMLTextAreaElement }).hiddenTextarea;
        if (hidden) {
          hidden.focus({ preventScroll: true });
          hidden.click();
        }
      } else {
        requestAnimationFrame(() => {
          t.enterEditing();
          t.selectAll();
        });
      }
      scheduleSave();
    }, [fabricSelectionControls, readOnly, scheduleSave]);

    const addStickyNoteAtPoint = useCallback((normX: number, normY: number) => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly) return;

      const w = STICKY_DEFAULT_W;
      const h = STICKY_DEFAULT_H;

      const sticky = createStickyNoteGroup({
        left: normX * activeArtboardWidth - w / 2,
        top: normY * activeArtboardHeight - h / 2,
      });

      canvas.add(sticky);
      canvas.setActiveObject(sticky);
      applyStickyFabricControls(sticky);
      canvas.requestRenderAll();

      scheduleSave();
    }, [readOnly, scheduleSave, activeArtboardWidth, activeArtboardHeight]);

    const addParchmentNoteAt = useCallback(
      (text: string, x: number, y: number, fill = PARCHMENT_DEFAULT_FILL) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;

        const w = 260;
        const h = 170;

        const parchment = createParchmentNoteGroup({
          left: x * activeArtboardWidth - w / 2,
          top: y * activeArtboardHeight - h / 2,
          width: w,
          height: h,
          fill,
          text,
        });
        canvas.add(parchment);
        canvas.setActiveObject(parchment);
        applyParchmentFabricControls(parchment);
        canvas.requestRenderAll();

        recordHistory();
        scheduleSave();
      },
      [activeArtboardWidth, activeArtboardHeight, readOnly, recordHistory, scheduleSave],
    );

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

    const exitCropMode = useCallback(() => {
      const canvas = fabricRef.current;
      const crop = cropTargetRef.current;
      if (!canvas || !crop) {
        setCropMode(false);
        return;
      }
      crop.group?.set({
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        lockScaling: false,
        lockRotation: false,
        selectable: true,
        evented: true,
        subTargetCheck: false,
      });
      applyBoardFabricControls(crop.group ?? crop.image);
      crop.image.set({
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      });
      if (crop.group) {
        canvas.setActiveObject(crop.group);
      }
      cropTargetRef.current = null;
      setCropMode(false);
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
    }, [recordHistory, scheduleSave]);

    const enterImageCropMode = useCallback(
      (target?: FabricObject | null) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return false;
        const selected = target ?? deleteTargetRef.current ?? canvas.getActiveObject();
        if (!selected) return false;

        let group: Group | null = null;
        let image: FabricImage | null = null;

        const frame = imageFrameGroupFromTarget(selected);
        if (frame) {
          group = frame;
          image = boardImageFromTarget(selected);
        } else if (selected instanceof FabricImage) {
          image = boardImageFromTarget(selected);
        }

        if (!image) return false;

        setQuickSelector(null);
        deleteTargetRef.current = group ?? image;
        group?.set({
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          lockScaling: true,
          lockRotation: true,
          selectable: false,
          evented: false,
        });
        image.set({
          hasControls: true,
          hasBorders: true,
          selectable: true,
          evented: true,
          lockRotation: true,
        });
        applyBoardFabricControls(image);
        canvas.setActiveObject(image);
        cropTargetRef.current = { group, image };
        setCropMode(true);
        canvas.requestRenderAll();
        return true;
      },
      [readOnly],
    );
    enterImageCropModeRef.current = enterImageCropMode;

    const toggleImageRoundOnActive = useCallback(
      () => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const targets = getRadialActionTargets();
        if (!targets.length) return;
        let changed = false;
        for (const selected of targets) {
          const frame = imageFrameGroupFromTarget(selected);
          if (frame) continue;
          const image = boardImageFromTarget(selected);
          if (!image) continue;
          const current = Number(image.get("imageCornerRadius") ?? 0);
          applyImageCornerRadius(image, current > 0 ? 0 : 32);
          changed = true;
        }
        if (!changed) return;
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [getRadialActionTargets, readOnly, recordHistory, scheduleSave],
    );

    const toggleLineDashOnActive = useCallback(
      () => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const targets = getRadialActionTargets();
        if (!targets.length) return;
        let changed = false;

        for (const selected of targets) {
          let root: FabricObject = selected;
          while (root.group) root = root.group as FabricObject;

          if (structureProp(root, "structureType") === "divider" && root instanceof Rect) {
            const left = root.left ?? 0;
            const top = root.top ?? 0;
            const width = Math.max(80, (root.width ?? 80) * (root.scaleX ?? 1));
            const color = String(root.get("structureColor") ?? root.fill ?? DECAL_LINE);
            const structureId = String(root.get("structureId") ?? createStructureId());
            const angle = root.angle ?? 0;
            const line = createDynamicDividerDecal(left - width / 2, top, width, true);
            line.set({ structureId, structureColor: color, stroke: color, angle });
            canvas.remove(root);
            canvas.add(line);
            line.setCoords();
            changed = true;
            continue;
          }

          const dashed =
            !!root.get("lineDashed") ||
            (Array.isArray(root.get("strokeDashArray")) && (root.get("strokeDashArray") as number[]).length > 0);
          const nextDashed = !dashed;

          if (structureProp(root, "structureType") === "divider" && root instanceof Line) {
            root.set({
              strokeDashArray: nextDashed ? LINE_DASH_PATTERN : undefined,
              lineDashed: nextDashed,
            });
            changed = true;
          } else if (root.get("markKind") === "shape" && root.get("shapeType") === "line" && root instanceof Line) {
            root.set({
              strokeDashArray: nextDashed ? LINE_DASH_PATTERN : undefined,
              lineDashed: nextDashed,
            });
            changed = true;
          } else if (root.get("markKind") === "draw" || root.type === "path") {
            root.set({
              strokeDashArray: nextDashed ? LINE_DASH_PATTERN : undefined,
              lineDashed: nextDashed,
            });
            changed = true;
          }
        }

        if (!changed) return;
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [getRadialActionTargets, readOnly, recordHistory, scheduleSave],
    );

    const applyImageFrameToActive = useCallback(
      (shapeType: BoardMarkShapeType) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly || !IMAGE_FRAME_SHAPES.has(shapeType)) return;
        const targets = getRadialActionTargets();
        if (!targets.length) return;

        const nextGroups: FabricObject[] = [];
        for (const selected of targets) {
          const group = applyImageFrameToRoot(canvas, selected, shapeType);
          if (group) nextGroups.push(group);
        }
        if (!nextGroups.length) return;

        restoreRadialSelection(canvas, nextGroups);
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [getRadialActionTargets, readOnly, recordHistory, restoreRadialSelection, scheduleSave],
    );

    const addShapeAtPoint = useCallback(
      (shapeType: BoardMarkShapeType, normX: number, normY: number, stroke = MARK_SHAPE_STROKE) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const cx = normX * activeArtboardWidth;
        const cy = normY * activeArtboardHeight;

        if (TEXT_CAPABLE_SHAPES.has(shapeType)) {
          const group = createTextCapableShapeGroup(shapeType, cx, cy, stroke);
          applyBoardFabricControls(group);
          canvas.add(group);
          enterObjectTextEditing(canvas, group, fabricSelectionControls);
          scheduleSave();
          return;
        }

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
        } else if (shapeType === "check") {
          shape = new Path(
            "M 14 50 L 36 72 L 82 24",
            {
              left: cx - 48,
              top: cy - 48,
              fill: "transparent",
              stroke,
              strokeWidth: 10,
              strokeLineCap: "round",
              strokeLineJoin: "round",
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
        } else if (shapeType === "heart") {
          shape = new Path(
            "M 50 88 C 20 66 6 52 6 34 C 6 20 16 10 30 10 C 38 10 45 14 50 20 C 55 14 62 10 70 10 C 84 10 94 20 94 34 C 94 52 80 66 50 88 Z",
            {
              left: cx - 50,
              top: cy - 50,
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "bubble") {
          shape = new Path(
            "M 8 10 Q 8 2 16 2 L 104 2 Q 112 2 112 10 L 112 58 Q 112 66 104 66 L 58 66 L 44 82 L 46 66 L 16 66 Q 8 66 8 58 Z",
            {
              left: cx - 60,
              top: cy - 42,
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else if (shapeType === "cylinder") {
          shape = new Path(
            "M 16 14 Q 16 2 60 2 Q 104 2 104 14 L 104 72 Q 104 84 60 84 Q 16 84 16 72 Z M 16 14 Q 16 26 60 26 Q 104 26 104 14",
            {
              left: cx - 60,
              top: cy - 43,
              fill,
              stroke,
              strokeWidth: 3,
              ...mark,
            },
          );
        } else {
          // arrow
          shape = new Path("M 0 0 L 92 0 L 92 -16 L 128 0 L 92 16 L 92 0 L 0 0 Z", {
            left: cx - 64,
            top: cy - 16,
            fill,
            stroke,
            strokeWidth: 3,
            ...mark,
          });
        }
        applyBoardFabricControls(shape);
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
          left: normX * activeArtboardWidth,
          top: normY * activeArtboardHeight,
          fontSize: 72,
          fontFamily: "system-ui, sans-serif",
          originX: "center",
          originY: "center",
          markKind: "sticker",
          stickerId,
        });
        applyBoardFabricControls(sticker);
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
        const targets = getRadialActionTargets();
        if (!targets.length) return;
        const nextObjects: FabricObject[] = [];

        for (const selected of targets) {
          let root: FabricObject = selected;
          while (root.group) root = root.group as FabricObject;
          if (root.get("markKind") !== "shape") continue;
          const center = root.getCenterPoint();
          const stroke = (root.stroke as string) || MARK_SHAPE_STROKE;
          let existingText = "";
          if (root instanceof Group && root.get("textCapable")) {
            const textObj = findEditableTextInGroup(root);
            existingText = textObj?.text ?? "";
          }
          canvas.remove(root);
          if (TEXT_CAPABLE_SHAPES.has(shapeType)) {
            const group = createTextCapableShapeGroup(shapeType, center.x, center.y, stroke);
            const textObj = findEditableTextInGroup(group);
            if (textObj && existingText) textObj.set("text", existingText);
            applyBoardFabricControls(group);
            canvas.add(group);
            nextObjects.push(group);
          } else {
            addShapeAtPoint(shapeType, center.x / activeArtboardWidth, center.y / activeArtboardHeight, stroke);
          }
        }

        deleteTargetRef.current = null;
        radialTargetsRef.current = [];
        if (nextObjects.length) restoreRadialSelection(canvas, nextObjects);
        canvas.requestRenderAll();
        recordHistory();
      },
      [activeArtboardHeight, activeArtboardWidth, addShapeAtPoint, getRadialActionTargets, readOnly, recordHistory, restoreRadialSelection],
    );

    const swapMarkSticker = useCallback(
      (stickerId: BoardMarkStickerId) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const targets = getRadialActionTargets();
        if (!targets.length) return;
        let changed = false;
        for (const selected of targets) {
          let root: FabricObject = selected;
          while (root.group) root = root.group as FabricObject;
          if (root.get("markKind") !== "sticker" || !(root instanceof FabricText)) continue;
          root.set({ text: BOARD_MARK_STICKER_EMOJI[stickerId], stickerId });
          changed = true;
        }
        if (!changed) return;
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [getRadialActionTargets, readOnly, recordHistory, scheduleSave],
    );

    const placeImage = (canvas: Canvas, img: FabricImage, options?: ImageFitOptions) => {
      const fit = options?.fit ?? "default";
      const centerX =
        typeof options?.normX === "number" ? options.normX * activeArtboardWidth : activeArtboardWidth / 2;
      const centerY =
        typeof options?.normY === "number" ? options.normY * activeArtboardHeight : activeArtboardHeight / 2;
      if (fit === "cover") {
        const iw = img.width || 1;
        const ih = img.height || 1;
        const imgAspect = iw / ih;
        const boardAspect = activeArtboardWidth / activeArtboardHeight;
        let scale: number;
        if (imgAspect > boardAspect) {
          scale = activeArtboardHeight / ih;
        } else {
          scale = activeArtboardWidth / iw;
        }
        img.set({
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });
      } else {
        const iw = img.width || 1;
        const ih = img.height || 1;
        const maxWidth = activeArtboardWidth * 0.36;
        const maxHeight = activeArtboardHeight * 0.42;
        const scale = Math.min(maxWidth / iw, maxHeight / ih, 1);
        img.set({
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center",
          angle: 0,
          scaleX: scale,
          scaleY: scale,
        });
      }
      img.set({ markKind: "image" });
      applyBoardFabricControls(img);
      canvas.add(img);
      if (options?.sendToBack) {
        canvas.sendObjectToBack(img);
      }
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      recordHistoryRef.current();
      scheduleSaveRef.current();
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

      const t = new IText(text, {
        left,
        top,
        fontSize,
        fontFamily: "system-ui, sans-serif",
        fill: MARK_TEXT_FILL,
        fontWeight: "600",
        originX: "center",
        originY: "center",
        markKind: "text",
      });

      applyBoardFabricControls(t);
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.requestRenderAll();

      recordHistory();
      scheduleSave();
    }, [readOnly, recordHistory, scheduleSave]);

    const addTextNormalized = useCallback(
      (text: string, x: number, y: number, fontSize = 36, fill = MARK_TEXT_FILL) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;

        const t = new IText(text, {
          left: x * activeArtboardWidth,
          top: y * activeArtboardHeight,
          fontSize,
          fontFamily: "system-ui, sans-serif",
          fill,
          fontWeight: "600",
          originX: "center",
          originY: "center",
          markKind: "text",
        });
        applyBoardFabricControls(t);
        canvas.add(t);
        canvas.setActiveObject(t);
        canvas.requestRenderAll();

        recordHistory();
        scheduleSave();
      },
      [activeArtboardWidth, activeArtboardHeight, readOnly, recordHistory, scheduleSave],
    );

    const addStickyNoteAt = useCallback(
      (text: string, x: number, y: number, fill = "#FFF9C4") => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;

        const w = 260;
        const h = 170;

        const sticky = createStickyNoteGroup({
          left: x * activeArtboardWidth - w / 2,
          top: y * activeArtboardHeight - h / 2,
          width: w,
          height: h,
          fill,
          text,
        });
        canvas.add(sticky);
        canvas.setActiveObject(sticky);
        applyStickyFabricControls(sticky);
        canvas.requestRenderAll();

        recordHistory();
        scheduleSave();
      },
      [activeArtboardWidth, activeArtboardHeight, readOnly, recordHistory, scheduleSave],
    );

    const rebindStructureHandlers = useCallback(
      (canvas: Canvas) => {
        if (readOnly) return;

        const addRowForStructure = (structureId: string, structureType: string) => {
          const group = findStructureGroup(canvas, structureId, structureType);
          if (!group) return;
          if (structureType === "priority") addPriorityRow(canvas, group);
          if (structureType === "numbered_list") addNumberedListRow(canvas, group);
          group.setCoords();
          recordHistory();
          scheduleSave();
          rebindStructureHandlersRef.current(canvas);
        };

        walkStructureObjects(canvas, (obj) => {
          if (!(obj instanceof IText) && !(obj instanceof Textbox)) return;
          const role = structureProp(obj, "structureRole");
          if (
            role !== "label" &&
            role !== "priority-left" &&
            role !== "priority-right" &&
            role !== "numbered-list-label"
          )
            return;
          const structureId = structureProp(obj, "structureId") as string | undefined;
          const structureType = structureProp(obj, "structureType") as string | undefined;
          if (!structureId || !structureType) return;
          obj.off("keydown");
          obj.on("keydown", (opt) => {
            const e = (opt as { e?: KeyboardEvent }).e;
            if (!e || e.key !== "Enter") return;
            e.preventDefault();
            obj.exitEditing();
            addRowForStructure(structureId, structureType);
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

        if (role === "label" || role === "priority-left" || role === "priority-right" || role === "numbered-list-label" || role === "checkbox-label" || role === "bullet-label") {
          return enterStructureTextEditing(canvas, target as FabricObject, fabricSelectionControls);
        }

        if (isAddButtonHit(target)) {
          const group = findStructureGroup(canvas, structureId, structureType);
          if (!group) return true;
          if (structureType === "priority") addPriorityRow(canvas, group);
          if (structureType === "numbered_list") addNumberedListRow(canvas, group);
          recordHistory();
          scheduleSave();
          rebindStructureHandlersRef.current(canvas);
          return true;
        }

        return false;
      },
      [fabricSelectionControls, recordHistory, scheduleSave],
    );

    handleStructurePointerRef.current = handleStructurePointer;

    toggleCheckboxRef.current = (canvas, group) => {
      const checked = !structureProp(group, "checked");
      group.set({ checked });
      for (const child of group.getObjects()) {
        child.set({ checked });
        if (child instanceof FabricText && structureProp(child, "structureRole") === "checkbox-toggle") {
          child.set({ visible: checked });
        }
      }
      applyDynamicDecalColor(group, String(group.get("structureColor") ?? DECAL_INK));
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
    };

    const placeInteractiveBullet = (left: number, top: number, size: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const bullet = createDynamicBulletDecal(left, top, size);
      canvas.add(bullet);
      bullet.setCoords();
      canvas.setActiveObject(bullet);
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
      rebindStructureHandlersRef.current(canvas);
    };

    const placeInteractiveCheckbox = (left: number, top: number, size: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const group = createDynamicCheckboxDecal(left, top, size);
      canvas.add(group);
      group.setCoords();
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
      rebindStructureHandlersRef.current(canvas);
    };

    const placeInteractivePriority = (left: number, top: number, width: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const group = createPriorityGroup(left, top, width);
      canvas.add(group);
      group.setCoords();
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
        if (!canvas || readOnly || !activeArtboardWidth || !activeArtboardHeight) return;

        const left = x * activeArtboardWidth;
        const top = y * activeArtboardHeight;
        const width = w * activeArtboardWidth;
        const height = h * activeArtboardHeight;

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

        if (diagram === "checkbox" || (diagram as string) === "checklist") {
          const size = Math.max(48, Math.min(width, height));
          placeInteractiveCheckbox(left, top, size);
          return;
        }

        if (diagram === "numbered_list") {
          const group = createDynamicNumberedListDecal({
            left,
            top,
            width,
            height,
            items,
          });
          canvas.add(group);
          group.setCoords();
          canvas.setActiveObject(group);
          canvas.requestRenderAll();
          recordHistory();
          scheduleSave();
          rebindStructureHandlersRef.current(canvas);
          return;
        }

        if (diagram === "bullet") {
          const size = Math.max(12, Math.min(width, height));
          placeInteractiveBullet(left + width / 2, top + height / 2, size);
          return;
        }

        if (diagram === "calendar") {
          const now = new Date();
          const group = createDynamicCalendarDecal({
            left,
            top,
            width,
            height,
            month: now.getMonth(),
            year: now.getFullYear(),
          });
          canvas.add(group);
          group.setCoords();
          canvas.setActiveObject(group);
          setCalendarControl({
            structureId: String(group.get("structureId")),
            month: clampCalendarMonth(Number(group.get("calendarMonth"))),
            year: clampCalendarYear(Number(group.get("calendarYear"))),
          });
          canvas.requestRenderAll();
          recordHistory();
          scheduleSave();
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
          const group = createDynamicEisenhowerMatrixDecal({
            left,
            top,
            width,
            height,
          });
          canvas.add(group);
          group.setCoords();
          canvas.setActiveObject(group);
          canvas.requestRenderAll();
          recordHistory();
          scheduleSave();
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
          const divider = createDynamicDividerDecal(left, top + height / 2, width);
          canvas.add(divider);
          divider.setCoords();
          canvas.setActiveObject(divider);
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
          ...FABRIC_CONTROL_STYLE,
        });

        applyBoardFabricControls(group);
        canvas.add(group);
        group.setCoords();
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [activeArtboardHeight, activeArtboardWidth, fabricSelectionControls, readOnly, recordHistory, scheduleSave],
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
        width: activeArtboardWidth,
        height: activeArtboardHeight,
      });
      await temp.loadFromJSON(fragment);
      const clones = await Promise.all(temp.getObjects().map((obj) => obj.clone()));
      temp.dispose();
      for (const obj of clones) {
        const added = obj as FabricObject;
        canvas.add(added);
        if (isLegacyStickyGroup(added)) {
          restoreStickyAfterLoad(added);
        } else if (isLegacyFlatStickyTextbox(added)) {
          migrateTextboxStickyToGroup(canvas, added);
        } else if (isStickyRect(added)) {
          migrateStickyRectToGroup(canvas, added);
        } else if (added instanceof Group) {
          if (added.get("markKind") === "shape" && added.get("textCapable")) restoreShapeGroupAfterLoad(added);
          else if (structureProp(added, "structureType") === "calendar") restoreCalendarAfterLoad(canvas, added);
          else if (structureProp(added, "structureId")) restoreStructureAfterLoad(added);
        }
        if (!structureProp(added, "structureId")) {
          applyBoardFabricControls(added);
        }
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
        const left = normX * activeArtboardWidth;
        const top = normY * activeArtboardHeight;
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

    const removeElements = useCallback(
      (criteria: {
        element_index?: number;
        match_text?: string;
        kind?: string;
        sticker?: string;
        shape?: string;
        structure?: string;
        all?: boolean;
      }) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return 0;

        const matchText =
          typeof criteria.match_text === "string" ? criteria.match_text.trim().toLowerCase() : "";
        const kindFilter = typeof criteria.kind === "string" ? criteria.kind.trim().toLowerCase() : "";
        const stickerFilter = typeof criteria.sticker === "string" ? criteria.sticker.trim().toLowerCase() : "";
        const shapeFilter = typeof criteria.shape === "string" ? criteria.shape.trim().toLowerCase() : "";
        const structureFilter =
          typeof criteria.structure === "string" ? criteria.structure.trim().toLowerCase() : "";

        const textFromObject = (obj: FabricObject): string => {
          if (obj instanceof FabricText || obj instanceof Textbox || obj instanceof IText) {
            return (obj.text ?? "").toString().trim();
          }
          if (obj instanceof Group) {
            for (const child of obj.getObjects()) {
              const nested = textFromObject(child);
              if (nested) return nested;
            }
          }
          return "";
        };

        const describeObject = (obj: FabricObject) => {
          const structureType = structureProp(obj, "structureType") as string | undefined;
          if (structureType) {
            return { kind: "structure", structure: structureType.toLowerCase(), text: "" };
          }
          const markKind = (obj.get("markKind") as string | undefined)?.toLowerCase();
          if (markKind === "sticky") {
            return { kind: "sticky", text: textFromObject(obj).toLowerCase() };
          }
          if (markKind === "parchment") {
            return { kind: "parchment", text: textFromObject(obj).toLowerCase() };
          }
          if (markKind === "sticker") {
            return {
              kind: "sticker",
              sticker: String(obj.get("stickerId") ?? "").toLowerCase(),
              text: textFromObject(obj).toLowerCase(),
            };
          }
          if (markKind === "shape") {
            return {
              kind: "shape",
              shape: String(obj.get("shapeType") ?? "shape").toLowerCase(),
              text: textFromObject(obj).toLowerCase(),
            };
          }
          if (markKind === "image" || markKind === "image-frame") {
            return { kind: "image", text: "" };
          }
          if (obj instanceof FabricImage) {
            return { kind: markKind === "sticker" ? "sticker" : "image", text: "" };
          }
          if (obj instanceof FabricText || obj instanceof Textbox || obj instanceof IText) {
            return {
              kind: markKind === "sticker" ? "sticker" : "text",
              text: textFromObject(obj).toLowerCase(),
            };
          }
          return { kind: "element", text: textFromObject(obj).toLowerCase() };
        };

        const objects = canvas.getObjects();
        const matchesIndex = (index: number) =>
          typeof criteria.element_index === "number" &&
          Number.isFinite(criteria.element_index) &&
          Math.round(criteria.element_index) === index;

        const matchesCriteria = (obj: FabricObject, index: number) => {
          if (matchesIndex(index)) return true;
          const desc = describeObject(obj);
          if (kindFilter && desc.kind !== kindFilter) return false;
          if (stickerFilter && (!("sticker" in desc) || desc.sticker !== stickerFilter)) return false;
          if (shapeFilter && (!("shape" in desc) || desc.shape !== shapeFilter)) return false;
          if (structureFilter && (!("structure" in desc) || desc.structure !== structureFilter)) return false;
          if (matchText && !desc.text.includes(matchText)) return false;
          if (!kindFilter && !stickerFilter && !shapeFilter && !structureFilter && !matchText) return false;
          return true;
        };

        const toRemove: FabricObject[] = [];
        for (let index = 0; index < objects.length; index += 1) {
          const obj = objects[index];
          if (!matchesCriteria(obj, index)) continue;
          toRemove.push(obj);
          if (!criteria.all) break;
        }

        if (!criteria.all && toRemove.length > 1) {
          toRemove.length = 1;
        }

        if (!toRemove.length) return 0;

        canvas.discardActiveObject();
        for (const obj of toRemove) {
          if (obj instanceof IText || obj instanceof Textbox) {
            if (obj.isEditing) obj.exitEditing();
          }
          canvas.remove(obj);
        }
        deleteTargetRef.current = null;
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
        return toRemove.length;
      },
      [readOnly, recordHistory, scheduleSave],
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
      if (!activeObject && radialTargetsRef.current.length) {
        if (radialTargetsRef.current.length === 1) {
          activeObject = radialTargetsRef.current[0];
        } else {
          activeObject = new ActiveSelection(radialTargetsRef.current, { canvas });
        }
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
      radialTargetsRef.current = [];
      canvas.requestRenderAll();
      recordHistory();
      scheduleSave();
    }, [readOnly, recordHistory, scheduleSave]);

    const resetBoard = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || readOnly || !fabricCanvasRenderable(canvas)) return;
      const bg = boardFillForKey(colorKey);

      window.clearTimeout(saveTimerRef.current);
      window.clearTimeout(historyTimerRef.current);
      suppressHistoryRef.current = true;

      canvas.discardActiveObject();
      for (const obj of [...canvas.getObjects()]) {
        canvas.remove(obj);
      }
      canvas.backgroundColor = bg;
      requestFabricRender(canvas);
      deleteTargetRef.current = null;

      resetHistory(canvas);
      suppressHistoryRef.current = false;

      onSave(withArtboardMeta(canvas.toJSON() as Record<string, unknown>, artboardSize));
    }, [artboardSize, colorKey, onSave, readOnly, resetHistory]);

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

    const applyMarkFontSize = useCallback(
      (size: BoardMarkTextSize) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const targets = getRadialActionTargets();
        if (!targets.length) return;
        const fontSize = MARK_TEXT_SIZES[size];
        let changed = false;

        for (const selected of targets) {
          const root = topLevelBoardRoot(selected);
          if (root instanceof IText || root instanceof Textbox || root instanceof FabricText) {
            root.set("fontSize", fontSize);
            changed = true;
          } else if (root instanceof Group) {
            const text = root.getObjects().find((o) => o instanceof Textbox || o instanceof IText || o instanceof FabricText);
            if (text instanceof Textbox || text instanceof IText || text instanceof FabricText) {
              text.set("fontSize", fontSize);
              changed = true;
            }
          }
        }

        if (!changed) return;
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [getRadialActionTargets, readOnly, recordHistory, scheduleSave],
    );

    const applyMarkTextAlign = useCallback(
      (align: BoardMarkTextAlign) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const targets = getRadialActionTargets();
        if (!targets.length) return;
        let changed = false;

        for (const selected of targets) {
          const root = topLevelBoardRoot(selected);
          if (root instanceof IText || root instanceof Textbox || root instanceof FabricText) {
            root.set("textAlign", align);
            changed = true;
          } else if (root instanceof Group) {
            const text = root.getObjects().find((o) => o instanceof Textbox || o instanceof IText || o instanceof FabricText);
            if (text instanceof Textbox || text instanceof IText || text instanceof FabricText) {
              text.set("textAlign", align);
              changed = true;
            }
          }
        }

        if (!changed) return;
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [getRadialActionTargets, readOnly, recordHistory, scheduleSave],
    );

    const applyMarkFontFamily = useCallback(
      (font: BoardMarkTextFont) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const targets = getRadialActionTargets();
        if (!targets.length) return;
        const fontFamily = MARK_TEXT_FONTS[font];
        let changed = false;

        for (const selected of targets) {
          const root = topLevelBoardRoot(selected);
          if (root instanceof IText || root instanceof Textbox || root instanceof FabricText) {
            root.set("fontFamily", fontFamily);
            changed = true;
          } else if (root instanceof Group) {
            const text = root.getObjects().find((o) => o instanceof Textbox || o instanceof IText || o instanceof FabricText);
            if (text instanceof Textbox || text instanceof IText || text instanceof FabricText) {
              text.set("fontFamily", fontFamily);
              changed = true;
            }
          }
        }

        if (!changed) return;
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [getRadialActionTargets, readOnly, recordHistory, scheduleSave],
    );

    const applyMarkColor = useCallback(
      (hex: string) => {
        const canvas = fabricRef.current;
        if (!canvas || readOnly) return;
        const targets = getRadialActionTargets();
        if (!targets.length) return;

        if (targets.length === 1) {
          const selected = deleteTargetRef.current ?? targets[0];
          const selectedRole = structureProp(selected as unknown as FabricObjectType, "structureRole");
          const selectedStructureType = structureProp(selected as unknown as FabricObjectType, "structureType");
          if (
            selectedStructureType === "eisenhower" &&
            typeof selectedRole === "string" &&
            selectedRole.startsWith("eisenhower-quadrant-") &&
            selected instanceof Rect
          ) {
            selected.set({ fill: hex, quadrantColor: hex });
            canvas.requestRenderAll();
            recordHistory();
            scheduleSave();
            return;
          }
        }

        const isTextObject = (o: FabricObject) =>
          o instanceof IText ||
          o instanceof Textbox ||
          o instanceof FabricText ||
          o.type === "i-text" ||
          o.type === "textbox" ||
          o.type === "text";

        let changed = false;
        for (const selected of targets) {
          let root: FabricObject = topLevelBoardRoot(selected);

          const structureType = structureProp(root, "structureType");
          if (
            structureType === "calendar" ||
            structureType === "eisenhower" ||
            structureType === "checkbox" ||
            structureType === "numbered_list" ||
            structureType === "bullet" ||
            structureType === "divider"
          ) {
            applyDynamicDecalColor(root, hex);
            changed = true;
          } else if (isTextObject(root)) {
            root.set("fill", hex);
            changed = true;
          } else if (isStickyRect(root)) {
            root.set({ fill: hex, stroke: stickyStrokeForFill(hex) });
            changed = true;
          } else if (root.get("markKind") === "sticky") {
            const rect = root.getObjects().find((o) => o.get("markKind") === "sticky-bg");
            if (rect instanceof Rect) {
              rect.set({ fill: hex, stroke: hex === "#FFF9C4" ? "#E8D44D" : hex });
              changed = true;
            }
          } else if (root.get("markKind") === "parchment") {
            applyParchmentSurfaceColor(root as Group, hex);
            changed = true;
          } else if (root.get("markKind") === "shape" && root.get("textCapable")) {
            const shapeObj = root
              .getObjects()
              .find((o) => o.get("markKind") !== "shape-text" && !(o instanceof Textbox) && !(o instanceof IText));
            if (shapeObj) {
              shapeObj.set({ stroke: hex, fill: `${hex}33` });
              drawColorRef.current = hex;
              changed = true;
            }
          } else if (root.get("markKind") === "shape") {
            root.set({ stroke: hex, fill: `${hex}33` });
            drawColorRef.current = hex;
            changed = true;
          } else if (root.get("markKind") === "draw" || root.type === "path") {
            root.set({ stroke: hex });
            drawColorRef.current = hex;
            changed = true;
          } else if (root instanceof Group) {
            const rect = root.getObjects().find((o) => o.get("markKind") === "sticky-bg");
            const shapeObj = root
              .getObjects()
              .find((o) => o.get("markKind") !== "shape-text" && !(o instanceof Textbox) && !(o instanceof IText));
            const textbox = root.getObjects().find((o) => o instanceof Textbox);
            if (rect instanceof Rect && textbox instanceof Textbox) {
              rect.set({ fill: hex, stroke: hex === "#FFF9C4" ? "#E8D44D" : hex });
              changed = true;
            } else if (shapeObj && root.get("textCapable")) {
              shapeObj.set({ stroke: hex, fill: `${hex}33` });
              changed = true;
            } else {
              const text = root.getObjects().find(isTextObject);
              if (text) {
                text.set("fill", hex);
                changed = true;
              }
            }
          }
        }

        if (!changed) return;
        canvas.requestRenderAll();
        recordHistory();
        scheduleSave();
      },
      [getRadialActionTargets, readOnly, recordHistory, scheduleSave],
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
        if (cropMode && e.key === "Escape") {
          e.preventDefault();
          exitCropMode();
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
    }, [copySelected, cropMode, deleteSelected, drawingMode, exitCropMode, exitDrawMode, pasteClipboard, readOnly, redo, selectAllObjects, undo]);

    useEffect(() => {
      if (isActive) return;
      exitDrawMode();
      exitCropMode();
    }, [exitCropMode, exitDrawMode, isActive]);

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
        if (action === "statement") {
          flushSync(() => setQuickSelector(null));
          deleteTargetRef.current = null;
          addTextAtPoint(normX, normY);
          return;
        }
        setQuickSelector(null);
        deleteTargetRef.current = null;
        if (action === "sticky") addStickyNoteAtPoint(normX, normY);
        else if (action === "image") onRequestImagePick?.();
        else if (action === "draw") startDrawMode();
        else if (action === "paste") void pasteAtPoint(normX, normY);
      },
      [
        addStickyNoteAtPoint,
        addTextAtPoint,
        copySelected,
        deleteSelected,
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

    const handleStructurePick = useCallback(
      (diagram: BoardDiagramType) => {
        if (!quickSelector) return;
        const { normX, normY } = quickSelector;
        const placement = STRUCTURE_DECAL_SIZE[diagram] ?? { x: 0.12, y: 0.28, w: 0.72, h: 0.22 };
        const w = placement.w;
        const h = placement.h;
        const items = PLOT_STRUCTURES.find((s) => s.type === diagram)?.items;
        addDiagramOverlay(
          diagram,
          Math.max(0, Math.min(1 - w, normX - w / 2)),
          Math.max(0, Math.min(1 - h, normY - h / 2)),
          w,
          h,
          items,
        );
        setQuickSelector(null);
        deleteTargetRef.current = null;
      },
      [addDiagramOverlay, quickSelector],
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
      if (readOnly || !fabricSelectionControls) return;
      const wrap = canvasWrapRef.current;
      if (!wrap) return;

      let longPressTimer: number | undefined;
      let touchStartX = 0;
      let touchStartY = 0;
      let drawTapStartX = 0;
      let drawTapStartY = 0;
      let drawTapHadMove = false;
      let pinchGestureActive = false;
      let pinchStartFingerAngle = 0;
      let pinchStartFingerDist = 0;
      let pinchStartObjectAngle = 0;
      let pinchStartScaleX = 1;
      let pinchStartScaleY = 1;
      let pinchGestureTarget: FabricObject | null = null;
      const lastTapRef = { time: 0, target: null as FabricObject | null };
      const lastDrawTapRef = { time: 0 };

      const fingerAngle = (t1: Touch, t2: Touch) =>
        (Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180) / Math.PI;

      const fingerDistance = (t1: Touch, t2: Touch) =>
        Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      const clampPinchScale = (value: number) => {
        const sign = Math.sign(value) || 1;
        const magnitude = Math.min(20, Math.max(0.05, Math.abs(value)));
        return sign * magnitude;
      };

      const touchScenePoint = (canvas: Canvas, touch: Touch) =>
        canvas.getScenePoint({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);

      const isPinchGestureTarget = (obj: FabricObject | null | undefined): obj is FabricObject => {
        if (!obj) return false;
        if (obj instanceof IText || obj instanceof Textbox) {
          if (obj.isEditing) return false;
        }
        const root = topLevelBoardRoot(obj);
        if (structureProp(root, "structureType")) return false;
        return !obj.lockRotation || !obj.lockScaling;
      };

      const pinchTargetForTouches = (canvas: Canvas, t1: Touch, t2: Touch): FabricObject | null => {
        const active = canvas.getActiveObject();
        if (!isPinchGestureTarget(active)) return null;
        const root = topLevelBoardRoot(active);
        root.setCoords();
        const rect = root.getBoundingRect();
        const pad = 28;
        const inRect = (x: number, y: number) =>
          x >= rect.left - pad &&
          x <= rect.left + rect.width + pad &&
          y >= rect.top - pad &&
          y <= rect.top + rect.height + pad;
        const p1 = touchScenePoint(canvas, t1);
        const p2 = touchScenePoint(canvas, t2);
        if (!inRect(p1.x, p1.y) || !inRect(p2.x, p2.y)) return null;
        return active;
      };

      const isStatementTarget = (obj: FabricObject | undefined): boolean => {
        if (!obj) return false;
        if (isStickyRect(obj) || stickyGroupFromTarget(obj) || parchmentGroupFromTarget(obj)) return false;
        let root: FabricObject = obj;
        while (root.group) root = root.group as FabricObject;
        return (
          (root instanceof IText || root instanceof Textbox) &&
          root.get("markKind") !== "sticky-text" &&
          root.get("markKind") !== "parchment-text" &&
          !structureProp(root, "structureRole")
        );
      };

      const statementRoot = (obj: FabricObject): FabricObject => {
        let root: FabricObject = obj;
        while (root.group) root = root.group as FabricObject;
        return root;
      };

      const textEditTarget = (obj: FabricObject | undefined): FabricObject | null => {
        if (!obj) return null;
        const sticky = stickyGroupFromTarget(obj);
        if (sticky) return sticky;
        const parchment = parchmentGroupFromTarget(obj);
        if (parchment) return parchment;
        if (isStickyRect(obj)) return null;
        let root: FabricObject = obj;
        while (root.group) root = root.group as FabricObject;
        if (root instanceof IText || root instanceof Textbox) return root;
        if (root instanceof Group && root.get("textCapable")) return root;
        return null;
      };

      const onTouchStart = (e: TouchEvent) => {
        if (!isActiveRef.current) return;
        if (e.touches.length === 2) {
          if (longPressTimer) {
            window.clearTimeout(longPressTimer);
            longPressTimer = undefined;
          }
          const activeCanvas = fabricRef.current;
          if (!activeCanvas || activeCanvas.isDrawingMode || cropModeRef.current) return;
          const target = pinchTargetForTouches(activeCanvas, e.touches[0], e.touches[1]);
          if (!target) return;
          pinchGestureActive = true;
          pinchGestureTarget = target;
          pinchStartFingerAngle = fingerAngle(e.touches[0], e.touches[1]);
          pinchStartFingerDist = fingerDistance(e.touches[0], e.touches[1]);
          pinchStartObjectAngle = target.angle ?? 0;
          pinchStartScaleX = target.scaleX ?? 1;
          pinchStartScaleY = target.scaleY ?? 1;
          return;
        }
        if (e.touches.length !== 1) return;
        if (fabricRef.current?.isDrawingMode) {
          drawTapStartX = e.touches[0].clientX;
          drawTapStartY = e.touches[0].clientY;
          drawTapHadMove = false;
          return;
        }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        if (isStatementTarget(fabricRef.current?.findTarget(e) as FabricObject | undefined)) return;
        longPressTimer = window.setTimeout(() => {
          const activeCanvas = fabricRef.current;
          if (!activeCanvas) return;
          if (navigator.vibrate) navigator.vibrate(10);
          openQuickSelectorRef.current(activeCanvas, e, activeCanvas.findTarget(e) ?? undefined);
        }, 420);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (pinchGestureActive && e.touches.length === 2 && pinchGestureTarget && fabricRef.current) {
          e.preventDefault();
          const target = pinchGestureTarget;
          const updates: Partial<FabricObject> = {};

          if (!target.lockScaling && pinchStartFingerDist > 0) {
            const ratio = fingerDistance(e.touches[0], e.touches[1]) / pinchStartFingerDist;
            updates.scaleX = clampPinchScale(pinchStartScaleX * ratio);
            if (target.lockScalingY) {
              updates.scaleY = pinchStartScaleY;
            } else {
              updates.scaleY = clampPinchScale(pinchStartScaleY * ratio);
            }
          }

          if (!target.lockRotation) {
            const angle = fingerAngle(e.touches[0], e.touches[1]);
            updates.angle = pinchStartObjectAngle + (angle - pinchStartFingerAngle);
          }

          if (Object.keys(updates).length) {
            target.set(updates);
            target.setCoords();
            fabricRef.current.requestRenderAll();
          }
          return;
        }
        if (fabricRef.current?.isDrawingMode && e.touches[0]) {
          const dx = e.touches[0].clientX - drawTapStartX;
          const dy = e.touches[0].clientY - drawTapStartY;
          if (dx * dx + dy * dy > 64) drawTapHadMove = true;
          return;
        }
        if (!longPressTimer || !e.touches[0]) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (dx * dx + dy * dy > 64) {
          window.clearTimeout(longPressTimer);
          longPressTimer = undefined;
        }
      };

      const onTouchEnd = (e: TouchEvent) => {
        if (longPressTimer) window.clearTimeout(longPressTimer);
        longPressTimer = undefined;

        if (pinchGestureActive && e.touches.length < 2) {
          if (pinchGestureTarget) {
            recordHistoryRef.current();
            scheduleSaveRef.current();
          }
          pinchGestureActive = false;
          pinchGestureTarget = null;
          return;
        }

        const activeCanvas = fabricRef.current;
        if (!activeCanvas || !isActiveRef.current) return;

        if (activeCanvas.isDrawingMode) {
          if (!drawTapHadMove && e.changedTouches.length === 1) {
            const now = Date.now();
            if (now - lastDrawTapRef.time < 400) {
              exitDrawMode();
              lastDrawTapRef.time = 0;
            } else {
              lastDrawTapRef.time = now;
            }
          }
          return;
        }

        if (e.changedTouches.length !== 1) return;

        const target = activeCanvas.findTarget(e) as FabricObject | undefined;
        if (isStatementTarget(target)) {
          e.preventDefault();
          enterObjectTextEditing(
            activeCanvas,
            statementRoot(target!),
            true,
          );
          lastTapRef.time = 0;
          lastTapRef.target = null;
          return;
        }

        const editTarget = textEditTarget(target);
        if (!editTarget) {
          lastTapRef.time = 0;
          lastTapRef.target = null;
          return;
        }

        const now = Date.now();
        if (lastTapRef.target === editTarget && now - lastTapRef.time < 400) {
          enterObjectTextEditing(activeCanvas, editTarget, true);
          lastTapRef.time = 0;
          lastTapRef.target = null;
          return;
        }
        lastTapRef.time = now;
        lastTapRef.target = editTarget;
      };

      const touchRoot = wrap;
      const capture = { capture: true as const };
      touchRoot.addEventListener("touchstart", onTouchStart, { passive: true, ...capture });
      touchRoot.addEventListener("touchmove", onTouchMove, { passive: false, ...capture });
      touchRoot.addEventListener("touchend", onTouchEnd, capture);
      touchRoot.addEventListener("touchcancel", onTouchEnd, capture);

      return () => {
        if (longPressTimer) window.clearTimeout(longPressTimer);
        touchRoot.removeEventListener("touchstart", onTouchStart, capture);
        touchRoot.removeEventListener("touchmove", onTouchMove, capture);
        touchRoot.removeEventListener("touchend", onTouchEnd, capture);
        touchRoot.removeEventListener("touchcancel", onTouchEnd, capture);
      };
    }, [exitDrawMode, fabricSelectionControls, readOnly]);

    useImperativeHandle(ref, () => ({
      boardId,
      addText,
      addTextAt,
      addTextNormalized,
      addStickyNote,
      addStickyNoteAt,
      addParchmentNote,
      addParchmentNoteAt,
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
      removeElements,
      resetBoard,
      undo,
      redo,
      canUndo,
      canRedo,
      getLayoutJson: () =>
        withArtboardMeta((fabricRef.current?.toJSON() as Record<string, unknown>) ?? {}, artboardSize),
      addShape: (shape) => addShapeAtPoint(shape, 0.5, 0.5),
      addShapeAt: (shape, x, y) => addShapeAtPoint(shape, x, y),
      addSticker: (sticker) => addStickerAtPoint(sticker, 0.5, 0.5),
      addStickerAt: (sticker, x, y) => addStickerAtPoint(sticker, x, y),
      startDrawMode,
    }), [boardId, addDiagramOverlay, addImageFromFile, addImageFromUrl, addParchmentNote, addParchmentNoteAt, addShapeAtPoint, addStickerAtPoint, addStickyNote, addStickyNoteAt, addText, addTextAt, addTextNormalized, artboardSize, canPasteClipboard, canRedo, canUndo, copySelected, deleteSelected, hasSelection, mergeLayoutObjects, pasteAtPoint, pasteClipboard, redo, removeElements, resetBoard, startDrawMode, undo]);

    return (
      <div
        ref={containerRef}
        style={embedded ? { backgroundColor: boardFillForKey(colorKey) } : undefined}
        className={cn(
          "board-artboard-host h-full w-full",
          embedded
            ? "min-h-0 overflow-auto p-0"
            : "flex min-h-[420px] items-center justify-center bg-[#ebe8e3] p-4",
        )}
      >
        <div
          ref={canvasWrapRef}
          className={cn(
            "relative h-full w-full min-h-0 overflow-auto",
            embedded
              ? ""
              : "min-h-[140px] rounded-sm shadow-[0_2px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)]",
          )}
        >
          <canvas ref={canvasElRef} />
          {!readOnly && isActive && drawingMode && (
            <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border border-stone-300/80 bg-white/95 px-3 py-1 text-[11px] font-medium text-stone-700 shadow-sm">
              {fabricSelectionControls ? "Double tap to finish" : "Esc to finish"}
            </div>
          )}
          {!readOnly && isActive && cropMode && (
            <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={exitCropMode}
                className="rounded-full border border-stone-300/80 bg-white/95 px-3 py-1 text-[11px] font-semibold text-stone-800 shadow-sm hover:bg-white"
              >
                Done
              </button>
            </div>
          )}
          {!readOnly && isActive && calendarControl ? (
            <div
              className="absolute right-3 top-3 z-20 flex items-center gap-2 rounded-full border border-stone-300/80 bg-white/95 px-2 py-1 text-[11px] shadow-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <select
                value={calendarControl.month}
                onChange={(e) => updateSelectedCalendar({ month: Number(e.target.value) })}
                className="h-7 rounded-md border border-stone-200 bg-white px-2 text-[11px] text-stone-800"
                aria-label="Calendar month"
              >
                {CALENDAR_MONTHS.map((monthName, index) => (
                  <option key={monthName} value={index}>
                    {monthName}
                  </option>
                ))}
              </select>

              <select
                value={calendarControl.year}
                onChange={(e) => updateSelectedCalendar({ year: Number(e.target.value) })}
                className="h-7 rounded-md border border-stone-200 bg-white px-2 text-[11px] text-stone-800"
                aria-label="Calendar year"
              >
                {Array.from({ length: 31 }, (_, i) => new Date().getFullYear() - 10 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {!readOnly && isActive && quickSelector && typeof document !== "undefined"
            ? createPortal(
                <BoardMarksQuickSelector
                  x={quickSelector.clientX}
                  y={quickSelector.clientY}
                  fixed
                  mode={quickSelector.mode}
                  textCapable={quickSelector.textCapable}
                  shapeCapable={quickSelector.shapeCapable}
                  stickerCapable={quickSelector.stickerCapable}
                  imageCapable={quickSelector.imageCapable}
                  lineCapable={quickSelector.lineCapable}
                  batchMixed={quickSelector.batchMixed}
                  canPaste={canPasteClipboard()}
                  onPick={handleQuickPick}
                  onClose={closeQuickSelector}
                  boardColorOptions={BOARD_QUICK_PICK_COLORS}
                  activeBoardFill={boardFillForKey(colorKey)}
                  onBoardColorPick={onBoardColorPick}
                  onElementColorPick={applyMarkColor}
                  onElementSizePick={applyMarkFontSize}
                  onElementTextAlignPick={applyMarkTextAlign}
                  onElementFontPick={applyMarkFontFamily}
                  onImageRoundPick={toggleImageRoundOnActive}
                  onImageFramePick={applyImageFrameToActive}
                  onLineDashPick={toggleLineDashOnActive}
                  onShapePick={handleShapePick}
                  onStickerPick={handleStickerPick}
                  onStructurePick={handleStructurePick}
                />,
                document.body,
              )
            : null}
        </div>
      </div>
    );
  },
);
