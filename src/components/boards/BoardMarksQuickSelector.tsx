import { useEffect, useState } from "react";
import {
  ImagePlus,
  ChevronLeft,
  ClipboardCopy,
  ClipboardPaste,
  Palette,
  StickyNote,
  Trash2,
  Type,
  CaseSensitive,
  Pencil,
  Shapes,
  Sparkles,
  Square,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Minus,
  Hexagon,
  Pentagon,
  Star,
  Diamond,
  ArrowRight,
  ChartPie,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BoardMarksQuickAction =
  | "statement"
  | "sticky"
  | "image"
  | "draw"
  | "shapes"
  | "stickers"
  | "edit"
  | "color"
  | "size"
  | "copy"
  | "paste"
  | "delete";

export type BoardMarkTextSize = "S" | "M" | "L" | "XL";

export type BoardMarkShapeType =
  | "rect"
  | "circle"
  | "ellipse"
  | "triangle"
  | "line"
  | "semicircle"
  | "pie"
  | "hexagon"
  | "pentagon"
  | "star"
  | "diamond"
  | "arrow";

export type BoardMarkStickerId =
  | "star"
  | "heart"
  | "check"
  | "sparkles"
  | "target"
  | "fire"
  | "thumbsup"
  | "lightbulb"
  | "sun"
  | "moon"
  | "rainbow"
  | "flower"
  | "leaf"
  | "rocket"
  | "trophy"
  | "medal"
  | "bell"
  | "warning"
  | "exclamation"
  | "question"
  | "smile"
  | "party"
  | "music"
  | "bookmark";

export const BOARD_MARK_SHAPE_OPTIONS: {
  id: BoardMarkShapeType;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "rect", label: "Rect", Icon: Square },
  { id: "circle", label: "Circle", Icon: CircleIcon },
  { id: "ellipse", label: "Ellipse", Icon: CircleIcon },
  { id: "triangle", label: "Triangle", Icon: TriangleIcon },
  { id: "line", label: "Line", Icon: Minus },
  { id: "semicircle", label: "Semi", Icon: ChartPie },
  { id: "pie", label: "Pie", Icon: ChartPie },
  { id: "hexagon", label: "Hex", Icon: Hexagon },
  { id: "pentagon", label: "Pent", Icon: Pentagon },
  { id: "star", label: "Star", Icon: Star },
  { id: "diamond", label: "Diamond", Icon: Diamond },
  { id: "arrow", label: "Arrow", Icon: ArrowRight },
];

/** Unicode emoji only — no third-party artwork; safe for commercial product use. */
export const BOARD_MARK_STICKER_OPTIONS: { id: BoardMarkStickerId; label: string; emoji: string }[] = [
  { id: "star", label: "Star", emoji: "⭐" },
  { id: "heart", label: "Heart", emoji: "❤️" },
  { id: "check", label: "Done", emoji: "✅" },
  { id: "sparkles", label: "Sparkles", emoji: "✨" },
  { id: "target", label: "Target", emoji: "🎯" },
  { id: "fire", label: "Fire", emoji: "🔥" },
  { id: "thumbsup", label: "Thumbs up", emoji: "👍" },
  { id: "lightbulb", label: "Idea", emoji: "💡" },
  { id: "sun", label: "Sun", emoji: "☀️" },
  { id: "moon", label: "Moon", emoji: "🌙" },
  { id: "rainbow", label: "Rainbow", emoji: "🌈" },
  { id: "flower", label: "Flower", emoji: "🌸" },
  { id: "leaf", label: "Growth", emoji: "🌿" },
  { id: "rocket", label: "Launch", emoji: "🚀" },
  { id: "trophy", label: "Trophy", emoji: "🏆" },
  { id: "medal", label: "Medal", emoji: "🏅" },
  { id: "bell", label: "Reminder", emoji: "🔔" },
  { id: "warning", label: "Warning", emoji: "⚠️" },
  { id: "exclamation", label: "Important", emoji: "❗" },
  { id: "question", label: "Question", emoji: "❓" },
  { id: "smile", label: "Smile", emoji: "😊" },
  { id: "party", label: "Celebrate", emoji: "🎉" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "bookmark", label: "Bookmark", emoji: "🔖" },
];

export const BOARD_MARK_STICKER_EMOJI: Record<BoardMarkStickerId, string> = Object.fromEntries(
  BOARD_MARK_STICKER_OPTIONS.map((s) => [s.id, s.emoji]),
) as Record<BoardMarkStickerId, string>;

type BoardMarksQuickSelectorProps = {
  x: number;
  y: number;
  mode: "empty" | "object";
  textCapable?: boolean;
  shapeCapable?: boolean;
  stickerCapable?: boolean;
  canPaste?: boolean;
  onPick: (action: BoardMarksQuickAction) => void;
  onClose: () => void;
  boardColorOptions?: { hex: string; label: string }[];
  activeBoardFill?: string;
  onBoardColorPick?: (hex: string) => void;
  onElementColorPick?: (hex: string) => void;
  onElementSizePick?: (size: BoardMarkTextSize) => void;
  onShapePick?: (shape: BoardMarkShapeType) => void;
  onStickerPick?: (sticker: BoardMarkStickerId) => void;
};

const TEXT_SIZE_OPTIONS: { id: BoardMarkTextSize; label: string }[] = [
  { id: "S", label: "S" },
  { id: "M", label: "M" },
  { id: "L", label: "L" },
  { id: "XL", label: "XL" },
];

const WHEEL = 176;
const CENTER = WHEEL / 2;
const ITEM_RADIUS = 54;
const SWATCH_RADIUS = 74;
const STICKER_INNER_RADIUS = 46;
const SHAPE_INNER_RADIUS = 46;

type WheelItem = {
  id: BoardMarksQuickAction;
  label: string;
  Icon: LucideIcon;
  accent?: string;
};

function spreadAngles(count: number, startDeg = -90): number[] {
  if (count <= 0) return [];
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => startDeg + i * step);
}

const EMPTY_ACTIONS: WheelItem[] = [
  { id: "statement", label: "Text", Icon: Type },
  { id: "image", label: "Image", Icon: ImagePlus },
  { id: "sticky", label: "Note", Icon: StickyNote },
  { id: "draw", label: "Draw", Icon: Pencil },
  { id: "shapes", label: "Shapes", Icon: Shapes },
  { id: "stickers", label: "Stickers", Icon: Sparkles },
  { id: "color", label: "Recolor", Icon: Palette },
];

const OBJECT_ACTIONS: WheelItem[] = [
  { id: "edit", label: "Edit", Icon: Type },
  { id: "size", label: "Size", Icon: CaseSensitive },
  { id: "shapes", label: "Shape", Icon: Shapes },
  { id: "stickers", label: "Sticker", Icon: Sparkles },
  { id: "copy", label: "Copy", Icon: ClipboardCopy },
  { id: "color", label: "Recolor", Icon: Palette },
  { id: "delete", label: "Delete", Icon: Trash2, accent: "text-red-300" },
];

export function BoardMarksQuickSelector({
  x,
  y,
  mode,
  textCapable = false,
  shapeCapable = false,
  stickerCapable = false,
  canPaste = false,
  onPick,
  onClose,
  boardColorOptions = [],
  activeBoardFill,
  onBoardColorPick,
  onElementColorPick,
  onElementSizePick,
  onShapePick,
  onStickerPick,
}: BoardMarksQuickSelectorProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const subMenuOpen = paletteOpen || sizeOpen || shapesOpen || stickersOpen;

  const wheelItems = (() => {
    if (mode === "object") {
      const actions = OBJECT_ACTIONS.filter((item) => {
        if (item.id === "size" || item.id === "edit") return textCapable;
        if (item.id === "shapes") return shapeCapable;
        if (item.id === "stickers") return stickerCapable;
        return true;
      });
      const angles = spreadAngles(actions.length);
      return actions.map((item, i) => ({ ...item, angle: angles[i] }));
    }
    const actions = [
      ...EMPTY_ACTIONS.slice(0, 6),
      ...(canPaste ? [{ id: "paste" as const, label: "Paste", Icon: ClipboardPaste }] : []),
      EMPTY_ACTIONS[6],
    ];
    const angles = spreadAngles(actions.length);
    return actions.map((item, i) => ({ ...item, angle: angles[i] }));
  })();

  const paletteLabel = mode === "empty" ? "Board color" : "Element color";
  const shapesLabel = mode === "empty" ? "Pick shape" : "Change shape";
  const stickersLabel = mode === "empty" ? "Pick sticker" : "Change sticker";

  const backToMain = () => {
    setPaletteOpen(false);
    setSizeOpen(false);
    setShapesOpen(false);
    setStickersOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (paletteOpen) setPaletteOpen(false);
      else if (sizeOpen) setSizeOpen(false);
      else if (shapesOpen) setShapesOpen(false);
      else if (stickersOpen) setStickersOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [onClose, paletteOpen, sizeOpen, shapesOpen, stickersOpen]);

  const handleBackdropClick = () => {
    if (subMenuOpen) backToMain();
    else onClose();
  };

  const handleItemClick = (id: BoardMarksQuickAction) => {
    if (id === "color") {
      setSizeOpen(false);
      setShapesOpen(false);
      setStickersOpen(false);
      setPaletteOpen(true);
      return;
    }
    if (id === "size") {
      setPaletteOpen(false);
      setShapesOpen(false);
      setStickersOpen(false);
      setSizeOpen(true);
      return;
    }
    if (id === "shapes") {
      setPaletteOpen(false);
      setSizeOpen(false);
      setStickersOpen(false);
      setShapesOpen(true);
      return;
    }
    if (id === "stickers") {
      setPaletteOpen(false);
      setSizeOpen(false);
      setShapesOpen(false);
      setStickersOpen(true);
      return;
    }
    onPick(id);
  };

  const handleColorPick = (hex: string) => {
    if (mode === "empty") onBoardColorPick?.(hex);
    else onElementColorPick?.(hex);
    onClose();
  };

  const handleSizePick = (size: BoardMarkTextSize) => {
    onElementSizePick?.(size);
    onClose();
  };

  const handleShapePick = (shape: BoardMarkShapeType) => {
    onShapePick?.(shape);
    onClose();
  };

  const handleStickerPick = (sticker: BoardMarkStickerId) => {
    onStickerPick?.(sticker);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close marks selector"
        className="absolute inset-0 z-30 cursor-default bg-black/10 backdrop-blur-[1px]"
        onClick={handleBackdropClick}
      />
      <div
        className="board-marks-quick-selector pointer-events-none absolute z-40"
        style={{ left: x, top: y }}
        role="menu"
        aria-label="Marks quick selector"
      >
        <div
          className="pointer-events-auto relative -translate-x-1/2 -translate-y-1/2"
          style={{ width: WHEEL, height: WHEEL }}
        >
          <div className="absolute inset-0 rounded-full border border-white/10 bg-neutral-950/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-md" />
          {subMenuOpen ? (
            <button
              type="button"
              title="Back to menu"
              aria-label="Back to menu"
              onClick={(e) => {
                e.stopPropagation();
                backToMain();
              }}
              className="absolute left-1/2 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </button>
          ) : (
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
          )}

          {paletteOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              {paletteLabel}
            </span>
          )}
          {sizeOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              Text size
            </span>
          )}
          {shapesOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-20 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              {shapesLabel}
            </span>
          )}
          {stickersOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-20 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              {stickersLabel}
            </span>
          )}

          {!subMenuOpen &&
            wheelItems.map(({ id, label, Icon, angle, accent }) => {
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * ITEM_RADIUS;
              const top = CENTER + Math.sin(rad) * ITEM_RADIUS;

              return (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  title={label}
                  onClick={() => handleItemClick(id)}
                  className={cn(
                    "absolute flex min-w-[3.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 py-1.5 text-white transition-all",
                    "hover:scale-105 hover:border-white/30 hover:bg-white/20 active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    accent,
                  )}
                  style={{ left, top }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="text-[11px] font-bold leading-none tracking-wide text-white">{label}</span>
                </button>
              );
            })}

          {paletteOpen && boardColorOptions.length > 0 && (
            <>
              {boardColorOptions.slice(0, 8).map((pick, index) => {
                const start = 205;
                const step = 130 / Math.max(boardColorOptions.slice(0, 8).length - 1, 1);
                const angle = start + index * step;
                const rad = (angle * Math.PI) / 180;
                const left = CENTER + Math.cos(rad) * SWATCH_RADIUS;
                const top = CENTER + Math.sin(rad) * SWATCH_RADIUS;
                const active =
                  mode === "empty" && activeBoardFill?.toLowerCase() === pick.hex.toLowerCase();

                return (
                  <button
                    key={pick.hex}
                    type="button"
                    title={`${paletteLabel}: ${pick.label}`}
                    aria-label={`Set ${paletteLabel.toLowerCase()} to ${pick.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorPick(pick.hex);
                    }}
                    className={cn(
                      "absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white/50 transition-transform",
                      "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      active && "scale-110 ring-2 ring-white",
                    )}
                    style={{ left, top, backgroundColor: pick.hex }}
                  />
                );
              })}
            </>
          )}

          {sizeOpen &&
            TEXT_SIZE_OPTIONS.map(({ id, label }, index) => {
              const start = 205;
              const step = 130 / Math.max(TEXT_SIZE_OPTIONS.length - 1, 1);
              const angle = start + index * step;
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * SWATCH_RADIUS;
              const top = CENTER + Math.sin(rad) * SWATCH_RADIUS;

              return (
                <button
                  key={id}
                  type="button"
                  title={`Text size ${label}`}
                  aria-label={`Set text size to ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSizePick(id);
                  }}
                  className={cn(
                    "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[11px] font-bold text-white transition-transform",
                    "hover:scale-110 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  )}
                  style={{ left, top }}
                >
                  {label}
                </button>
              );
            })}

          {shapesOpen &&
            BOARD_MARK_SHAPE_OPTIONS.map(({ id, label, Icon }, index) => {
              const total = BOARD_MARK_SHAPE_OPTIONS.length;
              const perRing = Math.ceil(total / 2);
              const ring = index < perRing ? 0 : 1;
              const ringIndex = ring === 0 ? index : index - perRing;
              const angle = -90 + (360 / perRing) * ringIndex;
              const rad = (angle * Math.PI) / 180;
              const radius = ring === 0 ? SWATCH_RADIUS : SHAPE_INNER_RADIUS;
              const left = CENTER + Math.cos(rad) * radius;
              const top = CENTER + Math.sin(rad) * radius;

              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={`${shapesLabel}: ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShapePick(id);
                  }}
                  className={cn(
                    "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-transform",
                    "hover:scale-110 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  )}
                  style={{ left, top }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              );
            })}

          {stickersOpen &&
            BOARD_MARK_STICKER_OPTIONS.map(({ id, label, emoji }, index) => {
              const total = BOARD_MARK_STICKER_OPTIONS.length;
              const perRing = Math.ceil(total / 2);
              const ring = index < perRing ? 0 : 1;
              const ringIndex = ring === 0 ? index : index - perRing;
              const angle = -90 + (360 / perRing) * ringIndex;
              const rad = (angle * Math.PI) / 180;
              const radius = ring === 0 ? SWATCH_RADIUS : STICKER_INNER_RADIUS;
              const left = CENTER + Math.cos(rad) * radius;
              const top = CENTER + Math.sin(rad) * radius;

              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={`${stickersLabel}: ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStickerPick(id);
                  }}
                  className={cn(
                    "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-base transition-transform",
                    "hover:scale-110 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  )}
                  style={{ left, top }}
                >
                  {emoji}
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}
