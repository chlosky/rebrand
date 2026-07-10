import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  ImagePlus,
  ChevronLeft,
  ClipboardCopy,
  ClipboardPaste,
  Palette,
  StickyNote,
  Trash2,
  Type,
  CaseSensitive,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyCenter,
  Pencil,
  Shapes,
  Sparkles,
  LayoutGrid,
  Square,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Minus,
  Hexagon,
  Pentagon,
  Check,
  Star,
  Diamond,
  ArrowRight,
  Heart,
  MessageCircle,
  Database,
  Radius,
  SquareDashed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLOT_STRUCTURES } from "@/components/boards/BoardPlottingWorkbench";
import type { BoardDiagramType } from "@/components/boards/BoardCanvasEditor";

export type BoardMarksQuickAction =
  | "statement"
  | "sticky"
  | "image"
  | "draw"
  | "shapes"
  | "stickers"
  | "structures"
  | "edit"
  | "color"
  | "size"
  | "copy"
  | "paste"
  | "delete"
  | "round"
  | "frame"
  | "dash";

export type BoardMarkTextSize = "S" | "M" | "L" | "XL";

export type BoardMarkTextAlign = "left" | "center" | "right";

export type BoardMarkTextFont = "sans" | "serif" | "garamond" | "display" | "script";

export const BOARD_MARK_FONT_OPTIONS: {
  id: BoardMarkTextFont;
  label: string;
  fontFamily: string;
}[] = [
  { id: "sans", label: "Sans", fontFamily: "Satoshi, system-ui, sans-serif" },
  { id: "serif", label: "Serif", fontFamily: "Georgia, 'Times New Roman', serif" },
  { id: "garamond", label: "Garamond", fontFamily: '"EB Garamond", Garamond, Georgia, "Times New Roman", serif' },
  { id: "display", label: "Display", fontFamily: '"Bricolage Grotesque", Satoshi, system-ui, sans-serif' },
  { id: "script", label: "Script", fontFamily: "Allura, cursive" },
];

export type BoardMarkShapeType =
  | "rect"
  | "circle"
  | "triangle"
  | "line"
  | "hexagon"
  | "pentagon"
  | "check"
  | "star"
  | "diamond"
  | "arrow"
  | "heart"
  | "bubble"
  | "cylinder"
  | "photo";

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
  { id: "triangle", label: "Triangle", Icon: TriangleIcon },
  { id: "line", label: "Line", Icon: Minus },
  { id: "hexagon", label: "Hex", Icon: Hexagon },
  { id: "pentagon", label: "Pent", Icon: Pentagon },
  { id: "check", label: "Check", Icon: Check },
  { id: "diamond", label: "Diamond", Icon: Diamond },
  { id: "arrow", label: "Arrow", Icon: ArrowRight },
  { id: "heart", label: "Heart", Icon: Heart },
  { id: "bubble", label: "Bubble", Icon: MessageCircle },
  { id: "cylinder", label: "Cylinder", Icon: Database },
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

export const BOARD_MARK_FRAME_OPTIONS: {
  id: BoardMarkShapeType;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "photo", label: "Photo", Icon: ImageIcon },
  { id: "rect", label: "Rect", Icon: Square },
  { id: "circle", label: "Circle", Icon: CircleIcon },
  { id: "heart", label: "Heart", Icon: Heart },
  { id: "star", label: "Star", Icon: Star },
  { id: "hexagon", label: "Hex", Icon: Hexagon },
  { id: "diamond", label: "Diamond", Icon: Diamond },
];

const IMAGE_OBJECT_ACTIONS: WheelItem[] = [
  { id: "edit", label: "Edit", Icon: ImagePlus },
  { id: "round", label: "Round", Icon: Radius },
  { id: "frame", label: "Frame", Icon: Shapes },
  { id: "copy", label: "Copy", Icon: ClipboardCopy },
  { id: "delete", label: "Delete", Icon: Trash2, accent: "text-red-300" },
];

const LINE_OBJECT_ACTIONS: WheelItem[] = [
  { id: "dash", label: "Dash", Icon: SquareDashed },
  { id: "color", label: "Recolor", Icon: Palette },
  { id: "copy", label: "Copy", Icon: ClipboardCopy },
  { id: "delete", label: "Delete", Icon: Trash2, accent: "text-red-300" },
];

type BoardMarksQuickSelectorProps = {
  x: number;
  y: number;
  fixed?: boolean;
  mode: "empty" | "object";
  textCapable?: boolean;
  shapeCapable?: boolean;
  stickerCapable?: boolean;
  imageCapable?: boolean;
  lineCapable?: boolean;
  batchMixed?: boolean;
  batchCount?: number;
  canPaste?: boolean;
  onPick: (action: BoardMarksQuickAction) => void;
  onClose: () => void;
  boardColorOptions?: { hex: string; label: string }[];
  activeBoardFill?: string;
  onBoardColorPick?: (hex: string) => void;
  onElementColorPick?: (hex: string) => void;
  onElementSizePick?: (size: BoardMarkTextSize) => void;
  onElementTextAlignPick?: (align: BoardMarkTextAlign) => void;
  onElementFontPick?: (font: BoardMarkTextFont) => void;
  onImageEditPick?: () => void;
  onImageRoundPick?: () => void;
  onImageFramePick?: (shape: BoardMarkShapeType) => void;
  onLineDashPick?: () => void;
  onShapePick?: (shape: BoardMarkShapeType) => void;
  onStickerPick?: (sticker: BoardMarkStickerId) => void;
  onStructurePick?: (structure: BoardDiagramType) => void;
};

const TEXT_SIZE_OPTIONS: { id: BoardMarkTextSize; label: string }[] = [
  { id: "S", label: "S" },
  { id: "M", label: "M" },
  { id: "L", label: "L" },
  { id: "XL", label: "XL" },
];

const TEXT_ALIGN_OPTIONS: { id: BoardMarkTextAlign; label: string; Icon: LucideIcon }[] = [
  { id: "left", label: "Left", Icon: AlignLeft },
  { id: "center", label: "Center", Icon: AlignCenter },
  { id: "right", label: "Right", Icon: AlignRight },
];

const EDIT_SUBMENU_OPTIONS: { id: "position" | "font"; label: string; Icon: LucideIcon }[] = [
  { id: "position", label: "Position", Icon: AlignHorizontalJustifyCenter },
  { id: "font", label: "Font", Icon: CaseSensitive },
];

const WHEEL_SIZE = 172;
const ITEM_RADIUS = 56;
const SUB_RADIUS = 64;
const INNER_RADIUS = 48;
const WHEEL_PAD = 26;

const mainItemClass =
  "absolute flex min-w-[3.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-full border border-white/10 bg-white/10 px-1 py-1.5 text-white transition-all hover:scale-105 hover:border-white/30 hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

const subItemClass =
  "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-transform hover:scale-110 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

function wheelOuterSize() {
  return WHEEL_SIZE + WHEEL_PAD * 2;
}

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
  { id: "sticky", label: "Note", Icon: StickyNote },
  { id: "draw", label: "Draw", Icon: Pencil },
  { id: "color", label: "Recolor", Icon: Palette },
];

const OBJECT_ACTIONS: WheelItem[] = [
  { id: "edit", label: "Edit", Icon: Type },
  { id: "size", label: "Size", Icon: CaseSensitive },
  { id: "copy", label: "Copy", Icon: ClipboardCopy },
  { id: "color", label: "Recolor", Icon: Palette },
  { id: "delete", label: "Delete", Icon: Trash2, accent: "text-red-300" },
];

export function BoardMarksQuickSelector({
  x,
  y,
  fixed = false,
  mode,
  textCapable = false,
  shapeCapable = false,
  stickerCapable = false,
  imageCapable = false,
  lineCapable = false,
  batchMixed = false,
  batchCount,
  canPaste = false,
  onPick,
  onClose,
  boardColorOptions = [],
  activeBoardFill,
  onBoardColorPick,
  onElementColorPick,
  onElementSizePick,
  onElementTextAlignPick,
  onElementFontPick,
  onImageEditPick,
  onImageRoundPick,
  onImageFramePick,
  onLineDashPick,
  onShapePick,
  onStickerPick,
  onStructurePick,
}: BoardMarksQuickSelectorProps) {
  const OUTER = wheelOuterSize();
  const CENTER = OUTER / 2;
  const DISC_OFFSET = WHEEL_PAD;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [frameOpen, setFrameOpen] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [structuresOpen, setStructuresOpen] = useState(false);
  const subMenuOpen =
    paletteOpen ||
    sizeOpen ||
    editOpen ||
    alignOpen ||
    fontOpen ||
    frameOpen ||
    shapesOpen ||
    stickersOpen ||
    structuresOpen;

  // Radial shows six chromatic picks plus white and black (full list has more than eight).
  const radialColorPicks = (() => {
    if (!boardColorOptions.length) return [];
    const white = boardColorOptions.find((p) => p.label === "White");
    const black = boardColorOptions.find((p) => p.label === "Black");
    const chromatic = boardColorOptions.filter((p) => p.label !== "White" && p.label !== "Black");
    return [...chromatic.slice(0, 6), ...(white ? [white] : []), ...(black ? [black] : [])];
  })();

  const wheelItems = (() => {
    if (mode === "object") {
      if (batchMixed) {
        const actions = OBJECT_ACTIONS.filter((item) => item.id === "copy" || item.id === "delete");
        const angles = spreadAngles(actions.length);
        return actions.map((item, i) => ({ ...item, angle: angles[i] }));
      }
      if (imageCapable) {
        const imageActions =
          batchCount && batchCount > 1
            ? IMAGE_OBJECT_ACTIONS.filter((item) => item.id !== "edit")
            : IMAGE_OBJECT_ACTIONS;
        const angles = spreadAngles(imageActions.length);
        return imageActions.map((item, i) => ({ ...item, angle: angles[i] }));
      }
      if (lineCapable) {
        const angles = spreadAngles(LINE_OBJECT_ACTIONS.length);
        return LINE_OBJECT_ACTIONS.map((item, i) => ({ ...item, angle: angles[i] }));
      }
      const actions = OBJECT_ACTIONS.filter((item) => {
        if (item.id === "size" || item.id === "edit") return textCapable;
        if (item.id === "stickers") return stickerCapable;
        return true;
      });
      const angles = spreadAngles(actions.length);
      return actions.map((item, i) => ({ ...item, angle: angles[i] }));
    }
    const actions = [
      ...EMPTY_ACTIONS,
      ...(canPaste ? [{ id: "paste" as const, label: "Paste", Icon: ClipboardPaste }] : []),
    ];
    const angles = spreadAngles(actions.length);
    return actions.map((item, i) => ({ ...item, angle: angles[i] }));
  })();

  const paletteLabel = mode === "empty" ? "Board color" : "Element color";
  const shapesLabel = mode === "empty" ? "Pick shape" : "Change shape";
  const stickersLabel = mode === "empty" ? "Pick sticker" : "Change sticker";
  const structuresLabel = "Pick structure";

  const backToMain = () => {
    setPaletteOpen(false);
    setSizeOpen(false);
    setEditOpen(false);
    setAlignOpen(false);
    setFontOpen(false);
    setFrameOpen(false);
    setShapesOpen(false);
    setStickersOpen(false);
    setStructuresOpen(false);
  };

  const backOneLevel = () => {
    if (alignOpen) {
      setAlignOpen(false);
      setEditOpen(true);
      return;
    }
    if (fontOpen) {
      setFontOpen(false);
      setEditOpen(true);
      return;
    }
    backToMain();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (alignOpen) {
        setAlignOpen(false);
        setEditOpen(true);
      } else if (fontOpen) {
        setFontOpen(false);
        setEditOpen(true);
      } else if (frameOpen) setFrameOpen(false);
      else if (paletteOpen) setPaletteOpen(false);
      else if (sizeOpen) setSizeOpen(false);
      else if (editOpen) setEditOpen(false);
      else if (shapesOpen) setShapesOpen(false);
      else if (stickersOpen) setStickersOpen(false);
      else if (structuresOpen) setStructuresOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [onClose, paletteOpen, sizeOpen, editOpen, alignOpen, fontOpen, frameOpen, shapesOpen, stickersOpen, structuresOpen]);

  const handleBackdropClick = () => {
    if (alignOpen || fontOpen) {
      if (alignOpen) setAlignOpen(false);
      if (fontOpen) setFontOpen(false);
      setEditOpen(true);
      return;
    }
    if (subMenuOpen) backToMain();
    else onClose();
  };

  const handleItemClick = (id: BoardMarksQuickAction) => {
    if (id === "color") {
      setSizeOpen(false);
      setEditOpen(false);
      setAlignOpen(false);
      setFontOpen(false);
      setShapesOpen(false);
      setStickersOpen(false);
      setStructuresOpen(false);
      setPaletteOpen(true);
      return;
    }
    if (id === "size") {
      setPaletteOpen(false);
      setEditOpen(false);
      setAlignOpen(false);
      setFontOpen(false);
      setShapesOpen(false);
      setStickersOpen(false);
      setStructuresOpen(false);
      setSizeOpen(true);
      return;
    }
    if (id === "edit") {
      if (imageCapable && !textCapable) {
        onImageEditPick?.();
        onClose();
        return;
      }
      setPaletteOpen(false);
      setSizeOpen(false);
      setFrameOpen(false);
      setShapesOpen(false);
      setStickersOpen(false);
      setStructuresOpen(false);
      setAlignOpen(false);
      setFontOpen(false);
      setEditOpen(true);
      return;
    }
    if (id === "round") {
      onImageRoundPick?.();
      onClose();
      return;
    }
    if (id === "dash") {
      onLineDashPick?.();
      onClose();
      return;
    }
    if (id === "frame") {
      setPaletteOpen(false);
      setSizeOpen(false);
      setEditOpen(false);
      setAlignOpen(false);
      setFontOpen(false);
      setShapesOpen(false);
      setStickersOpen(false);
      setStructuresOpen(false);
      setFrameOpen(true);
      return;
    }
    if (id === "shapes") {
      setPaletteOpen(false);
      setSizeOpen(false);
      setEditOpen(false);
      setAlignOpen(false);
      setFontOpen(false);
      setStickersOpen(false);
      setStructuresOpen(false);
      setShapesOpen(true);
      return;
    }
    if (id === "structures") {
      setPaletteOpen(false);
      setSizeOpen(false);
      setEditOpen(false);
      setAlignOpen(false);
      setFontOpen(false);
      setShapesOpen(false);
      setStickersOpen(false);
      setStructuresOpen(true);
      return;
    }
    if (id === "stickers") {
      setPaletteOpen(false);
      setSizeOpen(false);
      setEditOpen(false);
      setAlignOpen(false);
      setFontOpen(false);
      setShapesOpen(false);
      setStructuresOpen(false);
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

  const handleEditSubPick = (id: "position" | "font") => {
    setEditOpen(false);
    if (id === "position") setAlignOpen(true);
    else setFontOpen(true);
  };

  const handleAlignPick = (align: BoardMarkTextAlign) => {
    onElementTextAlignPick?.(align);
    onClose();
  };

  const handleFontPick = (font: BoardMarkTextFont) => {
    onElementFontPick?.(font);
    onClose();
  };

  const handleFramePick = (shape: BoardMarkShapeType) => {
    onImageFramePick?.(shape);
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

  const handleStructurePick = (structure: BoardDiagramType) => {
    onStructurePick?.(structure);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close marks selector"
        className={cn(
          "inset-0 z-50 cursor-default bg-black/10 backdrop-blur-[1px]",
          fixed ? "fixed" : "absolute",
        )}
        onClick={handleBackdropClick}
      />
      <div
        className={cn(
          "board-marks-quick-selector pointer-events-none z-[51]",
          fixed ? "fixed" : "absolute",
        )}
        style={{ left: x, top: y }}
        role="menu"
        aria-label="Marks quick selector"
      >
        <div
          className="pointer-events-auto relative -translate-x-1/2 -translate-y-1/2"
          style={{ width: OUTER, height: OUTER }}
        >
          <div
            className="absolute rounded-full border border-white/10 bg-neutral-950/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-md"
            style={{
              left: DISC_OFFSET,
              top: DISC_OFFSET,
              width: WHEEL_SIZE,
              height: WHEEL_SIZE,
            }}
          />
          {subMenuOpen ? (
            <button
              type="button"
              title="Back to menu"
              aria-label="Back to menu"
              onClick={(e) => {
                e.stopPropagation();
                backOneLevel();
              }}
              className="absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
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
          {editOpen && !alignOpen && !fontOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              Text edit
            </span>
          )}
          {alignOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              Position
            </span>
          )}
          {fontOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              Font
            </span>
          )}
          {frameOpen && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 translate-y-5 text-center text-[10px] font-medium leading-tight text-white/70">
              Frame
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(id);
                  }}
                  className={cn(mainItemClass, accent)}
                  style={{ left, top }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="text-[11px] font-bold leading-none tracking-wide text-white">{label}</span>
                </button>
              );
            })}

          {paletteOpen && radialColorPicks.length > 0 && (
            <>
              {radialColorPicks.map((pick, index) => {
                const angles = spreadAngles(radialColorPicks.length);
                const angle = angles[index];
                const rad = (angle * Math.PI) / 180;
                const left = CENTER + Math.cos(rad) * SUB_RADIUS;
                const top = CENTER + Math.sin(rad) * SUB_RADIUS;
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
                      "absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 transition-transform",
                      pick.label === "White" ? "ring-neutral-400" : "ring-white/50",
                      "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      active && "scale-110 ring-2 ring-white",
                    )}
                    style={{ left, top, backgroundColor: pick.hex }}
                  />
                );
              })}
            </>
          )}

          {editOpen &&
            !alignOpen &&
            !fontOpen &&
            EDIT_SUBMENU_OPTIONS.map(({ id, label, Icon }, index) => {
              const angles = spreadAngles(EDIT_SUBMENU_OPTIONS.length);
              const angle = angles[index];
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * ITEM_RADIUS;
              const top = CENTER + Math.sin(rad) * ITEM_RADIUS;

              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSubPick(id);
                  }}
                  className={mainItemClass}
                  style={{ left, top }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="text-[11px] font-bold leading-none tracking-wide text-white">{label}</span>
                </button>
              );
            })}

          {alignOpen &&
            TEXT_ALIGN_OPTIONS.map(({ id, label, Icon }, index) => {
              const angles = spreadAngles(TEXT_ALIGN_OPTIONS.length);
              const angle = angles[index];
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * SUB_RADIUS;
              const top = CENTER + Math.sin(rad) * SUB_RADIUS;

              return (
                <button
                  key={id}
                  type="button"
                  title={`Align ${label}`}
                  aria-label={`Align text ${label.toLowerCase()}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAlignPick(id);
                  }}
                  className={subItemClass}
                  style={{ left, top }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                </button>
              );
            })}

          {fontOpen &&
            BOARD_MARK_FONT_OPTIONS.map(({ id, label, fontFamily }, index) => {
              const angles = spreadAngles(BOARD_MARK_FONT_OPTIONS.length);
              const angle = angles[index];
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * SUB_RADIUS;
              const top = CENTER + Math.sin(rad) * SUB_RADIUS;

              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={`Set font to ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFontPick(id);
                  }}
                  className={cn(subItemClass, "text-[11px] font-bold")}
                  style={{ left, top, fontFamily }}
                >
                  Aa
                </button>
              );
            })}

          {frameOpen &&
            BOARD_MARK_FRAME_OPTIONS.map(({ id, label, Icon }, index) => {
              const angles = spreadAngles(BOARD_MARK_FRAME_OPTIONS.length);
              const angle = angles[index];
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * SUB_RADIUS;
              const top = CENTER + Math.sin(rad) * SUB_RADIUS;

              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={`Frame shape ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFramePick(id);
                  }}
                  className={subItemClass}
                  style={{ left, top }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              );
            })}

          {sizeOpen &&
            TEXT_SIZE_OPTIONS.map(({ id, label }, index) => {
              const angles = spreadAngles(TEXT_SIZE_OPTIONS.length);
              const angle = angles[index];
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * SUB_RADIUS;
              const top = CENTER + Math.sin(rad) * SUB_RADIUS;

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
                  className={cn(subItemClass, "text-[11px] font-bold")}
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
              const radius = ring === 0 ? SUB_RADIUS : INNER_RADIUS;
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
                  className={subItemClass}
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
              const radius = ring === 0 ? SUB_RADIUS : INNER_RADIUS;
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
                  className={cn(subItemClass, "text-sm")}
                  style={{ left, top }}
                >
                  {emoji}
                </button>
              );
            })}

          {structuresOpen &&
            PLOT_STRUCTURES.map(({ type, title }, index) => {
              const angles = spreadAngles(PLOT_STRUCTURES.length);
              const angle = angles[index];
              const rad = (angle * Math.PI) / 180;
              const left = CENTER + Math.cos(rad) * SUB_RADIUS;
              const top = CENTER + Math.sin(rad) * SUB_RADIUS;

              return (
                <button
                  key={type}
                  type="button"
                  title={title}
                  aria-label={`${structuresLabel}: ${title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStructurePick(type);
                  }}
                  className={cn(subItemClass, "text-[9px] font-semibold leading-tight")}
                  style={{ left, top }}
                >
                  {title.split(" ")[0]}
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}
